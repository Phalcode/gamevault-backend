import {
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
} from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import configuration from "../configuration";
import { FilesService } from "./files.service";
import { GamesService } from "./games.service";
import { RawgService } from "./rawg.service";
import { ImagesService } from "./images.service";
import * as fs from "fs";
import { UsersService } from "./users.service";
import { Role } from "../models/role.enum";
import { UpdateUserDto } from "../dtos/update-user.dto";
import { BoxArtService } from "./box-art.service";

@Injectable()
export class AutomationService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AutomationService.name);
  constructor(
    private filesService: FilesService,
    private rawgService: RawgService,
    private gamesService: GamesService,
    private imagesService: ImagesService,
    private usersService: UsersService,
    private boxartService: BoxArtService,
  ) {}

  /**
   * Called when the application is fully initialized and ready to serve
   * requests.
   */
  onApplicationBootstrap() {
    this.autoindexGames().catch((e) =>
      this.logger.error(e, "Error on Startup Automation: Autoindex"),
    );
    this.autoGarbageCollect().catch((e) =>
      this.logger.error(e, "Error on Startup Automation: Garbage Collection"),
    );
    this.setServerAdmin().catch((e) =>
      this.logger.error(e, "Error on Startup Automation: Server Admin Reset"),
    );
    this.checkFolders();
  }

  /**
   * Sets the server admin by updating the user's role and activation status. If
   * a password is provided in the configuration, it will also be reset.
   */
  private async setServerAdmin() {
    try {
      const user = await this.usersService.getUserByUsernameOrFail(
        configuration.SERVER.ADMIN_USERNAME,
      );

      const updateUserDto: UpdateUserDto = {
        role: Role.ADMIN,
        activated: true,
        password: configuration.SERVER.ADMIN_PASSWORD || undefined,
      };

      await this.usersService.update(user.id, updateUserDto, true);
    } catch (error) {
      if (error instanceof NotFoundException) {
        if (configuration.SERVER.ADMIN_USERNAME) {
          const message = configuration.SERVER.ADMIN_PASSWORD
            ? `The admin password was not reset because the user "${configuration.SERVER.ADMIN_USERNAME}" specified in the configuration was not found in the database. Make sure to register the user.`
            : "The admin password was not reset because no admin username was specified in the configuration.";

          this.logger.warn(message);
        }
      } else {
        this.logger.error(
          error,
          "An error occurred while setting the server admin.",
        );
      }
    }
  }

  /**
   * Cron job that indexes games, performs integrity check and caches them.
   *
   * @async
   */
  @Cron(`*/${configuration.GAMES.INDEX_INTERVAL_IN_MINUTES} * * * *`)
  public async autoindexGames() {
    //Get all games in file system
    const gamesInFileSystem = this.filesService.getFiles();
    //Index all games in file system
    await this.filesService.indexFiles(gamesInFileSystem);
    //Get all games in database
    const gamesInDatabase = await this.gamesService.getAllGames();
    //Check integrity of games in database with games in file system
    await this.filesService.integrityCheck(gamesInFileSystem, gamesInDatabase);
    //Check cache of games in database
    await this.rawgService.cacheGames(gamesInDatabase);
    //Check boxart of games in database
    await this.boxartService.checkBoxArts(gamesInDatabase);
  }

  /**
   * Cron job that performs garbage collection of images in the database.
   *
   * @async
   */
  @Cron(`*/${configuration.IMAGE.GC_INTERVAL_MINUTES} * * * *`)
  public async autoGarbageCollect() {
    if (configuration.TESTING.MOCK_FILES) {
      this.logger.log(
        "Not collecting any garbage because TESTING_MOCK_FILES is set to true, so no garbage can exist",
      );
      return;
    }
    await this.imagesService.garbageCollectImagesInDatabase();
  }

  /**
   * Checks and creates necessary folders if they do not exist.
   *
   * @private
   */
  private checkFolders() {
    if (configuration.TESTING.MOCK_FILES) {
      this.logger.warn(
        "Not checking or creating any folders because TESTING_MOCK_FILES is set to true",
      );
      return;
    }

    this.createDirectoryIfNotExist(
      configuration.VOLUMES.FILES,
      `Directory "${configuration.VOLUMES.FILES}" does not exist. Trying to create a new one...`,
    );

    this.createDirectoryIfNotExist(
      configuration.VOLUMES.IMAGES,
      `Directory "${configuration.VOLUMES.IMAGES}" does not exist. Trying to create a new one...`,
    );

    this.createDirectoryIfNotExist(
      configuration.VOLUMES.LOGS,
      `Directory "${configuration.VOLUMES.LOGS}" does not exist. Trying to create a new one...`,
    );

    if (
      configuration.DB.SYSTEM === "SQLITE" &&
      !configuration.TESTING.IN_MEMORY_DB
    ) {
      this.createDirectoryIfNotExist(
        configuration.VOLUMES.SQLITEDB,
        `Directory "${configuration.VOLUMES.SQLITEDB}" does not exist. Trying to create a new one...`,
      );
    }
  }

  /**
   * Creates a directory if it does not exist.
   *
   * @param {string} path - The path of the directory.
   * @param {string} errorMessage - The error message to log if the directory
   *   does not exist.
   */
  private createDirectoryIfNotExist(path, errorMessage) {
    if (!fs.existsSync(path)) {
      this.logger.error(errorMessage);
      fs.mkdirSync(path);
    }
  }
}
