import { HttpService } from "@nestjs/axios";
import {
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { AxiosError } from "axios";
import { ClientRequest } from "http";
import { catchError, firstValueFrom } from "rxjs";
import stringSimilarity from "string-similarity-js";

import configuration from "../../../configuration";
import { Game } from "../../games/game.entity";
import { GamesService } from "../../games/games.service";
import { RawgMapperService } from "./mapper.service";
import { RawgGame } from "./models/game.interface";
import { Result as RawgResult, SearchResult } from "./models/games.interface";
import { RawgPlatform } from "./models/platforms";
import { RawgStore } from "./models/stores";

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
   * Check the cache for each game in the provided list. If the RAWG API is
   * disabled or the API key is not set, the cache check will be skipped.
   * Otherwise, each game will be cached using the cacheGame method. Any errors
   * that occur during caching will be logged. Finally, the updated game list
   * will be returned.
   *
   * @param games - The list of games to check the cache for
   * @returns The updated list of games after caching
   */
  public async checkCache(games: Game[]): Promise<Game[]> {
    // Skip cache check if RAWG API is disabled
    if (configuration.TESTING.RAWG_API_DISABLED) {
      this.logger.warn({
        message: "Skipping RAWG Cache Check.",
        reason: "TESTING_RAWG_API_DISABLED is set to true.",
      });
      return games;
    }

    // Skip cache check if RAWG API key is not set
    if (
      !configuration.RAWG_API.KEY &&
      configuration.RAWG_API.URL === "https://api.rawg.io/api"
    ) {
      this.logger.warn({
        message: "Skipping RAWG Cache Check.",
        reason: "RAWG_API_KEY is not set.",
      });
      return games;
    }

    this.logger.log({
      message: "Starting RAWG Cache Check.",
      gamesCount: games.length,
    });

    // Cache each game in the list
    for (let i = 0; i < games.length; i++) {
      try {
        games[i] = await this.cacheGame(games[i]);
        this.logger.debug({
          message: "Game Cached Successfully.",
          game: {
            id: games[i].id,
            file_path: games[i].file_path,
          },
        });
      } catch (error) {
        this.logger.error({
          message: "Error Caching Game.",
          game: {
            id: games[i].id,
            file_path: games[i].file_path,
          },
          error,
        });
      }
    }

    this.logger.log({
      message: "Finished RAWG Cache Check.",
      gamesCount: games.length,
    });
    return games;
  }

  /**
   * Caches a Game object.
   *
   * @param game - The Game object to be cached.
   * @returns The cached Game object.
   */
  private async cacheGame(game: Game): Promise<Game> {
    // Skip caching if the file path contains (NC) flag
    if (game.file_path.includes("(NC)")) {
      this.logger.debug({
        message: "Skipping Caching Game.",
        reason: "File path contains (NC) flag.",
        game: {
          id: game.id,
          file_path: game.file_path,
        },
      });
      return game;
    }

    // Skip caching if the game is not outdated
    if (!this.isOutdated(game)) {
      this.logger.debug({
        message: "Skipping Caching Game.",
        reason: "Cached data is still fresh.",
        game: {
          id: game.id,
          file_path: game.file_path,
        },
        cachedAt: game.cache_date,
      });
      return game;
    }

    this.logger.debug({
      message: "Caching Game.",
      game: {
        id: game.id,
        file_path: game.file_path,
      },
    });

    // Fetch the game data from external API using Rawg ID or title and release date
    const rawgEntry: RawgGame = game.rawg_id
      ? await this.fetchByRawgId(game.rawg_id)
      : await this.getBestMatch(
          game.title,
          game.release_date?.getUTCFullYear() || undefined,
        );

    // Map the RawgGame to a Game object
    const mappedGame = await this.mapper.mapRawgGameToGame(rawgEntry, game);
    // Save the mapped Game object
    await this.gamesService.save(mappedGame);

    return mappedGame;
  }

  private async getBestMatch(
    title: string,
    releaseYear?: number,
  ): Promise<RawgGame> {
    const sortedResults = await this.fetchMatching(title, releaseYear);

    this.logger.log({
      message: `Found ${sortedResults.length} matches on RAWG.`,
      title,
      releaseYear,
      sortedResults,
    });

    return this.fetchByRawgId(sortedResults[0].id);
  }

  /**
   * Fetches matching game titles from the RAWG API. If a release year is
   * provided, it fetches games with the given title and release year. If no
   * release year is provided or no matching game is found with the release
   * year, it fetches games with the given title only.
   *
   * @param title - The title of the game.
   * @param releaseYear - The release year of the game (optional).
   * @returns An array of RawgResult objects representing the matching game
   *   titles.
   * @throws NotFoundException if no matching game is found.
   */
  public async fetchMatching(
    title: string,
    releaseYear?: number,
  ): Promise<RawgResult[]> {
    // Array to store the search results
    const searchResults: RawgResult[] = [];

    // If releaseYear is provided, fetch games with the given title and release year
    if (releaseYear) {
      const search = await this.fetch(title, releaseYear);
      this.logger.debug({
        message: `Fetched ${search.results.length} RAWG game(s) matching title and release year.`,
        title,
        releaseYear,
        temporarySearchResults: search,
      });
      searchResults.push(...search.results);
    }

    // If no search results are found with the release year, fetch games with the given title only
    if (searchResults.length === 0) {
      const search = await this.fetch(title);
      this.logger.debug({
        message: `Fetched ${search.results.length} RAWG game(s) matching title.`,
        title,
        temporarySearchResults: search,
      });
      searchResults.push(...search.results);
    }

    // If no search results are found, throw a NotFoundException
    if (searchResults.length === 0) {
      this.logger.log({
        message: "No matching RAWG game found.",
        title,
        releaseYear,
      });
      throw new NotFoundException("No matching RAWG game found");
    }

    // Calculate the probability of matching for each game
    searchResults.forEach((searchResult) => {
      const cleanedGameTitle = title?.toLowerCase().replace(/[^\w\s]/g, "");
      const cleanedSearchResultTitle = searchResult.name
        ?.toLowerCase()
        .replace(/[^\w\s]/g, "");

      // Calculate string similarity between the title and game name
      searchResult.probability = stringSimilarity(
        cleanedGameTitle,
        cleanedSearchResultTitle,
      );

      // If releaseYear is provided, adjust the probability based on the difference between the release year of the game and the provided release year
      if (releaseYear !== undefined) {
        const gameReleaseYear = new Date(
          searchResult.released,
        )?.getUTCFullYear();
        searchResult.probability -=
          Math.abs(releaseYear - gameReleaseYear) / 10;
      }
    });

    // Sort the search results by probability in descending order
    searchResults.sort((a, b) => b.probability - a.probability);

    // Return the search results
    return searchResults;
  }

  /** Determines whether a game's cache is outdated. */
  private isOutdated(game: Game) {
    if (!game.cache_date) {
      this.logger.debug({
        message: "Game is not cached.",
        game: {
          id: game.id,
          file_path: game.file_path,
        },
      });
      return true;
    }

    if (
      new Date().getTime() - game.cache_date.getTime() >
      configuration.RAWG_API.CACHE_DAYS * 24 * 60 * 60 * 1000
    ) {
      this.logger.debug({
        message: "Game Cache is outdated.",
        game: {
          id: game.id,
          file_path: game.file_path,
        },
      });
      return true;
    }
    return false;
  }

  /** Returns the RawgGame object associated with the specified ID. */
  private async fetchByRawgId(id: number): Promise<RawgGame> {
    const response = await firstValueFrom(
      this.httpService
        .get(`${configuration.RAWG_API.URL}/games/${id}`, {
          params: { key: configuration.RAWG_API.KEY },
        })
        .pipe(
          catchError((error: AxiosError) => {
            throw new InternalServerErrorException(
              `Serverside RAWG Request Error: ${error.status} ${error.message}`,
              { cause: error.toJSON() },
            );
          }),
        ),
    );
    return response.data;
  }

  /**
   * Retrieves a list of games from the RAWG API based on optional search
   * criteria.
   */
  private async fetch(
    search?: string,
    releaseYear?: number,
  ): Promise<SearchResult> {
    const searchDates = releaseYear
      ? `${releaseYear}-01-01,${releaseYear}-12-31`
      : undefined;

    const requestParameters = {
      search,
      key: configuration.RAWG_API.KEY,
      dates: searchDates,
      stores: configuration.RAWG_API.INCLUDED_STORES.includes(
        RawgStore["All Stores"],
      )
        ? undefined
        : configuration.RAWG_API.INCLUDED_STORES.join(),
      platforms: configuration.RAWG_API.INCLUDED_PLATFORMS.includes(
        RawgPlatform["All Platforms"],
      )
        ? undefined
        : configuration.RAWG_API.INCLUDED_PLATFORMS.join(),
    };

    const response = await firstValueFrom(
      this.httpService
        .get(`${configuration.RAWG_API.URL}/games`, {
          params: requestParameters,
        })
        .pipe(
          catchError((error: AxiosError) => {
            throw new InternalServerErrorException(
              `Serverside RAWG Request Error: ${error.status} ${error.message}`,
              { cause: error.toJSON() },
            );
          }),
        ),
    );

    //Log the full request url and response data from RAWG
    this.logger.debug({
      message: "RAWG Request",
      url:
        (response.request as ClientRequest)?.host +
        (response.request as ClientRequest)?.path,
      data: response.data,
    });
    return response.data as SearchResult;
  }
}
