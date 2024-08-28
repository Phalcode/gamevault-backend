import { Logger, NotImplementedException } from "@nestjs/common";
import { In, MigrationInterface, QueryRunner } from "typeorm";
import { GamevaultGame } from "../../../games/gamevault-game.entity";
import { Media } from "../../../media/media.entity";
import { DeveloperMetadata } from "../../../metadata/developers/developer.metadata.entity";
import { GameMetadata } from "../../../metadata/games/game.metadata.entity";
import { GenreMetadata } from "../../../metadata/genres/genre.metadata.entity";
import { PublisherMetadata } from "../../../metadata/publishers/publisher.metadata.entity";
import { TagMetadata } from "../../../metadata/tags/tag.metadata.entity";
import { State } from "../../../progresses/models/state.enum";
import { Progress } from "../../../progresses/progress.entity";
import { GamevaultUser } from "../../../users/gamevault-user.entity";
import { DeveloperV12 } from "../../legacy-entities/developer.v12-entity";
import { GameV12 } from "../../legacy-entities/game.v12-entity";
import { GamevaultUserV12 } from "../../legacy-entities/gamevault-user.v12-entity";
import { GenreV12 } from "../../legacy-entities/genre.v12-entity";
import { ImageV12 } from "../../legacy-entities/image.v12-entity";
import { ProgressV12 } from "../../legacy-entities/progress.v12-entity";
import { PublisherV12 } from "../../legacy-entities/publisher.v12-entity";
import { TagV12 } from "../../legacy-entities/tag.v12-entity";

export class V13Part3MigrateData1724800000000 implements MigrationInterface {
  private readonly logger = new Logger(this.constructor.name);
  name = "V13Part3MigrateData1724800000000";
  legacyProviderSlug = "rawg-legacy";
  public async up(queryRunner: QueryRunner): Promise<void> {
    this.logger.log({ message: "Starting Migration to V13.0.0 - Part 3" });

    await this.migrateImages(queryRunner);
    await this.migrateTags(queryRunner);
    await this.migrateGenres(queryRunner);
    await this.migrateDevelopers(queryRunner);
    await this.migratePublishers(queryRunner);
    await this.migrateGames(queryRunner);
    await this.migrateUsersAndBookmarks(queryRunner);
    await this.migrateProgresses(queryRunner);

    this.logger.log({
      message: "Migration to V13.0.0 - Part 3 completed successfully.",
    });
  }

  private async migrateImages(queryRunner: QueryRunner): Promise<void> {
    this.logger.log({ message: "Migrating Images..." });

    const images = await queryRunner.manager.find(ImageV12, {
      withDeleted: true,
    });
    this.logger.log({
      message: `Found ${images.length} images in the V12 database.`,
    });

    for (const image of images) {
      this.logger.log({ message: `Migrating image`, image });

      const newImage = await queryRunner.manager.save(Media, {
        id: image.id,
        source_url: image.source,
        file_path: image.path.replace("/images/", "/media/"),
        type: image.mediaType ?? "application/octet-stream",
        uploader: image.uploader,
        created_at: image.created_at,
        updated_at: image.updated_at,
        deleted_at: image.deleted_at,
        entity_version: image.entity_version,
      });

      await queryRunner.manager.update(Media, newImage.id, {
        id: image.id,
      });

      this.logger.log({ message: `Image migrated successfully`, newImage });
    }

    this.logger.log({ message: "Image migration completed." });
  }

  private async migrateTags(queryRunner: QueryRunner): Promise<void> {
    this.logger.log({ message: "Migrating Tags..." });

    const tags = await queryRunner.manager.find(TagV12, { withDeleted: true });
    this.logger.log({
      message: `Found ${tags.length} tags in the V12 database.`,
    });

    for (const tag of tags) {
      this.logger.log({ message: `Migrating tag`, tag });

      if (
        await queryRunner.manager.existsBy(TagMetadata, {
          provider_slug: this.legacyProviderSlug,
          provider_data_id: tag.rawg_id.toString(),
        })
      ) {
        this.logger.log({ message: `Tag already exists.` });
        return;
      }

      const newTag = await queryRunner.manager.save(TagMetadata, {
        provider_slug: this.legacyProviderSlug,
        provider_data_id: tag.rawg_id.toString(),
        name: tag.name,
        id: tag.id,
        created_at: tag.created_at,
        updated_at: tag.updated_at,
        deleted_at: tag.deleted_at,
        entity_version: tag.entity_version,
      });

      await queryRunner.manager.update(TagMetadata, newTag.id, {
        id: tag.id,
      });

      this.logger.log({ message: `Tag migrated successfully`, newTag });
    }

    this.logger.log({ message: "Tag migration completed." });
  }

  private async migrateGenres(queryRunner: QueryRunner): Promise<void> {
    this.logger.log({ message: "Migrating Genres..." });

    const genres = await queryRunner.manager.find(GenreV12, {
      withDeleted: true,
    });
    this.logger.log({
      message: `Found ${genres.length} genres in the V12 database.`,
    });

    for (const genre of genres) {
      this.logger.log({ message: `Migrating genre`, genre });

      if (
        await queryRunner.manager.existsBy(GenreMetadata, {
          provider_slug: this.legacyProviderSlug,
          provider_data_id: genre.rawg_id.toString(),
        })
      ) {
        this.logger.log({ message: `Genre already exists.` });
        return;
      }

      const newGenre = await queryRunner.manager.save(GenreMetadata, {
        provider_slug: this.legacyProviderSlug,
        provider_data_id: genre.rawg_id.toString(),
        name: genre.name,
        id: genre.id,
        created_at: genre.created_at,
        updated_at: genre.updated_at,
        deleted_at: genre.deleted_at,
        entity_version: genre.entity_version,
      });

      await queryRunner.manager.update(GenreMetadata, newGenre.id, {
        id: genre.id,
      });

      this.logger.log({ message: `Genre migrated successfully`, newGenre });
    }

    this.logger.log({ message: "Genre migration completed." });
  }

  private async migrateDevelopers(queryRunner: QueryRunner): Promise<void> {
    this.logger.log({ message: "Migrating Developers..." });

    const developers = await queryRunner.manager.find(DeveloperV12, {
      withDeleted: true,
    });
    this.logger.log({
      message: `Found ${developers.length} developers in the V12 database.`,
    });

    for (const developer of developers) {
      this.logger.log({ message: `Migrating developer`, developer });

      if (
        await queryRunner.manager.existsBy(DeveloperMetadata, {
          provider_slug: this.legacyProviderSlug,
          provider_data_id: developer.rawg_id.toString(),
        })
      ) {
        this.logger.log({ message: `Developer already exists.` });
        return;
      }

      const newDeveloper = await queryRunner.manager.save(DeveloperMetadata, {
        provider_slug: this.legacyProviderSlug,
        provider_data_id: developer.rawg_id.toString(),
        name: developer.name,
        id: developer.id,
        created_at: developer.created_at,
        updated_at: developer.updated_at,
        deleted_at: developer.deleted_at,
        entity_version: developer.entity_version,
      });

      await queryRunner.manager.update(DeveloperMetadata, newDeveloper.id, {
        id: developer.id,
      });

      this.logger.log({
        message: `Developer migrated successfully`,
        newDeveloper,
      });
    }

    this.logger.log({ message: "Developer migration completed." });
  }

  private async migratePublishers(queryRunner: QueryRunner): Promise<void> {
    this.logger.log({ message: "Migrating Publishers..." });

    const publishers = await queryRunner.manager.find(PublisherV12, {
      withDeleted: true,
    });
    this.logger.log({
      message: `Found ${publishers.length} publishers in the V12 database.`,
    });

    for (const publisher of publishers) {
      this.logger.log({ message: `Migrating publisher`, publisher });

      if (
        await queryRunner.manager.existsBy(PublisherMetadata, {
          provider_slug: this.legacyProviderSlug,
          provider_data_id: publisher.rawg_id.toString(),
        })
      ) {
        this.logger.log({ message: `Publisher already exists.` });
        return;
      }

      const newPublisher = await queryRunner.manager.save(PublisherMetadata, {
        provider_slug: this.legacyProviderSlug,
        provider_data_id: publisher.rawg_id.toString(),
        name: publisher.name,
        id: publisher.id,
        created_at: publisher.created_at,
        updated_at: publisher.updated_at,
        deleted_at: publisher.deleted_at,
        entity_version: publisher.entity_version,
      });

      await queryRunner.manager.update(PublisherMetadata, newPublisher.id, {
        id: publisher.id,
      });

      this.logger.log({
        message: `Publisher migrated successfully`,
        newPublisher,
      });
    }

    this.logger.log({ message: "Publisher migration completed." });
  }

  private async migrateGames(queryRunner: QueryRunner): Promise<void> {
    this.logger.log({ message: "Migrating Games..." });

    const games = await queryRunner.manager.find(GameV12, {
      relations: [
        "box_image",
        "background_image",
        "publishers",
        "developers",
        "tags",
        "genres",
      ],
      withDeleted: true,
      relationLoadStrategy: "query",
    });
    this.logger.log({
      message: `Found ${games.length} games in the V12 database.`,
    });

    for (const game of games) {
      this.logger.log({ message: `Migrating game ${game.id}` });

      const savedGame = await queryRunner.manager.save(GamevaultGame, {
        id: game.id,
        file_path: game.file_path,
        size: game.size,
        title: game.title,
        version: game.version,
        release_date: game.release_date,
        early_access: game.early_access,
        download_count: 0,
        type: game.type,
        created_at: game.created_at,
        updated_at: game.updated_at,
        deleted_at: game.deleted_at,
        entity_version: game.entity_version,
      });

      await queryRunner.manager.update(GamevaultGame, savedGame.id, {
        id: game.id,
      });

      this.logger.log({ message: `Game saved successfully`, savedGame });

      const cover = game.box_image
        ? await queryRunner.manager.findOneBy(Media, { id: game.box_image.id })
        : undefined;
      if (cover) this.logger.log({ message: "Linked cover image", cover });

      const background = game.background_image
        ? await queryRunner.manager.findOneBy(Media, {
            id: game.background_image.id,
          })
        : undefined;
      if (background)
        this.logger.log({ message: "Linked background image", background });

      if (!game.rawg_id) {
        this.logger.log({
          message: "No rawg_id found. Skipping metadata.",
          gameId: game.id,
        });
        continue;
      }

      const tags = game.tags?.length
        ? await queryRunner.manager.findBy(TagMetadata, {
            provider_slug: this.legacyProviderSlug,
            provider_data_id: In(game.tags.map((t) => t.rawg_id)),
          })
        : [];
      this.logger.log({ message: `Linked tags`, tagCount: tags.length });

      const genres = game.genres?.length
        ? await queryRunner.manager.findBy(GenreMetadata, {
            provider_slug: this.legacyProviderSlug,
            provider_data_id: In(game.genres.map((g) => g.rawg_id)),
          })
        : [];
      this.logger.log({ message: `Linked genres`, genreCount: genres.length });

      const developers = game.developers?.length
        ? await queryRunner.manager.findBy(DeveloperMetadata, {
            provider_slug: this.legacyProviderSlug,
            provider_data_id: In(game.developers.map((d) => d.rawg_id)),
          })
        : [];
      this.logger.log({
        message: `Linked developers`,
        developerCount: developers.length,
      });

      const publishers = game.publishers?.length
        ? await queryRunner.manager.findBy(PublisherMetadata, {
            provider_slug: this.legacyProviderSlug,
            provider_data_id: In(game.publishers.map((p) => p.rawg_id)),
          })
        : [];
      this.logger.log({
        message: `Linked publishers`,
        publisherCount: publishers.length,
      });

      if (
        await queryRunner.manager.existsBy(GameMetadata, {
          provider_slug: this.legacyProviderSlug,
          provider_data_id: game.rawg_id.toString(),
        })
      ) {
        this.logger.log({ message: `Game Metadata already exists. Skipping.` });
        continue;
      }

      const gameMetadata = await queryRunner.manager.save(GameMetadata, {
        provider_slug: this.legacyProviderSlug,
        provider_data_id: game.rawg_id.toString(),
        title: game.rawg_title,
        release_date: game.rawg_release_date,
        description: game.description,
        average_playtime: game.average_playtime,
        cover,
        background,
        url_websites: [game.website_url],
        rating: game.metacritic_rating,
        early_access: game.early_access,
        tags,
        genres,
        developers,
        publishers,
      });

      savedGame.provider_metadata = [gameMetadata];
      await queryRunner.manager.save(GamevaultGame, savedGame);

      this.logger.log({
        message: `Game metadata saved successfully`,
        gameMetadata,
      });
    }

    this.logger.log({ message: "Game migration completed." });
  }

  private async migrateUsersAndBookmarks(
    queryRunner: QueryRunner,
  ): Promise<void> {
    this.logger.log({ message: "Migrating Users..." });

    const users = await queryRunner.manager.find(GamevaultUserV12, {
      withDeleted: true,
      select: [
        "id",
        "created_at",
        "updated_at",
        "deleted_at",
        "entity_version",
        "username",
        "password",
        "socket_secret",
        "profile_picture",
        "background_image",
        "email",
        "first_name",
        "last_name",
        "activated",
        "role",
        "bookmarked_games",
      ],
      relations: ["profile_picture", "background_image", "bookmarked_games"],
      relationLoadStrategy: "query",
    });
    this.logger.log({
      message: `Found ${users.length} users in the V12 database.`,
    });

    for (const user of users) {
      this.logger.log({ message: `Migrating user`, user });

      const avatar = user.profile_picture
        ? await queryRunner.manager.findOneBy(Media, {
            id: user.profile_picture.id,
          })
        : undefined;
      if (avatar) this.logger.log({ message: "Linked avatar image", avatar });

      const background = user.background_image
        ? await queryRunner.manager.findOneBy(Media, {
            id: user.background_image.id,
          })
        : undefined;
      if (background)
        this.logger.log({ message: "Linked background image", background });

      const bookmarkedGames = user.bookmarked_games?.length
        ? await queryRunner.manager.findBy(GamevaultGame, {
            id: In(user.bookmarked_games.map((b) => b.id)),
          })
        : [];

      const newUser = await queryRunner.manager.save(GamevaultUser, {
        id: user.id,
        username: user.username,
        password: user.password,
        socket_secret: user.socket_secret,
        avatar,
        background,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        birth_date: undefined,
        activated: user.activated,
        role: user.role.valueOf(),
        bookmarked_games: bookmarkedGames,
        created_at: user.created_at,
        updated_at: user.updated_at,
        deleted_at: user.deleted_at,
        entity_version: user.entity_version,
      });

      await queryRunner.manager.update(GamevaultUser, newUser.id, {
        id: user.id,
      });

      this.logger.log({ message: `User migrated successfully`, newUser });
    }

    this.logger.log({ message: "User migration completed." });
  }

  private async migrateProgresses(queryRunner: QueryRunner): Promise<void> {
    this.logger.log({ message: "Migrating Progresses..." });

    const progresses = await queryRunner.manager.find(ProgressV12, {
      withDeleted: true,
      loadEagerRelations: true,
      relations: ["user", "game"],
      relationLoadStrategy: "query",
    });
    this.logger.log({
      message: `Found ${progresses.length} progresses in the V12 database.`,
    });

    for (const progress of progresses) {
      this.logger.log({ message: `Migrating progress`, progress });

      const user = progress.user
        ? await queryRunner.manager.findOne(GamevaultUser, {
            where: { id: progress.user.id },
            withDeleted: true,
          })
        : undefined;

      const game = progress.game
        ? await queryRunner.manager.findOne(GamevaultGame, {
            where: { id: progress.game.id },
            withDeleted: true,
          })
        : undefined;

      const newProgress = await queryRunner.manager.save(Progress, {
        user,
        game,
        minutes_played: progress.minutes_played,
        state: State[progress.state.valueOf()],
        last_played_at: progress.last_played_at,
        id: progress.id,
        created_at: progress.created_at,
        updated_at: progress.updated_at,
        deleted_at: progress.deleted_at,
        entity_version: progress.entity_version,
      });

      await queryRunner.manager.update(Progress, newProgress.id, {
        id: progress.id,
      });

      this.logger.log({
        message: `Progress migrated successfully`,
        newProgress,
      });
    }

    this.logger.log({ message: "Progress migration completed." });
  }

  public async down(): Promise<void> {
    throw new NotImplementedException(
      "There is no rollback for this migration.",
    );
  }
}
