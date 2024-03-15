import { MigrationInterface, QueryRunner } from "typeorm";

export class ImagesOneToOne1710515113986 implements MigrationInterface {
  name = "ImagesOneToOne1710515113986";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "IDX_352a30652cd352f552fef73dec"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_0152ed47a9e8963b5aaceb51e7"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_game" (
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
                "type" varchar NOT NULL DEFAULT ('UNDETECTABLE'),
                CONSTRAINT "UQ_7770cb331bdc54951bb9046fa9d" UNIQUE ("file_path")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_game"(
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
            FROM "game"
        `);
    await queryRunner.query(`
            DROP TABLE "game"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_game"
                RENAME TO "game"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_352a30652cd352f552fef73dec" ON "game" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_0152ed47a9e8963b5aaceb51e7" ON "game" ("title")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_352a30652cd352f552fef73dec"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_0152ed47a9e8963b5aaceb51e7"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_game" (
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
                "type" varchar NOT NULL DEFAULT ('UNDETECTABLE'),
                CONSTRAINT "UQ_7770cb331bdc54951bb9046fa9d" UNIQUE ("file_path"),
                CONSTRAINT "UQ_d155b40abc872a8f5994b2db16b" UNIQUE ("box_image_id"),
                CONSTRAINT "UQ_ae67c9253e4c3d5ebedeb723b75" UNIQUE ("background_image_id")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_game"(
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
            FROM "game"
        `);
    await queryRunner.query(`
            DROP TABLE "game"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_game"
                RENAME TO "game"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_352a30652cd352f552fef73dec" ON "game" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_0152ed47a9e8963b5aaceb51e7" ON "game" ("title")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_c2a3f8b06558be9508161af22e"
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
                "email" varchar,
                "first_name" varchar,
                "last_name" varchar,
                "activated" boolean NOT NULL DEFAULT (0),
                "role" varchar CHECK("role" IN ('0', '1', '2', '3')) NOT NULL DEFAULT (1),
                "profile_picture_id" integer,
                "background_image_id" integer,
                "socket_secret" varchar(64) NOT NULL,
                CONSTRAINT "UQ_87a411128cdc9520aede81ba929" UNIQUE ("socket_secret"),
                CONSTRAINT "UQ_d0e7d50057240e5752a2c303ffb" UNIQUE ("email"),
                CONSTRAINT "UQ_ad2fda40ce941655c838fb1435f" UNIQUE ("username")
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
            DROP INDEX "IDX_c2a3f8b06558be9508161af22e"
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
                "email" varchar,
                "first_name" varchar,
                "last_name" varchar,
                "activated" boolean NOT NULL DEFAULT (0),
                "role" varchar CHECK("role" IN ('0', '1', '2', '3')) NOT NULL DEFAULT (1),
                "profile_picture_id" integer,
                "background_image_id" integer,
                "socket_secret" varchar(64) NOT NULL,
                CONSTRAINT "UQ_87a411128cdc9520aede81ba929" UNIQUE ("socket_secret"),
                CONSTRAINT "UQ_d0e7d50057240e5752a2c303ffb" UNIQUE ("email"),
                CONSTRAINT "UQ_ad2fda40ce941655c838fb1435f" UNIQUE ("username"),
                CONSTRAINT "UQ_7f6b22ed7503f205ee09002a822" UNIQUE ("profile_picture_id"),
                CONSTRAINT "UQ_af25d313b2845d841e18ed3237f" UNIQUE ("background_image_id")
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
            DROP INDEX "IDX_352a30652cd352f552fef73dec"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_0152ed47a9e8963b5aaceb51e7"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_game" (
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
                "type" varchar NOT NULL DEFAULT ('UNDETECTABLE'),
                CONSTRAINT "UQ_7770cb331bdc54951bb9046fa9d" UNIQUE ("file_path"),
                CONSTRAINT "UQ_d155b40abc872a8f5994b2db16b" UNIQUE ("box_image_id"),
                CONSTRAINT "UQ_ae67c9253e4c3d5ebedeb723b75" UNIQUE ("background_image_id"),
                CONSTRAINT "FK_52b4bb990c5a5fe76c6d675c002" FOREIGN KEY ("box_image_id") REFERENCES "image" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_0e88ada3f37f7cabfb6d59ed0d0" FOREIGN KEY ("background_image_id") REFERENCES "image" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_game"(
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
            FROM "game"
        `);
    await queryRunner.query(`
            DROP TABLE "game"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_game"
                RENAME TO "game"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_352a30652cd352f552fef73dec" ON "game" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_0152ed47a9e8963b5aaceb51e7" ON "game" ("title")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_c2a3f8b06558be9508161af22e"
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
                "email" varchar,
                "first_name" varchar,
                "last_name" varchar,
                "activated" boolean NOT NULL DEFAULT (0),
                "role" varchar CHECK("role" IN ('0', '1', '2', '3')) NOT NULL DEFAULT (1),
                "profile_picture_id" integer,
                "background_image_id" integer,
                "socket_secret" varchar(64) NOT NULL,
                CONSTRAINT "UQ_87a411128cdc9520aede81ba929" UNIQUE ("socket_secret"),
                CONSTRAINT "UQ_d0e7d50057240e5752a2c303ffb" UNIQUE ("email"),
                CONSTRAINT "UQ_ad2fda40ce941655c838fb1435f" UNIQUE ("username"),
                CONSTRAINT "UQ_7f6b22ed7503f205ee09002a822" UNIQUE ("profile_picture_id"),
                CONSTRAINT "UQ_af25d313b2845d841e18ed3237f" UNIQUE ("background_image_id"),
                CONSTRAINT "FK_c1779b9b22212754248aa404bad" FOREIGN KEY ("profile_picture_id") REFERENCES "image" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_4b83e27ed50c1e183a69fceef68" FOREIGN KEY ("background_image_id") REFERENCES "image" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
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
                "email" varchar,
                "first_name" varchar,
                "last_name" varchar,
                "activated" boolean NOT NULL DEFAULT (0),
                "role" varchar CHECK("role" IN ('0', '1', '2', '3')) NOT NULL DEFAULT (1),
                "profile_picture_id" integer,
                "background_image_id" integer,
                "socket_secret" varchar(64) NOT NULL,
                CONSTRAINT "UQ_87a411128cdc9520aede81ba929" UNIQUE ("socket_secret"),
                CONSTRAINT "UQ_d0e7d50057240e5752a2c303ffb" UNIQUE ("email"),
                CONSTRAINT "UQ_ad2fda40ce941655c838fb1435f" UNIQUE ("username"),
                CONSTRAINT "UQ_7f6b22ed7503f205ee09002a822" UNIQUE ("profile_picture_id"),
                CONSTRAINT "UQ_af25d313b2845d841e18ed3237f" UNIQUE ("background_image_id")
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
            FROM "temporary_gamevault_user"
        `);
    await queryRunner.query(`
            DROP TABLE "temporary_gamevault_user"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_c2a3f8b06558be9508161af22e" ON "gamevault_user" ("id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_0152ed47a9e8963b5aaceb51e7"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_352a30652cd352f552fef73dec"
        `);
    await queryRunner.query(`
            ALTER TABLE "game"
                RENAME TO "temporary_game"
        `);
    await queryRunner.query(`
            CREATE TABLE "game" (
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
                "type" varchar NOT NULL DEFAULT ('UNDETECTABLE'),
                CONSTRAINT "UQ_7770cb331bdc54951bb9046fa9d" UNIQUE ("file_path"),
                CONSTRAINT "UQ_d155b40abc872a8f5994b2db16b" UNIQUE ("box_image_id"),
                CONSTRAINT "UQ_ae67c9253e4c3d5ebedeb723b75" UNIQUE ("background_image_id")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "game"(
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
            FROM "temporary_game"
        `);
    await queryRunner.query(`
            DROP TABLE "temporary_game"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_0152ed47a9e8963b5aaceb51e7" ON "game" ("title")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_352a30652cd352f552fef73dec" ON "game" ("id")
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
                "email" varchar,
                "first_name" varchar,
                "last_name" varchar,
                "activated" boolean NOT NULL DEFAULT (0),
                "role" varchar CHECK("role" IN ('0', '1', '2', '3')) NOT NULL DEFAULT (1),
                "profile_picture_id" integer,
                "background_image_id" integer,
                "socket_secret" varchar(64) NOT NULL,
                CONSTRAINT "UQ_87a411128cdc9520aede81ba929" UNIQUE ("socket_secret"),
                CONSTRAINT "UQ_d0e7d50057240e5752a2c303ffb" UNIQUE ("email"),
                CONSTRAINT "UQ_ad2fda40ce941655c838fb1435f" UNIQUE ("username")
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
            FROM "temporary_gamevault_user"
        `);
    await queryRunner.query(`
            DROP TABLE "temporary_gamevault_user"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_c2a3f8b06558be9508161af22e" ON "gamevault_user" ("id")
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
                "email" varchar,
                "first_name" varchar,
                "last_name" varchar,
                "activated" boolean NOT NULL DEFAULT (0),
                "role" varchar CHECK("role" IN ('0', '1', '2', '3')) NOT NULL DEFAULT (1),
                "profile_picture_id" integer,
                "background_image_id" integer,
                "socket_secret" varchar(64) NOT NULL,
                CONSTRAINT "UQ_87a411128cdc9520aede81ba929" UNIQUE ("socket_secret"),
                CONSTRAINT "UQ_d0e7d50057240e5752a2c303ffb" UNIQUE ("email"),
                CONSTRAINT "UQ_ad2fda40ce941655c838fb1435f" UNIQUE ("username"),
                CONSTRAINT "FK_c1779b9b22212754248aa404bad" FOREIGN KEY ("profile_picture_id") REFERENCES "image" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
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
            FROM "temporary_gamevault_user"
        `);
    await queryRunner.query(`
            DROP TABLE "temporary_gamevault_user"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_c2a3f8b06558be9508161af22e" ON "gamevault_user" ("id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_0152ed47a9e8963b5aaceb51e7"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_352a30652cd352f552fef73dec"
        `);
    await queryRunner.query(`
            ALTER TABLE "game"
                RENAME TO "temporary_game"
        `);
    await queryRunner.query(`
            CREATE TABLE "game" (
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
                "type" varchar NOT NULL DEFAULT ('UNDETECTABLE'),
                CONSTRAINT "UQ_7770cb331bdc54951bb9046fa9d" UNIQUE ("file_path")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "game"(
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
            FROM "temporary_game"
        `);
    await queryRunner.query(`
            DROP TABLE "temporary_game"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_0152ed47a9e8963b5aaceb51e7" ON "game" ("title")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_352a30652cd352f552fef73dec" ON "game" ("id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_0152ed47a9e8963b5aaceb51e7"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_352a30652cd352f552fef73dec"
        `);
    await queryRunner.query(`
            ALTER TABLE "game"
                RENAME TO "temporary_game"
        `);
    await queryRunner.query(`
            CREATE TABLE "game" (
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
                "type" varchar NOT NULL DEFAULT ('UNDETECTABLE'),
                CONSTRAINT "UQ_7770cb331bdc54951bb9046fa9d" UNIQUE ("file_path"),
                CONSTRAINT "FK_52b4bb990c5a5fe76c6d675c002" FOREIGN KEY ("box_image_id") REFERENCES "image" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
    await queryRunner.query(`
            INSERT INTO "game"(
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
            FROM "temporary_game"
        `);
    await queryRunner.query(`
            DROP TABLE "temporary_game"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_0152ed47a9e8963b5aaceb51e7" ON "game" ("title")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_352a30652cd352f552fef73dec" ON "game" ("id")
        `);
  }
}
