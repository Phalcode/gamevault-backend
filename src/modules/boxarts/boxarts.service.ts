import { forwardRef, Inject, Injectable, Logger } from "@nestjs/common";
import gis, { Result } from "async-g-i-s";
import configuration from "../../configuration";
import { GamesService } from "../games/games.service";
import { ImagesService } from "../images/images.service";
import { Game } from "../games/game.entity";

@Injectable()
export class BoxArtsService {
  private readonly logger = new Logger(BoxArtsService.name);
  private cooldownGames = 0;
  private cooldownStartTime = 0;
  private readonly cooldownDurationInMilliseconds: number =
    configuration.IMAGE.GOOGLE_API_RATE_LIMIT_COOLDOWN_IN_HOURS * 3600000;

  constructor(
    @Inject(forwardRef(() => GamesService))
    private gamesService: GamesService,
    private imagesService: ImagesService,
  ) {}

  public async checkMultiple(games: Game[]): Promise<Game[]> {
    if (configuration.TESTING.GOOGLE_API_DISABLED) {
      this.logger.warn(
        "Skipping Box Art Search, because TESTING_GOOGLE_API_DISABLED is set to true",
      );
      return games;
    }

    this.logger.log({
      message: "Starting Box Art Check",
      gamesCount: games.length,
    });

    for (let i = 0; i < games.length; i++) {
      try {
        games[i] = await this.check(games[i]);
        this.logger.debug({
          message: `Checked Box Art`,
          gameId: games[i].id,
          gameTitle: games[i].title,
          box_image: games[i].box_image,
        });
      } catch (error) {
        this.logger.error({
          message: "Box Art Check Failed",
          gameId: games[i].id,
          gameTitle: games[i].title,
          box_image: games[i].box_image,
          error,
        });
      }
    }

    this.logger.log({
      message: "Finished Box Art Check",
      gamesCount: games.length,
    });

    return games;
  }

  /**
   * Checks if the box art for the game is available and searches for it if
   * necessary.
   *
   * @param game - The game to check the box art for.
   */
  public async check(game: Game): Promise<Game> {
    // Check if the Google API is disabled
    if (configuration.TESTING.GOOGLE_API_DISABLED) {
      this.logger.warn(
        "Skipping Box Art Search, because TESTING_GOOGLE_API_DISABLED is set to true",
      );
      return game;
    }

    // Check if the box art is still available
    if (
      game.box_image?.id &&
      (await this.imagesService.isAvailable(game.box_image.id))
    ) {
      this.logger.debug({
        message: "Box Art is still available",
        gameId: game.id,
        gameTitle: game.title,
        box_image: game.box_image,
      });
      return game;
    }

    // Check if the cooldown is active
    if (
      this.cooldownGames >= 5 &&
      Date.now() - this.cooldownStartTime < this.cooldownDurationInMilliseconds
    ) {
      const remainingCooldown =
        this.cooldownStartTime +
        this.cooldownDurationInMilliseconds -
        Date.now();

      this.logger.warn({
        message: `Cooldown active. Skipping Box Art Search. The cooldown will also expire after a server restart.`,
        remainingCooldown: this.formatCooldownTime(remainingCooldown),
      });
      return game;
    }

    let results: Result[] = [];

    // Try SteamGridDB
    results = await this.search(
      game.title,
      `"${game.title}" site:steamgriddb.com -profile`,
    );

    if (!results.length) {
      // Try PCGAMINGWIKI
      results = await this.search(
        game.title,
        `"${game.title}" site:www.pcgamingwiki.com`,
      );
    }

    if (!results.length) {
      // Perform a broad image search on Google
      results = await this.search(game.title, `"${game.title}" game box art`);
    }

    if (!results.length) {
      this.cooldownGames++;
      if (this.cooldownGames >= 5) {
        this.cooldownStartTime = Date.now();
        const remainingCooldown =
          this.cooldownStartTime +
          this.cooldownDurationInMilliseconds -
          Date.now();
        this.logger.warn({
          message:
            "No Box Art Images found for multiple games. You probably hit the Google Image Search Rate-Limit. Cooldown activated.",
          remainingCooldown: this.formatCooldownTime(remainingCooldown),
        });
      }
      return game;
    }

    // Download the matching image and return
    const returnedGame = await this.downloadMatchingImage(game, results);
    this.cooldownGames = 0;
    return returnedGame;
  }

  /**
   * Search for images with a specific aspect ratio using the given search
   * query.
   *
   * @param title - The title of the search.
   * @param searchQuery - The search query.
   * @returns An array of matching images.
   */
  private async search(searchQuery: string): Promise<Result[]> {
    try {
      // Define the target aspect ratio and tolerance
      const targetAspectRatio = 0.66;
      const tolerance = 0.1;

      // Perform the image search
      const searchResults = await gis(searchQuery);

      this.logger.debug({
        message: `Google Image Search Results`,
        searchQuery,
        resultsCount: searchResults.length,
        searchResults,
      });
      // Filter the search results based on the aspect ratio
      const matches = searchResults.filter((image) => {
        const aspectRatio = image.width / image.height;
        const aspectRatioDifference = Math.abs(aspectRatio - targetAspectRatio);
        return aspectRatioDifference <= tolerance;
      });

      // Log the number of matches found
      this.logger.debug({
        message: `Found ${matches.length} matching Box Art Images.`,
        searchQuery,
        matchesCount: matches.length,
        matches,
      });

      // Return the matching images
      return matches;
    } catch (error) {
      // Log an error if the search fails
      this.logger.error({
        message: `Box Art Search failed`,
        searchQuery,
        error,
      });
    }
  }

  /**
   * Downloads the first matching image from the given array of images and
   * updates the game object with the downloaded image. If no matching image is
   * found, logs an error message.
   *
   * @param game - The game object to update with the downloaded image.
   * @param images - The array of images to search for a matching image.
   * @returns The updated game object.
   */
  private async downloadMatchingImage(
    game: Game,
    images: Result[],
  ): Promise<Game> {
    let found = false;

    // Iterate through the images array
    for (const image of images) {
      try {
        // Download the image by URL
        game.box_image = await this.imagesService.downloadByUrl(image.url);

        // Save the updated game object
        await this.gamesService.save(game);

        // Log the details of the downloaded image
        this.logger.log({
          message: `Saved new Box Art Image.`,
          game: game.title,
          image,
        });

        found = true;
        break;
      } catch (error) {
        // Log an error if image download fails
        this.logger.error({
          message: "Error downloading image.",
          game: game.title,
          image,
          error,
        });
      }
    }

    if (!found) {
      // Log an error if no matching image is found
      this.logger.error({
        message: `Could not download Box Art Image for game.`,
        game: game.title,
        matchingImagesCount: images.length,
      });
    }

    // Return the updated game object
    return game;
  }

  /** Formats the cooldown time into a string representation. */
  private formatCooldownTime(milliseconds: number): string {
    const hours = Math.floor(milliseconds / 3_600_000);
    const minutes = Math.floor((milliseconds % 3_600_000) / 60_000);
    const seconds = Math.floor((milliseconds % 60_000) / 1000);

    return `${hours}h ${minutes}m ${seconds}s`;
  }
}
