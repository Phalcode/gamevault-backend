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

export class V13Final1728421385000 implements MigrationInterface {
  private readonly logger = new Logger(this.constructor.name);
  name = "V13Final1728421385000";
  legacyProviderSlug = "rawg-legacy";

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await this.checkMigrationRun(queryRunner)) {
      return;
    }
    await this.part1_rename_tables(queryRunner);
    await this.part2_generate_new_schema(queryRunner);
    await this.part3_migrate_data(queryRunner);
    await this.part4_delete_old_tables(queryRunner);
    await this.part5_sync(queryRunner);
  }

  private async checkMigrationRun(queryRunner: QueryRunner): Promise<boolean> {
    const migrations = await queryRunner.query(
      `SELECT * FROM migrations WHERE name LIKE $1`,
      ["V13Part%"],
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

  private async part1_rename_tables(queryRunner: QueryRunner) {
    if (existsSync("/images")) {
      throw new Error(
        "Your media volume mount point is still pointing to /images. This is deprecated since v13.0.0. From now on, mount your images to /media instead.",
      );
    }

    // Rename all existing tables, so no conflicts appear
    await queryRunner.query(`ALTER TABLE "image" RENAME TO "v12_image"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_f03b89f33671086e6733828e79"`,
    );
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

    //Final Cleanup Measures
    await queryRunner.query(`DROP SEQUENCE IF EXISTS crackpipe_user_id_seq`);
    await queryRunner.query(
      `ALTER SEQUENCE IF EXISTS gamevault_user_id_seq RENAME TO v12_gamevault_user_id_seq`,
    );
    await queryRunner.query(
      `ALTER SEQUENCE IF EXISTS image_id_seq RENAME TO v12_image_id_seq`,
    );
  }

  private async part2_generate_new_schema(queryRunner: QueryRunner) {
    this.logger.log("Creating ENUM type: progress_state_enum");
    await queryRunner.query(`
    DO $$ 
    BEGIN 
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'progress_state_enum' AND typtype = 'e') THEN 
            CREATE TYPE "public"."progress_state_enum" AS ENUM(
                'UNPLAYED',
                'INFINITE',
                'PLAYING',
                'COMPLETED',
                'ABORTED_TEMPORARY',
                'ABORTED_PERMANENT'
            );
        END IF; 
    END $$;            
  `);

    this.logger.log("Creating ENUM type: gamevault_game_type_enum");
    await queryRunner.query(`
    DO $$ 
    BEGIN 
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gamevault_game_type_enum' AND typtype = 'e') THEN 
            CREATE TYPE "public"."gamevault_game_type_enum" AS ENUM(
                'UNDETECTABLE',
                'WINDOWS_SETUP',
                'WINDOWS_PORTABLE',
                'LINUX_PORTABLE'
            );
        END IF; 
    END $$;
  `);

    this.logger.log("Creating ENUM type: gamevault_user_role_enum");
    await queryRunner.query(`
    DO $$ 
    BEGIN 
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gamevault_user_role_enum' AND typtype = 'e') THEN 
            CREATE TYPE "public"."gamevault_user_role_enum" AS ENUM('0', '1', '2', '3'); 
        END IF; 
    END $$;
  `);

    this.logger.log("Creating table: media");
    await queryRunner.query(`
        CREATE TABLE "media" (
            "id" SERIAL NOT NULL,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
            "deleted_at" TIMESTAMP,
            "entity_version" integer NOT NULL,
            "source_url" character varying,
            "file_path" character varying,
            "type" character varying NOT NULL,
            "uploader_id" integer,
            CONSTRAINT "UQ_62649abcfe2e99bd6215511e231" UNIQUE ("file_path"),
            CONSTRAINT "PK_f4e0fcac36e050de337b670d8bd" PRIMARY KEY ("id")
        )
    `);

    this.logger.log("Creating table: developer_metadata");
    await queryRunner.query(`
        CREATE TABLE "developer_metadata" (
            "id" SERIAL NOT NULL,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
            "deleted_at" TIMESTAMP,
            "entity_version" integer NOT NULL,
            "provider_slug" character varying NOT NULL,
            "provider_data_id" character varying NOT NULL,
            "name" character varying NOT NULL,
            CONSTRAINT "PK_3797936110f483ab684d700e487" PRIMARY KEY ("id")
        )
    `);

    this.logger.log("Creating table: genre_metadata");
    await queryRunner.query(`
        CREATE TABLE "genre_metadata" (
            "id" SERIAL NOT NULL,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
            "deleted_at" TIMESTAMP,
            "entity_version" integer NOT NULL,
            "provider_slug" character varying NOT NULL,
            "provider_data_id" character varying NOT NULL,
            "name" character varying NOT NULL,
            CONSTRAINT "PK_ab9cd344970e9df47d3d6c8b5be" PRIMARY KEY ("id")
        )
    `);

    this.logger.log("Creating table: publisher_metadata");
    await queryRunner.query(`
        CREATE TABLE "publisher_metadata" (
            "id" SERIAL NOT NULL,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
            "deleted_at" TIMESTAMP,
            "entity_version" integer NOT NULL,
            "provider_slug" character varying NOT NULL,
            "provider_data_id" character varying NOT NULL,
            "name" character varying NOT NULL,
            CONSTRAINT "PK_73e957f8e68ba1111ac3b79adc4" PRIMARY KEY ("id")
        )
    `);

    this.logger.log("Creating table: tag_metadata");
    await queryRunner.query(`
        CREATE TABLE "tag_metadata" (
            "id" SERIAL NOT NULL,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
            "deleted_at" TIMESTAMP,
            "entity_version" integer NOT NULL,
            "provider_slug" character varying NOT NULL,
            "provider_data_id" character varying NOT NULL,
            "name" character varying NOT NULL,
            CONSTRAINT "PK_96d7cccf17f8cb2cfa25388cbdd" PRIMARY KEY ("id")
        )
    `);

    this.logger.log("Creating table: game_metadata");
    await queryRunner.query(`
        CREATE TABLE "game_metadata" (
            "id" SERIAL NOT NULL,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
            "deleted_at" TIMESTAMP,
            "entity_version" integer NOT NULL,
            "provider_slug" character varying,
            "provider_data_id" character varying,
            "provider_data_url" character varying,
            "provider_priority" integer,
            "age_rating" integer,
            "title" character varying,
            "release_date" TIMESTAMP,
            "description" character varying,
            "notes" character varying,
            "average_playtime" integer,
            "url_screenshots" text,
            "url_trailers" text,
            "url_gameplays" text,
            "url_websites" text,
            "rating" double precision,
            "early_access" boolean,
            "launch_parameters" character varying,
            "launch_executable" character varying,
            "installer_executable" character varying,
            "cover_id" integer,
            "background_id" integer,
            CONSTRAINT "PK_7af272a017b850a4ce7a6c2886a" PRIMARY KEY ("id")
        )
    `);

    this.logger.log("Creating table: progress");
    await queryRunner.query(`
        CREATE TABLE "progress" (
            "id" SERIAL NOT NULL,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
            "deleted_at" TIMESTAMP,
            "entity_version" integer NOT NULL,
            "minutes_played" integer NOT NULL DEFAULT '0',
            "state" "public"."progress_state_enum" NOT NULL DEFAULT 'UNPLAYED',
            "last_played_at" TIMESTAMP,
            "user_id" integer,
            "game_id" integer,
            CONSTRAINT "PK_79abdfd87a688f9de756a162b6f" PRIMARY KEY ("id")
        )
    `);

    this.logger.log("Creating table: gamevault_game");
    await queryRunner.query(`
        CREATE TABLE "gamevault_game" (
            "id" SERIAL NOT NULL,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
            "deleted_at" TIMESTAMP,
            "entity_version" integer NOT NULL,
            "file_path" character varying NOT NULL,
            "size" bigint NOT NULL DEFAULT '0',
            "title" character varying,
            "version" character varying,
            "release_date" TIMESTAMP,
            "early_access" boolean NOT NULL DEFAULT false,
            "download_count" integer NOT NULL DEFAULT '0',
            "type" "public"."gamevault_game_type_enum" NOT NULL DEFAULT 'UNDETECTABLE',
            "user_metadata_id" integer,
            "metadata_id" integer,
            CONSTRAINT "UQ_91d454956bd20f46b646b05b91f" UNIQUE ("file_path"),
            CONSTRAINT "REL_edc9b16a9e16d394b2ca3b49b1" UNIQUE ("user_metadata_id"),
            CONSTRAINT "REL_aab0797ae3873a5ef2817d0989" UNIQUE ("metadata_id"),
            CONSTRAINT "PK_dc16bc448f2591a832533f25d95" PRIMARY KEY ("id")
        )
    `);

    this.logger.log("Creating table: gamevault_user");
    await queryRunner.query(`
        CREATE TABLE "gamevault_user" (
            "id" SERIAL NOT NULL,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
            "deleted_at" TIMESTAMP,
            "entity_version" integer NOT NULL,
            "username" character varying NOT NULL,
            "password" character varying NOT NULL,
            "socket_secret" character varying(64) NOT NULL,
            "email" character varying,
            "first_name" character varying,
            "last_name" character varying,
            "birth_date" TIMESTAMP,
            "activated" boolean NOT NULL DEFAULT false,
            "role" "public"."gamevault_user_role_enum" NOT NULL DEFAULT '1',
            "avatar_id" integer,
            "background_id" integer,
            CONSTRAINT "UQ_4c835305e86b28e416cfe13dace" UNIQUE ("username"),
            CONSTRAINT "UQ_284621e91b3886db5ebd901384a" UNIQUE ("email"),
            CONSTRAINT "REL_872748cf76003216d011ae0feb" UNIQUE ("avatar_id"),
            CONSTRAINT "REL_0bd4a25fe30450010869557666" UNIQUE ("background_id"),
            CONSTRAINT "PK_c2a3f8b06558be9508161af22e2" PRIMARY KEY ("id")
        )
    `);

    this.logger.log(
      "Creating join table: game_metadata_gamevault_games_gamevault_game",
    );
    await queryRunner.query(`
        CREATE TABLE "game_metadata_gamevault_games_gamevault_game" (
            "game_metadata_id" integer NOT NULL,
            "gamevault_game_id" integer NOT NULL,
            CONSTRAINT "PK_5b1fb42d2970bc93bc217cea7a6" PRIMARY KEY ("game_metadata_id", "gamevault_game_id")
        )
    `);

    this.logger.log(
      "Creating join table: game_metadata_publishers_publisher_metadata",
    );
    await queryRunner.query(`
        CREATE TABLE "game_metadata_publishers_publisher_metadata" (
            "game_metadata_id" integer NOT NULL,
            "publisher_metadata_id" integer NOT NULL,
            CONSTRAINT "PK_435376dbd181413d7fb87ce294b" PRIMARY KEY ("game_metadata_id", "publisher_metadata_id")
        )
    `);

    this.logger.log(
      "Creating join table: game_metadata_developers_developer_metadata",
    );
    await queryRunner.query(`
        CREATE TABLE "game_metadata_developers_developer_metadata" (
            "game_metadata_id" integer NOT NULL,
            "developer_metadata_id" integer NOT NULL,
            CONSTRAINT "PK_74cda1e4aaea01fd41001f3e76f" PRIMARY KEY ("game_metadata_id", "developer_metadata_id")
        )
    `);

    this.logger.log("Creating join table: game_metadata_tags_tag_metadata");
    await queryRunner.query(`
        CREATE TABLE "game_metadata_tags_tag_metadata" (
            "game_metadata_id" integer NOT NULL,
            "tag_metadata_id" integer NOT NULL,
            CONSTRAINT "PK_b26a645d9ab3212edd7adf50ca0" PRIMARY KEY ("game_metadata_id", "tag_metadata_id")
        )
    `);

    this.logger.log("Creating join table: game_metadata_genres_genre_metadata");
    await queryRunner.query(`
        CREATE TABLE "game_metadata_genres_genre_metadata" (
            "game_metadata_id" integer NOT NULL,
            "genre_metadata_id" integer NOT NULL,
            CONSTRAINT "PK_a6ac649aebd65563fa73159f6da" PRIMARY KEY ("game_metadata_id", "genre_metadata_id")
        )
    `);

    this.logger.log(
      "Creating join table: gamevault_game_provider_metadata_game_metadata",
    );
    await queryRunner.query(`
        CREATE TABLE "gamevault_game_provider_metadata_game_metadata" (
            "gamevault_game_id" integer NOT NULL,
            "game_metadata_id" integer NOT NULL,
            CONSTRAINT "PK_ce0d864677026881405540a60b3" PRIMARY KEY ("gamevault_game_id", "game_metadata_id")
        )
    `);

    this.logger.log("Creating join table: bookmark");
    await queryRunner.query(`
        CREATE TABLE "bookmark" (
            "gamevault_user_id" integer NOT NULL,
            "gamevault_game_id" integer NOT NULL,
            CONSTRAINT "PK_c0f9972ee1277cb6da40463192b" PRIMARY KEY ("gamevault_user_id", "gamevault_game_id")
        )
    `);

    await queryRunner.query(`
            CREATE INDEX "IDX_f4e0fcac36e050de337b670d8b" ON "media" ("id")
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_62649abcfe2e99bd6215511e23" ON "media" ("file_path")
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
            CREATE INDEX "IDX_79abdfd87a688f9de756a162b6" ON "progress" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_ddcaca3a9db9d77105d51c02c2" ON "progress" ("user_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_feaddf361921db1df3a6fe3965" ON "progress" ("game_id")
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
            CREATE INDEX IF NOT EXISTS "IDX_c2a3f8b06558be9508161af22e" ON "gamevault_user" ("id")
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "IDX_4c835305e86b28e416cfe13dac" ON "gamevault_user" ("username")
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_e0da4bbf1074bca2d980a81077" ON "gamevault_user" ("socket_secret")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_4edfac51e323a4993aec668eb4" ON "gamevault_user" ("birth_date")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_178abeeb628ebcdb70239c08d4" ON "game_metadata_gamevault_games_gamevault_game" ("game_metadata_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_c5afe975cb06f9624d5f5aa8ff" ON "game_metadata_gamevault_games_gamevault_game" ("gamevault_game_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_6d9f174cdbce41bb5b934271a9" ON "game_metadata_publishers_publisher_metadata" ("game_metadata_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_71ffc2cb90c863a5c225efa295" ON "game_metadata_publishers_publisher_metadata" ("publisher_metadata_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_2b99b13a4b75f1396c49990e6d" ON "game_metadata_developers_developer_metadata" ("game_metadata_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_3741d615695a161ffc5a41e748" ON "game_metadata_developers_developer_metadata" ("developer_metadata_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_f6c8361e5e167251a06355c168" ON "game_metadata_tags_tag_metadata" ("game_metadata_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_a4f3fec63ccb14d466924a11ef" ON "game_metadata_tags_tag_metadata" ("tag_metadata_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_c7d2d3ca1a28eab7d55e99ff24" ON "game_metadata_genres_genre_metadata" ("game_metadata_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_0482ce35adf40c9128eaa1ae89" ON "game_metadata_genres_genre_metadata" ("genre_metadata_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_8602b8a76c7952d1155118933f" ON "gamevault_game_provider_metadata_game_metadata" ("gamevault_game_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_0b9f583ebc16b0bb8cbfaf00f8" ON "gamevault_game_provider_metadata_game_metadata" ("game_metadata_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_6f00464edf85ddfedbd2580842" ON "bookmark" ("gamevault_user_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_3c8d93fdd9e34a97f5a5903129" ON "bookmark" ("gamevault_game_id")
        `);
    await queryRunner.query(`
            ALTER TABLE "media"
            ADD CONSTRAINT "FK_8bd1ad5f79df58cfd7ad9c42fb5" FOREIGN KEY ("uploader_id") REFERENCES "gamevault_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "game_metadata"
            ADD CONSTRAINT "FK_9aefd37a55b610cea5ea583cdf6" FOREIGN KEY ("cover_id") REFERENCES "media"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "game_metadata"
            ADD CONSTRAINT "FK_6f44518f2a088b90a8cc804d12f" FOREIGN KEY ("background_id") REFERENCES "media"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "progress"
            ADD CONSTRAINT "FK_ddcaca3a9db9d77105d51c02c24" FOREIGN KEY ("user_id") REFERENCES "gamevault_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "progress"
            ADD CONSTRAINT "FK_feaddf361921db1df3a6fe3965a" FOREIGN KEY ("game_id") REFERENCES "gamevault_game"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "gamevault_game"
            ADD CONSTRAINT "FK_edc9b16a9e16d394b2ca3b49b12" FOREIGN KEY ("user_metadata_id") REFERENCES "game_metadata"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "gamevault_game"
            ADD CONSTRAINT "FK_aab0797ae3873a5ef2817d09891" FOREIGN KEY ("metadata_id") REFERENCES "game_metadata"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "gamevault_user"
            ADD CONSTRAINT "FK_872748cf76003216d011ae0febb" FOREIGN KEY ("avatar_id") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "gamevault_user"
            ADD CONSTRAINT "FK_0bd4a25fe304500108695576666" FOREIGN KEY ("background_id") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "game_metadata_gamevault_games_gamevault_game"
            ADD CONSTRAINT "FK_178abeeb628ebcdb70239c08d46" FOREIGN KEY ("game_metadata_id") REFERENCES "game_metadata"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `);
    await queryRunner.query(`
            ALTER TABLE "game_metadata_gamevault_games_gamevault_game"
            ADD CONSTRAINT "FK_c5afe975cb06f9624d5f5aa8ff7" FOREIGN KEY ("gamevault_game_id") REFERENCES "gamevault_game"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "game_metadata_publishers_publisher_metadata"
            ADD CONSTRAINT "FK_6d9f174cdbce41bb5b934271a9b" FOREIGN KEY ("game_metadata_id") REFERENCES "game_metadata"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `);
    await queryRunner.query(`
            ALTER TABLE "game_metadata_publishers_publisher_metadata"
            ADD CONSTRAINT "FK_71ffc2cb90c863a5c225efa2950" FOREIGN KEY ("publisher_metadata_id") REFERENCES "publisher_metadata"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "game_metadata_developers_developer_metadata"
            ADD CONSTRAINT "FK_2b99b13a4b75f1396c49990e6de" FOREIGN KEY ("game_metadata_id") REFERENCES "game_metadata"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `);
    await queryRunner.query(`
            ALTER TABLE "game_metadata_developers_developer_metadata"
            ADD CONSTRAINT "FK_3741d615695a161ffc5a41e748c" FOREIGN KEY ("developer_metadata_id") REFERENCES "developer_metadata"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "game_metadata_tags_tag_metadata"
            ADD CONSTRAINT "FK_f6c8361e5e167251a06355c168a" FOREIGN KEY ("game_metadata_id") REFERENCES "game_metadata"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `);
    await queryRunner.query(`
            ALTER TABLE "game_metadata_tags_tag_metadata"
            ADD CONSTRAINT "FK_a4f3fec63ccb14d466924a11efc" FOREIGN KEY ("tag_metadata_id") REFERENCES "tag_metadata"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "game_metadata_genres_genre_metadata"
            ADD CONSTRAINT "FK_c7d2d3ca1a28eab7d55e99ff24b" FOREIGN KEY ("game_metadata_id") REFERENCES "game_metadata"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `);
    await queryRunner.query(`
            ALTER TABLE "game_metadata_genres_genre_metadata"
            ADD CONSTRAINT "FK_0482ce35adf40c9128eaa1ae894" FOREIGN KEY ("genre_metadata_id") REFERENCES "genre_metadata"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "gamevault_game_provider_metadata_game_metadata"
            ADD CONSTRAINT "FK_8602b8a76c7952d1155118933f4" FOREIGN KEY ("gamevault_game_id") REFERENCES "gamevault_game"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `);
    await queryRunner.query(`
            ALTER TABLE "gamevault_game_provider_metadata_game_metadata"
            ADD CONSTRAINT "FK_0b9f583ebc16b0bb8cbfaf00f8f" FOREIGN KEY ("game_metadata_id") REFERENCES "game_metadata"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "bookmark"
            ADD CONSTRAINT "FK_6f00464edf85ddfedbd25808428" FOREIGN KEY ("gamevault_user_id") REFERENCES "gamevault_user"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `);
    await queryRunner.query(`
            ALTER TABLE "bookmark"
            ADD CONSTRAINT "FK_3c8d93fdd9e34a97f5a5903129b" FOREIGN KEY ("gamevault_game_id") REFERENCES "gamevault_game"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  private async part3_migrate_data(queryRunner: QueryRunner) {
    await this.toggleAutoIncrementId(queryRunner, false);
    await this.migrateImages(queryRunner);
    await this.migrateTags(queryRunner);
    await this.migrateGenres(queryRunner);
    await this.migrateDevelopers(queryRunner);
    await this.migratePublishers(queryRunner);
    await this.migrateGames(queryRunner);
    await this.migrateUsersAndBookmarks(queryRunner);
    await this.migrateProgresses(queryRunner);
    await this.toggleAutoIncrementId(queryRunner, true);
  }

  private async part4_delete_old_tables(queryRunner: QueryRunner) {
    await queryRunner.query(`DROP TABLE IF EXISTS "v12_bookmark" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "v12_developer" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "v12_game" CASCADE`);
    await queryRunner.query(
      `DROP TABLE IF EXISTS "v12_game_developers_v12_developer" CASCADE`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "v12_game_genres_v12_genre" CASCADE`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "v12_game_publishers_v12_publisher" CASCADE`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "v12_game_stores_v12_store" CASCADE`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "v12_game_tags_v12_tag" CASCADE`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "v12_gamevault_user" CASCADE`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "v12_genre" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "v12_image" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "v12_progress" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "v12_publisher" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "v12_store" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "v12_tag" CASCADE`);
  }

  private async part5_sync(queryRunner: QueryRunner) {
    await queryRunner.query(`
            ALTER TABLE "gamevault_user" 
            DROP CONSTRAINT IF EXISTS "UQ_e0da4bbf1074bca2d980a810771"
        `);
    await queryRunner.query(`
            ALTER TABLE "gamevault_user"
            ADD CONSTRAINT "UQ_e0da4bbf1074bca2d980a810771" UNIQUE ("socket_secret")
        `);
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_c2a3f8b06558be9508161af22e" ON "gamevault_user" ("id")
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "IDX_4c835305e86b28e416cfe13dac" ON "gamevault_user" ("username")
        `);
  }
  private async part6_sorting_title(queryRunner: QueryRunner) {
    await queryRunner.query(`
      ALTER TABLE "gamevault_game"
      ADD "sort_title" character varying
    `);

    const gameRepository = queryRunner.manager.getRepository("gamevault_game");

    // Fetch all games
    const games = await gameRepository.find({
      withDeleted: true,
      select: ["id", "title"],
    });

    // Update each game with the new sort_title
    for (const game of games) {
      const sortTitle = this.createSortTitle(game.title); // Apply the sorting function
      await gameRepository.update(game.id, { sort_title: sortTitle });
    }
  }

  private async toggleAutoIncrementId(
    queryRunner: QueryRunner,
    enable: boolean,
  ) {
    const tableNames = [
      "media",
      "tag_metadata",
      "genre_metadata",
      "developer_metadata",
      "publisher_metadata",
      "gamevault_game",
      "gamevault_user",
      "progress",
    ];
    for (const tableName of tableNames) {
      if (enable) {
        const [{ maxid }] = await queryRunner.query(
          `SELECT MAX(id) as maxid FROM ${tableName}`,
        );
        const maxId = Number(maxid) || 1;

        await queryRunner.query(
          `ALTER SEQUENCE ${tableName}_id_seq RESTART WITH ${maxId}`,
        );
        await queryRunner.query(
          `ALTER TABLE ${tableName} ALTER COLUMN id SET DEFAULT nextval('${tableName}_id_seq')`,
        );
      } else {
        await queryRunner.query(
          `ALTER TABLE ${tableName} ALTER COLUMN id DROP DEFAULT`,
        );
      }
    }
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

  public async down(): Promise<void> {
    throw new NotImplementedException(
      "There is no way to undo this migration.",
    );
  }
}
