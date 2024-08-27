import { Logger, NotImplementedException } from "@nestjs/common";
import { MigrationInterface, QueryRunner } from "typeorm";

export class V13Part2GenerateNewSchema1724792551000
  implements MigrationInterface
{
  private readonly logger = new Logger(this.constructor.name);
  name = "V13Part2GenerateNewSchema1724792551000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    this.logger.log("Starting Migration to V13.0.0 - Part 2");

    this.logger.log("Creating ENUM type: progress_state_enum");
    await queryRunner.query(`
            CREATE TYPE "public"."progress_state_enum" AS ENUM(
                'UNPLAYED',
                'INFINITE',
                'PLAYING',
                'COMPLETED',
                'ABORTED_TEMPORARY',
                'ABORTED_PERMANENT'
            )
        `);

    this.logger.log("Creating ENUM type: gamevault_game_type_enum");
    await queryRunner.query(`
            CREATE TYPE "public"."gamevault_game_type_enum" AS ENUM(
                'UNDETECTABLE',
                'WINDOWS_SETUP',
                'WINDOWS_PORTABLE',
                'LINUX_PORTABLE'
            )
        `);

    this.logger.log("Creating ENUM type: gamevault_user_role_enum");
    await queryRunner.query(`
            CREATE TYPE "public"."gamevault_user_role_enum" AS ENUM('0', '1', '2', '3')
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
            CONSTRAINT "UQ_e0da4bbf1074bca2d980a810771" UNIQUE ("socket_secret"),
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

    this.logger.log("Creating join table: v12_game_publishers_v12_publisher");
    await queryRunner.query(`
        CREATE TABLE "v12_game_publishers_v12_publisher" (
            "v12_game_id" integer NOT NULL,
            "v12_publisher_id" integer NOT NULL,
            CONSTRAINT "PK_a788e88dc7c792a6525893c3e11" PRIMARY KEY ("v12_game_id", "v12_publisher_id")
        )
    `);

    this.logger.log("Creating join table: v12_game_developers_v12_developer");
    await queryRunner.query(`
        CREATE TABLE "v12_game_developers_v12_developer" (
            "v12_game_id" integer NOT NULL,
            "v12_developer_id" integer NOT NULL,
            CONSTRAINT "PK_5e4b1137756321f183ce339056e" PRIMARY KEY ("v12_game_id", "v12_developer_id")
        )
    `);

    this.logger.log("Creating join table: v12_game_stores_v12_store");
    await queryRunner.query(`
        CREATE TABLE "v12_game_stores_v12_store" (
            "v12_game_id" integer NOT NULL,
            "v12_store_id" integer NOT NULL,
            CONSTRAINT "PK_a7905084a2bb3a8b8cc175e0217" PRIMARY KEY ("v12_game_id", "v12_store_id")
        )
    `);

    this.logger.log("Creating join table: v12_game_tags_v12_tag");
    await queryRunner.query(`
        CREATE TABLE "v12_game_tags_v12_tag" (
            "v12_game_id" integer NOT NULL,
            "v12_tag_id" integer NOT NULL,
            CONSTRAINT "PK_245993c7296f2f5a925370cb555" PRIMARY KEY ("v12_game_id", "v12_tag_id")
        )
    `);

    this.logger.log("Creating join table: v12_game_genres_v12_genre");
    await queryRunner.query(`
        CREATE TABLE "v12_game_genres_v12_genre" (
            "v12_game_id" integer NOT NULL,
            "v12_genre_id" integer NOT NULL,
            CONSTRAINT "PK_ddaa96ae611b46547e8a657cbc6" PRIMARY KEY ("v12_game_id", "v12_genre_id")
        )
    `);

    this.logger.log("Migration to V13.0.0 - Part 2 completed successfully.");
  }

  public async down(): Promise<void> {
    throw new NotImplementedException(
      "There is no way to undo this migration.",
    );
  }
}
