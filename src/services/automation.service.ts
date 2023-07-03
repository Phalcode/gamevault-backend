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

@Injectable()
export class AutomationService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AutomationService.name);
  constructor(
    private files: FilesService,
    private rawg: RawgService,
    private games: GamesService,
    private images: ImagesService,
    private users: UsersService,
  ) {}

  /**
   * Called when the application is fully initialized and ready to serve
   * requests.
   */
  onApplicationBootstrap() {
    this.autoindexGames();
    this.autoGarbageCollect();
    this.setServerAdmin();
  }

  /**
   * Sets the server admin by updating the user's role and activation status. If
   * a password is provided in the configuration, it will also be reset.
   */
  private async setServerAdmin() {
    try {
      const user = await this.users.getUserByUsernameOrFail(
        configuration.SERVER.ADMIN_USERNAME,
      );

      const updateUserDto: UpdateUserDto = {
        role: Role.ADMIN,
        activated: true,
        password: configuration.SERVER.ADMIN_PASSWORD || undefined,
      };

      this.users.update(user.id, updateUserDto, true);
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
          "An error occurred while setting the server admin.",
          error,
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
    const gamesInFileSystem = this.files.getFiles();
    //Index all games in file system
    await this.files.indexFiles(gamesInFileSystem);
    //Get all games in database
    const gamesInDatabase = await this.games.getAllGames();
    //Check integrity of games in database with games in file system
    await this.files.integrityCheck(gamesInFileSystem, gamesInDatabase);
    //Check cache of games in database
    await this.rawg.cacheCheck(gamesInDatabase);
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
    this.images.garbageCollectImagesInDatabase();
  }

  /** Creates necessary directories for file and database storage. */
  createFolders() {
    if (configuration.TESTING.MOCK_FILES) {
      this.logger.warn(
        "Not creating any folders because TESTING_MOCK_FILES is set to true",
      );
    }

    if (!fs.existsSync(configuration.IMAGE.STORAGE_PATH)) {
      fs.mkdirSync(configuration.IMAGE.STORAGE_PATH);
      this.logger.log(
        `Image directory ${configuration.IMAGE.STORAGE_PATH} created successfully`,
      );
    }

    if (
      configuration.DB.SYSTEM === "SQLITE" &&
      !configuration.TESTING.IN_MEMORY_DB &&
      !fs.existsSync(configuration.DB.LOCATION)
    ) {
      fs.mkdirSync(configuration.DB.LOCATION);
      this.logger.log(
        `Database directory ${configuration.DB.LOCATION} created successfully`,
      );
    }
  }
}