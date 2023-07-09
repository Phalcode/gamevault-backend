import {
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import configuration from "../configuration";
import { GamesService } from "./games.service";
import { MapperService } from "./mapper.service";
import { RawgGame } from "../models/rawg/game.interface";
import {
  Result as RawgResult,
  SearchResult,
} from "../models/rawg/games.interface";
import { Game } from "../database/entities/game.entity";
import { BoxArtService } from "./box-art.service";
import { catchError, firstValueFrom } from "rxjs";
import { HttpService } from "@nestjs/axios";
import { AxiosError } from "axios";
import stringSimilarity from "string-similarity-js";

@Injectable()
export class RawgService {
  baseUrl = configuration.RAWG_API.URL;
  key = configuration.RAWG_API.KEY;

  private readonly logger = new Logger(RawgService.name);

  constructor(
    @Inject(forwardRef(() => GamesService))
    private gamesService: GamesService,
    @Inject(forwardRef(() => BoxArtService))
    private boxartService: BoxArtService,
    private mapper: MapperService,
    private readonly httpService: HttpService,
  ) {}

  /**
   * Check the games in the database against the RAWG API to see if they need to
   * be updated in the database or not.
   *
   * @async
   * @param gamesInDatabase - An array of Game objects to check against the RAWG
   *   API.
   * @returns Returns a Promise with no return value.
   */
  public async cacheCheck(gamesInDatabase: Game[]): Promise<void> {
    if (configuration.TESTING.RAWG_API_DISABLED) {
      this.logger.warn(
        "Skipping RAWG Cache Check because RAWG API is disabled",
      );
      return;
    }

    if (!configuration.RAWG_API.KEY) {
      this.logger.warn(
        "Skipping RAWG Cache Check because RAWG API Key is not set",
      );
      return;
    }
    this.logger.log("STARTED RAWG CACHE CHECK");

    for (const gameInDB of gamesInDatabase) {
      try {
        const cachedGameInDB = await this.cacheGame(gameInDB);
        await this.boxartService.checkBoxArt(cachedGameInDB);
        this.logger.debug(
          { gameId: cachedGameInDB.id, title: cachedGameInDB.title },
          `Game Cached Successfully`,
        );
      } catch (error) {
        this.logger.error(
          {
            gameId: gameInDB.id,
            title: gameInDB.title,
            error: error,
          },
          "Game Caching Failed!",
        );
      }
    }
    this.logger.log("FINISHED RAWG CACHE CHECK");
  }

  /**
   * Caches the specified game in the database by finding a matching game in the
   * RAWG API and mapping the data to a Game object.
   *
   * @async
   * @private
   * @param game - The Game object to cache in the database.
   * @returns Returns a Promise with a mapped Game object that has been saved in
   *   the database.
   */
  private async cacheGame(game: Game): Promise<Game> {
    this.logger.debug(`Caching Game: "${game.title}"`);
    if (!this.isOutdated(game)) {
      this.logger.debug(
        { gameId: game.id, title: game.title, cachedAt: game.cache_date },
        `Game Caching Skipped. Game is up to date.`,
      );
      return game;
    }

    let rawgEntry: RawgGame;
    if (game.rawg_id) {
      rawgEntry = await this.getRawgGameById(game.rawg_id);
    } else {
      rawgEntry = await this.getBestMatchingRawgGame(
        game.title,
        game.release_date.getFullYear(),
      );
    }
    const mappedGame = await this.mapper.map(game, rawgEntry);
    return await this.gamesService.saveGame(mappedGame);
  }

  /**
   * Searches for the best matching game in the RAWG API based on the specified
   * title and release year.
   *
   * @async
   * @private
   * @param title - The title of the game to search for.
   * @param releaseYear - The release year of the game to search for.
   * @returns Returns a Promise with the best matching RawgGame object.
   */
  private async getBestMatchingRawgGame(
    title: string,
    releaseYear: number,
  ): Promise<RawgGame> {
    const sortedResults = await this.getRawgGames(title, releaseYear);
    const bestMatch = sortedResults[0];

    if (bestMatch.probability != 1) {
      this.logger.log(`${sortedResults.length} matches found for "${title}"`);
      this.logger.debug("-- START OF MATCHES --");
      for (const match of sortedResults) {
        if (match.probability === 0) continue;
        this.logger.debug(
          `➥ Match: "${match.name} (${new Date(
            match.released,
          ).getFullYear()})" | RAWG-ID: "${match.id}" | Probability: ${
            match.probability
          }`,
        );
      }
      this.logger.debug("-- END OF MATCHES --");
    }

    return this.getRawgGameById(bestMatch.id);
  }

  /**
   * Searches for and returns a game from the RAWG API that matches the
   * specified title and release year.
   *
   * @param title - The title of the game to search for.
   * @param releaseYear - The year the game was released.
   * @returns An array of RawgResult objects that match the search criteria.
   */
  public async getRawgGames(
    title: string,
    releaseYear: number,
  ): Promise<RawgResult[]> {
    const searchResults: RawgResult[] = [];

    //get games by title and release year and add them to the search results
    const gamesByTitleAndYear = await this.getGames(title, releaseYear);
    searchResults.push(...gamesByTitleAndYear.results);
    //get games by title and add them to the search results
    const gamesByTitle = await this.getGames(title);
    searchResults.push(...gamesByTitle.results);

    if (searchResults.length === 0) {
      this.logger.log(
        `➥ "${title} (${releaseYear})" | Search Step 1 (Precise Title and Year Search) | No results found`,
      );
      const gamesByTitleFuzzy = await this.getGames(title, undefined, false);
      searchResults.push(...gamesByTitleFuzzy.results);
    }

    if (searchResults.length === 0) {
      this.logger.log(
        `➥ "${title} (${releaseYear})" | Search Step 2 (Fuzzy Search) | No results found`,
      );
      throw new NotFoundException(
        `No game found in RAWG for "${title} (${releaseYear})"`,
      );
    }

    searchResults.forEach((game) => {
      // DEV_INFO: If game.probability does not exists, add it to the Result Object
      game.probability = stringSimilarity(
        title.toLowerCase().replaceAll(/[^\w\s]/g, ""),
        game.name.toLowerCase().replaceAll(/[^\w\s]/g, ""),
      );
      // reduce the probability the more the year does not match
      game.probability -=
        Math.abs(releaseYear - new Date(game.released).getFullYear()) / 10;
    });

    // Sort search results by probability beginning with the highest probability
    return searchResults.sort((a, b) => b.probability - a.probability);
  }

  /**
   * Determines whether a game's cache is outdated.
   *
   * @param game - The game to check for an outdated cache.
   * @returns True if the cache is outdated, false otherwise.
   */
  private isOutdated(game: Game) {
    if (!game.cache_date) {
      this.logger.debug(`➥ "${game.title}" | Uncached`);
      return true;
    }

    if (
      new Date().getTime() - game.cache_date.getTime() >
      configuration.RAWG_API.CACHE_DAYS * 24 * 60 * 60 * 1000
    ) {
      this.logger.debug(
        `➥ "${game.title}" | Cache outdated | Cache Date: ${game.cache_date}`,
      );
      return true;
    }
    return false;
  }

  /**
   * Returns the RawgGame object associated with the specified ID.
   *
   * @param id - The RAWG ID of the game to retrieve.
   * @returns The RawgGame object associated with the specified ID.
   */
  private async getRawgGameById(id: number): Promise<RawgGame> {
    try {
      const response = await firstValueFrom(
        this.httpService
          .get(`${this.baseUrl}/games/${id}`, {
            params: { key: this.key },
          })
          .pipe(
            catchError((error: AxiosError) => {
              throw new Error(
                `Serverside Request Error: ${error.status} ${error.message}`,
              );
            }),
          ),
      );
      return response.data;
    } catch (error) {
      throw new InternalServerErrorException(
        error,
        "Fetching data from RAWG failed",
      );
    }
  }

  /**
   * Retrieves a list of games from the RAWG API based on optional search
   * criteria.
   *
   * @async
   * @param [search] - The game title to search for.
   * @param [releaseYear] - The year of release to search for.
   * @param [precise=true] - Whether the search should be precise or not.
   *   Default is `true`
   * @returns - A promise that resolves to a SearchResult object containing the
   *   results of the search.
   * @throws {InternalServerErrorException} - Throws an error if the request to
   *   the RAWG API fails.
   */
  private async getGames(
    search?: string,
    releaseYear?: number,
    precise = true,
  ): Promise<SearchResult> {
    const searchDates = releaseYear
      ? `${releaseYear}-01-01,${releaseYear}-12-31`
      : undefined;

    try {
      const response = await firstValueFrom(
        this.httpService
          .get(`${this.baseUrl}/games`, {
            params: {
              key: this.key,
              search: search,
              dates: searchDates,
              search_precise: precise,
              platforms: 4,
              exclude_stores: 9,
            },
          })
          .pipe(
            catchError((error: AxiosError) => {
              throw new Error(
                `Serverside Request Error: ${error.status} ${error.message}`,
              );
            }),
          ),
      );
      return response.data as SearchResult;
    } catch (error) {
      throw new InternalServerErrorException(
        error,
        "Fetching data from RAWG failed",
      );
    }
  }
}
