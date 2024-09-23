import { Logger, NotImplementedException } from "@nestjs/common";
import { MigrationInterface, QueryRunner } from "typeorm";

export class V13Part2GenerateNewSchema1724792551000
  implements MigrationInterface
{
  private readonly logger = new Logger(this.constructor.name);

  public async up(queryRunner: QueryRunner): Promise<void> {
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

  public async down(): Promise<void> {
    throw new NotImplementedException(
      "There is no way to undo this migration.",
    );
  }
}
