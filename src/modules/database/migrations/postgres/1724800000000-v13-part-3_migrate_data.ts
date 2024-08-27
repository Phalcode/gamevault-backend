import { Logger, NotImplementedException } from "@nestjs/common";
import { In, MigrationInterface, QueryRunner } from "typeorm";
import { GamevaultGame } from "../../../games/gamevault-game.entity";
import { Media } from "../../../media/media.entity";
import { DeveloperMetadata } from "../../../metadata/developers/developer.metadata.entity";
import { GameMetadata } from "../../../metadata/games/game.metadata.entity";
import { GenreMetadata } from "../../../metadata/genres/genre.metadata.entity";
import { PublisherMetadata } from "../../../metadata/publishers/publisher.metadata.entity";
import { TagMetadata } from "../../../metadata/tags/tag.metadata.entity";
import { DeveloperV12 } from "../../legacy-entities/developer.v12-entity";
import { GameV12 } from "../../legacy-entities/game.v12-entity";
import { GenreV12 } from "../../legacy-entities/genre.v12-entity";
import { ImageV12 } from "../../legacy-entities/image.v12-entity";
import { PublisherV12 } from "../../legacy-entities/publisher.v12-entity";
import { TagV12 } from "../../legacy-entities/tag.v12-entity";

export class V13Part2MigrateData1724800000000 implements MigrationInterface {
  private readonly logger = new Logger(this.constructor.name);
  name = "V13Part2MigrateData1724800000000";
  legacy_provider_slug = "rawg-legacy";

  public async up(queryRunner: QueryRunner): Promise<void> {
    this.logger.log("Starting Migration to V13.0.0 - Part 3");

    await this.migrateImages(queryRunner);
    await this.migrateTags(queryRunner);
    await this.migrateGenres(queryRunner);
    await this.migrateDevelopers(queryRunner);
    await this.migratePublishers(queryRunner);

    await this.migrateGames(queryRunner);
    await this.migrateUsers(queryRunner);

    await this.migrateBookmarks(queryRunner);
    await this.migrateProgress(queryRunner);
  }

  private async migrateImages(queryRunner: QueryRunner) {
    this.logger.log("Migrating Images...");
    const v12_images = await queryRunner.manager.find(ImageV12);
    for (const v12_image of v12_images) {
      this.logger.log(`Found ${v12_images.length} images in v12 database.`);
      this.logger.log(`Migrating V12 image #${v12_image.id}`);
      await queryRunner.manager.save(Media, {
        id: v12_image.id,
        source_url: v12_image.source,
        file_path: v12_image.path.replace("/images/", "/media/"),
        type: v12_image.mediaType ?? "application/octet-stream",
        uploader: v12_image.uploader,
        created_at: v12_image.created_at,
        updated_at: v12_image.updated_at,
        deleted_at: v12_image.deleted_at,
        entity_version: v12_image.entity_version,
      });
      this.logger.log(`Migrated V12 image #${v12_image.id}`);
    }
  }

  private async migrateTags(queryRunner: QueryRunner) {
    this.logger.log("Migrating Tags...");
    const v12_tags = await queryRunner.manager.find(TagV12);
    this.logger.log(`Found ${v12_tags.length} tags in v12 database.`);
    for (const v12_tag of v12_tags) {
      this.logger.log(`Migrating V12 tag #${v12_tag.id} (${v12_tag.name})`);
      await queryRunner.manager.save(TagMetadata, {
        provider_slug: this.legacy_provider_slug,
        provider_data_id: v12_tag.rawg_id.toString(),
        name: v12_tag.name,
        id: v12_tag.id,
        created_at: v12_tag.created_at,
        updated_at: v12_tag.updated_at,
        deleted_at: v12_tag.deleted_at,
        entity_version: v12_tag.entity_version,
      });
      this.logger.log(`Migrated V12 tag #${v12_tag.id} (${v12_tag.name})`);
    }
  }

  private async migrateGenres(queryRunner: QueryRunner) {
    this.logger.log("Migrating Genres...");
    const v12_genres = await queryRunner.manager.find(GenreV12);
    this.logger.log(`Found ${v12_genres.length} genres in v12 database.`);
    for (const v12_genre of v12_genres) {
      this.logger.log(
        `Migrating V12 genre #${v12_genre.id} (${v12_genre.name})`,
      );
      await queryRunner.manager.save(GenreMetadata, {
        provider_slug: this.legacy_provider_slug,
        provider_data_id: v12_genre.rawg_id.toString(),
        name: v12_genre.name,
        id: v12_genre.id,
        created_at: v12_genre.created_at,
        updated_at: v12_genre.updated_at,
        deleted_at: v12_genre.deleted_at,
        entity_version: v12_genre.entity_version,
      });
      this.logger.log(
        `Migrated V12 genre #${v12_genre.id} (${v12_genre.name})`,
      );
    }
  }

  private async migrateDevelopers(queryRunner: QueryRunner) {
    this.logger.log("Migrating Developers...");
    const v12_developers = await queryRunner.manager.find(DeveloperV12);
    this.logger.log(
      `Found ${v12_developers.length} developers in v12 database.`,
    );
    for (const v12_developer of v12_developers) {
      this.logger.log(
        `Migrating V12 developer #${v12_developer.id} (${v12_developer.name})`,
      );
      await queryRunner.manager.save(DeveloperMetadata, {
        provider_slug: this.legacy_provider_slug,
        provider_data_id: v12_developer.rawg_id.toString(),
        name: v12_developer.name,
        id: v12_developer.id,
        created_at: v12_developer.created_at,
        updated_at: v12_developer.updated_at,
        deleted_at: v12_developer.deleted_at,
        entity_version: v12_developer.entity_version,
      });
      this.logger.log(
        `Migrated V12 developer #${v12_developer.id} (${v12_developer.name})`,
      );
    }
  }

  private async migratePublishers(queryRunner: QueryRunner) {
    this.logger.log("Migrating Publishers...");
    const v12_publishers = await queryRunner.manager.find(PublisherV12);
    this.logger.log(
      `Found ${v12_publishers.length} publishers in v12 database.`,
    );
    for (const v12_publisher of v12_publishers) {
      this.logger.log(
        `Migrating V12 publisher #${v12_publisher.id} (${v12_publisher.name})`,
      );
      await queryRunner.manager.save(PublisherMetadata, {
        provider_slug: this.legacy_provider_slug,
        provider_data_id: v12_publisher.rawg_id.toString(),
        name: v12_publisher.name,
        id: v12_publisher.id,
        created_at: v12_publisher.created_at,
        updated_at: v12_publisher.updated_at,
        deleted_at: v12_publisher.deleted_at,
        entity_version: v12_publisher.entity_version,
      });
      this.logger.log(
        `Migrated V12 publisher #${v12_publisher.id} (${v12_publisher.name})`,
      );
    }
  }

  private async migrateUsers(queryRunner: QueryRunner) {
    throw new Error("Method not implemented.");
  }
  private async migrateBookmarks(queryRunner: QueryRunner) {
    throw new Error("Method not implemented.");
  }
  private async migrateProgress(queryRunner: QueryRunner) {
    throw new Error("Method not implemented.");
  }

  private async migrateGames(queryRunner: QueryRunner) {
    this.logger.log("Migrating Games...");

    const v12_games = await queryRunner.manager.find(GameV12, {
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

    if (v12_games.some((game) => game.tags?.length > 0)) {
      // TODO: For some reason these sub-items dont get found in the database. Find out why and fix it.
      throw Error("It works!");
    }

    this.logger.log(`Found ${v12_games.length} games in v12 database.`);
    for (const v12_game of v12_games) {
      this.logger.log({
        message: `Migrating V12 game`,
        game: v12_game,
      });

      const saved_game = await queryRunner.manager.save(GamevaultGame, {
        file_path: v12_game.file_path,
        size: v12_game.size,
        title: v12_game.title,
        version: v12_game.version,
        release_date: v12_game.release_date,
        early_access: v12_game.early_access,
        download_count: 0,
        type: v12_game.type,
        id: v12_game.id,
        created_at: v12_game.created_at,
        updated_at: v12_game.updated_at,
        deleted_at: v12_game.deleted_at,
        entity_version: v12_game.entity_version,
      } as GamevaultGame);
      const cover = v12_game.box_image
        ? await queryRunner.manager.findOneBy(Media, {
            id: v12_game.box_image.id,
          })
        : undefined;

      if (cover) {
        this.logger.log("Linked cover image.");
      }

      const background = v12_game.background_image
        ? await queryRunner.manager.findOneBy(Media, {
            id: v12_game.background_image.id,
          })
        : undefined;

      if (background) {
        this.logger.log("Linked background image.");
      }

      if (!v12_game.rawg_id) {
        this.logger.log("No rawg_id found. Skipping metadata.");
        continue;
      }

      const tags = v12_game.tags?.length
        ? await queryRunner.manager.findBy(TagMetadata, {
            provider_slug: this.legacy_provider_slug,
            provider_data_id: In(v12_game.tags?.map((t) => t.rawg_id)),
          })
        : undefined;

      if (tags) {
        this.logger.log(`Linked ${tags.length} tags.`);
      }

      const genres = v12_game.genres?.length
        ? await queryRunner.manager.findBy(GenreMetadata, {
            provider_slug: this.legacy_provider_slug,
            provider_data_id: In(v12_game.genres?.map((g) => g.rawg_id)),
          })
        : undefined;

      if (genres) {
        this.logger.log(`Linked ${genres.length} genres.`);
      }

      const developers = v12_game.developers?.length
        ? await queryRunner.manager.findBy(DeveloperMetadata, {
            provider_slug: this.legacy_provider_slug,
            provider_data_id: In(v12_game.developers?.map((d) => d.rawg_id)),
          })
        : undefined;

      if (developers) {
        this.logger.log(`Linked ${developers.length} developers.`);
      }

      const publishers = v12_game.publishers?.length
        ? await queryRunner.manager.findBy(PublisherMetadata, {
            provider_slug: this.legacy_provider_slug,
            provider_data_id: In(v12_game.publishers?.map((p) => p.rawg_id)),
          })
        : undefined;

      if (publishers) {
        this.logger.log(`Linked ${publishers.length} publishers.`);
      }

      const saved_metadata: GameMetadata = await queryRunner.manager.save(
        GameMetadata,
        {
          gamevault_games: [saved_game],
          provider_slug: this.legacy_provider_slug,
          provider_data_id: v12_game.rawg_id.toString(),
          title: v12_game.rawg_title,
          release_date: v12_game.rawg_release_date,
          description: v12_game.description,
          average_playtime: v12_game.average_playtime,
          cover,
          background,
          url_websites: [v12_game.website_url],
          rating: v12_game.metacritic_rating,
          early_access: v12_game.early_access,
          tags,
          genres,
          developers,
          publishers,
        },
      );

      this.logger.log(
        `Created V13 game #${saved_game.id}: "${saved_game.title}"`,
      );
    }
  }

  public async down(): Promise<void> {
    throw new NotImplementedException(
      "There is no way to undo this migration.",
    );
  }
}
