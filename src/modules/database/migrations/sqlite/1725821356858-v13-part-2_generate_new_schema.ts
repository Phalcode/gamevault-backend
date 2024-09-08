import { MigrationInterface, QueryRunner } from "typeorm";

export class V13Part2GenerateNewSchema1725821356858 implements MigrationInterface {
    name = 'V13Part2GenerateNewSchema1725821356858'

    public async up(queryRunner: QueryRunner): Promise<void> {
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
            CREATE TABLE "media" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
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
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "file_path" varchar NOT NULL,
                "size" bigint NOT NULL DEFAULT (0),
                "title" varchar,
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

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "IDX_3c8d93fdd9e34a97f5a5903129"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_6f00464edf85ddfedbd2580842"
        `);
        await queryRunner.query(`
            ALTER TABLE "bookmark"
                RENAME TO "temporary_bookmark"
        `);
        await queryRunner.query(`
            CREATE TABLE "bookmark" (
                "gamevault_user_id" integer NOT NULL,
                "gamevault_game_id" integer NOT NULL,
                PRIMARY KEY ("gamevault_user_id", "gamevault_game_id")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "bookmark"("gamevault_user_id", "gamevault_game_id")
            SELECT "gamevault_user_id",
                "gamevault_game_id"
            FROM "temporary_bookmark"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_bookmark"
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_3c8d93fdd9e34a97f5a5903129" ON "bookmark" ("gamevault_game_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_6f00464edf85ddfedbd2580842" ON "bookmark" ("gamevault_user_id")
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_0b9f583ebc16b0bb8cbfaf00f8"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_8602b8a76c7952d1155118933f"
        `);
        await queryRunner.query(`
            ALTER TABLE "gamevault_game_provider_metadata_game_metadata"
                RENAME TO "temporary_gamevault_game_provider_metadata_game_metadata"
        `);
        await queryRunner.query(`
            CREATE TABLE "gamevault_game_provider_metadata_game_metadata" (
                "gamevault_game_id" integer NOT NULL,
                "game_metadata_id" integer NOT NULL,
                PRIMARY KEY ("gamevault_game_id", "game_metadata_id")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "gamevault_game_provider_metadata_game_metadata"("gamevault_game_id", "game_metadata_id")
            SELECT "gamevault_game_id",
                "game_metadata_id"
            FROM "temporary_gamevault_game_provider_metadata_game_metadata"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_gamevault_game_provider_metadata_game_metadata"
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_0b9f583ebc16b0bb8cbfaf00f8" ON "gamevault_game_provider_metadata_game_metadata" ("game_metadata_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_8602b8a76c7952d1155118933f" ON "gamevault_game_provider_metadata_game_metadata" ("gamevault_game_id")
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_0482ce35adf40c9128eaa1ae89"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_c7d2d3ca1a28eab7d55e99ff24"
        `);
        await queryRunner.query(`
            ALTER TABLE "game_metadata_genres_genre_metadata"
                RENAME TO "temporary_game_metadata_genres_genre_metadata"
        `);
        await queryRunner.query(`
            CREATE TABLE "game_metadata_genres_genre_metadata" (
                "game_metadata_id" integer NOT NULL,
                "genre_metadata_id" integer NOT NULL,
                PRIMARY KEY ("game_metadata_id", "genre_metadata_id")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "game_metadata_genres_genre_metadata"("game_metadata_id", "genre_metadata_id")
            SELECT "game_metadata_id",
                "genre_metadata_id"
            FROM "temporary_game_metadata_genres_genre_metadata"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_game_metadata_genres_genre_metadata"
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_0482ce35adf40c9128eaa1ae89" ON "game_metadata_genres_genre_metadata" ("genre_metadata_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_c7d2d3ca1a28eab7d55e99ff24" ON "game_metadata_genres_genre_metadata" ("game_metadata_id")
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_a4f3fec63ccb14d466924a11ef"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_f6c8361e5e167251a06355c168"
        `);
        await queryRunner.query(`
            ALTER TABLE "game_metadata_tags_tag_metadata"
                RENAME TO "temporary_game_metadata_tags_tag_metadata"
        `);
        await queryRunner.query(`
            CREATE TABLE "game_metadata_tags_tag_metadata" (
                "game_metadata_id" integer NOT NULL,
                "tag_metadata_id" integer NOT NULL,
                PRIMARY KEY ("game_metadata_id", "tag_metadata_id")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "game_metadata_tags_tag_metadata"("game_metadata_id", "tag_metadata_id")
            SELECT "game_metadata_id",
                "tag_metadata_id"
            FROM "temporary_game_metadata_tags_tag_metadata"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_game_metadata_tags_tag_metadata"
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_a4f3fec63ccb14d466924a11ef" ON "game_metadata_tags_tag_metadata" ("tag_metadata_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_f6c8361e5e167251a06355c168" ON "game_metadata_tags_tag_metadata" ("game_metadata_id")
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_3741d615695a161ffc5a41e748"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_2b99b13a4b75f1396c49990e6d"
        `);
        await queryRunner.query(`
            ALTER TABLE "game_metadata_developers_developer_metadata"
                RENAME TO "temporary_game_metadata_developers_developer_metadata"
        `);
        await queryRunner.query(`
            CREATE TABLE "game_metadata_developers_developer_metadata" (
                "game_metadata_id" integer NOT NULL,
                "developer_metadata_id" integer NOT NULL,
                PRIMARY KEY ("game_metadata_id", "developer_metadata_id")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "game_metadata_developers_developer_metadata"("game_metadata_id", "developer_metadata_id")
            SELECT "game_metadata_id",
                "developer_metadata_id"
            FROM "temporary_game_metadata_developers_developer_metadata"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_game_metadata_developers_developer_metadata"
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_3741d615695a161ffc5a41e748" ON "game_metadata_developers_developer_metadata" ("developer_metadata_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_2b99b13a4b75f1396c49990e6d" ON "game_metadata_developers_developer_metadata" ("game_metadata_id")
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_71ffc2cb90c863a5c225efa295"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_6d9f174cdbce41bb5b934271a9"
        `);
        await queryRunner.query(`
            ALTER TABLE "game_metadata_publishers_publisher_metadata"
                RENAME TO "temporary_game_metadata_publishers_publisher_metadata"
        `);
        await queryRunner.query(`
            CREATE TABLE "game_metadata_publishers_publisher_metadata" (
                "game_metadata_id" integer NOT NULL,
                "publisher_metadata_id" integer NOT NULL,
                PRIMARY KEY ("game_metadata_id", "publisher_metadata_id")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "game_metadata_publishers_publisher_metadata"("game_metadata_id", "publisher_metadata_id")
            SELECT "game_metadata_id",
                "publisher_metadata_id"
            FROM "temporary_game_metadata_publishers_publisher_metadata"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_game_metadata_publishers_publisher_metadata"
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_71ffc2cb90c863a5c225efa295" ON "game_metadata_publishers_publisher_metadata" ("publisher_metadata_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_6d9f174cdbce41bb5b934271a9" ON "game_metadata_publishers_publisher_metadata" ("game_metadata_id")
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_c5afe975cb06f9624d5f5aa8ff"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_178abeeb628ebcdb70239c08d4"
        `);
        await queryRunner.query(`
            ALTER TABLE "game_metadata_gamevault_games_gamevault_game"
                RENAME TO "temporary_game_metadata_gamevault_games_gamevault_game"
        `);
        await queryRunner.query(`
            CREATE TABLE "game_metadata_gamevault_games_gamevault_game" (
                "game_metadata_id" integer NOT NULL,
                "gamevault_game_id" integer NOT NULL,
                PRIMARY KEY ("game_metadata_id", "gamevault_game_id")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "game_metadata_gamevault_games_gamevault_game"("game_metadata_id", "gamevault_game_id")
            SELECT "game_metadata_id",
                "gamevault_game_id"
            FROM "temporary_game_metadata_gamevault_games_gamevault_game"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_game_metadata_gamevault_games_gamevault_game"
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_c5afe975cb06f9624d5f5aa8ff" ON "game_metadata_gamevault_games_gamevault_game" ("gamevault_game_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_178abeeb628ebcdb70239c08d4" ON "game_metadata_gamevault_games_gamevault_game" ("game_metadata_id")
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_4edfac51e323a4993aec668eb4"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_e0da4bbf1074bca2d980a81077"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_4c835305e86b28e416cfe13dac"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_c2a3f8b06558be9508161af22e"
        `);
        await queryRunner.query(`
            ALTER TABLE "gamevault_user"
                RENAME TO "temporary_gamevault_user"
        `);
        await queryRunner.query(`
            CREATE TABLE "gamevault_user" (
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
                CONSTRAINT "REL_0bd4a25fe30450010869557666" UNIQUE ("background_id")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "gamevault_user"(
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
            FROM "temporary_gamevault_user"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_gamevault_user"
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_4edfac51e323a4993aec668eb4" ON "gamevault_user" ("birth_date")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_e0da4bbf1074bca2d980a81077" ON "gamevault_user" ("socket_secret")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_4c835305e86b28e416cfe13dac" ON "gamevault_user" ("username")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_c2a3f8b06558be9508161af22e" ON "gamevault_user" ("id")
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_73e99cf1379987ed7c5983d74f"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_91d454956bd20f46b646b05b91"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_dc16bc448f2591a832533f25d9"
        `);
        await queryRunner.query(`
            ALTER TABLE "gamevault_game"
                RENAME TO "temporary_gamevault_game"
        `);
        await queryRunner.query(`
            CREATE TABLE "gamevault_game" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "file_path" varchar NOT NULL,
                "size" bigint NOT NULL DEFAULT (0),
                "title" varchar,
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
            INSERT INTO "gamevault_game"(
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
            FROM "temporary_gamevault_game"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_gamevault_game"
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_73e99cf1379987ed7c5983d74f" ON "gamevault_game" ("release_date")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_91d454956bd20f46b646b05b91" ON "gamevault_game" ("file_path")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_dc16bc448f2591a832533f25d9" ON "gamevault_game" ("id")
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_feaddf361921db1df3a6fe3965"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_ddcaca3a9db9d77105d51c02c2"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_79abdfd87a688f9de756a162b6"
        `);
        await queryRunner.query(`
            ALTER TABLE "progress"
                RENAME TO "temporary_progress"
        `);
        await queryRunner.query(`
            CREATE TABLE "progress" (
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
                "game_id" integer
            )
        `);
        await queryRunner.query(`
            INSERT INTO "progress"(
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
            FROM "temporary_progress"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_progress"
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_feaddf361921db1df3a6fe3965" ON "progress" ("game_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_ddcaca3a9db9d77105d51c02c2" ON "progress" ("user_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_79abdfd87a688f9de756a162b6" ON "progress" ("id")
        `);
        await queryRunner.query(`
            DROP INDEX "UQ_GAME_METADATA"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_47070ef56d911fa9824f3277e2"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_21c321551d9c772d56e07b2a1a"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_4f0b69ca308a906932c84ea0d5"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_e9a00e38e7969570d9ab66dd27"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_7af272a017b850a4ce7a6c2886"
        `);
        await queryRunner.query(`
            ALTER TABLE "game_metadata"
                RENAME TO "temporary_game_metadata"
        `);
        await queryRunner.query(`
            CREATE TABLE "game_metadata" (
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
                "background_id" integer
            )
        `);
        await queryRunner.query(`
            INSERT INTO "game_metadata"(
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
            FROM "temporary_game_metadata"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_game_metadata"
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "UQ_GAME_METADATA" ON "game_metadata" ("provider_slug", "provider_data_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_47070ef56d911fa9824f3277e2" ON "game_metadata" ("release_date")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_21c321551d9c772d56e07b2a1a" ON "game_metadata" ("title")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_4f0b69ca308a906932c84ea0d5" ON "game_metadata" ("provider_data_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_e9a00e38e7969570d9ab66dd27" ON "game_metadata" ("provider_slug")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_7af272a017b850a4ce7a6c2886" ON "game_metadata" ("id")
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_62649abcfe2e99bd6215511e23"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_f4e0fcac36e050de337b670d8b"
        `);
        await queryRunner.query(`
            ALTER TABLE "media"
                RENAME TO "temporary_media"
        `);
        await queryRunner.query(`
            CREATE TABLE "media" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
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
            INSERT INTO "media"(
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
            FROM "temporary_media"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_media"
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_62649abcfe2e99bd6215511e23" ON "media" ("file_path")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_f4e0fcac36e050de337b670d8b" ON "media" ("id")
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
            ALTER TABLE "v12_tag"
                RENAME TO "temporary_v12_tag"
        `);
        await queryRunner.query(`
            CREATE TABLE "v12_tag" (
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
            INSERT INTO "v12_tag"(
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
            FROM "temporary_v12_tag"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_v12_tag"
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
            DROP INDEX "IDX_4a2e62473659b6263b17a5497c"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_6695d0cc38a598edd65fcba0ee"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_e2db9da8c8288f3ff795994d4d"
        `);
        await queryRunner.query(`
            ALTER TABLE "v12_store"
                RENAME TO "temporary_v12_store"
        `);
        await queryRunner.query(`
            CREATE TABLE "v12_store" (
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
            INSERT INTO "v12_store"(
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
            FROM "temporary_v12_store"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_v12_store"
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
            DROP INDEX "IDX_ba10ea475597187820c3b4fd28"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_2263bfd2f8ed59b0f54f6d3ae9"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_f2f05b756501810d84eea1d651"
        `);
        await queryRunner.query(`
            ALTER TABLE "v12_publisher"
                RENAME TO "temporary_v12_publisher"
        `);
        await queryRunner.query(`
            CREATE TABLE "v12_publisher" (
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
            INSERT INTO "v12_publisher"(
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
            FROM "temporary_v12_publisher"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_v12_publisher"
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
            DROP INDEX "IDX_888c3736e64117aba956e90f65"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_8a0e8d0364e3637f00d655af94"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_cf2ba84ceb90f80049fce15995"
        `);
        await queryRunner.query(`
            ALTER TABLE "v12_genre"
                RENAME TO "temporary_v12_genre"
        `);
        await queryRunner.query(`
            CREATE TABLE "v12_genre" (
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
            INSERT INTO "v12_genre"(
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
            FROM "temporary_v12_genre"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_v12_genre"
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
            DROP INDEX "IDX_039ad5528f914321b2fc6b1fff"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_54a35803b834868362fa4c2629"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_907a95c00ab6d81140c1a1b4a3"
        `);
        await queryRunner.query(`
            ALTER TABLE "v12_developer"
                RENAME TO "temporary_v12_developer"
        `);
        await queryRunner.query(`
            CREATE TABLE "v12_developer" (
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
            INSERT INTO "v12_developer"(
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
            FROM "temporary_v12_developer"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_v12_developer"
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
            DROP INDEX "IDX_3c8d93fdd9e34a97f5a5903129"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_6f00464edf85ddfedbd2580842"
        `);
        await queryRunner.query(`
            DROP TABLE "bookmark"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_0b9f583ebc16b0bb8cbfaf00f8"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_8602b8a76c7952d1155118933f"
        `);
        await queryRunner.query(`
            DROP TABLE "gamevault_game_provider_metadata_game_metadata"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_0482ce35adf40c9128eaa1ae89"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_c7d2d3ca1a28eab7d55e99ff24"
        `);
        await queryRunner.query(`
            DROP TABLE "game_metadata_genres_genre_metadata"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_a4f3fec63ccb14d466924a11ef"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_f6c8361e5e167251a06355c168"
        `);
        await queryRunner.query(`
            DROP TABLE "game_metadata_tags_tag_metadata"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_3741d615695a161ffc5a41e748"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_2b99b13a4b75f1396c49990e6d"
        `);
        await queryRunner.query(`
            DROP TABLE "game_metadata_developers_developer_metadata"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_71ffc2cb90c863a5c225efa295"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_6d9f174cdbce41bb5b934271a9"
        `);
        await queryRunner.query(`
            DROP TABLE "game_metadata_publishers_publisher_metadata"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_c5afe975cb06f9624d5f5aa8ff"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_178abeeb628ebcdb70239c08d4"
        `);
        await queryRunner.query(`
            DROP TABLE "game_metadata_gamevault_games_gamevault_game"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_4edfac51e323a4993aec668eb4"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_e0da4bbf1074bca2d980a81077"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_4c835305e86b28e416cfe13dac"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_c2a3f8b06558be9508161af22e"
        `);
        await queryRunner.query(`
            DROP TABLE "gamevault_user"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_73e99cf1379987ed7c5983d74f"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_91d454956bd20f46b646b05b91"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_dc16bc448f2591a832533f25d9"
        `);
        await queryRunner.query(`
            DROP TABLE "gamevault_game"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_feaddf361921db1df3a6fe3965"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_ddcaca3a9db9d77105d51c02c2"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_79abdfd87a688f9de756a162b6"
        `);
        await queryRunner.query(`
            DROP TABLE "progress"
        `);
        await queryRunner.query(`
            DROP INDEX "UQ_GAME_METADATA"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_47070ef56d911fa9824f3277e2"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_21c321551d9c772d56e07b2a1a"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_4f0b69ca308a906932c84ea0d5"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_e9a00e38e7969570d9ab66dd27"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_7af272a017b850a4ce7a6c2886"
        `);
        await queryRunner.query(`
            DROP TABLE "game_metadata"
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
            DROP TABLE "tag_metadata"
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
            DROP TABLE "publisher_metadata"
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
            DROP TABLE "genre_metadata"
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
            DROP TABLE "developer_metadata"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_62649abcfe2e99bd6215511e23"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_f4e0fcac36e050de337b670d8b"
        `);
        await queryRunner.query(`
            DROP TABLE "media"
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
            ALTER TABLE "v12_tag"
                RENAME TO "temporary_v12_tag"
        `);
        await queryRunner.query(`
            CREATE TABLE "v12_tag" (
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
            INSERT INTO "v12_tag"(
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
            FROM "temporary_v12_tag"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_v12_tag"
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
            DROP INDEX "IDX_4a2e62473659b6263b17a5497c"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_6695d0cc38a598edd65fcba0ee"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_e2db9da8c8288f3ff795994d4d"
        `);
        await queryRunner.query(`
            ALTER TABLE "v12_store"
                RENAME TO "temporary_v12_store"
        `);
        await queryRunner.query(`
            CREATE TABLE "v12_store" (
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
            INSERT INTO "v12_store"(
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
            FROM "temporary_v12_store"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_v12_store"
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
            DROP INDEX "IDX_ba10ea475597187820c3b4fd28"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_2263bfd2f8ed59b0f54f6d3ae9"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_f2f05b756501810d84eea1d651"
        `);
        await queryRunner.query(`
            ALTER TABLE "v12_publisher"
                RENAME TO "temporary_v12_publisher"
        `);
        await queryRunner.query(`
            CREATE TABLE "v12_publisher" (
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
            INSERT INTO "v12_publisher"(
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
            FROM "temporary_v12_publisher"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_v12_publisher"
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
            DROP INDEX "IDX_888c3736e64117aba956e90f65"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_8a0e8d0364e3637f00d655af94"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_cf2ba84ceb90f80049fce15995"
        `);
        await queryRunner.query(`
            ALTER TABLE "v12_genre"
                RENAME TO "temporary_v12_genre"
        `);
        await queryRunner.query(`
            CREATE TABLE "v12_genre" (
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
            INSERT INTO "v12_genre"(
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
            FROM "temporary_v12_genre"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_v12_genre"
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
            DROP INDEX "IDX_039ad5528f914321b2fc6b1fff"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_54a35803b834868362fa4c2629"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_907a95c00ab6d81140c1a1b4a3"
        `);
        await queryRunner.query(`
            ALTER TABLE "v12_developer"
                RENAME TO "temporary_v12_developer"
        `);
        await queryRunner.query(`
            CREATE TABLE "v12_developer" (
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
            INSERT INTO "v12_developer"(
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
            FROM "temporary_v12_developer"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_v12_developer"
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
    }

}
