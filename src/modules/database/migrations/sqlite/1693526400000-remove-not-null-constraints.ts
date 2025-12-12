import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveNotNullConstraints1693526400000 implements MigrationInterface {
  name = "RemoveNotNullConstraints1693526400000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "temporary_gamevault_user" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "username" varchar NOT NULL,
                "password" varchar NOT NULL,
                "email" varchar NOT NULL,
                "first_name" varchar NOT NULL,
                "last_name" varchar NOT NULL,
                "activated" boolean NOT NULL DEFAULT (0),
                "role" varchar CHECK("role" IN ('0', '1', '2', '3')) NOT NULL DEFAULT (1),
                "profile_picture_id" integer,
                "background_image_id" integer,
                CONSTRAINT "UQ_ad2fda40ce941655c838fb1435f" UNIQUE ("username"),
                CONSTRAINT "UQ_d0e7d50057240e5752a2c303ffb" UNIQUE ("email")
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
            DROP INDEX "IDX_e0626148aee5829fd312447001"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_f03b89f33671086e6733828e79"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_image" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "source" varchar NOT NULL,
                "path" varchar,
                "media_type" varchar,
                CONSTRAINT "UQ_f03b89f33671086e6733828e79c" UNIQUE ("path")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_image"(
                    "id",
                    "created_at",
                    "updated_at",
                    "deleted_at",
                    "entity_version",
                    "source",
                    "path",
                    "media_type"
                )
            SELECT "id",
                "created_at",
                "updated_at",
                "deleted_at",
                "entity_version",
                "source",
                "path",
                "media_type"
            FROM "image"
        `);
    await queryRunner.query(`
            DROP TABLE "image"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_image"
                RENAME TO "image"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_e0626148aee5829fd312447001" ON "image" ("source")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_f03b89f33671086e6733828e79" ON "image" ("path")
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
                "type" varchar NOT NULL DEFAULT ('UNDETECTABLE'),
                CONSTRAINT "UQ_7770cb331bdc54951bb9046fa9d" UNIQUE ("file_path"),
                CONSTRAINT "FK_0e88ada3f37f7cabfb6d59ed0d0" FOREIGN KEY ("background_image_id") REFERENCES "image" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_52b4bb990c5a5fe76c6d675c002" FOREIGN KEY ("box_image_id") REFERENCES "image" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
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
            CREATE INDEX "IDX_0152ed47a9e8963b5aaceb51e7" ON "game" ("title")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_e0626148aee5829fd312447001"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_f03b89f33671086e6733828e79"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_image" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "source" varchar,
                "path" varchar,
                "media_type" varchar,
                CONSTRAINT "UQ_f03b89f33671086e6733828e79c" UNIQUE ("path")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_image"(
                    "id",
                    "created_at",
                    "updated_at",
                    "deleted_at",
                    "entity_version",
                    "source",
                    "path",
                    "media_type"
                )
            SELECT "id",
                "created_at",
                "updated_at",
                "deleted_at",
                "entity_version",
                "source",
                "path",
                "media_type"
            FROM "image"
        `);
    await queryRunner.query(`
            DROP TABLE "image"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_image"
                RENAME TO "image"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_e0626148aee5829fd312447001" ON "image" ("source")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_f03b89f33671086e6733828e79" ON "image" ("path")
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
                "email" varchar NOT NULL,
                "first_name" varchar NOT NULL,
                "last_name" varchar NOT NULL,
                "activated" boolean NOT NULL DEFAULT (0),
                "role" varchar CHECK("role" IN ('0', '1', '2', '3')) NOT NULL DEFAULT (1),
                "profile_picture_id" integer,
                "background_image_id" integer,
                CONSTRAINT "UQ_ad2fda40ce941655c838fb1435f" UNIQUE ("username"),
                CONSTRAINT "UQ_d0e7d50057240e5752a2c303ffb" UNIQUE ("email")
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
                CONSTRAINT "FK_0e88ada3f37f7cabfb6d59ed0d0" FOREIGN KEY ("background_image_id") REFERENCES "image" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_52b4bb990c5a5fe76c6d675c002" FOREIGN KEY ("box_image_id") REFERENCES "image" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
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
            CREATE INDEX "IDX_0152ed47a9e8963b5aaceb51e7" ON "game" ("title")
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
                "email" varchar NOT NULL,
                "first_name" varchar NOT NULL,
                "last_name" varchar NOT NULL,
                "activated" boolean NOT NULL DEFAULT (0),
                "role" varchar CHECK("role" IN ('0', '1', '2', '3')) NOT NULL DEFAULT (1),
                "profile_picture_id" integer,
                "background_image_id" integer,
                CONSTRAINT "UQ_ad2fda40ce941655c838fb1435f" UNIQUE ("username"),
                CONSTRAINT "UQ_d0e7d50057240e5752a2c303ffb" UNIQUE ("email"),
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
            FROM "gamevault_user"
        `);
    await queryRunner.query(`
            DROP TABLE "gamevault_user"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_gamevault_user"
                RENAME TO "gamevault_user"
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
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
                "email" varchar NOT NULL,
                "first_name" varchar NOT NULL,
                "last_name" varchar NOT NULL,
                "activated" boolean NOT NULL DEFAULT (0),
                "role" varchar CHECK("role" IN ('0', '1', '2', '3')) NOT NULL DEFAULT (1),
                "profile_picture_id" integer,
                "background_image_id" integer,
                CONSTRAINT "UQ_ad2fda40ce941655c838fb1435f" UNIQUE ("username"),
                CONSTRAINT "UQ_d0e7d50057240e5752a2c303ffb" UNIQUE ("email")
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
            FROM "temporary_gamevault_user"
        `);
    await queryRunner.query(`
            DROP TABLE "temporary_gamevault_user"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_0152ed47a9e8963b5aaceb51e7"
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
                "type" varchar NOT NULL DEFAULT ('UNDETECTABLE'),
                CONSTRAINT "UQ_7770cb331bdc54951bb9046fa9d" UNIQUE ("file_path"),
                CONSTRAINT "FK_0e88ada3f37f7cabfb6d59ed0d0" FOREIGN KEY ("background_image_id") REFERENCES "image" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
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
                "email" varchar NOT NULL,
                "first_name" varchar NOT NULL,
                "last_name" varchar NOT NULL,
                "activated" boolean NOT NULL DEFAULT (0),
                "role" varchar CHECK("role" IN ('0', '1', '2', '3')) NOT NULL DEFAULT (1),
                "profile_picture_id" integer,
                "background_image_id" integer,
                CONSTRAINT "UQ_ad2fda40ce941655c838fb1435f" UNIQUE ("username"),
                CONSTRAINT "UQ_d0e7d50057240e5752a2c303ffb" UNIQUE ("email")
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
            FROM "temporary_gamevault_user"
        `);
    await queryRunner.query(`
            DROP TABLE "temporary_gamevault_user"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_f03b89f33671086e6733828e79"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_e0626148aee5829fd312447001"
        `);
    await queryRunner.query(`
            ALTER TABLE "image"
                RENAME TO "temporary_image"
        `);
    await queryRunner.query(`
            CREATE TABLE "image" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "source" varchar NOT NULL,
                "path" varchar,
                "media_type" varchar,
                CONSTRAINT "UQ_f03b89f33671086e6733828e79c" UNIQUE ("path")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "image"(
                    "id",
                    "created_at",
                    "updated_at",
                    "deleted_at",
                    "entity_version",
                    "source",
                    "path",
                    "media_type"
                )
            SELECT "id",
                "created_at",
                "updated_at",
                "deleted_at",
                "entity_version",
                "source",
                "path",
                "media_type"
            FROM "temporary_image"
        `);
    await queryRunner.query(`
            DROP TABLE "temporary_image"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_f03b89f33671086e6733828e79" ON "image" ("path")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_e0626148aee5829fd312447001" ON "image" ("source")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_0152ed47a9e8963b5aaceb51e7"
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
                "type" varchar NOT NULL DEFAULT ('UNDETECTABLE'),
                CONSTRAINT "UQ_7770cb331bdc54951bb9046fa9d" UNIQUE ("file_path"),
                CONSTRAINT "FK_0e88ada3f37f7cabfb6d59ed0d0" FOREIGN KEY ("background_image_id") REFERENCES "image" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
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
            DROP INDEX "IDX_f03b89f33671086e6733828e79"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_e0626148aee5829fd312447001"
        `);
    await queryRunner.query(`
            ALTER TABLE "image"
                RENAME TO "temporary_image"
        `);
    await queryRunner.query(`
            CREATE TABLE "image" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "source" varchar NOT NULL,
                "path" varchar,
                "media_type" varchar,
                CONSTRAINT "UQ_f03b89f33671086e6733828e79c" UNIQUE ("path")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "image"(
                    "id",
                    "created_at",
                    "updated_at",
                    "deleted_at",
                    "entity_version",
                    "source",
                    "path",
                    "media_type"
                )
            SELECT "id",
                "created_at",
                "updated_at",
                "deleted_at",
                "entity_version",
                "source",
                "path",
                "media_type"
            FROM "temporary_image"
        `);
    await queryRunner.query(`
            DROP TABLE "temporary_image"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_f03b89f33671086e6733828e79" ON "image" ("path")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_e0626148aee5829fd312447001" ON "image" ("source")
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
                "email" varchar NOT NULL,
                "first_name" varchar NOT NULL,
                "last_name" varchar NOT NULL,
                "activated" boolean NOT NULL DEFAULT (0),
                "role" varchar CHECK("role" IN ('0', '1', '2', '3')) NOT NULL DEFAULT (1),
                "profile_picture_id" integer,
                "background_image_id" integer,
                CONSTRAINT "UQ_ad2fda40ce941655c838fb1435f" UNIQUE ("username"),
                CONSTRAINT "UQ_d0e7d50057240e5752a2c303ffb" UNIQUE ("email"),
                CONSTRAINT "FK_4a135b04a00cf3e3653cd585334" FOREIGN KEY ("background_image_id") REFERENCES "image" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_3a56876605551fa369cbcd09c41" FOREIGN KEY ("profile_picture_id") REFERENCES "image" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
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
            FROM "temporary_gamevault_user"
        `);
    await queryRunner.query(`
            DROP TABLE "temporary_gamevault_user"
        `);
  }
}
