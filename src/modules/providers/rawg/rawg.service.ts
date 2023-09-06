import {
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import configuration from "../../../configuration";
import { GamesService } from "../../games/games.service";
import { RawgMapperService } from "./mapper.service";
import { RawgGame } from "./models/game.interface";
import { Result as RawgResult, SearchResult } from "./models/games.interface";
import { Game } from "../../games/game.entity";
import { catchError, firstValueFrom } from "rxjs";
import { HttpService } from "@nestjs/axios";
import { AxiosError } from "axios";
import stringSimilarity from "string-similarity-js";

@Injectable()
export class RawgService {
  private readonly logger = new Logger(RawgService.name);

  constructor(
    @Inject(forwardRef(() => GamesService))
    private gamesService: GamesService,
    private mapper: RawgMapperService,
    private readonly httpService: HttpService,
  ) {}

  /**
   * Check the games in the database against the RAWG API to see if they need to
   * be updated in the database or not.
   *
   * @async
   * @param games - An array of Game objects to check against the RAWG API.
   * @returns Returns a Promise with no return value.
   */
  public async cacheGames(games: Game[]): Promise<void> {
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

    for (const game of games) {
      try {
        await this.cacheGame(game);
        this.logger.debug(
          { gameId: game.id, title: game.title },
          `Game Cached Successfully`,
        );
      } catch (error) {
        this.logger.error(
          {
            gameId: game.id,
            title: game.title,
            error: error,
          },
          "Game Caching Failed",
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
        game.release_date?.getFullYear() || undefined,
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
    releaseYear?: number,
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
   * Search for games in RAWG API based on the provided title and optional
   * release year.
   *
   * @param {string} title - The title of the game to search for.
   * @param {number} [releaseYear] - The optional release year of the game.
   * @returns {Promise<RawgResult[]>} An array of RawgResult objects
   *   representing search results.
   * @throws {NotFoundException} If no game is found in RAWG.
   */
  public async getRawgGames(
    title: string,
    releaseYear?: number,
  ): Promise<RawgResult[]> {
    const searchResults: RawgResult[] = [];

    // Step 1: Get games by title and release year (if provided)
    if (releaseYear) {
      searchResults.push(...(await this.getGames(title, releaseYear)).results);
    }

    // Step 2: Get games by title only if Step 1 had no results or releaseYear is not provided
    if (searchResults.length === 0) {
      searchResults.push(...(await this.getGames(title)).results);
    }

    // If no results found in both steps, try fuzzy search
    if (searchResults.length === 0) {
      searchResults.push(
        ...(await this.getGames(title, undefined, false)).results,
      );
    }

    // If still no results found, throw an exception
    if (searchResults.length === 0) {
      this.logger.log(
        `➥ "${title} (${
          releaseYear || "No Year"
        })" | No results found after all search steps`,
      );

      throw new NotFoundException(
        `No game found in RAWG for "${title} (${releaseYear || "No Year"})"`,
      );
    }

    // Calculate and assign probabilities
    searchResults.forEach((game) => {
      const titleCleaned = title.toLowerCase().replaceAll(/[^\w\s]/g, "");
      const gameNameCleaned = game.name
        .toLowerCase()
        .replaceAll(/[^\w\s]/g, "");

      // Calculate similarity based on title
      game.probability = stringSimilarity(titleCleaned, gameNameCleaned);

      // Reduce the probability the more the year does not match (if releaseYear is provided)
      if (releaseYear !== undefined) {
        const gameReleaseYear = new Date(game.released).getFullYear();
        game.probability -= Math.abs(releaseYear - gameReleaseYear) / 10;
      }
    });

    // Sort search results by probability in descending order
    searchResults.sort((a, b) => b.probability - a.probability);

    return searchResults;
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
          .get(`${configuration.RAWG_API.URL}/games/${id}`, {
            params: { key: configuration.RAWG_API.KEY },
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
          .get(`${configuration.RAWG_API.URL}/games`, {
            params: {
              search,
              key: configuration.RAWG_API.KEY,
              dates: searchDates,
              search_precise: precise,
              exclude_stores: configuration.RAWG_API.EXCLUDE_STORES,
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
