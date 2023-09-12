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

  public async checkBoxArts(games: Game[]): Promise<void> {
    if (configuration.TESTING.GOOGLE_API_DISABLED) {
      this.logger.warn(
        "Skipping Box Art Search because Google API is disabled",
      );
      return;
    }

    this.logger.log("STARTED BOXART CHECK");

    for (const game of games) {
      try {
        await this.checkBoxArt(game);
        this.logger.debug(
          { gameId: game.id, title: game.title },
          `Checked BoxArt Successfully`,
        );
      } catch (error) {
        this.logger.error(
          {
            gameId: game.id,
            title: game.title,
            error: error,
          },
          "Checking BoxArt Failed!",
        );
      }
    }
    this.logger.log("FINISHED BOXART CHECK");
  }

  /**
   * Checks if the box art for the game is available and searches for it if
   * necessary.
   *
   * @param game - The game for which to check the box art.
   */
  public async checkBoxArt(game: Game): Promise<void> {
    if (
      game.box_image?.id &&
      (await this.imagesService.isImageAvailable(game.box_image.id))
    ) {
      this.logger.debug(`Box Art for "${game.title}" is still available`);
      return;
    }

    if (configuration.TESTING.GOOGLE_API_DISABLED) {
      this.logger.warn(
        "Skipping Box Art Search because Google API is disabled",
      );
      return;
    }

    const currentTime = Date.now();
    if (
      this.cooldownGames >= 5 &&
      currentTime - this.cooldownStartTime < this.cooldownDurationInMilliseconds
    ) {
      const remainingCooldown =
        this.cooldownStartTime +
        this.cooldownDurationInMilliseconds -
        currentTime;
      this.logger.warn(
        `Cooldown active. Skipping Box Art Search. Remaining cooldown: ${this.formatCooldownTime(
          remainingCooldown,
        )}`,
      );
      return;
    }

    const steamGridDbResults = await this.performImageSearch(
      game.title,
      `"${game.title}" inurl:steamgriddb.com`,
    );

    let results: Result[] = steamGridDbResults;

    if (steamGridDbResults.length === 0) {
      results = await this.performImageSearch(
        game.title,
        `"${game.title}" game box art`,
      );
    }

    if (results.length === 0) {
      this.cooldownGames++;
      if (this.cooldownGames >= 5) {
        this.cooldownStartTime = currentTime;
        const remainingCooldown =
          this.cooldownStartTime +
          this.cooldownDurationInMilliseconds -
          currentTime;
        this.logger.warn(
          `No Box Art Images found for multiple games. You probably hit the Google Image Search Rate-Limit. Cooldown activated for ${this.formatCooldownTime(
            this.cooldownDurationInMilliseconds,
          )}. Remaining cooldown: ${this.formatCooldownTime(
            remainingCooldown,
          )}. The cooldown will expire after a server restart.`,
        );
      }
      return;
    }

    const matchingImage = await this.downloadMatchingImage(game, results);

    if (!matchingImage) {
      this.logger.error(`No Box Art Images found for "${game.title}"`);
      return;
    }

    this.cooldownGames = 0;
  }

  /**
   * Performs an image search using the specified title and search query.
   *
   * @param title - The title of the game.
   * @param searchQuery - The search query to be used.
   * @returns The results of the image search.
   */
  private async performImageSearch(
    title: string,
    searchQuery: string,
  ): Promise<Result[]> {
    try {
      const targetAspectRatio = 0.66;
      const tolerance = 0.1;
      const matches = [];
      const searchResults = await gis(searchQuery);
      this.logger.debug(
        `Found ${searchResults.length} Box Art Images for "${title}" | Search: "${searchQuery}"`,
      );

      for (const image of searchResults) {
        const aspectRatio = image.width / image.height;
        const aspectRatioDifference = Math.abs(aspectRatio - targetAspectRatio);

        if (aspectRatioDifference <= tolerance) {
          matches.push(image);
        }
      }
      return matches;
    } catch (error) {
      this.logger.error(
        error,
        `Box Art search failed for query: ${searchQuery}`,
      );
    }
  }

  /**
   * Finds the matching image with the target aspect ratio from the given
   * images. Saves the first image that matches all criteria into the game.
   */
  private async downloadMatchingImage(
    game: Game,
    images: Result[],
  ): Promise<boolean> {
    for (const image of images) {
      try {
        game.box_image = await this.imagesService.downloadImageByUrl(image.url);
        await this.gamesService.saveGame(game);
        this.logger.log(
          `Saved new Box Art for "${game.title}" (${image.width}px x ${image.height}px) | URL: ${image.url}`,
        );
        return true;
      } catch (error) {
        continue;
      }
    }

    return false;
  }

  /**
   * Formats the cooldown time into a string representation.
   *
   * @param milliseconds - The duration of the cooldown in milliseconds.
   * @returns The formatted cooldown time string.
   */
  private formatCooldownTime(milliseconds: number): string {
    const hours = Math.floor(milliseconds / 3600000);
    const minutes = Math.floor((milliseconds % 3600000) / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);

    return `${hours}h ${minutes}m ${seconds}s`;
  }
}
