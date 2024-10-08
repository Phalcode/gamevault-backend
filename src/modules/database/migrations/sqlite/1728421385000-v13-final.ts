import { Logger, NotImplementedException } from "@nestjs/common";
import { existsSync } from "fs";
import { toLower } from "lodash";
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
import { randomBytes } from "crypto";

export class V13Final1728421385000 implements MigrationInterface {
  private readonly logger = new Logger(this.constructor.name);
  name = "V13Final1728421385000";
  legacyProviderSlug = "rawg-legacy";

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await this.checkMigrationRun(queryRunner)) {
      return;
    }
    await this.part0_sync(queryRunner);
    await this.part1_rename_tables(queryRunner);
    await this.part2_generate_new_schema(queryRunner);
    await this.part3_migrate_data(queryRunner);
    await this.part4_enable_auto_increment(queryRunner);
    await this.part5_delete_old_tables(queryRunner);
    await this.part6_sorting_title(queryRunner);
  }

  private async checkMigrationRun(queryRunner: QueryRunner): Promise<boolean> {
    const migrations = await queryRunner.query(
      `SELECT * FROM migrations WHERE name LIKE 'V13Part%'`,
    );

    if (migrations.length > 0) {
      this.logger.warn("V13 MIGRATIONS ALREADY RUN SKIPPING...");
      for (const migration of migrations) {
        this.logger.warn(JSON.stringify(migration));
      }
      return true;
    }

    return false;
  }

  private async part0_sync(queryRunner: QueryRunner) {
    await queryRunner.query(`
            DROP INDEX "IDX_5c0cd47a75116720223e43db85"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_5c2989f7bc37f907cfd937c0fd"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_71b846918f80786eed6bfb68b7"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_developer" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_5c2989f7bc37f907cfd937c0fd0" UNIQUE ("name"),
                CONSTRAINT "UQ_5c0cd47a75116720223e43db853" UNIQUE ("rawg_id")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_developer"(
                    "id",
                    "created_at",
                    "updated_at",
                    "deleted_at",
                    "entity_version",
                    "rawg_id",
                    "name"
                )
            SELECT "id",
                "created_at",
                "updated_at",
                "deleted_at",
                "entity_version",
                "rawg_id",
                "name"
            FROM "developer"
        `);
    await queryRunner.query(`
            DROP TABLE "developer"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_developer"
                RENAME TO "developer"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_5c0cd47a75116720223e43db85" ON "developer" ("rawg_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_5c2989f7bc37f907cfd937c0fd" ON "developer" ("name")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_71b846918f80786eed6bfb68b7" ON "developer" ("id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_672bce67ec8cb2d7755c158ad6"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_dd8cd9e50dd049656e4be1f7e8"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_0285d4f1655d080cfcf7d1ab14"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_genre" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_dd8cd9e50dd049656e4be1f7e8c" UNIQUE ("name"),
                CONSTRAINT "UQ_672bce67ec8cb2d7755c158ad65" UNIQUE ("rawg_id")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_genre"(
                    "id",
                    "created_at",
                    "updated_at",
                    "deleted_at",
                    "entity_version",
                    "rawg_id",
                    "name"
                )
            SELECT "id",
                "created_at",
                "updated_at",
                "deleted_at",
                "entity_version",
                "rawg_id",
                "name"
            FROM "genre"
        `);
    await queryRunner.query(`
            DROP TABLE "genre"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_genre"
                RENAME TO "genre"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_672bce67ec8cb2d7755c158ad6" ON "genre" ("rawg_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_dd8cd9e50dd049656e4be1f7e8" ON "genre" ("name")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_0285d4f1655d080cfcf7d1ab14" ON "genre" ("id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_4a0539222ee1307f657f875003"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_9dc496f2e5b912da9edd2aa445"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_70a5936b43177f76161724da3e"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_publisher" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_9dc496f2e5b912da9edd2aa4455" UNIQUE ("name"),
                CONSTRAINT "UQ_4a0539222ee1307f657f875003b" UNIQUE ("rawg_id")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_publisher"(
                    "id",
                    "created_at",
                    "updated_at",
                    "deleted_at",
                    "entity_version",
                    "rawg_id",
                    "name"
                )
            SELECT "id",
                "created_at",
                "updated_at",
                "deleted_at",
                "entity_version",
                "rawg_id",
                "name"
            FROM "publisher"
        `);
    await queryRunner.query(`
            DROP TABLE "publisher"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_publisher"
                RENAME TO "publisher"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_4a0539222ee1307f657f875003" ON "publisher" ("rawg_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_9dc496f2e5b912da9edd2aa445" ON "publisher" ("name")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_70a5936b43177f76161724da3e" ON "publisher" ("id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_45c4541783f264043ec2a5864d"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_66df34da7fb037e24fc7fee642"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_f3172007d4de5ae8e7692759d7"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_store" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_66df34da7fb037e24fc7fee642b" UNIQUE ("name"),
                CONSTRAINT "UQ_45c4541783f264043ec2a5864d6" UNIQUE ("rawg_id")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_store"(
                    "id",
                    "created_at",
                    "updated_at",
                    "deleted_at",
                    "entity_version",
                    "rawg_id",
                    "name"
                )
            SELECT "id",
                "created_at",
                "updated_at",
                "deleted_at",
                "entity_version",
                "rawg_id",
                "name"
            FROM "store"
        `);
    await queryRunner.query(`
            DROP TABLE "store"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_store"
                RENAME TO "store"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_45c4541783f264043ec2a5864d" ON "store" ("rawg_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_66df34da7fb037e24fc7fee642" ON "store" ("name")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_f3172007d4de5ae8e7692759d7" ON "store" ("id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_289102542903593026bd16e4e1"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_6a9775008add570dc3e5a0bab7"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_8e4052373c579afc1471f52676"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_tag" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_6a9775008add570dc3e5a0bab7b" UNIQUE ("name"),
                CONSTRAINT "UQ_289102542903593026bd16e4e1b" UNIQUE ("rawg_id")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_tag"(
                    "id",
                    "created_at",
                    "updated_at",
                    "deleted_at",
                    "entity_version",
                    "rawg_id",
                    "name"
                )
            SELECT "id",
                "created_at",
                "updated_at",
                "deleted_at",
                "entity_version",
                "rawg_id",
                "name"
            FROM "tag"
        `);
    await queryRunner.query(`
            DROP TABLE "tag"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_tag"
                RENAME TO "tag"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_289102542903593026bd16e4e1" ON "tag" ("rawg_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_6a9775008add570dc3e5a0bab7" ON "tag" ("name")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_8e4052373c579afc1471f52676" ON "tag" ("id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_5c0cd47a75116720223e43db85"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_5c2989f7bc37f907cfd937c0fd"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_71b846918f80786eed6bfb68b7"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_developer" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_5c2989f7bc37f907cfd937c0fd0" UNIQUE ("name"),
                CONSTRAINT "UQ_5c0cd47a75116720223e43db853" UNIQUE ("rawg_id")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_developer"(
                    "id",
                    "created_at",
                    "updated_at",
                    "deleted_at",
                    "entity_version",
                    "rawg_id",
                    "name"
                )
            SELECT "id",
                "created_at",
                "updated_at",
                "deleted_at",
                "entity_version",
                "rawg_id",
                "name"
            FROM "developer"
        `);
    await queryRunner.query(`
            DROP TABLE "developer"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_developer"
                RENAME TO "developer"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_5c0cd47a75116720223e43db85" ON "developer" ("rawg_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_5c2989f7bc37f907cfd937c0fd" ON "developer" ("name")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_71b846918f80786eed6bfb68b7" ON "developer" ("id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_672bce67ec8cb2d7755c158ad6"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_dd8cd9e50dd049656e4be1f7e8"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_0285d4f1655d080cfcf7d1ab14"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_genre" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_dd8cd9e50dd049656e4be1f7e8c" UNIQUE ("name"),
                CONSTRAINT "UQ_672bce67ec8cb2d7755c158ad65" UNIQUE ("rawg_id")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_genre"(
                    "id",
                    "created_at",
                    "updated_at",
                    "deleted_at",
                    "entity_version",
                    "rawg_id",
                    "name"
                )
            SELECT "id",
                "created_at",
                "updated_at",
                "deleted_at",
                "entity_version",
                "rawg_id",
                "name"
            FROM "genre"
        `);
    await queryRunner.query(`
            DROP TABLE "genre"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_genre"
                RENAME TO "genre"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_672bce67ec8cb2d7755c158ad6" ON "genre" ("rawg_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_dd8cd9e50dd049656e4be1f7e8" ON "genre" ("name")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_0285d4f1655d080cfcf7d1ab14" ON "genre" ("id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_4a0539222ee1307f657f875003"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_9dc496f2e5b912da9edd2aa445"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_70a5936b43177f76161724da3e"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_publisher" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_9dc496f2e5b912da9edd2aa4455" UNIQUE ("name"),
                CONSTRAINT "UQ_4a0539222ee1307f657f875003b" UNIQUE ("rawg_id")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_publisher"(
                    "id",
                    "created_at",
                    "updated_at",
                    "deleted_at",
                    "entity_version",
                    "rawg_id",
                    "name"
                )
            SELECT "id",
                "created_at",
                "updated_at",
                "deleted_at",
                "entity_version",
                "rawg_id",
                "name"
            FROM "publisher"
        `);
    await queryRunner.query(`
            DROP TABLE "publisher"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_publisher"
                RENAME TO "publisher"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_4a0539222ee1307f657f875003" ON "publisher" ("rawg_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_9dc496f2e5b912da9edd2aa445" ON "publisher" ("name")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_70a5936b43177f76161724da3e" ON "publisher" ("id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_45c4541783f264043ec2a5864d"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_66df34da7fb037e24fc7fee642"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_f3172007d4de5ae8e7692759d7"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_store" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_66df34da7fb037e24fc7fee642b" UNIQUE ("name"),
                CONSTRAINT "UQ_45c4541783f264043ec2a5864d6" UNIQUE ("rawg_id")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_store"(
                    "id",
                    "created_at",
                    "updated_at",
                    "deleted_at",
                    "entity_version",
                    "rawg_id",
                    "name"
                )
            SELECT "id",
                "created_at",
                "updated_at",
                "deleted_at",
                "entity_version",
                "rawg_id",
                "name"
            FROM "store"
        `);
    await queryRunner.query(`
            DROP TABLE "store"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_store"
                RENAME TO "store"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_45c4541783f264043ec2a5864d" ON "store" ("rawg_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_66df34da7fb037e24fc7fee642" ON "store" ("name")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_f3172007d4de5ae8e7692759d7" ON "store" ("id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_289102542903593026bd16e4e1"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_6a9775008add570dc3e5a0bab7"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_8e4052373c579afc1471f52676"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_tag" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_6a9775008add570dc3e5a0bab7b" UNIQUE ("name"),
                CONSTRAINT "UQ_289102542903593026bd16e4e1b" UNIQUE ("rawg_id")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_tag"(
                    "id",
                    "created_at",
                    "updated_at",
                    "deleted_at",
                    "entity_version",
                    "rawg_id",
                    "name"
                )
            SELECT "id",
                "created_at",
                "updated_at",
                "deleted_at",
                "entity_version",
                "rawg_id",
                "name"
            FROM "tag"
        `);
    await queryRunner.query(`
            DROP TABLE "tag"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_tag"
                RENAME TO "tag"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_289102542903593026bd16e4e1" ON "tag" ("rawg_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_6a9775008add570dc3e5a0bab7" ON "tag" ("name")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_8e4052373c579afc1471f52676" ON "tag" ("id")
        `);
  }

  private async part1_rename_tables(queryRunner: QueryRunner) {
    if (existsSync("/images")) {
      throw new Error(
        "Your media volume mount point is still pointing to /images. This is deprecated since v13.0.0. From now on, mount your images to /media instead.",
      );
    }

    // Rename all existing tables, so no conflicts appear
    await queryRunner.query(`ALTER TABLE "image" RENAME TO "v12_image"`);
    await queryRunner.query(`DROP INDEX "IDX_f03b89f33671086e6733828e79"`);
    await queryRunner.renameTable("game", "v12_game");
    await queryRunner.renameTable("gamevault_user", "v12_gamevault_user");

    await queryRunner.renameTable("progress", "v12_progress");
    await queryRunner.renameTable("developer", "v12_developer");
    await queryRunner.renameTable("genre", "v12_genre");
    await queryRunner.renameTable("publisher", "v12_publisher");
    await queryRunner.renameTable("store", "v12_store");
    await queryRunner.renameTable("tag", "v12_tag");

    await queryRunner.renameTable("bookmark", "v12_bookmark");
    await queryRunner.renameColumn(
      "v12_bookmark",
      "gamevault_user_id",
      "v12_gamevault_user_id",
    );
    await queryRunner.renameColumn("v12_bookmark", "game_id", "v12_game_id");

    await queryRunner.renameTable(
      "game_developers_developer",
      "v12_game_developers_v12_developer",
    );
    await queryRunner.renameColumn(
      "v12_game_developers_v12_developer",
      "game_id",
      "v12_game_id",
    );
    await queryRunner.renameColumn(
      "v12_game_developers_v12_developer",
      "developer_id",
      "v12_developer_id",
    );

    await queryRunner.renameTable(
      "game_genres_genre",
      "v12_game_genres_v12_genre",
    );
    await queryRunner.renameColumn(
      "v12_game_genres_v12_genre",
      "game_id",
      "v12_game_id",
    );
    await queryRunner.renameColumn(
      "v12_game_genres_v12_genre",
      "genre_id",
      "v12_genre_id",
    );

    await queryRunner.renameTable(
      "game_publishers_publisher",
      "v12_game_publishers_v12_publisher",
    );
    await queryRunner.renameColumn(
      "v12_game_publishers_v12_publisher",
      "game_id",
      "v12_game_id",
    );
    await queryRunner.renameColumn(
      "v12_game_publishers_v12_publisher",
      "publisher_id",
      "v12_publisher_id",
    );

    await queryRunner.renameTable(
      "game_stores_store",
      "v12_game_stores_v12_store",
    );
    await queryRunner.renameColumn(
      "v12_game_stores_v12_store",
      "game_id",
      "v12_game_id",
    );
    await queryRunner.renameColumn(
      "v12_game_stores_v12_store",
      "store_id",
      "v12_store_id",
    );

    await queryRunner.renameTable("game_tags_tag", "v12_game_tags_v12_tag");
    await queryRunner.renameColumn(
      "v12_game_tags_v12_tag",
      "game_id",
      "v12_game_id",
    );
    await queryRunner.renameColumn(
      "v12_game_tags_v12_tag",
      "tag_id",
      "v12_tag_id",
    );

    await queryRunner.dropTable("query-result-cache", true);
  }
  private async part2_generate_new_schema(queryRunner: QueryRunner) {
    await queryRunner.query(`
            DROP INDEX "IDX_d6db1ab4ee9ad9dbe86c64e4cc"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_v12_image" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "source" varchar,
                "path" varchar,
                "media_type" varchar,
                "uploader_id" integer,
                CONSTRAINT "UQ_f03b89f33671086e6733828e79c" UNIQUE ("path")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_v12_image"(
                    "id",
                    "created_at",
                    "updated_at",
                    "deleted_at",
                    "entity_version",
                    "source",
                    "path",
                    "media_type",
                    "uploader_id"
                )
            SELECT "id",
                "created_at",
                "updated_at",
                "deleted_at",
                "entity_version",
                "source",
                "path",
                "media_type",
                "uploader_id"
            FROM "v12_image"
        `);
    await queryRunner.query(`
            DROP TABLE "v12_image"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_v12_image"
                RENAME TO "v12_image"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_d6db1ab4ee9ad9dbe86c64e4cc" ON "v12_image" ("id")
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_v12_gamevault_user" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "username" varchar NOT NULL,
                "password" varchar NOT NULL,
                "email" varchar,
                "first_name" varchar,
                "last_name" varchar,
                "activated" boolean NOT NULL DEFAULT (0),
                "role" varchar CHECK("role" IN ('0', '1', '2', '3')) NOT NULL DEFAULT (1),
                "profile_picture_id" integer,
                "background_image_id" integer,
                CONSTRAINT "UQ_ad2fda40ce941655c838fb1435f" UNIQUE ("username"),
                CONSTRAINT "UQ_d0e7d50057240e5752a2c303ffb" UNIQUE ("email")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_v12_gamevault_user"(
                    "id",
                    "created_at",
                    "updated_at",
                    "deleted_at",
                    "entity_version",
                    "username",
                    "password",
                    "email",
                    "first_name",
                    "last_name",
                    "activated",
                    "role",
                    "profile_picture_id",
                    "background_image_id"
                )
            SELECT "id",
                "created_at",
                "updated_at",
                "deleted_at",
                "entity_version",
                "username",
                "password",
                "email",
                "first_name",
                "last_name",
                "activated",
                "role",
                "profile_picture_id",
                "background_image_id"
            FROM "v12_gamevault_user"
        `);
    await queryRunner.query(`
            DROP TABLE "v12_gamevault_user"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_v12_gamevault_user"
                RENAME TO "v12_gamevault_user"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_8d759a72ce42e6444af6860181"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_v12_game" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "title" varchar NOT NULL,
                "rawg_title" varchar,
                "version" varchar,
                "release_date" datetime NOT NULL,
                "rawg_release_date" datetime,
                "cache_date" datetime,
                "file_path" varchar NOT NULL,
                "size" bigint NOT NULL DEFAULT (0),
                "description" varchar,
                "website_url" varchar,
                "metacritic_rating" integer,
                "average_playtime" integer,
                "early_access" boolean NOT NULL,
                "box_image_id" integer,
                "background_image_id" integer,
                "type" varchar CHECK(
                    "type" IN (
                        'UNDETECTABLE',
                        'WINDOWS_PORTABLE',
                        'WINDOWS_SETUP'
                    )
                ) NOT NULL DEFAULT ('UNDETECTABLE'),
                CONSTRAINT "UQ_95628db340ba8b2c1ed6add021c" UNIQUE ("file_path")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_v12_game"(
                    "id",
                    "created_at",
                    "updated_at",
                    "deleted_at",
                    "entity_version",
                    "rawg_id",
                    "title",
                    "rawg_title",
                    "version",
                    "release_date",
                    "rawg_release_date",
                    "cache_date",
                    "file_path",
                    "size",
                    "description",
                    "website_url",
                    "metacritic_rating",
                    "average_playtime",
                    "early_access",
                    "box_image_id",
                    "background_image_id",
                    "type"
                )
            SELECT "id",
                "created_at",
                "updated_at",
                "deleted_at",
                "entity_version",
                "rawg_id",
                "title",
                "rawg_title",
                "version",
                "release_date",
                "rawg_release_date",
                "cache_date",
                "file_path",
                "size",
                "description",
                "website_url",
                "metacritic_rating",
                "average_playtime",
                "early_access",
                "box_image_id",
                "background_image_id",
                "type"
            FROM "v12_game"
        `);
    await queryRunner.query(`
            DROP TABLE "v12_game"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_v12_game"
                RENAME TO "v12_game"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_8d759a72ce42e6444af6860181" ON "v12_game" ("title")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_d6db1ab4ee9ad9dbe86c64e4cc"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_039ad5528f914321b2fc6b1fff"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_54a35803b834868362fa4c2629"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_907a95c00ab6d81140c1a1b4a3"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_v12_developer" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_54a35803b834868362fa4c26290" UNIQUE ("name"),
                CONSTRAINT "UQ_039ad5528f914321b2fc6b1fffc" UNIQUE ("rawg_id")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_v12_developer"(
                    "id",
                    "created_at",
                    "updated_at",
                    "deleted_at",
                    "entity_version",
                    "rawg_id",
                    "name"
                )
            SELECT "id",
                "created_at",
                "updated_at",
                "deleted_at",
                "entity_version",
                "rawg_id",
                "name"
            FROM "v12_developer"
        `);
    await queryRunner.query(`
            DROP TABLE "v12_developer"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_v12_developer"
                RENAME TO "v12_developer"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_039ad5528f914321b2fc6b1fff" ON "v12_developer" ("rawg_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_54a35803b834868362fa4c2629" ON "v12_developer" ("name")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_907a95c00ab6d81140c1a1b4a3" ON "v12_developer" ("id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_888c3736e64117aba956e90f65"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_8a0e8d0364e3637f00d655af94"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_cf2ba84ceb90f80049fce15995"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_v12_genre" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_8a0e8d0364e3637f00d655af947" UNIQUE ("name"),
                CONSTRAINT "UQ_888c3736e64117aba956e90f658" UNIQUE ("rawg_id")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_v12_genre"(
                    "id",
                    "created_at",
                    "updated_at",
                    "deleted_at",
                    "entity_version",
                    "rawg_id",
                    "name"
                )
            SELECT "id",
                "created_at",
                "updated_at",
                "deleted_at",
                "entity_version",
                "rawg_id",
                "name"
            FROM "v12_genre"
        `);
    await queryRunner.query(`
            DROP TABLE "v12_genre"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_v12_genre"
                RENAME TO "v12_genre"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_888c3736e64117aba956e90f65" ON "v12_genre" ("rawg_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_8a0e8d0364e3637f00d655af94" ON "v12_genre" ("name")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_cf2ba84ceb90f80049fce15995" ON "v12_genre" ("id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_ba10ea475597187820c3b4fd28"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_2263bfd2f8ed59b0f54f6d3ae9"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_f2f05b756501810d84eea1d651"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_v12_publisher" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_2263bfd2f8ed59b0f54f6d3ae99" UNIQUE ("name"),
                CONSTRAINT "UQ_ba10ea475597187820c3b4fd281" UNIQUE ("rawg_id")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_v12_publisher"(
                    "id",
                    "created_at",
                    "updated_at",
                    "deleted_at",
                    "entity_version",
                    "rawg_id",
                    "name"
                )
            SELECT "id",
                "created_at",
                "updated_at",
                "deleted_at",
                "entity_version",
                "rawg_id",
                "name"
            FROM "v12_publisher"
        `);
    await queryRunner.query(`
            DROP TABLE "v12_publisher"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_v12_publisher"
                RENAME TO "v12_publisher"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_ba10ea475597187820c3b4fd28" ON "v12_publisher" ("rawg_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_2263bfd2f8ed59b0f54f6d3ae9" ON "v12_publisher" ("name")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_f2f05b756501810d84eea1d651" ON "v12_publisher" ("id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_4a2e62473659b6263b17a5497c"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_6695d0cc38a598edd65fcba0ee"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_e2db9da8c8288f3ff795994d4d"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_v12_store" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_6695d0cc38a598edd65fcba0ee4" UNIQUE ("name"),
                CONSTRAINT "UQ_4a2e62473659b6263b17a5497c3" UNIQUE ("rawg_id")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_v12_store"(
                    "id",
                    "created_at",
                    "updated_at",
                    "deleted_at",
                    "entity_version",
                    "rawg_id",
                    "name"
                )
            SELECT "id",
                "created_at",
                "updated_at",
                "deleted_at",
                "entity_version",
                "rawg_id",
                "name"
            FROM "v12_store"
        `);
    await queryRunner.query(`
            DROP TABLE "v12_store"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_v12_store"
                RENAME TO "v12_store"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_4a2e62473659b6263b17a5497c" ON "v12_store" ("rawg_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_6695d0cc38a598edd65fcba0ee" ON "v12_store" ("name")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_e2db9da8c8288f3ff795994d4d" ON "v12_store" ("id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_b60ff4525bb354df761a2eba44"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_636a93cb92150e4660bf07a3bc"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_0e129f8ad40f587596e0f8d8ff"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_v12_tag" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_636a93cb92150e4660bf07a3bc1" UNIQUE ("name"),
                CONSTRAINT "UQ_b60ff4525bb354df761a2eba441" UNIQUE ("rawg_id")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_v12_tag"(
                    "id",
                    "created_at",
                    "updated_at",
                    "deleted_at",
                    "entity_version",
                    "rawg_id",
                    "name"
                )
            SELECT "id",
                "created_at",
                "updated_at",
                "deleted_at",
                "entity_version",
                "rawg_id",
                "name"
            FROM "v12_tag"
        `);
    await queryRunner.query(`
            DROP TABLE "v12_tag"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_v12_tag"
                RENAME TO "v12_tag"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_b60ff4525bb354df761a2eba44" ON "v12_tag" ("rawg_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_636a93cb92150e4660bf07a3bc" ON "v12_tag" ("name")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_0e129f8ad40f587596e0f8d8ff" ON "v12_tag" ("id")
        `);
    await queryRunner.query(`
            CREATE TABLE "media" (
                "id" integer PRIMARY KEY NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "source_url" varchar,
                "file_path" varchar,
                "type" varchar NOT NULL,
                "uploader_id" integer,
                CONSTRAINT "UQ_62649abcfe2e99bd6215511e231" UNIQUE ("file_path")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_f4e0fcac36e050de337b670d8b" ON "media" ("id")
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_62649abcfe2e99bd6215511e23" ON "media" ("file_path")
        `);
    await queryRunner.query(`
            CREATE TABLE "developer_metadata" (
                "id" integer PRIMARY KEY NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "provider_slug" varchar NOT NULL,
                "provider_data_id" varchar NOT NULL,
                "name" varchar NOT NULL
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_3797936110f483ab684d700e48" ON "developer_metadata" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_8d642e3a72cb76d343639c3281" ON "developer_metadata" ("provider_slug")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_414ccae60b54eb1580bca0c28f" ON "developer_metadata" ("provider_data_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_16b10ff59b57ea2b920ccdec2d" ON "developer_metadata" ("name")
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "UQ_DEVELOPER_METADATA" ON "developer_metadata" ("provider_slug", "provider_data_id")
        `);
    await queryRunner.query(`
            CREATE TABLE "genre_metadata" (
                "id" integer PRIMARY KEY NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "provider_slug" varchar NOT NULL,
                "provider_data_id" varchar NOT NULL,
                "name" varchar NOT NULL
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_ab9cd344970e9df47d3d6c8b5b" ON "genre_metadata" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_bcbc44cdfbf2977f55c52651aa" ON "genre_metadata" ("provider_slug")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_7258256a052ef3ff3e882fa471" ON "genre_metadata" ("provider_data_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_bf40614141adff790cb659c902" ON "genre_metadata" ("name")
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "UQ_GENRE_METADATA" ON "genre_metadata" ("provider_slug", "provider_data_id")
        `);
    await queryRunner.query(`
            CREATE TABLE "publisher_metadata" (
                "id" integer PRIMARY KEY NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "provider_slug" varchar NOT NULL,
                "provider_data_id" varchar NOT NULL,
                "name" varchar NOT NULL
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_73e957f8e68ba1111ac3b79adc" ON "publisher_metadata" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_16f6954549be1a71c53654c939" ON "publisher_metadata" ("provider_slug")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_e9ec06cab4b92d64ba257b4eed" ON "publisher_metadata" ("provider_data_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_73c3afaa08bae7e58471e83c8e" ON "publisher_metadata" ("name")
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "UQ_PUBLISHER_METADATA" ON "publisher_metadata" ("provider_slug", "provider_data_id")
        `);
    await queryRunner.query(`
            CREATE TABLE "tag_metadata" (
                "id" integer PRIMARY KEY NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "provider_slug" varchar NOT NULL,
                "provider_data_id" varchar NOT NULL,
                "name" varchar NOT NULL
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_96d7cccf17f8cb2cfa25388cbd" ON "tag_metadata" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_d914734a79b8145479a748d0a5" ON "tag_metadata" ("provider_slug")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_a1b923a5cf28e468500e7e0b59" ON "tag_metadata" ("provider_data_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_a5f8eb5e083ca5fb83cd152777" ON "tag_metadata" ("name")
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "UQ_TAG_METADATA" ON "tag_metadata" ("provider_slug", "provider_data_id")
        `);
    await queryRunner.query(`
            CREATE TABLE "game_metadata" (
                "id" integer PRIMARY KEY NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "provider_slug" varchar,
                "provider_data_id" varchar,
                "provider_data_url" varchar,
                "provider_priority" integer,
                "age_rating" integer,
                "title" varchar,
                "release_date" datetime,
                "description" varchar,
                "notes" varchar,
                "average_playtime" integer,
                "url_screenshots" text,
                "url_trailers" text,
                "url_gameplays" text,
                "url_websites" text,
                "rating" float,
                "early_access" boolean,
                "launch_parameters" varchar,
                "launch_executable" varchar,
                "installer_executable" varchar,
                "cover_id" integer,
                "background_id" integer
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_7af272a017b850a4ce7a6c2886" ON "game_metadata" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_e9a00e38e7969570d9ab66dd27" ON "game_metadata" ("provider_slug")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_4f0b69ca308a906932c84ea0d5" ON "game_metadata" ("provider_data_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_21c321551d9c772d56e07b2a1a" ON "game_metadata" ("title")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_47070ef56d911fa9824f3277e2" ON "game_metadata" ("release_date")
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "UQ_GAME_METADATA" ON "game_metadata" ("provider_slug", "provider_data_id")
        `);
    await queryRunner.query(`
            CREATE TABLE "progress" (
                "id" integer PRIMARY KEY NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "minutes_played" integer NOT NULL DEFAULT (0),
                "state" varchar CHECK(
                    "state" IN (
                        'UNPLAYED',
                        'INFINITE',
                        'PLAYING',
                        'COMPLETED',
                        'ABORTED_TEMPORARY',
                        'ABORTED_PERMANENT'
                    )
                ) NOT NULL DEFAULT ('UNPLAYED'),
                "last_played_at" datetime,
                "user_id" integer,
                "game_id" integer
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_79abdfd87a688f9de756a162b6" ON "progress" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_ddcaca3a9db9d77105d51c02c2" ON "progress" ("user_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_feaddf361921db1df3a6fe3965" ON "progress" ("game_id")
        `);
    await queryRunner.query(`
            CREATE TABLE "gamevault_game" (
                "id" integer PRIMARY KEY NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "file_path" varchar NOT NULL,
                "size" bigint NOT NULL DEFAULT (0),
                "title" varchar,
                "sort_title" varchar,
                "version" varchar,
                "release_date" datetime,
                "early_access" boolean NOT NULL DEFAULT (0),
                "download_count" integer NOT NULL DEFAULT (0),
                "type" varchar CHECK(
                    "type" IN (
                        'UNDETECTABLE',
                        'WINDOWS_SETUP',
                        'WINDOWS_PORTABLE',
                        'LINUX_PORTABLE'
                    )
                ) NOT NULL DEFAULT ('UNDETECTABLE'),
                "user_metadata_id" integer,
                "metadata_id" integer,
                CONSTRAINT "UQ_91d454956bd20f46b646b05b91f" UNIQUE ("file_path"),
                CONSTRAINT "REL_edc9b16a9e16d394b2ca3b49b1" UNIQUE ("user_metadata_id"),
                CONSTRAINT "REL_aab0797ae3873a5ef2817d0989" UNIQUE ("metadata_id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_dc16bc448f2591a832533f25d9" ON "gamevault_game" ("id")
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_91d454956bd20f46b646b05b91" ON "gamevault_game" ("file_path")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_73e99cf1379987ed7c5983d74f" ON "gamevault_game" ("release_date")
        `);
    await queryRunner.query(`
            CREATE TABLE "gamevault_user" (
                "id" integer PRIMARY KEY NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "username" varchar NOT NULL,
                "password" varchar NOT NULL,
                "socket_secret" varchar(64) NOT NULL,
                "email" varchar,
                "first_name" varchar,
                "last_name" varchar,
                "birth_date" datetime,
                "activated" boolean NOT NULL DEFAULT (0),
                "role" varchar CHECK("role" IN ('0', '1', '2', '3')) NOT NULL DEFAULT (1),
                "avatar_id" integer,
                "background_id" integer,
                CONSTRAINT "UQ_4c835305e86b28e416cfe13dace" UNIQUE ("username"),
                CONSTRAINT "UQ_e0da4bbf1074bca2d980a810771" UNIQUE ("socket_secret"),
                CONSTRAINT "UQ_284621e91b3886db5ebd901384a" UNIQUE ("email"),
                CONSTRAINT "REL_872748cf76003216d011ae0feb" UNIQUE ("avatar_id"),
                CONSTRAINT "REL_0bd4a25fe30450010869557666" UNIQUE ("background_id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_c2a3f8b06558be9508161af22e" ON "gamevault_user" ("id")
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_4c835305e86b28e416cfe13dac" ON "gamevault_user" ("username")
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_e0da4bbf1074bca2d980a81077" ON "gamevault_user" ("socket_secret")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_4edfac51e323a4993aec668eb4" ON "gamevault_user" ("birth_date")
        `);
    await queryRunner.query(`
            CREATE TABLE "game_metadata_gamevault_games_gamevault_game" (
                "game_metadata_id" integer NOT NULL,
                "gamevault_game_id" integer NOT NULL,
                PRIMARY KEY ("game_metadata_id", "gamevault_game_id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_178abeeb628ebcdb70239c08d4" ON "game_metadata_gamevault_games_gamevault_game" ("game_metadata_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_c5afe975cb06f9624d5f5aa8ff" ON "game_metadata_gamevault_games_gamevault_game" ("gamevault_game_id")
        `);
    await queryRunner.query(`
            CREATE TABLE "game_metadata_publishers_publisher_metadata" (
                "game_metadata_id" integer NOT NULL,
                "publisher_metadata_id" integer NOT NULL,
                PRIMARY KEY ("game_metadata_id", "publisher_metadata_id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_6d9f174cdbce41bb5b934271a9" ON "game_metadata_publishers_publisher_metadata" ("game_metadata_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_71ffc2cb90c863a5c225efa295" ON "game_metadata_publishers_publisher_metadata" ("publisher_metadata_id")
        `);
    await queryRunner.query(`
            CREATE TABLE "game_metadata_developers_developer_metadata" (
                "game_metadata_id" integer NOT NULL,
                "developer_metadata_id" integer NOT NULL,
                PRIMARY KEY ("game_metadata_id", "developer_metadata_id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_2b99b13a4b75f1396c49990e6d" ON "game_metadata_developers_developer_metadata" ("game_metadata_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_3741d615695a161ffc5a41e748" ON "game_metadata_developers_developer_metadata" ("developer_metadata_id")
        `);
    await queryRunner.query(`
            CREATE TABLE "game_metadata_tags_tag_metadata" (
                "game_metadata_id" integer NOT NULL,
                "tag_metadata_id" integer NOT NULL,
                PRIMARY KEY ("game_metadata_id", "tag_metadata_id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_f6c8361e5e167251a06355c168" ON "game_metadata_tags_tag_metadata" ("game_metadata_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_a4f3fec63ccb14d466924a11ef" ON "game_metadata_tags_tag_metadata" ("tag_metadata_id")
        `);
    await queryRunner.query(`
            CREATE TABLE "game_metadata_genres_genre_metadata" (
                "game_metadata_id" integer NOT NULL,
                "genre_metadata_id" integer NOT NULL,
                PRIMARY KEY ("game_metadata_id", "genre_metadata_id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_c7d2d3ca1a28eab7d55e99ff24" ON "game_metadata_genres_genre_metadata" ("game_metadata_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_0482ce35adf40c9128eaa1ae89" ON "game_metadata_genres_genre_metadata" ("genre_metadata_id")
        `);
    await queryRunner.query(`
            CREATE TABLE "gamevault_game_provider_metadata_game_metadata" (
                "gamevault_game_id" integer NOT NULL,
                "game_metadata_id" integer NOT NULL,
                PRIMARY KEY ("gamevault_game_id", "game_metadata_id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_8602b8a76c7952d1155118933f" ON "gamevault_game_provider_metadata_game_metadata" ("gamevault_game_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_0b9f583ebc16b0bb8cbfaf00f8" ON "gamevault_game_provider_metadata_game_metadata" ("game_metadata_id")
        `);
    await queryRunner.query(`
            CREATE TABLE "bookmark" (
                "gamevault_user_id" integer NOT NULL,
                "gamevault_game_id" integer NOT NULL,
                PRIMARY KEY ("gamevault_user_id", "gamevault_game_id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_6f00464edf85ddfedbd2580842" ON "bookmark" ("gamevault_user_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_3c8d93fdd9e34a97f5a5903129" ON "bookmark" ("gamevault_game_id")
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_v12_gamevault_user" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "username" varchar NOT NULL,
                "password" varchar NOT NULL,
                "email" varchar,
                "first_name" varchar,
                "last_name" varchar,
                "activated" boolean NOT NULL DEFAULT (0),
                "role" varchar CHECK("role" IN ('0', '1', '2', '3')) NOT NULL DEFAULT (1),
                "profile_picture_id" integer,
                "background_image_id" integer,
                "socket_secret" varchar(64),
                CONSTRAINT "UQ_ad2fda40ce941655c838fb1435f" UNIQUE ("username"),
                CONSTRAINT "UQ_d0e7d50057240e5752a2c303ffb" UNIQUE ("email"),
                CONSTRAINT "UQ_ef1c27a5c7e1f58650e6b0e6122" UNIQUE ("socket_secret")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_v12_gamevault_user"(
                    "id",
                    "created_at",
                    "updated_at",
                    "deleted_at",
                    "entity_version",
                    "username",
                    "password",
                    "email",
                    "first_name",
                    "last_name",
                    "activated",
                    "role",
                    "profile_picture_id",
                    "background_image_id"
                )
            SELECT "id",
                "created_at",
                "updated_at",
                "deleted_at",
                "entity_version",
                "username",
                "password",
                "email",
                "first_name",
                "last_name",
                "activated",
                "role",
                "profile_picture_id",
                "background_image_id"
            FROM "v12_gamevault_user"
        `);
    await queryRunner.query(`
            DROP TABLE "v12_gamevault_user"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_v12_gamevault_user"
                RENAME TO "v12_gamevault_user"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_039ad5528f914321b2fc6b1fff"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_54a35803b834868362fa4c2629"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_907a95c00ab6d81140c1a1b4a3"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_v12_developer" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_54a35803b834868362fa4c26290" UNIQUE ("name"),
                CONSTRAINT "UQ_039ad5528f914321b2fc6b1fffc" UNIQUE ("rawg_id")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_v12_developer"(
                    "id",
                    "created_at",
                    "updated_at",
                    "deleted_at",
                    "entity_version",
                    "rawg_id",
                    "name"
                )
            SELECT "id",
                "created_at",
                "updated_at",
                "deleted_at",
                "entity_version",
                "rawg_id",
                "name"
            FROM "v12_developer"
        `);
    await queryRunner.query(`
            DROP TABLE "v12_developer"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_v12_developer"
                RENAME TO "v12_developer"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_039ad5528f914321b2fc6b1fff" ON "v12_developer" ("rawg_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_54a35803b834868362fa4c2629" ON "v12_developer" ("name")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_907a95c00ab6d81140c1a1b4a3" ON "v12_developer" ("id")
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_v12_gamevault_user" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "username" varchar NOT NULL,
                "password" varchar NOT NULL,
                "email" varchar,
                "first_name" varchar,
                "last_name" varchar,
                "activated" boolean NOT NULL DEFAULT (0),
                "role" varchar CHECK("role" IN ('0', '1', '2', '3')) NOT NULL DEFAULT (1),
                "profile_picture_id" integer,
                "background_image_id" integer,
                "socket_secret" varchar(64),
                CONSTRAINT "UQ_ad2fda40ce941655c838fb1435f" UNIQUE ("username"),
                CONSTRAINT "UQ_d0e7d50057240e5752a2c303ffb" UNIQUE ("email"),
                CONSTRAINT "UQ_ef1c27a5c7e1f58650e6b0e6122" UNIQUE ("socket_secret"),
                CONSTRAINT "UQ_a69f2a821e2f94bb605c0807181" UNIQUE ("profile_picture_id"),
                CONSTRAINT "UQ_3778cbe5dc4d3fee22f07873de6" UNIQUE ("background_image_id")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_v12_gamevault_user"(
                    "id",
                    "created_at",
                    "updated_at",
                    "deleted_at",
                    "entity_version",
                    "username",
                    "password",
                    "email",
                    "first_name",
                    "last_name",
                    "activated",
                    "role",
                    "profile_picture_id",
                    "background_image_id",
                    "socket_secret"
                )
            SELECT "id",
                "created_at",
                "updated_at",
                "deleted_at",
                "entity_version",
                "username",
                "password",
                "email",
                "first_name",
                "last_name",
                "activated",
                "role",
                "profile_picture_id",
                "background_image_id",
                "socket_secret"
            FROM "v12_gamevault_user"
        `);
    await queryRunner.query(`
            DROP TABLE "v12_gamevault_user"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_v12_gamevault_user"
                RENAME TO "v12_gamevault_user"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_888c3736e64117aba956e90f65"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_8a0e8d0364e3637f00d655af94"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_cf2ba84ceb90f80049fce15995"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_v12_genre" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_8a0e8d0364e3637f00d655af947" UNIQUE ("name"),
                CONSTRAINT "UQ_888c3736e64117aba956e90f658" UNIQUE ("rawg_id")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_v12_genre"(
                    "id",
                    "created_at",
                    "updated_at",
                    "deleted_at",
                    "entity_version",
                    "rawg_id",
                    "name"
                )
            SELECT "id",
                "created_at",
                "updated_at",
                "deleted_at",
                "entity_version",
                "rawg_id",
                "name"
            FROM "v12_genre"
        `);
    await queryRunner.query(`
            DROP TABLE "v12_genre"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_v12_genre"
                RENAME TO "v12_genre"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_888c3736e64117aba956e90f65" ON "v12_genre" ("rawg_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_8a0e8d0364e3637f00d655af94" ON "v12_genre" ("name")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_cf2ba84ceb90f80049fce15995" ON "v12_genre" ("id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_ba10ea475597187820c3b4fd28"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_2263bfd2f8ed59b0f54f6d3ae9"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_f2f05b756501810d84eea1d651"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_v12_publisher" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_2263bfd2f8ed59b0f54f6d3ae99" UNIQUE ("name"),
                CONSTRAINT "UQ_ba10ea475597187820c3b4fd281" UNIQUE ("rawg_id")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_v12_publisher"(
                    "id",
                    "created_at",
                    "updated_at",
                    "deleted_at",
                    "entity_version",
                    "rawg_id",
                    "name"
                )
            SELECT "id",
                "created_at",
                "updated_at",
                "deleted_at",
                "entity_version",
                "rawg_id",
                "name"
            FROM "v12_publisher"
        `);
    await queryRunner.query(`
            DROP TABLE "v12_publisher"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_v12_publisher"
                RENAME TO "v12_publisher"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_ba10ea475597187820c3b4fd28" ON "v12_publisher" ("rawg_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_2263bfd2f8ed59b0f54f6d3ae9" ON "v12_publisher" ("name")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_f2f05b756501810d84eea1d651" ON "v12_publisher" ("id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_4a2e62473659b6263b17a5497c"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_6695d0cc38a598edd65fcba0ee"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_e2db9da8c8288f3ff795994d4d"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_v12_store" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_6695d0cc38a598edd65fcba0ee4" UNIQUE ("name"),
                CONSTRAINT "UQ_4a2e62473659b6263b17a5497c3" UNIQUE ("rawg_id")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_v12_store"(
                    "id",
                    "created_at",
                    "updated_at",
                    "deleted_at",
                    "entity_version",
                    "rawg_id",
                    "name"
                )
            SELECT "id",
                "created_at",
                "updated_at",
                "deleted_at",
                "entity_version",
                "rawg_id",
                "name"
            FROM "v12_store"
        `);
    await queryRunner.query(`
            DROP TABLE "v12_store"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_v12_store"
                RENAME TO "v12_store"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_4a2e62473659b6263b17a5497c" ON "v12_store" ("rawg_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_6695d0cc38a598edd65fcba0ee" ON "v12_store" ("name")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_e2db9da8c8288f3ff795994d4d" ON "v12_store" ("id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_8d759a72ce42e6444af6860181"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_v12_game" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "title" varchar NOT NULL,
                "rawg_title" varchar,
                "version" varchar,
                "release_date" datetime,
                "rawg_release_date" datetime,
                "cache_date" datetime,
                "file_path" varchar NOT NULL,
                "size" bigint NOT NULL DEFAULT (0),
                "description" varchar,
                "website_url" varchar,
                "metacritic_rating" integer,
                "average_playtime" integer,
                "early_access" boolean NOT NULL,
                "box_image_id" integer,
                "background_image_id" integer,
                "type" varchar CHECK(
                    "type" IN (
                        'UNDETECTABLE',
                        'WINDOWS_SETUP',
                        'WINDOWS_PORTABLE',
                        'LINUX_PORTABLE'
                    )
                ) NOT NULL DEFAULT ('UNDETECTABLE'),
                CONSTRAINT "UQ_95628db340ba8b2c1ed6add021c" UNIQUE ("file_path"),
                CONSTRAINT "UQ_ec66cc0eac714939df6576d0121" UNIQUE ("box_image_id"),
                CONSTRAINT "UQ_1ccf51eea9ed1b50a9e3f7a5db4" UNIQUE ("background_image_id")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_v12_game"(
                    "id",
                    "created_at",
                    "updated_at",
                    "deleted_at",
                    "entity_version",
                    "rawg_id",
                    "title",
                    "rawg_title",
                    "version",
                    "release_date",
                    "rawg_release_date",
                    "cache_date",
                    "file_path",
                    "size",
                    "description",
                    "website_url",
                    "metacritic_rating",
                    "average_playtime",
                    "early_access",
                    "box_image_id",
                    "background_image_id",
                    "type"
                )
            SELECT "id",
                "created_at",
                "updated_at",
                "deleted_at",
                "entity_version",
                "rawg_id",
                "title",
                "rawg_title",
                "version",
                "release_date",
                "rawg_release_date",
                "cache_date",
                "file_path",
                "size",
                "description",
                "website_url",
                "metacritic_rating",
                "average_playtime",
                "early_access",
                "box_image_id",
                "background_image_id",
                "type"
            FROM "v12_game"
        `);
    await queryRunner.query(`
            DROP TABLE "v12_game"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_v12_game"
                RENAME TO "v12_game"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_8d759a72ce42e6444af6860181" ON "v12_game" ("title")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_b60ff4525bb354df761a2eba44"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_636a93cb92150e4660bf07a3bc"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_0e129f8ad40f587596e0f8d8ff"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_v12_tag" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_636a93cb92150e4660bf07a3bc1" UNIQUE ("name"),
                CONSTRAINT "UQ_b60ff4525bb354df761a2eba441" UNIQUE ("rawg_id")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_v12_tag"(
                    "id",
                    "created_at",
                    "updated_at",
                    "deleted_at",
                    "entity_version",
                    "rawg_id",
                    "name"
                )
            SELECT "id",
                "created_at",
                "updated_at",
                "deleted_at",
                "entity_version",
                "rawg_id",
                "name"
            FROM "v12_tag"
        `);
    await queryRunner.query(`
            DROP TABLE "v12_tag"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_v12_tag"
                RENAME TO "v12_tag"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_b60ff4525bb354df761a2eba44" ON "v12_tag" ("rawg_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_636a93cb92150e4660bf07a3bc" ON "v12_tag" ("name")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_0e129f8ad40f587596e0f8d8ff" ON "v12_tag" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_9104e2e6a962d5cc0b17c3705d" ON "v12_image" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_fe74c6fdec37f411e4e042e1c7" ON "v12_image" ("path")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_59b393e6f4ed2f9a57e15835a9" ON "v12_gamevault_user" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_d8fa7fb9bde6aa79885c4eed33" ON "v12_gamevault_user" ("username")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_d99731b484bc5fec1cfee9e0fc" ON "v12_game" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_179bcdd73ab43366d14defc706" ON "v12_game" ("release_date")
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_95628db340ba8b2c1ed6add021" ON "v12_game" ("file_path")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_f4e0fcac36e050de337b670d8b"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_62649abcfe2e99bd6215511e23"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_media" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "source_url" varchar,
                "file_path" varchar,
                "type" varchar NOT NULL,
                "uploader_id" integer,
                CONSTRAINT "UQ_62649abcfe2e99bd6215511e231" UNIQUE ("file_path"),
                CONSTRAINT "FK_8bd1ad5f79df58cfd7ad9c42fb5" FOREIGN KEY ("uploader_id") REFERENCES "gamevault_user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_media"(
                    "id",
                    "created_at",
                    "updated_at",
                    "deleted_at",
                    "entity_version",
                    "source_url",
                    "file_path",
                    "type",
                    "uploader_id"
                )
            SELECT "id",
                "created_at",
                "updated_at",
                "deleted_at",
                "entity_version",
                "source_url",
                "file_path",
                "type",
                "uploader_id"
            FROM "media"
        `);
    await queryRunner.query(`
            DROP TABLE "media"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_media"
                RENAME TO "media"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_f4e0fcac36e050de337b670d8b" ON "media" ("id")
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_62649abcfe2e99bd6215511e23" ON "media" ("file_path")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_7af272a017b850a4ce7a6c2886"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_e9a00e38e7969570d9ab66dd27"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_4f0b69ca308a906932c84ea0d5"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_21c321551d9c772d56e07b2a1a"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_47070ef56d911fa9824f3277e2"
        `);
    await queryRunner.query(`
            DROP INDEX "UQ_GAME_METADATA"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_game_metadata" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "provider_slug" varchar,
                "provider_data_id" varchar,
                "provider_data_url" varchar,
                "provider_priority" integer,
                "age_rating" integer,
                "title" varchar,
                "release_date" datetime,
                "description" varchar,
                "notes" varchar,
                "average_playtime" integer,
                "url_screenshots" text,
                "url_trailers" text,
                "url_gameplays" text,
                "url_websites" text,
                "rating" float,
                "early_access" boolean,
                "launch_parameters" varchar,
                "launch_executable" varchar,
                "installer_executable" varchar,
                "cover_id" integer,
                "background_id" integer,
                CONSTRAINT "FK_9aefd37a55b610cea5ea583cdf6" FOREIGN KEY ("cover_id") REFERENCES "media" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT "FK_6f44518f2a088b90a8cc804d12f" FOREIGN KEY ("background_id") REFERENCES "media" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_game_metadata"(
                    "id",
                    "created_at",
                    "updated_at",
                    "deleted_at",
                    "entity_version",
                    "provider_slug",
                    "provider_data_id",
                    "provider_data_url",
                    "provider_priority",
                    "age_rating",
                    "title",
                    "release_date",
                    "description",
                    "notes",
                    "average_playtime",
                    "url_screenshots",
                    "url_trailers",
                    "url_gameplays",
                    "url_websites",
                    "rating",
                    "early_access",
                    "launch_parameters",
                    "launch_executable",
                    "installer_executable",
                    "cover_id",
                    "background_id"
                )
            SELECT "id",
                "created_at",
                "updated_at",
                "deleted_at",
                "entity_version",
                "provider_slug",
                "provider_data_id",
                "provider_data_url",
                "provider_priority",
                "age_rating",
                "title",
                "release_date",
                "description",
                "notes",
                "average_playtime",
                "url_screenshots",
                "url_trailers",
                "url_gameplays",
                "url_websites",
                "rating",
                "early_access",
                "launch_parameters",
                "launch_executable",
                "installer_executable",
                "cover_id",
                "background_id"
            FROM "game_metadata"
        `);
    await queryRunner.query(`
            DROP TABLE "game_metadata"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_game_metadata"
                RENAME TO "game_metadata"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_7af272a017b850a4ce7a6c2886" ON "game_metadata" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_e9a00e38e7969570d9ab66dd27" ON "game_metadata" ("provider_slug")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_4f0b69ca308a906932c84ea0d5" ON "game_metadata" ("provider_data_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_21c321551d9c772d56e07b2a1a" ON "game_metadata" ("title")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_47070ef56d911fa9824f3277e2" ON "game_metadata" ("release_date")
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "UQ_GAME_METADATA" ON "game_metadata" ("provider_slug", "provider_data_id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_79abdfd87a688f9de756a162b6"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_ddcaca3a9db9d77105d51c02c2"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_feaddf361921db1df3a6fe3965"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_progress" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "minutes_played" integer NOT NULL DEFAULT (0),
                "state" varchar CHECK(
                    "state" IN (
                        'UNPLAYED',
                        'INFINITE',
                        'PLAYING',
                        'COMPLETED',
                        'ABORTED_TEMPORARY',
                        'ABORTED_PERMANENT'
                    )
                ) NOT NULL DEFAULT ('UNPLAYED'),
                "last_played_at" datetime,
                "user_id" integer,
                "game_id" integer,
                CONSTRAINT "FK_ddcaca3a9db9d77105d51c02c24" FOREIGN KEY ("user_id") REFERENCES "gamevault_user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT "FK_feaddf361921db1df3a6fe3965a" FOREIGN KEY ("game_id") REFERENCES "gamevault_game" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_progress"(
                    "id",
                    "created_at",
                    "updated_at",
                    "deleted_at",
                    "entity_version",
                    "minutes_played",
                    "state",
                    "last_played_at",
                    "user_id",
                    "game_id"
                )
            SELECT "id",
                "created_at",
                "updated_at",
                "deleted_at",
                "entity_version",
                "minutes_played",
                "state",
                "last_played_at",
                "user_id",
                "game_id"
            FROM "progress"
        `);
    await queryRunner.query(`
            DROP TABLE "progress"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_progress"
                RENAME TO "progress"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_79abdfd87a688f9de756a162b6" ON "progress" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_ddcaca3a9db9d77105d51c02c2" ON "progress" ("user_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_feaddf361921db1df3a6fe3965" ON "progress" ("game_id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_dc16bc448f2591a832533f25d9"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_91d454956bd20f46b646b05b91"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_73e99cf1379987ed7c5983d74f"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_gamevault_game" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "file_path" varchar NOT NULL,
                "size" bigint NOT NULL DEFAULT (0),
                "title" varchar,
                "sort_title" varchar,
                "version" varchar,
                "release_date" datetime,
                "early_access" boolean NOT NULL DEFAULT (0),
                "download_count" integer NOT NULL DEFAULT (0),
                "type" varchar CHECK(
                    "type" IN (
                        'UNDETECTABLE',
                        'WINDOWS_SETUP',
                        'WINDOWS_PORTABLE',
                        'LINUX_PORTABLE'
                    )
                ) NOT NULL DEFAULT ('UNDETECTABLE'),
                "user_metadata_id" integer,
                "metadata_id" integer,
                CONSTRAINT "UQ_91d454956bd20f46b646b05b91f" UNIQUE ("file_path"),
                CONSTRAINT "REL_edc9b16a9e16d394b2ca3b49b1" UNIQUE ("user_metadata_id"),
                CONSTRAINT "REL_aab0797ae3873a5ef2817d0989" UNIQUE ("metadata_id"),
                CONSTRAINT "FK_edc9b16a9e16d394b2ca3b49b12" FOREIGN KEY ("user_metadata_id") REFERENCES "game_metadata" ("id") ON DELETE
                SET NULL ON UPDATE NO ACTION,
                    CONSTRAINT "FK_aab0797ae3873a5ef2817d09891" FOREIGN KEY ("metadata_id") REFERENCES "game_metadata" ("id") ON DELETE
                SET NULL ON UPDATE NO ACTION
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_gamevault_game"(
                    "id",
                    "created_at",
                    "updated_at",
                    "deleted_at",
                    "entity_version",
                    "file_path",
                    "size",
                    "title",
                    "version",
                    "release_date",
                    "early_access",
                    "download_count",
                    "type",
                    "user_metadata_id",
                    "metadata_id"
                )
            SELECT "id",
                "created_at",
                "updated_at",
                "deleted_at",
                "entity_version",
                "file_path",
                "size",
                "title",
                "version",
                "release_date",
                "early_access",
                "download_count",
                "type",
                "user_metadata_id",
                "metadata_id"
            FROM "gamevault_game"
        `);
    await queryRunner.query(`
            DROP TABLE "gamevault_game"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_gamevault_game"
                RENAME TO "gamevault_game"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_dc16bc448f2591a832533f25d9" ON "gamevault_game" ("id")
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_91d454956bd20f46b646b05b91" ON "gamevault_game" ("file_path")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_73e99cf1379987ed7c5983d74f" ON "gamevault_game" ("release_date")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_c2a3f8b06558be9508161af22e"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_4c835305e86b28e416cfe13dac"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_e0da4bbf1074bca2d980a81077"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_4edfac51e323a4993aec668eb4"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_gamevault_user" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "username" varchar NOT NULL,
                "password" varchar NOT NULL,
                "socket_secret" varchar(64) NOT NULL,
                "email" varchar,
                "first_name" varchar,
                "last_name" varchar,
                "birth_date" datetime,
                "activated" boolean NOT NULL DEFAULT (0),
                "role" varchar CHECK("role" IN ('0', '1', '2', '3')) NOT NULL DEFAULT (1),
                "avatar_id" integer,
                "background_id" integer,
                CONSTRAINT "UQ_4c835305e86b28e416cfe13dace" UNIQUE ("username"),
                CONSTRAINT "UQ_e0da4bbf1074bca2d980a810771" UNIQUE ("socket_secret"),
                CONSTRAINT "UQ_284621e91b3886db5ebd901384a" UNIQUE ("email"),
                CONSTRAINT "REL_872748cf76003216d011ae0feb" UNIQUE ("avatar_id"),
                CONSTRAINT "REL_0bd4a25fe30450010869557666" UNIQUE ("background_id"),
                CONSTRAINT "FK_872748cf76003216d011ae0febb" FOREIGN KEY ("avatar_id") REFERENCES "media" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_0bd4a25fe304500108695576666" FOREIGN KEY ("background_id") REFERENCES "media" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_gamevault_user"(
                    "id",
                    "created_at",
                    "updated_at",
                    "deleted_at",
                    "entity_version",
                    "username",
                    "password",
                    "socket_secret",
                    "email",
                    "first_name",
                    "last_name",
                    "birth_date",
                    "activated",
                    "role",
                    "avatar_id",
                    "background_id"
                )
            SELECT "id",
                "created_at",
                "updated_at",
                "deleted_at",
                "entity_version",
                "username",
                "password",
                "socket_secret",
                "email",
                "first_name",
                "last_name",
                "birth_date",
                "activated",
                "role",
                "avatar_id",
                "background_id"
            FROM "gamevault_user"
        `);
    await queryRunner.query(`
            DROP TABLE "gamevault_user"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_gamevault_user"
                RENAME TO "gamevault_user"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_c2a3f8b06558be9508161af22e" ON "gamevault_user" ("id")
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_4c835305e86b28e416cfe13dac" ON "gamevault_user" ("username")
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_e0da4bbf1074bca2d980a81077" ON "gamevault_user" ("socket_secret")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_4edfac51e323a4993aec668eb4" ON "gamevault_user" ("birth_date")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_9104e2e6a962d5cc0b17c3705d"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_fe74c6fdec37f411e4e042e1c7"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_v12_image" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "source" varchar,
                "path" varchar,
                "media_type" varchar,
                "uploader_id" integer,
                CONSTRAINT "UQ_f03b89f33671086e6733828e79c" UNIQUE ("path"),
                CONSTRAINT "FK_2feca751bd268e1f80b094c7fff" FOREIGN KEY ("uploader_id") REFERENCES "v12_gamevault_user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_v12_image"(
                    "id",
                    "created_at",
                    "updated_at",
                    "deleted_at",
                    "entity_version",
                    "source",
                    "path",
                    "media_type",
                    "uploader_id"
                )
            SELECT "id",
                "created_at",
                "updated_at",
                "deleted_at",
                "entity_version",
                "source",
                "path",
                "media_type",
                "uploader_id"
            FROM "v12_image"
        `);
    await queryRunner.query(`
            DROP TABLE "v12_image"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_v12_image"
                RENAME TO "v12_image"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_9104e2e6a962d5cc0b17c3705d" ON "v12_image" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_fe74c6fdec37f411e4e042e1c7" ON "v12_image" ("path")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_59b393e6f4ed2f9a57e15835a9"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_d8fa7fb9bde6aa79885c4eed33"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_v12_gamevault_user" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "username" varchar NOT NULL,
                "password" varchar NOT NULL,
                "email" varchar,
                "first_name" varchar,
                "last_name" varchar,
                "activated" boolean NOT NULL DEFAULT (0),
                "role" varchar CHECK("role" IN ('0', '1', '2', '3')) NOT NULL DEFAULT (1),
                "profile_picture_id" integer,
                "background_image_id" integer,
                "socket_secret" varchar(64),
                CONSTRAINT "UQ_ad2fda40ce941655c838fb1435f" UNIQUE ("username"),
                CONSTRAINT "UQ_d0e7d50057240e5752a2c303ffb" UNIQUE ("email"),
                CONSTRAINT "UQ_ef1c27a5c7e1f58650e6b0e6122" UNIQUE ("socket_secret"),
                CONSTRAINT "UQ_a69f2a821e2f94bb605c0807181" UNIQUE ("profile_picture_id"),
                CONSTRAINT "UQ_3778cbe5dc4d3fee22f07873de6" UNIQUE ("background_image_id"),
                CONSTRAINT "FK_add8fb3363cdc1f4f5248797c1f" FOREIGN KEY ("profile_picture_id") REFERENCES "v12_image" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_b67991f386cfd93877a8c42d134" FOREIGN KEY ("background_image_id") REFERENCES "v12_image" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_v12_gamevault_user"(
                    "id",
                    "created_at",
                    "updated_at",
                    "deleted_at",
                    "entity_version",
                    "username",
                    "password",
                    "email",
                    "first_name",
                    "last_name",
                    "activated",
                    "role",
                    "profile_picture_id",
                    "background_image_id",
                    "socket_secret"
                )
            SELECT "id",
                "created_at",
                "updated_at",
                "deleted_at",
                "entity_version",
                "username",
                "password",
                "email",
                "first_name",
                "last_name",
                "activated",
                "role",
                "profile_picture_id",
                "background_image_id",
                "socket_secret"
            FROM "v12_gamevault_user"
        `);
    await queryRunner.query(`
            DROP TABLE "v12_gamevault_user"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_v12_gamevault_user"
                RENAME TO "v12_gamevault_user"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_59b393e6f4ed2f9a57e15835a9" ON "v12_gamevault_user" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_d8fa7fb9bde6aa79885c4eed33" ON "v12_gamevault_user" ("username")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_8d759a72ce42e6444af6860181"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_d99731b484bc5fec1cfee9e0fc"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_179bcdd73ab43366d14defc706"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_95628db340ba8b2c1ed6add021"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_v12_game" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "title" varchar NOT NULL,
                "rawg_title" varchar,
                "version" varchar,
                "release_date" datetime,
                "rawg_release_date" datetime,
                "cache_date" datetime,
                "file_path" varchar NOT NULL,
                "size" bigint NOT NULL DEFAULT (0),
                "description" varchar,
                "website_url" varchar,
                "metacritic_rating" integer,
                "average_playtime" integer,
                "early_access" boolean NOT NULL,
                "box_image_id" integer,
                "background_image_id" integer,
                "type" varchar CHECK(
                    "type" IN (
                        'UNDETECTABLE',
                        'WINDOWS_SETUP',
                        'WINDOWS_PORTABLE',
                        'LINUX_PORTABLE'
                    )
                ) NOT NULL DEFAULT ('UNDETECTABLE'),
                CONSTRAINT "UQ_95628db340ba8b2c1ed6add021c" UNIQUE ("file_path"),
                CONSTRAINT "UQ_ec66cc0eac714939df6576d0121" UNIQUE ("box_image_id"),
                CONSTRAINT "UQ_1ccf51eea9ed1b50a9e3f7a5db4" UNIQUE ("background_image_id"),
                CONSTRAINT "FK_a61e492ac08b0b32d61ae9963c1" FOREIGN KEY ("box_image_id") REFERENCES "v12_image" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_58972db9052aa0dbc1815defd6a" FOREIGN KEY ("background_image_id") REFERENCES "v12_image" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_v12_game"(
                    "id",
                    "created_at",
                    "updated_at",
                    "deleted_at",
                    "entity_version",
                    "rawg_id",
                    "title",
                    "rawg_title",
                    "version",
                    "release_date",
                    "rawg_release_date",
                    "cache_date",
                    "file_path",
                    "size",
                    "description",
                    "website_url",
                    "metacritic_rating",
                    "average_playtime",
                    "early_access",
                    "box_image_id",
                    "background_image_id",
                    "type"
                )
            SELECT "id",
                "created_at",
                "updated_at",
                "deleted_at",
                "entity_version",
                "rawg_id",
                "title",
                "rawg_title",
                "version",
                "release_date",
                "rawg_release_date",
                "cache_date",
                "file_path",
                "size",
                "description",
                "website_url",
                "metacritic_rating",
                "average_playtime",
                "early_access",
                "box_image_id",
                "background_image_id",
                "type"
            FROM "v12_game"
        `);
    await queryRunner.query(`
            DROP TABLE "v12_game"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_v12_game"
                RENAME TO "v12_game"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_8d759a72ce42e6444af6860181" ON "v12_game" ("title")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_d99731b484bc5fec1cfee9e0fc" ON "v12_game" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_179bcdd73ab43366d14defc706" ON "v12_game" ("release_date")
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_95628db340ba8b2c1ed6add021" ON "v12_game" ("file_path")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_178abeeb628ebcdb70239c08d4"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_c5afe975cb06f9624d5f5aa8ff"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_game_metadata_gamevault_games_gamevault_game" (
                "game_metadata_id" integer NOT NULL,
                "gamevault_game_id" integer NOT NULL,
                CONSTRAINT "FK_178abeeb628ebcdb70239c08d46" FOREIGN KEY ("game_metadata_id") REFERENCES "game_metadata" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT "FK_c5afe975cb06f9624d5f5aa8ff7" FOREIGN KEY ("gamevault_game_id") REFERENCES "gamevault_game" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                PRIMARY KEY ("game_metadata_id", "gamevault_game_id")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_game_metadata_gamevault_games_gamevault_game"("game_metadata_id", "gamevault_game_id")
            SELECT "game_metadata_id",
                "gamevault_game_id"
            FROM "game_metadata_gamevault_games_gamevault_game"
        `);
    await queryRunner.query(`
            DROP TABLE "game_metadata_gamevault_games_gamevault_game"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_game_metadata_gamevault_games_gamevault_game"
                RENAME TO "game_metadata_gamevault_games_gamevault_game"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_178abeeb628ebcdb70239c08d4" ON "game_metadata_gamevault_games_gamevault_game" ("game_metadata_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_c5afe975cb06f9624d5f5aa8ff" ON "game_metadata_gamevault_games_gamevault_game" ("gamevault_game_id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_6d9f174cdbce41bb5b934271a9"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_71ffc2cb90c863a5c225efa295"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_game_metadata_publishers_publisher_metadata" (
                "game_metadata_id" integer NOT NULL,
                "publisher_metadata_id" integer NOT NULL,
                CONSTRAINT "FK_6d9f174cdbce41bb5b934271a9b" FOREIGN KEY ("game_metadata_id") REFERENCES "game_metadata" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT "FK_71ffc2cb90c863a5c225efa2950" FOREIGN KEY ("publisher_metadata_id") REFERENCES "publisher_metadata" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                PRIMARY KEY ("game_metadata_id", "publisher_metadata_id")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_game_metadata_publishers_publisher_metadata"("game_metadata_id", "publisher_metadata_id")
            SELECT "game_metadata_id",
                "publisher_metadata_id"
            FROM "game_metadata_publishers_publisher_metadata"
        `);
    await queryRunner.query(`
            DROP TABLE "game_metadata_publishers_publisher_metadata"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_game_metadata_publishers_publisher_metadata"
                RENAME TO "game_metadata_publishers_publisher_metadata"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_6d9f174cdbce41bb5b934271a9" ON "game_metadata_publishers_publisher_metadata" ("game_metadata_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_71ffc2cb90c863a5c225efa295" ON "game_metadata_publishers_publisher_metadata" ("publisher_metadata_id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_2b99b13a4b75f1396c49990e6d"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_3741d615695a161ffc5a41e748"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_game_metadata_developers_developer_metadata" (
                "game_metadata_id" integer NOT NULL,
                "developer_metadata_id" integer NOT NULL,
                CONSTRAINT "FK_2b99b13a4b75f1396c49990e6de" FOREIGN KEY ("game_metadata_id") REFERENCES "game_metadata" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT "FK_3741d615695a161ffc5a41e748c" FOREIGN KEY ("developer_metadata_id") REFERENCES "developer_metadata" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                PRIMARY KEY ("game_metadata_id", "developer_metadata_id")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_game_metadata_developers_developer_metadata"("game_metadata_id", "developer_metadata_id")
            SELECT "game_metadata_id",
                "developer_metadata_id"
            FROM "game_metadata_developers_developer_metadata"
        `);
    await queryRunner.query(`
            DROP TABLE "game_metadata_developers_developer_metadata"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_game_metadata_developers_developer_metadata"
                RENAME TO "game_metadata_developers_developer_metadata"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_2b99b13a4b75f1396c49990e6d" ON "game_metadata_developers_developer_metadata" ("game_metadata_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_3741d615695a161ffc5a41e748" ON "game_metadata_developers_developer_metadata" ("developer_metadata_id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_f6c8361e5e167251a06355c168"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_a4f3fec63ccb14d466924a11ef"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_game_metadata_tags_tag_metadata" (
                "game_metadata_id" integer NOT NULL,
                "tag_metadata_id" integer NOT NULL,
                CONSTRAINT "FK_f6c8361e5e167251a06355c168a" FOREIGN KEY ("game_metadata_id") REFERENCES "game_metadata" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT "FK_a4f3fec63ccb14d466924a11efc" FOREIGN KEY ("tag_metadata_id") REFERENCES "tag_metadata" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                PRIMARY KEY ("game_metadata_id", "tag_metadata_id")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_game_metadata_tags_tag_metadata"("game_metadata_id", "tag_metadata_id")
            SELECT "game_metadata_id",
                "tag_metadata_id"
            FROM "game_metadata_tags_tag_metadata"
        `);
    await queryRunner.query(`
            DROP TABLE "game_metadata_tags_tag_metadata"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_game_metadata_tags_tag_metadata"
                RENAME TO "game_metadata_tags_tag_metadata"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_f6c8361e5e167251a06355c168" ON "game_metadata_tags_tag_metadata" ("game_metadata_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_a4f3fec63ccb14d466924a11ef" ON "game_metadata_tags_tag_metadata" ("tag_metadata_id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_c7d2d3ca1a28eab7d55e99ff24"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_0482ce35adf40c9128eaa1ae89"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_game_metadata_genres_genre_metadata" (
                "game_metadata_id" integer NOT NULL,
                "genre_metadata_id" integer NOT NULL,
                CONSTRAINT "FK_c7d2d3ca1a28eab7d55e99ff24b" FOREIGN KEY ("game_metadata_id") REFERENCES "game_metadata" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT "FK_0482ce35adf40c9128eaa1ae894" FOREIGN KEY ("genre_metadata_id") REFERENCES "genre_metadata" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                PRIMARY KEY ("game_metadata_id", "genre_metadata_id")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_game_metadata_genres_genre_metadata"("game_metadata_id", "genre_metadata_id")
            SELECT "game_metadata_id",
                "genre_metadata_id"
            FROM "game_metadata_genres_genre_metadata"
        `);
    await queryRunner.query(`
            DROP TABLE "game_metadata_genres_genre_metadata"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_game_metadata_genres_genre_metadata"
                RENAME TO "game_metadata_genres_genre_metadata"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_c7d2d3ca1a28eab7d55e99ff24" ON "game_metadata_genres_genre_metadata" ("game_metadata_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_0482ce35adf40c9128eaa1ae89" ON "game_metadata_genres_genre_metadata" ("genre_metadata_id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_8602b8a76c7952d1155118933f"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_0b9f583ebc16b0bb8cbfaf00f8"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_gamevault_game_provider_metadata_game_metadata" (
                "gamevault_game_id" integer NOT NULL,
                "game_metadata_id" integer NOT NULL,
                CONSTRAINT "FK_8602b8a76c7952d1155118933f4" FOREIGN KEY ("gamevault_game_id") REFERENCES "gamevault_game" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT "FK_0b9f583ebc16b0bb8cbfaf00f8f" FOREIGN KEY ("game_metadata_id") REFERENCES "game_metadata" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                PRIMARY KEY ("gamevault_game_id", "game_metadata_id")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_gamevault_game_provider_metadata_game_metadata"("gamevault_game_id", "game_metadata_id")
            SELECT "gamevault_game_id",
                "game_metadata_id"
            FROM "gamevault_game_provider_metadata_game_metadata"
        `);
    await queryRunner.query(`
            DROP TABLE "gamevault_game_provider_metadata_game_metadata"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_gamevault_game_provider_metadata_game_metadata"
                RENAME TO "gamevault_game_provider_metadata_game_metadata"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_8602b8a76c7952d1155118933f" ON "gamevault_game_provider_metadata_game_metadata" ("gamevault_game_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_0b9f583ebc16b0bb8cbfaf00f8" ON "gamevault_game_provider_metadata_game_metadata" ("game_metadata_id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_6f00464edf85ddfedbd2580842"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_3c8d93fdd9e34a97f5a5903129"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_bookmark" (
                "gamevault_user_id" integer NOT NULL,
                "gamevault_game_id" integer NOT NULL,
                CONSTRAINT "FK_6f00464edf85ddfedbd25808428" FOREIGN KEY ("gamevault_user_id") REFERENCES "gamevault_user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT "FK_3c8d93fdd9e34a97f5a5903129b" FOREIGN KEY ("gamevault_game_id") REFERENCES "gamevault_game" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                PRIMARY KEY ("gamevault_user_id", "gamevault_game_id")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_bookmark"("gamevault_user_id", "gamevault_game_id")
            SELECT "gamevault_user_id",
                "gamevault_game_id"
            FROM "bookmark"
        `);
    await queryRunner.query(`
            DROP TABLE "bookmark"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_bookmark"
                RENAME TO "bookmark"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_6f00464edf85ddfedbd2580842" ON "bookmark" ("gamevault_user_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_3c8d93fdd9e34a97f5a5903129" ON "bookmark" ("gamevault_game_id")
        `);
  }
  private async part3_migrate_data(queryRunner: QueryRunner) {
    await this.migrateImages(queryRunner);
    await this.migrateTags(queryRunner);
    await this.migrateGenres(queryRunner);
    await this.migrateDevelopers(queryRunner);
    await this.migratePublishers(queryRunner);
    await this.migrateGames(queryRunner);
    await this.migrateUsersAndBookmarks(queryRunner);
    await this.migrateProgresses(queryRunner);
  }
  private async part4_enable_auto_increment(queryRunner: QueryRunner) {
    await queryRunner.query(`
            DROP INDEX "IDX_907a95c00ab6d81140c1a1b4a3"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_54a35803b834868362fa4c2629"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_039ad5528f914321b2fc6b1fff"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_v12_developer" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_039ad5528f914321b2fc6b1fffc" UNIQUE ("rawg_id"),
                CONSTRAINT "UQ_54a35803b834868362fa4c26290" UNIQUE ("name")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_v12_developer"(
                    "id",
                    "created_at",
                    "updated_at",
                    "deleted_at",
                    "entity_version",
                    "rawg_id",
                    "name"
                )
            SELECT "id",
                "created_at",
                "updated_at",
                "deleted_at",
                "entity_version",
                "rawg_id",
                "name"
            FROM "v12_developer"
        `);
    await queryRunner.query(`
            DROP TABLE "v12_developer"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_v12_developer"
                RENAME TO "v12_developer"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_907a95c00ab6d81140c1a1b4a3" ON "v12_developer" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_54a35803b834868362fa4c2629" ON "v12_developer" ("name")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_039ad5528f914321b2fc6b1fff" ON "v12_developer" ("rawg_id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_cf2ba84ceb90f80049fce15995"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_8a0e8d0364e3637f00d655af94"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_888c3736e64117aba956e90f65"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_v12_genre" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_888c3736e64117aba956e90f658" UNIQUE ("rawg_id"),
                CONSTRAINT "UQ_8a0e8d0364e3637f00d655af947" UNIQUE ("name")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_v12_genre"(
                    "id",
                    "created_at",
                    "updated_at",
                    "deleted_at",
                    "entity_version",
                    "rawg_id",
                    "name"
                )
            SELECT "id",
                "created_at",
                "updated_at",
                "deleted_at",
                "entity_version",
                "rawg_id",
                "name"
            FROM "v12_genre"
        `);
    await queryRunner.query(`
            DROP TABLE "v12_genre"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_v12_genre"
                RENAME TO "v12_genre"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_cf2ba84ceb90f80049fce15995" ON "v12_genre" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_8a0e8d0364e3637f00d655af94" ON "v12_genre" ("name")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_888c3736e64117aba956e90f65" ON "v12_genre" ("rawg_id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_f2f05b756501810d84eea1d651"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_2263bfd2f8ed59b0f54f6d3ae9"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_ba10ea475597187820c3b4fd28"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_v12_publisher" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_ba10ea475597187820c3b4fd281" UNIQUE ("rawg_id"),
                CONSTRAINT "UQ_2263bfd2f8ed59b0f54f6d3ae99" UNIQUE ("name")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_v12_publisher"(
                    "id",
                    "created_at",
                    "updated_at",
                    "deleted_at",
                    "entity_version",
                    "rawg_id",
                    "name"
                )
            SELECT "id",
                "created_at",
                "updated_at",
                "deleted_at",
                "entity_version",
                "rawg_id",
                "name"
            FROM "v12_publisher"
        `);
    await queryRunner.query(`
            DROP TABLE "v12_publisher"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_v12_publisher"
                RENAME TO "v12_publisher"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_f2f05b756501810d84eea1d651" ON "v12_publisher" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_2263bfd2f8ed59b0f54f6d3ae9" ON "v12_publisher" ("name")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_ba10ea475597187820c3b4fd28" ON "v12_publisher" ("rawg_id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_e2db9da8c8288f3ff795994d4d"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_6695d0cc38a598edd65fcba0ee"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_4a2e62473659b6263b17a5497c"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_v12_store" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_4a2e62473659b6263b17a5497c3" UNIQUE ("rawg_id"),
                CONSTRAINT "UQ_6695d0cc38a598edd65fcba0ee4" UNIQUE ("name")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_v12_store"(
                    "id",
                    "created_at",
                    "updated_at",
                    "deleted_at",
                    "entity_version",
                    "rawg_id",
                    "name"
                )
            SELECT "id",
                "created_at",
                "updated_at",
                "deleted_at",
                "entity_version",
                "rawg_id",
                "name"
            FROM "v12_store"
        `);
    await queryRunner.query(`
            DROP TABLE "v12_store"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_v12_store"
                RENAME TO "v12_store"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_e2db9da8c8288f3ff795994d4d" ON "v12_store" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_6695d0cc38a598edd65fcba0ee" ON "v12_store" ("name")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_4a2e62473659b6263b17a5497c" ON "v12_store" ("rawg_id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_0e129f8ad40f587596e0f8d8ff"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_636a93cb92150e4660bf07a3bc"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_b60ff4525bb354df761a2eba44"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_v12_tag" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_b60ff4525bb354df761a2eba441" UNIQUE ("rawg_id"),
                CONSTRAINT "UQ_636a93cb92150e4660bf07a3bc1" UNIQUE ("name")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_v12_tag"(
                    "id",
                    "created_at",
                    "updated_at",
                    "deleted_at",
                    "entity_version",
                    "rawg_id",
                    "name"
                )
            SELECT "id",
                "created_at",
                "updated_at",
                "deleted_at",
                "entity_version",
                "rawg_id",
                "name"
            FROM "v12_tag"
        `);
    await queryRunner.query(`
            DROP TABLE "v12_tag"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_v12_tag"
                RENAME TO "v12_tag"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_0e129f8ad40f587596e0f8d8ff" ON "v12_tag" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_636a93cb92150e4660bf07a3bc" ON "v12_tag" ("name")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_b60ff4525bb354df761a2eba44" ON "v12_tag" ("rawg_id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_3741d615695a161ffc5a41e748"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_2b99b13a4b75f1396c49990e6d"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_game_metadata_developers_developer_metadata" (
                "game_metadata_id" integer NOT NULL,
                "developer_metadata_id" integer NOT NULL,
                PRIMARY KEY ("game_metadata_id", "developer_metadata_id")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_game_metadata_developers_developer_metadata"("game_metadata_id", "developer_metadata_id")
            SELECT "game_metadata_id",
                "developer_metadata_id"
            FROM "game_metadata_developers_developer_metadata"
        `);
    await queryRunner.query(`
            DROP TABLE "game_metadata_developers_developer_metadata"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_game_metadata_developers_developer_metadata"
                RENAME TO "game_metadata_developers_developer_metadata"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_3741d615695a161ffc5a41e748" ON "game_metadata_developers_developer_metadata" ("developer_metadata_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_2b99b13a4b75f1396c49990e6d" ON "game_metadata_developers_developer_metadata" ("game_metadata_id")
        `);
    await queryRunner.query(`
            DROP INDEX "UQ_DEVELOPER_METADATA"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_16b10ff59b57ea2b920ccdec2d"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_414ccae60b54eb1580bca0c28f"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_8d642e3a72cb76d343639c3281"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_3797936110f483ab684d700e48"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_developer_metadata" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "provider_slug" varchar NOT NULL,
                "provider_data_id" varchar NOT NULL,
                "name" varchar NOT NULL
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_developer_metadata"(
                    "id",
                    "created_at",
                    "updated_at",
                    "deleted_at",
                    "entity_version",
                    "provider_slug",
                    "provider_data_id",
                    "name"
                )
            SELECT "id",
                "created_at",
                "updated_at",
                "deleted_at",
                "entity_version",
                "provider_slug",
                "provider_data_id",
                "name"
            FROM "developer_metadata"
        `);
    await queryRunner.query(`
            DROP TABLE "developer_metadata"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_developer_metadata"
                RENAME TO "developer_metadata"
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "UQ_DEVELOPER_METADATA" ON "developer_metadata" ("provider_slug", "provider_data_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_16b10ff59b57ea2b920ccdec2d" ON "developer_metadata" ("name")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_414ccae60b54eb1580bca0c28f" ON "developer_metadata" ("provider_data_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_8d642e3a72cb76d343639c3281" ON "developer_metadata" ("provider_slug")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_3797936110f483ab684d700e48" ON "developer_metadata" ("id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_0482ce35adf40c9128eaa1ae89"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_c7d2d3ca1a28eab7d55e99ff24"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_game_metadata_genres_genre_metadata" (
                "game_metadata_id" integer NOT NULL,
                "genre_metadata_id" integer NOT NULL,
                PRIMARY KEY ("game_metadata_id", "genre_metadata_id")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_game_metadata_genres_genre_metadata"("game_metadata_id", "genre_metadata_id")
            SELECT "game_metadata_id",
                "genre_metadata_id"
            FROM "game_metadata_genres_genre_metadata"
        `);
    await queryRunner.query(`
            DROP TABLE "game_metadata_genres_genre_metadata"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_game_metadata_genres_genre_metadata"
                RENAME TO "game_metadata_genres_genre_metadata"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_0482ce35adf40c9128eaa1ae89" ON "game_metadata_genres_genre_metadata" ("genre_metadata_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_c7d2d3ca1a28eab7d55e99ff24" ON "game_metadata_genres_genre_metadata" ("game_metadata_id")
        `);
    await queryRunner.query(`
            DROP INDEX "UQ_GENRE_METADATA"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_bf40614141adff790cb659c902"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_7258256a052ef3ff3e882fa471"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_bcbc44cdfbf2977f55c52651aa"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_ab9cd344970e9df47d3d6c8b5b"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_genre_metadata" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "provider_slug" varchar NOT NULL,
                "provider_data_id" varchar NOT NULL,
                "name" varchar NOT NULL
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_genre_metadata"(
                    "id",
                    "created_at",
                    "updated_at",
                    "deleted_at",
                    "entity_version",
                    "provider_slug",
                    "provider_data_id",
                    "name"
                )
            SELECT "id",
                "created_at",
                "updated_at",
                "deleted_at",
                "entity_version",
                "provider_slug",
                "provider_data_id",
                "name"
            FROM "genre_metadata"
        `);
    await queryRunner.query(`
            DROP TABLE "genre_metadata"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_genre_metadata"
                RENAME TO "genre_metadata"
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "UQ_GENRE_METADATA" ON "genre_metadata" ("provider_slug", "provider_data_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_bf40614141adff790cb659c902" ON "genre_metadata" ("name")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_7258256a052ef3ff3e882fa471" ON "genre_metadata" ("provider_data_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_bcbc44cdfbf2977f55c52651aa" ON "genre_metadata" ("provider_slug")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_ab9cd344970e9df47d3d6c8b5b" ON "genre_metadata" ("id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_71ffc2cb90c863a5c225efa295"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_6d9f174cdbce41bb5b934271a9"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_game_metadata_publishers_publisher_metadata" (
                "game_metadata_id" integer NOT NULL,
                "publisher_metadata_id" integer NOT NULL,
                PRIMARY KEY ("game_metadata_id", "publisher_metadata_id")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_game_metadata_publishers_publisher_metadata"("game_metadata_id", "publisher_metadata_id")
            SELECT "game_metadata_id",
                "publisher_metadata_id"
            FROM "game_metadata_publishers_publisher_metadata"
        `);
    await queryRunner.query(`
            DROP TABLE "game_metadata_publishers_publisher_metadata"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_game_metadata_publishers_publisher_metadata"
                RENAME TO "game_metadata_publishers_publisher_metadata"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_71ffc2cb90c863a5c225efa295" ON "game_metadata_publishers_publisher_metadata" ("publisher_metadata_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_6d9f174cdbce41bb5b934271a9" ON "game_metadata_publishers_publisher_metadata" ("game_metadata_id")
        `);
    await queryRunner.query(`
            DROP INDEX "UQ_PUBLISHER_METADATA"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_73c3afaa08bae7e58471e83c8e"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_e9ec06cab4b92d64ba257b4eed"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_16f6954549be1a71c53654c939"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_73e957f8e68ba1111ac3b79adc"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_publisher_metadata" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "provider_slug" varchar NOT NULL,
                "provider_data_id" varchar NOT NULL,
                "name" varchar NOT NULL
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_publisher_metadata"(
                    "id",
                    "created_at",
                    "updated_at",
                    "deleted_at",
                    "entity_version",
                    "provider_slug",
                    "provider_data_id",
                    "name"
                )
            SELECT "id",
                "created_at",
                "updated_at",
                "deleted_at",
                "entity_version",
                "provider_slug",
                "provider_data_id",
                "name"
            FROM "publisher_metadata"
        `);
    await queryRunner.query(`
            DROP TABLE "publisher_metadata"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_publisher_metadata"
                RENAME TO "publisher_metadata"
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "UQ_PUBLISHER_METADATA" ON "publisher_metadata" ("provider_slug", "provider_data_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_73c3afaa08bae7e58471e83c8e" ON "publisher_metadata" ("name")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_e9ec06cab4b92d64ba257b4eed" ON "publisher_metadata" ("provider_data_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_16f6954549be1a71c53654c939" ON "publisher_metadata" ("provider_slug")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_73e957f8e68ba1111ac3b79adc" ON "publisher_metadata" ("id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_a4f3fec63ccb14d466924a11ef"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_f6c8361e5e167251a06355c168"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_game_metadata_tags_tag_metadata" (
                "game_metadata_id" integer NOT NULL,
                "tag_metadata_id" integer NOT NULL,
                PRIMARY KEY ("game_metadata_id", "tag_metadata_id")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_game_metadata_tags_tag_metadata"("game_metadata_id", "tag_metadata_id")
            SELECT "game_metadata_id",
                "tag_metadata_id"
            FROM "game_metadata_tags_tag_metadata"
        `);
    await queryRunner.query(`
            DROP TABLE "game_metadata_tags_tag_metadata"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_game_metadata_tags_tag_metadata"
                RENAME TO "game_metadata_tags_tag_metadata"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_a4f3fec63ccb14d466924a11ef" ON "game_metadata_tags_tag_metadata" ("tag_metadata_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_f6c8361e5e167251a06355c168" ON "game_metadata_tags_tag_metadata" ("game_metadata_id")
        `);
    await queryRunner.query(`
            DROP INDEX "UQ_TAG_METADATA"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_a5f8eb5e083ca5fb83cd152777"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_a1b923a5cf28e468500e7e0b59"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_d914734a79b8145479a748d0a5"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_96d7cccf17f8cb2cfa25388cbd"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_tag_metadata" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "provider_slug" varchar NOT NULL,
                "provider_data_id" varchar NOT NULL,
                "name" varchar NOT NULL
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_tag_metadata"(
                    "id",
                    "created_at",
                    "updated_at",
                    "deleted_at",
                    "entity_version",
                    "provider_slug",
                    "provider_data_id",
                    "name"
                )
            SELECT "id",
                "created_at",
                "updated_at",
                "deleted_at",
                "entity_version",
                "provider_slug",
                "provider_data_id",
                "name"
            FROM "tag_metadata"
        `);
    await queryRunner.query(`
            DROP TABLE "tag_metadata"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_tag_metadata"
                RENAME TO "tag_metadata"
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "UQ_TAG_METADATA" ON "tag_metadata" ("provider_slug", "provider_data_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_a5f8eb5e083ca5fb83cd152777" ON "tag_metadata" ("name")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_a1b923a5cf28e468500e7e0b59" ON "tag_metadata" ("provider_data_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_d914734a79b8145479a748d0a5" ON "tag_metadata" ("provider_slug")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_96d7cccf17f8cb2cfa25388cbd" ON "tag_metadata" ("id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_907a95c00ab6d81140c1a1b4a3"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_54a35803b834868362fa4c2629"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_039ad5528f914321b2fc6b1fff"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_v12_developer" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_039ad5528f914321b2fc6b1fffc" UNIQUE ("rawg_id"),
                CONSTRAINT "UQ_54a35803b834868362fa4c26290" UNIQUE ("name")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_v12_developer"(
                    "id",
                    "created_at",
                    "updated_at",
                    "deleted_at",
                    "entity_version",
                    "rawg_id",
                    "name"
                )
            SELECT "id",
                "created_at",
                "updated_at",
                "deleted_at",
                "entity_version",
                "rawg_id",
                "name"
            FROM "v12_developer"
        `);
    await queryRunner.query(`
            DROP TABLE "v12_developer"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_v12_developer"
                RENAME TO "v12_developer"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_907a95c00ab6d81140c1a1b4a3" ON "v12_developer" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_54a35803b834868362fa4c2629" ON "v12_developer" ("name")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_039ad5528f914321b2fc6b1fff" ON "v12_developer" ("rawg_id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_cf2ba84ceb90f80049fce15995"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_8a0e8d0364e3637f00d655af94"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_888c3736e64117aba956e90f65"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_v12_genre" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_888c3736e64117aba956e90f658" UNIQUE ("rawg_id"),
                CONSTRAINT "UQ_8a0e8d0364e3637f00d655af947" UNIQUE ("name")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_v12_genre"(
                    "id",
                    "created_at",
                    "updated_at",
                    "deleted_at",
                    "entity_version",
                    "rawg_id",
                    "name"
                )
            SELECT "id",
                "created_at",
                "updated_at",
                "deleted_at",
                "entity_version",
                "rawg_id",
                "name"
            FROM "v12_genre"
        `);
    await queryRunner.query(`
            DROP TABLE "v12_genre"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_v12_genre"
                RENAME TO "v12_genre"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_cf2ba84ceb90f80049fce15995" ON "v12_genre" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_8a0e8d0364e3637f00d655af94" ON "v12_genre" ("name")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_888c3736e64117aba956e90f65" ON "v12_genre" ("rawg_id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_f2f05b756501810d84eea1d651"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_2263bfd2f8ed59b0f54f6d3ae9"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_ba10ea475597187820c3b4fd28"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_v12_publisher" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_ba10ea475597187820c3b4fd281" UNIQUE ("rawg_id"),
                CONSTRAINT "UQ_2263bfd2f8ed59b0f54f6d3ae99" UNIQUE ("name")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_v12_publisher"(
                    "id",
                    "created_at",
                    "updated_at",
                    "deleted_at",
                    "entity_version",
                    "rawg_id",
                    "name"
                )
            SELECT "id",
                "created_at",
                "updated_at",
                "deleted_at",
                "entity_version",
                "rawg_id",
                "name"
            FROM "v12_publisher"
        `);
    await queryRunner.query(`
            DROP TABLE "v12_publisher"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_v12_publisher"
                RENAME TO "v12_publisher"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_f2f05b756501810d84eea1d651" ON "v12_publisher" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_2263bfd2f8ed59b0f54f6d3ae9" ON "v12_publisher" ("name")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_ba10ea475597187820c3b4fd28" ON "v12_publisher" ("rawg_id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_e2db9da8c8288f3ff795994d4d"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_6695d0cc38a598edd65fcba0ee"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_4a2e62473659b6263b17a5497c"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_v12_store" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_4a2e62473659b6263b17a5497c3" UNIQUE ("rawg_id"),
                CONSTRAINT "UQ_6695d0cc38a598edd65fcba0ee4" UNIQUE ("name")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_v12_store"(
                    "id",
                    "created_at",
                    "updated_at",
                    "deleted_at",
                    "entity_version",
                    "rawg_id",
                    "name"
                )
            SELECT "id",
                "created_at",
                "updated_at",
                "deleted_at",
                "entity_version",
                "rawg_id",
                "name"
            FROM "v12_store"
        `);
    await queryRunner.query(`
            DROP TABLE "v12_store"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_v12_store"
                RENAME TO "v12_store"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_e2db9da8c8288f3ff795994d4d" ON "v12_store" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_6695d0cc38a598edd65fcba0ee" ON "v12_store" ("name")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_4a2e62473659b6263b17a5497c" ON "v12_store" ("rawg_id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_0e129f8ad40f587596e0f8d8ff"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_636a93cb92150e4660bf07a3bc"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_b60ff4525bb354df761a2eba44"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_v12_tag" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_b60ff4525bb354df761a2eba441" UNIQUE ("rawg_id"),
                CONSTRAINT "UQ_636a93cb92150e4660bf07a3bc1" UNIQUE ("name")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_v12_tag"(
                    "id",
                    "created_at",
                    "updated_at",
                    "deleted_at",
                    "entity_version",
                    "rawg_id",
                    "name"
                )
            SELECT "id",
                "created_at",
                "updated_at",
                "deleted_at",
                "entity_version",
                "rawg_id",
                "name"
            FROM "v12_tag"
        `);
    await queryRunner.query(`
            DROP TABLE "v12_tag"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_v12_tag"
                RENAME TO "v12_tag"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_0e129f8ad40f587596e0f8d8ff" ON "v12_tag" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_636a93cb92150e4660bf07a3bc" ON "v12_tag" ("name")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_b60ff4525bb354df761a2eba44" ON "v12_tag" ("rawg_id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_71ffc2cb90c863a5c225efa295"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_6d9f174cdbce41bb5b934271a9"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_game_metadata_publishers_publisher_metadata" (
                "game_metadata_id" integer NOT NULL,
                "publisher_metadata_id" integer NOT NULL,
                CONSTRAINT "FK_6d9f174cdbce41bb5b934271a9b" FOREIGN KEY ("game_metadata_id") REFERENCES "game_metadata" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT "FK_71ffc2cb90c863a5c225efa2950" FOREIGN KEY ("publisher_metadata_id") REFERENCES "publisher_metadata" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                PRIMARY KEY ("game_metadata_id", "publisher_metadata_id")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_game_metadata_publishers_publisher_metadata"("game_metadata_id", "publisher_metadata_id")
            SELECT "game_metadata_id",
                "publisher_metadata_id"
            FROM "game_metadata_publishers_publisher_metadata"
        `);
    await queryRunner.query(`
            DROP TABLE "game_metadata_publishers_publisher_metadata"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_game_metadata_publishers_publisher_metadata"
                RENAME TO "game_metadata_publishers_publisher_metadata"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_71ffc2cb90c863a5c225efa295" ON "game_metadata_publishers_publisher_metadata" ("publisher_metadata_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_6d9f174cdbce41bb5b934271a9" ON "game_metadata_publishers_publisher_metadata" ("game_metadata_id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_3741d615695a161ffc5a41e748"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_2b99b13a4b75f1396c49990e6d"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_game_metadata_developers_developer_metadata" (
                "game_metadata_id" integer NOT NULL,
                "developer_metadata_id" integer NOT NULL,
                CONSTRAINT "FK_2b99b13a4b75f1396c49990e6de" FOREIGN KEY ("game_metadata_id") REFERENCES "game_metadata" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT "FK_3741d615695a161ffc5a41e748c" FOREIGN KEY ("developer_metadata_id") REFERENCES "developer_metadata" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                PRIMARY KEY ("game_metadata_id", "developer_metadata_id")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_game_metadata_developers_developer_metadata"("game_metadata_id", "developer_metadata_id")
            SELECT "game_metadata_id",
                "developer_metadata_id"
            FROM "game_metadata_developers_developer_metadata"
        `);
    await queryRunner.query(`
            DROP TABLE "game_metadata_developers_developer_metadata"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_game_metadata_developers_developer_metadata"
                RENAME TO "game_metadata_developers_developer_metadata"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_3741d615695a161ffc5a41e748" ON "game_metadata_developers_developer_metadata" ("developer_metadata_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_2b99b13a4b75f1396c49990e6d" ON "game_metadata_developers_developer_metadata" ("game_metadata_id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_a4f3fec63ccb14d466924a11ef"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_f6c8361e5e167251a06355c168"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_game_metadata_tags_tag_metadata" (
                "game_metadata_id" integer NOT NULL,
                "tag_metadata_id" integer NOT NULL,
                CONSTRAINT "FK_f6c8361e5e167251a06355c168a" FOREIGN KEY ("game_metadata_id") REFERENCES "game_metadata" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT "FK_a4f3fec63ccb14d466924a11efc" FOREIGN KEY ("tag_metadata_id") REFERENCES "tag_metadata" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                PRIMARY KEY ("game_metadata_id", "tag_metadata_id")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_game_metadata_tags_tag_metadata"("game_metadata_id", "tag_metadata_id")
            SELECT "game_metadata_id",
                "tag_metadata_id"
            FROM "game_metadata_tags_tag_metadata"
        `);
    await queryRunner.query(`
            DROP TABLE "game_metadata_tags_tag_metadata"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_game_metadata_tags_tag_metadata"
                RENAME TO "game_metadata_tags_tag_metadata"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_a4f3fec63ccb14d466924a11ef" ON "game_metadata_tags_tag_metadata" ("tag_metadata_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_f6c8361e5e167251a06355c168" ON "game_metadata_tags_tag_metadata" ("game_metadata_id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_0482ce35adf40c9128eaa1ae89"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_c7d2d3ca1a28eab7d55e99ff24"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_game_metadata_genres_genre_metadata" (
                "game_metadata_id" integer NOT NULL,
                "genre_metadata_id" integer NOT NULL,
                CONSTRAINT "FK_c7d2d3ca1a28eab7d55e99ff24b" FOREIGN KEY ("game_metadata_id") REFERENCES "game_metadata" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT "FK_0482ce35adf40c9128eaa1ae894" FOREIGN KEY ("genre_metadata_id") REFERENCES "genre_metadata" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                PRIMARY KEY ("game_metadata_id", "genre_metadata_id")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_game_metadata_genres_genre_metadata"("game_metadata_id", "genre_metadata_id")
            SELECT "game_metadata_id",
                "genre_metadata_id"
            FROM "game_metadata_genres_genre_metadata"
        `);
    await queryRunner.query(`
            DROP TABLE "game_metadata_genres_genre_metadata"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_game_metadata_genres_genre_metadata"
                RENAME TO "game_metadata_genres_genre_metadata"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_0482ce35adf40c9128eaa1ae89" ON "game_metadata_genres_genre_metadata" ("genre_metadata_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_c7d2d3ca1a28eab7d55e99ff24" ON "game_metadata_genres_genre_metadata" ("game_metadata_id")
        `);
  }
  private async part5_delete_old_tables(queryRunner: QueryRunner) {
    await queryRunner.query(`DROP TABLE IF EXISTS "v12_bookmark"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "v12_developer"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "v12_game"`);
    await queryRunner.query(
      `DROP TABLE IF EXISTS "v12_game_developers_v12_developer"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "v12_game_genres_v12_genre"`);
    await queryRunner.query(
      `DROP TABLE IF EXISTS "v12_game_publishers_v12_publisher"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "v12_game_stores_v12_store"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "v12_game_tags_v12_tag"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "v12_gamevault_user"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "v12_genre"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "v12_image"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "v12_progress"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "v12_publisher"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "v12_store"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "v12_tag"`);
  }
  private async part6_sorting_title(queryRunner: QueryRunner) {
    const gameRepository = queryRunner.manager.getRepository("gamevault_game");

    // Fetch all games
    const games = await gameRepository.find({
      withDeleted: true,
      select: ["id", "title"],
    });

    // Start a transaction for bulk updates
    await queryRunner.startTransaction();
    try {
      // Update each game with the new sort_title
      for (const game of games) {
        const sortTitle = this.createSortTitle(game.title); // Apply the sorting function
        await gameRepository.update(game.id, { sort_title: sortTitle });
      }
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    }
  }

  private createSortTitle(title: string): string {
    // List of leading articles to be removed
    const articles: string[] = ["the", "a", "an"];

    // Convert the title to lowercase
    let sortTitle: string = toLower(title).trim();

    // Remove any leading article
    for (const article of articles) {
      const articleWithSpace = `${article} `;
      if (sortTitle.startsWith(articleWithSpace)) {
        sortTitle = sortTitle.substring(articleWithSpace.length);
        break;
      }
    }

    // Remove special characters except alphanumeric and spaces
    // Replace multiple spaces with a single space and trim
    return sortTitle
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();
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
      this.logger.log({
        message: `Migrating image ID ${image.id}, Source: ${image.source}`,
      });

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
      this.logger.log({
        message: `Migrating tag ID ${tag.id}, Name: ${tag.name}`,
      });

      if (
        await queryRunner.manager.existsBy(TagMetadata, {
          provider_slug: this.legacyProviderSlug,
          provider_data_id: tag.rawg_id.toString(),
        })
      ) {
        this.logger.log({
          message: `Tag ID ${tag.id} already exists. Skipping.`,
        });
        continue;
      }

      const newTag = await queryRunner.manager.save(TagMetadata, {
        id: tag.id,
        provider_slug: this.legacyProviderSlug,
        provider_data_id: tag.rawg_id.toString(),
        name: tag.name,
        created_at: tag.created_at,
        updated_at: tag.updated_at,
        deleted_at: tag.deleted_at,
        entity_version: tag.entity_version,
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
      this.logger.log({
        message: `Migrating genre ID ${genre.id}, Name: ${genre.name}`,
      });

      if (
        await queryRunner.manager.existsBy(GenreMetadata, {
          provider_slug: this.legacyProviderSlug,
          provider_data_id: genre.rawg_id.toString(),
        })
      ) {
        this.logger.log({
          message: `Genre ID ${genre.id} already exists. Skipping.`,
        });
        continue;
      }

      const newGenre = await queryRunner.manager.save(GenreMetadata, {
        id: genre.id,
        provider_slug: this.legacyProviderSlug,
        provider_data_id: genre.rawg_id.toString(),
        name: genre.name,
        created_at: genre.created_at,
        updated_at: genre.updated_at,
        deleted_at: genre.deleted_at,
        entity_version: genre.entity_version,
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
      this.logger.log({
        message: `Migrating developer ID ${developer.id}, Name: ${developer.name}`,
      });

      if (
        await queryRunner.manager.existsBy(DeveloperMetadata, {
          provider_slug: this.legacyProviderSlug,
          provider_data_id: developer.rawg_id.toString(),
        })
      ) {
        this.logger.log({
          message: `Developer ID ${developer.id} already exists. Skipping.`,
        });
        continue;
      }

      const newDeveloper = await queryRunner.manager.save(DeveloperMetadata, {
        id: developer.id,
        provider_slug: this.legacyProviderSlug,
        provider_data_id: developer.rawg_id.toString(),
        name: developer.name,
        created_at: developer.created_at,
        updated_at: developer.updated_at,
        deleted_at: developer.deleted_at,
        entity_version: developer.entity_version,
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
      this.logger.log({
        message: `Migrating publisher ID ${publisher.id}, Name: ${publisher.name}`,
      });

      if (
        await queryRunner.manager.existsBy(PublisherMetadata, {
          provider_slug: this.legacyProviderSlug,
          provider_data_id: publisher.rawg_id.toString(),
        })
      ) {
        this.logger.log({
          message: `Publisher ID ${publisher.id} already exists. Skipping.`,
        });
        continue;
      }

      const newPublisher = await queryRunner.manager.save(PublisherMetadata, {
        id: publisher.id,
        provider_slug: this.legacyProviderSlug,
        provider_data_id: publisher.rawg_id.toString(),
        name: publisher.name,
        created_at: publisher.created_at,
        updated_at: publisher.updated_at,
        deleted_at: publisher.deleted_at,
        entity_version: publisher.entity_version,
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
      this.logger.log({
        message: `Migrating game ID ${game.id}, Title: ${game.title}`,
      });

      const migratedGame = await queryRunner.manager.save(GamevaultGame, {
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

      const cover = game.box_image
        ? await queryRunner.manager.findOne(Media, {
            where: { id: game.box_image.id },
            withDeleted: true,
          })
        : undefined;
      if (cover)
        this.logger.log({ message: `Linked cover image, ID: ${cover?.id}` });

      const background = game.background_image
        ? await queryRunner.manager.findOne(Media, {
            where: { id: game.background_image.id },
            withDeleted: true,
          })
        : undefined;
      if (background)
        this.logger.log({
          message: `Linked background image, ID: ${background?.id}`,
        });

      if (!game.rawg_id) {
        this.logger.log({
          message: `No rawg_id found. Skipping metadata for game ID: ${game.id}.`,
        });
        continue;
      }

      const tags = game.tags?.length
        ? await queryRunner.manager.findBy(TagMetadata, {
            provider_slug: this.legacyProviderSlug,
            provider_data_id: In(game.tags.map((t) => t.rawg_id)),
          })
        : [];
      this.logger.log({
        message: `Linked ${tags.length} tags for game ID: ${game.id}`,
      });

      const genres = game.genres?.length
        ? await queryRunner.manager.findBy(GenreMetadata, {
            provider_slug: this.legacyProviderSlug,
            provider_data_id: In(game.genres.map((g) => g.rawg_id)),
          })
        : [];
      this.logger.log({
        message: `Linked ${genres.length} genres for game ID: ${game.id}`,
      });

      const developers = game.developers?.length
        ? await queryRunner.manager.findBy(DeveloperMetadata, {
            provider_slug: this.legacyProviderSlug,
            provider_data_id: In(game.developers.map((d) => d.rawg_id)),
          })
        : [];
      this.logger.log({
        message: `Linked ${developers.length} developers for game ID: ${game.id}`,
      });

      const publishers = game.publishers?.length
        ? await queryRunner.manager.findBy(PublisherMetadata, {
            provider_slug: this.legacyProviderSlug,
            provider_data_id: In(game.publishers.map((p) => p.rawg_id)),
          })
        : [];
      this.logger.log({
        message: `Linked ${publishers.length} publishers for game ID: ${game.id}`,
      });

      if (
        await queryRunner.manager.existsBy(GameMetadata, {
          provider_slug: this.legacyProviderSlug,
          provider_data_id: game.rawg_id.toString(),
        })
      ) {
        this.logger.log({
          message: `Game Metadata already exists for game ID ${game.id}. Skipping.`,
        });
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

      migratedGame.provider_metadata = [gameMetadata];
      await queryRunner.manager.save(GamevaultGame, migratedGame);

      this.logger.log({
        message: `Game metadata saved successfully. Metadata ID: ${gameMetadata.id}, Title: ${gameMetadata.title}`,
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
      this.logger.log({
        message: `Migrating user ID ${user.id}, Username: ${user.username}`,
      });

      const avatar = user.profile_picture
        ? await queryRunner.manager.findOne(Media, {
            where: { id: user.profile_picture.id },
            withDeleted: true,
          })
        : undefined;
      if (avatar)
        this.logger.log({ message: `Linked avatar image, ID: ${avatar?.id}` });

      const background = user.background_image
        ? await queryRunner.manager.findOne(Media, {
            where: { id: user.background_image.id },
            withDeleted: true,
          })
        : undefined;
      if (background)
        this.logger.log({
          message: `Linked background image, ID: ${background?.id}`,
        });

      const bookmarkedGames = user.bookmarked_games?.length
        ? await queryRunner.manager.findBy(GamevaultGame, {
            id: In(user.bookmarked_games.map((b) => b.id)),
          })
        : [];

      const newUser = await queryRunner.manager.save(GamevaultUser, {
        id: user.id,
        username: user.username,
        password: user.password,
        socket_secret: user.socket_secret ?? randomBytes(32).toString("hex"),
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
      this.logger.log({
        message: `User migrated successfully.`,
        username: newUser.username,
        userId: newUser.id,
      });
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
      this.logger.log({
        message: `Migrating progress ID ${progress.id}, User: ${progress.user?.id}, Game: ${progress.game?.id}`,
      });

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
        id: progress.id,
        user,
        game,
        minutes_played: progress.minutes_played,
        state: State[progress.state.valueOf()],
        last_played_at: progress.last_played_at,
        created_at: progress.created_at,
        updated_at: progress.updated_at,
        deleted_at: progress.deleted_at,
        entity_version: progress.entity_version,
      });
      this.logger.log({
        message: `Progress migrated successfully.`,
        progress: newProgress,
      });
    }

    this.logger.log({ message: "Progress migration completed." });
  }

  public async down(): Promise<void> {
    throw new NotImplementedException(
      "There is no way to undo this migration.",
    );
  }
}
