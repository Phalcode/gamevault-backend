import { Logger } from "@nestjs/common";
import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1689521511730 implements MigrationInterface {
  private readonly logger = new Logger(Init1689521511730.name);
  name = "Init1689521511730";

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (
      (await queryRunner.hasTable("crackpipe_user")) &&
      (await queryRunner.hasTable("developer")) &&
      (await queryRunner.hasTable("game")) &&
      (await queryRunner.hasTable("genre")) &&
      (await queryRunner.hasTable("image")) &&
      (await queryRunner.hasTable("progress")) &&
      (await queryRunner.hasTable("publisher")) &&
      (await queryRunner.hasTable("store")) &&
      (await queryRunner.hasTable("tag"))
    ) {
      this.logger.log("Database already exists. Skipping initial Migration.");
      return;
    }

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
                    "background_image_id"
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
                "background_image_id"
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
            CREATE TABLE "temporary_progress" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "minutes_played" integer NOT NULL DEFAULT (0),
                "state" varchar NOT NULL DEFAULT ('UNPLAYED'),
                "last_played_at" datetime,
                "user_id" integer,
                "game_id" integer
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
            CREATE TABLE "temporary_crackpipe_user" (
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
                CONSTRAINT "UQ_d0e7d50057240e5752a2c303ffb" UNIQUE ("email"),
                CONSTRAINT "UQ_ad2fda40ce941655c838fb1435f" UNIQUE ("username")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_crackpipe_user"(
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
            FROM "crackpipe_user"
        `);
    await queryRunner.query(`
            DROP TABLE "crackpipe_user"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_crackpipe_user"
                RENAME TO "crackpipe_user"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_d7a940ba0d1d6af4fa6532ffd4"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_0161ee9a5742c8ab26f481cace"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_game_publishers_publisher" (
                "game_id" integer NOT NULL,
                "publisher_id" integer NOT NULL,
                PRIMARY KEY ("game_id", "publisher_id")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_game_publishers_publisher"("game_id", "publisher_id")
            SELECT "game_id",
                "publisher_id"
            FROM "game_publishers_publisher"
        `);
    await queryRunner.query(`
            DROP TABLE "game_publishers_publisher"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_game_publishers_publisher"
                RENAME TO "game_publishers_publisher"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_d7a940ba0d1d6af4fa6532ffd4" ON "game_publishers_publisher" ("publisher_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_0161ee9a5742c8ab26f481cace" ON "game_publishers_publisher" ("game_id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_c030afb1f3be8ccb7f5761588f"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_f5bea91f3185bcf27a60a83377"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_game_developers_developer" (
                "game_id" integer NOT NULL,
                "developer_id" integer NOT NULL,
                PRIMARY KEY ("game_id", "developer_id")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_game_developers_developer"("game_id", "developer_id")
            SELECT "game_id",
                "developer_id"
            FROM "game_developers_developer"
        `);
    await queryRunner.query(`
            DROP TABLE "game_developers_developer"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_game_developers_developer"
                RENAME TO "game_developers_developer"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_c030afb1f3be8ccb7f5761588f" ON "game_developers_developer" ("developer_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_f5bea91f3185bcf27a60a83377" ON "game_developers_developer" ("game_id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_2ab30a2cbcda7798a4cc0ea6d6"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_8f769182cc4e5958b3b57ec14a"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_game_stores_store" (
                "game_id" integer NOT NULL,
                "store_id" integer NOT NULL,
                PRIMARY KEY ("game_id", "store_id")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_game_stores_store"("game_id", "store_id")
            SELECT "game_id",
                "store_id"
            FROM "game_stores_store"
        `);
    await queryRunner.query(`
            DROP TABLE "game_stores_store"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_game_stores_store"
                RENAME TO "game_stores_store"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_2ab30a2cbcda7798a4cc0ea6d6" ON "game_stores_store" ("store_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_8f769182cc4e5958b3b57ec14a" ON "game_stores_store" ("game_id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_d12253f0cbce01f030a9ced11d"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_6366e7093c3571f85f1b5ffd4f"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_game_tags_tag" (
                "game_id" integer NOT NULL,
                "tag_id" integer NOT NULL,
                PRIMARY KEY ("game_id", "tag_id")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_game_tags_tag"("game_id", "tag_id")
            SELECT "game_id",
                "tag_id"
            FROM "game_tags_tag"
        `);
    await queryRunner.query(`
            DROP TABLE "game_tags_tag"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_game_tags_tag"
                RENAME TO "game_tags_tag"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_d12253f0cbce01f030a9ced11d" ON "game_tags_tag" ("tag_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_6366e7093c3571f85f1b5ffd4f" ON "game_tags_tag" ("game_id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_3549c373e01bdee0f24ed47649"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_2ae1c183b1ca4b831efcb9e673"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_game_genres_genre" (
                "game_id" integer NOT NULL,
                "genre_id" integer NOT NULL,
                PRIMARY KEY ("game_id", "genre_id")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_game_genres_genre"("game_id", "genre_id")
            SELECT "game_id",
                "genre_id"
            FROM "game_genres_genre"
        `);
    await queryRunner.query(`
            DROP TABLE "game_genres_genre"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_game_genres_genre"
                RENAME TO "game_genres_genre"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_3549c373e01bdee0f24ed47649" ON "game_genres_genre" ("genre_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_2ae1c183b1ca4b831efcb9e673" ON "game_genres_genre" ("game_id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_d7a940ba0d1d6af4fa6532ffd4"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_0161ee9a5742c8ab26f481cace"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_c030afb1f3be8ccb7f5761588f"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_f5bea91f3185bcf27a60a83377"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_2ab30a2cbcda7798a4cc0ea6d6"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_8f769182cc4e5958b3b57ec14a"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_d12253f0cbce01f030a9ced11d"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_6366e7093c3571f85f1b5ffd4f"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_3549c373e01bdee0f24ed47649"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_2ae1c183b1ca4b831efcb9e673"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_f03b89f33671086e6733828e79"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_e0626148aee5829fd312447001"
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
                "last_accessed_at" datetime NOT NULL,
                CONSTRAINT "UQ_f03b89f33671086e6733828e79c" UNIQUE ("path"),
                CONSTRAINT "UQ_e0626148aee5829fd312447001a" UNIQUE ("source")
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
                    "media_type",
                    "last_accessed_at"
                )
            SELECT "id",
                "created_at",
                "updated_at",
                "deleted_at",
                "entity_version",
                "source",
                "path",
                "mediaType",
                "last_accessed_at"
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
            CREATE INDEX "IDX_f03b89f33671086e6733828e79" ON "image" ("path")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_e0626148aee5829fd312447001" ON "image" ("source")
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
                CONSTRAINT "UQ_4c835305e86b28e416cfe13dace" UNIQUE ("username"),
                CONSTRAINT "UQ_284621e91b3886db5ebd901384a" UNIQUE ("email")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_crackpipe_user" (
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
                CONSTRAINT "UQ_d0e7d50057240e5752a2c303ffb" UNIQUE ("email"),
                CONSTRAINT "UQ_ad2fda40ce941655c838fb1435f" UNIQUE ("username")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_crackpipe_user"(
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
            FROM "crackpipe_user"
        `);
    await queryRunner.query(`
            DROP TABLE "crackpipe_user"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_crackpipe_user"
                RENAME TO "crackpipe_user"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_23c7fd8d5ba629387c0ee3beef" ON "game_publishers_publisher" ("game_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_9b62bde5e60ae224ece6212139" ON "game_publishers_publisher" ("publisher_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_af55594242fcb08c34a7169458" ON "game_developers_developer" ("game_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_086b3f0af45ee3a586f65e279d" ON "game_developers_developer" ("developer_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_a7f9028303f115fd99e8fa0704" ON "game_stores_store" ("game_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_6b179f1104e52e940718686e0b" ON "game_stores_store" ("store_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_0c2a0973b06e6530bdf70522f0" ON "game_tags_tag" ("game_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_24ae8c150d4a878e2260e52624" ON "game_tags_tag" ("tag_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_76c0e2a6b1c36a0ed08745b4cb" ON "game_genres_genre" ("game_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_ea273d6b68ec2073a7af5d7d28" ON "game_genres_genre" ("genre_id")
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
                CONSTRAINT "UQ_7770cb331bdc54951bb9046fa9d" UNIQUE ("file_path"),
                CONSTRAINT "FK_52b4bb990c5a5fe76c6d675c002" FOREIGN KEY ("box_image_id") REFERENCES "image" ("id") ON DELETE
                SET NULL ON UPDATE NO ACTION,
                    CONSTRAINT "FK_0e88ada3f37f7cabfb6d59ed0d0" FOREIGN KEY ("background_image_id") REFERENCES "image" ("id") ON DELETE
                SET NULL ON UPDATE NO ACTION
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
                    "background_image_id"
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
                "background_image_id"
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
            CREATE TABLE "temporary_progress" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "minutes_played" integer NOT NULL DEFAULT (0),
                "state" varchar NOT NULL DEFAULT ('UNPLAYED'),
                "last_played_at" datetime,
                "user_id" integer,
                "game_id" integer,
                CONSTRAINT "FK_ddcaca3a9db9d77105d51c02c24" FOREIGN KEY ("user_id") REFERENCES "crackpipe_user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT "FK_feaddf361921db1df3a6fe3965a" FOREIGN KEY ("game_id") REFERENCES "game" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
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
            CREATE TABLE "temporary_crackpipe_user" (
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
                CONSTRAINT "UQ_d0e7d50057240e5752a2c303ffb" UNIQUE ("email"),
                CONSTRAINT "UQ_ad2fda40ce941655c838fb1435f" UNIQUE ("username"),
                CONSTRAINT "FK_3a56876605551fa369cbcd09c41" FOREIGN KEY ("profile_picture_id") REFERENCES "image" ("id") ON DELETE
                SET NULL ON UPDATE NO ACTION,
                    CONSTRAINT "FK_4a135b04a00cf3e3653cd585334" FOREIGN KEY ("background_image_id") REFERENCES "image" ("id") ON DELETE
                SET NULL ON UPDATE NO ACTION
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_crackpipe_user"(
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
            FROM "crackpipe_user"
        `);
    await queryRunner.query(`
            DROP TABLE "crackpipe_user"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_crackpipe_user"
                RENAME TO "crackpipe_user"
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
                CONSTRAINT "UQ_4c835305e86b28e416cfe13dace" UNIQUE ("username"),
                CONSTRAINT "UQ_284621e91b3886db5ebd901384a" UNIQUE ("email"),
                CONSTRAINT "FK_c1779b9b22212754248aa404bad" FOREIGN KEY ("profile_picture_id") REFERENCES "image" ("id") ON DELETE
                SET NULL ON UPDATE NO ACTION,
                    CONSTRAINT "FK_4b83e27ed50c1e183a69fceef68" FOREIGN KEY ("background_image_id") REFERENCES "image" ("id") ON DELETE
                SET NULL ON UPDATE NO ACTION
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
            DROP INDEX "IDX_23c7fd8d5ba629387c0ee3beef"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_9b62bde5e60ae224ece6212139"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_game_publishers_publisher" (
                "game_id" integer NOT NULL,
                "publisher_id" integer NOT NULL,
                CONSTRAINT "FK_23c7fd8d5ba629387c0ee3beefe" FOREIGN KEY ("game_id") REFERENCES "game" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT "FK_9b62bde5e60ae224ece62121394" FOREIGN KEY ("publisher_id") REFERENCES "publisher" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                PRIMARY KEY ("game_id", "publisher_id")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_game_publishers_publisher"("game_id", "publisher_id")
            SELECT "game_id",
                "publisher_id"
            FROM "game_publishers_publisher"
        `);
    await queryRunner.query(`
            DROP TABLE "game_publishers_publisher"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_game_publishers_publisher"
                RENAME TO "game_publishers_publisher"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_23c7fd8d5ba629387c0ee3beef" ON "game_publishers_publisher" ("game_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_9b62bde5e60ae224ece6212139" ON "game_publishers_publisher" ("publisher_id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_af55594242fcb08c34a7169458"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_086b3f0af45ee3a586f65e279d"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_game_developers_developer" (
                "game_id" integer NOT NULL,
                "developer_id" integer NOT NULL,
                CONSTRAINT "FK_af55594242fcb08c34a7169458e" FOREIGN KEY ("game_id") REFERENCES "game" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT "FK_086b3f0af45ee3a586f65e279da" FOREIGN KEY ("developer_id") REFERENCES "developer" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                PRIMARY KEY ("game_id", "developer_id")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_game_developers_developer"("game_id", "developer_id")
            SELECT "game_id",
                "developer_id"
            FROM "game_developers_developer"
        `);
    await queryRunner.query(`
            DROP TABLE "game_developers_developer"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_game_developers_developer"
                RENAME TO "game_developers_developer"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_af55594242fcb08c34a7169458" ON "game_developers_developer" ("game_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_086b3f0af45ee3a586f65e279d" ON "game_developers_developer" ("developer_id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_a7f9028303f115fd99e8fa0704"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_6b179f1104e52e940718686e0b"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_game_stores_store" (
                "game_id" integer NOT NULL,
                "store_id" integer NOT NULL,
                CONSTRAINT "FK_a7f9028303f115fd99e8fa07041" FOREIGN KEY ("game_id") REFERENCES "game" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT "FK_6b179f1104e52e940718686e0b4" FOREIGN KEY ("store_id") REFERENCES "store" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                PRIMARY KEY ("game_id", "store_id")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_game_stores_store"("game_id", "store_id")
            SELECT "game_id",
                "store_id"
            FROM "game_stores_store"
        `);
    await queryRunner.query(`
            DROP TABLE "game_stores_store"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_game_stores_store"
                RENAME TO "game_stores_store"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_a7f9028303f115fd99e8fa0704" ON "game_stores_store" ("game_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_6b179f1104e52e940718686e0b" ON "game_stores_store" ("store_id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_0c2a0973b06e6530bdf70522f0"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_24ae8c150d4a878e2260e52624"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_game_tags_tag" (
                "game_id" integer NOT NULL,
                "tag_id" integer NOT NULL,
                CONSTRAINT "FK_0c2a0973b06e6530bdf70522f0e" FOREIGN KEY ("game_id") REFERENCES "game" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT "FK_24ae8c150d4a878e2260e526240" FOREIGN KEY ("tag_id") REFERENCES "tag" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                PRIMARY KEY ("game_id", "tag_id")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_game_tags_tag"("game_id", "tag_id")
            SELECT "game_id",
                "tag_id"
            FROM "game_tags_tag"
        `);
    await queryRunner.query(`
            DROP TABLE "game_tags_tag"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_game_tags_tag"
                RENAME TO "game_tags_tag"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_0c2a0973b06e6530bdf70522f0" ON "game_tags_tag" ("game_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_24ae8c150d4a878e2260e52624" ON "game_tags_tag" ("tag_id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_76c0e2a6b1c36a0ed08745b4cb"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_ea273d6b68ec2073a7af5d7d28"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_game_genres_genre" (
                "game_id" integer NOT NULL,
                "genre_id" integer NOT NULL,
                CONSTRAINT "FK_76c0e2a6b1c36a0ed08745b4cb1" FOREIGN KEY ("game_id") REFERENCES "game" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT "FK_ea273d6b68ec2073a7af5d7d281" FOREIGN KEY ("genre_id") REFERENCES "genre" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                PRIMARY KEY ("game_id", "genre_id")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_game_genres_genre"("game_id", "genre_id")
            SELECT "game_id",
                "genre_id"
            FROM "game_genres_genre"
        `);
    await queryRunner.query(`
            DROP TABLE "game_genres_genre"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_game_genres_genre"
                RENAME TO "game_genres_genre"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_76c0e2a6b1c36a0ed08745b4cb" ON "game_genres_genre" ("game_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_ea273d6b68ec2073a7af5d7d28" ON "game_genres_genre" ("genre_id")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "IDX_ea273d6b68ec2073a7af5d7d28"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_76c0e2a6b1c36a0ed08745b4cb"
        `);
    await queryRunner.query(`
            ALTER TABLE "game_genres_genre"
                RENAME TO "temporary_game_genres_genre"
        `);
    await queryRunner.query(`
            CREATE TABLE "game_genres_genre" (
                "game_id" integer NOT NULL,
                "genre_id" integer NOT NULL,
                PRIMARY KEY ("game_id", "genre_id")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "game_genres_genre"("game_id", "genre_id")
            SELECT "game_id",
                "genre_id"
            FROM "temporary_game_genres_genre"
        `);
    await queryRunner.query(`
            DROP TABLE "temporary_game_genres_genre"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_ea273d6b68ec2073a7af5d7d28" ON "game_genres_genre" ("genre_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_76c0e2a6b1c36a0ed08745b4cb" ON "game_genres_genre" ("game_id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_24ae8c150d4a878e2260e52624"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_0c2a0973b06e6530bdf70522f0"
        `);
    await queryRunner.query(`
            ALTER TABLE "game_tags_tag"
                RENAME TO "temporary_game_tags_tag"
        `);
    await queryRunner.query(`
            CREATE TABLE "game_tags_tag" (
                "game_id" integer NOT NULL,
                "tag_id" integer NOT NULL,
                PRIMARY KEY ("game_id", "tag_id")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "game_tags_tag"("game_id", "tag_id")
            SELECT "game_id",
                "tag_id"
            FROM "temporary_game_tags_tag"
        `);
    await queryRunner.query(`
            DROP TABLE "temporary_game_tags_tag"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_24ae8c150d4a878e2260e52624" ON "game_tags_tag" ("tag_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_0c2a0973b06e6530bdf70522f0" ON "game_tags_tag" ("game_id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_6b179f1104e52e940718686e0b"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_a7f9028303f115fd99e8fa0704"
        `);
    await queryRunner.query(`
            ALTER TABLE "game_stores_store"
                RENAME TO "temporary_game_stores_store"
        `);
    await queryRunner.query(`
            CREATE TABLE "game_stores_store" (
                "game_id" integer NOT NULL,
                "store_id" integer NOT NULL,
                PRIMARY KEY ("game_id", "store_id")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "game_stores_store"("game_id", "store_id")
            SELECT "game_id",
                "store_id"
            FROM "temporary_game_stores_store"
        `);
    await queryRunner.query(`
            DROP TABLE "temporary_game_stores_store"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_6b179f1104e52e940718686e0b" ON "game_stores_store" ("store_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_a7f9028303f115fd99e8fa0704" ON "game_stores_store" ("game_id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_086b3f0af45ee3a586f65e279d"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_af55594242fcb08c34a7169458"
        `);
    await queryRunner.query(`
            ALTER TABLE "game_developers_developer"
                RENAME TO "temporary_game_developers_developer"
        `);
    await queryRunner.query(`
            CREATE TABLE "game_developers_developer" (
                "game_id" integer NOT NULL,
                "developer_id" integer NOT NULL,
                PRIMARY KEY ("game_id", "developer_id")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "game_developers_developer"("game_id", "developer_id")
            SELECT "game_id",
                "developer_id"
            FROM "temporary_game_developers_developer"
        `);
    await queryRunner.query(`
            DROP TABLE "temporary_game_developers_developer"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_086b3f0af45ee3a586f65e279d" ON "game_developers_developer" ("developer_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_af55594242fcb08c34a7169458" ON "game_developers_developer" ("game_id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_9b62bde5e60ae224ece6212139"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_23c7fd8d5ba629387c0ee3beef"
        `);
    await queryRunner.query(`
            ALTER TABLE "game_publishers_publisher"
                RENAME TO "temporary_game_publishers_publisher"
        `);
    await queryRunner.query(`
            CREATE TABLE "game_publishers_publisher" (
                "game_id" integer NOT NULL,
                "publisher_id" integer NOT NULL,
                PRIMARY KEY ("game_id", "publisher_id")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "game_publishers_publisher"("game_id", "publisher_id")
            SELECT "game_id",
                "publisher_id"
            FROM "temporary_game_publishers_publisher"
        `);
    await queryRunner.query(`
            DROP TABLE "temporary_game_publishers_publisher"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_9b62bde5e60ae224ece6212139" ON "game_publishers_publisher" ("publisher_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_23c7fd8d5ba629387c0ee3beef" ON "game_publishers_publisher" ("game_id")
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
                CONSTRAINT "UQ_4c835305e86b28e416cfe13dace" UNIQUE ("username"),
                CONSTRAINT "UQ_284621e91b3886db5ebd901384a" UNIQUE ("email")
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
            ALTER TABLE "crackpipe_user"
                RENAME TO "temporary_crackpipe_user"
        `);
    await queryRunner.query(`
            CREATE TABLE "crackpipe_user" (
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
                CONSTRAINT "UQ_d0e7d50057240e5752a2c303ffb" UNIQUE ("email"),
                CONSTRAINT "UQ_ad2fda40ce941655c838fb1435f" UNIQUE ("username")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "crackpipe_user"(
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
            FROM "temporary_crackpipe_user"
        `);
    await queryRunner.query(`
            DROP TABLE "temporary_crackpipe_user"
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
                "state" varchar NOT NULL DEFAULT ('UNPLAYED'),
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
                    "background_image_id"
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
                "background_image_id"
            FROM "temporary_game"
        `);
    await queryRunner.query(`
            DROP TABLE "temporary_game"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_0152ed47a9e8963b5aaceb51e7" ON "game" ("title")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_ea273d6b68ec2073a7af5d7d28"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_76c0e2a6b1c36a0ed08745b4cb"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_24ae8c150d4a878e2260e52624"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_0c2a0973b06e6530bdf70522f0"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_6b179f1104e52e940718686e0b"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_a7f9028303f115fd99e8fa0704"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_086b3f0af45ee3a586f65e279d"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_af55594242fcb08c34a7169458"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_9b62bde5e60ae224ece6212139"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_23c7fd8d5ba629387c0ee3beef"
        `);
    await queryRunner.query(`
            ALTER TABLE "crackpipe_user"
                RENAME TO "temporary_crackpipe_user"
        `);
    await queryRunner.query(`
            CREATE TABLE "crackpipe_user" (
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
                CONSTRAINT "UQ_d0e7d50057240e5752a2c303ffb" UNIQUE ("email"),
                CONSTRAINT "UQ_ad2fda40ce941655c838fb1435f" UNIQUE ("username")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "crackpipe_user"(
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
            FROM "temporary_crackpipe_user"
        `);
    await queryRunner.query(`
            DROP TABLE "temporary_crackpipe_user"
        `);
    await queryRunner.query(`
            DROP TABLE "gamevault_user"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_e0626148aee5829fd312447001"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_f03b89f33671086e6733828e79"
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
                "mediaType" varchar,
                "last_accessed_at" datetime NOT NULL,
                CONSTRAINT "UQ_f03b89f33671086e6733828e79c" UNIQUE ("path"),
                CONSTRAINT "UQ_e0626148aee5829fd312447001a" UNIQUE ("source")
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
                    "mediaType",
                    "last_accessed_at"
                )
            SELECT "id",
                "created_at",
                "updated_at",
                "deleted_at",
                "entity_version",
                "source",
                "path",
                "media_type",
                "last_accessed_at"
            FROM "temporary_image"
        `);
    await queryRunner.query(`
            DROP TABLE "temporary_image"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_e0626148aee5829fd312447001" ON "image" ("source")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_f03b89f33671086e6733828e79" ON "image" ("path")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_2ae1c183b1ca4b831efcb9e673" ON "game_genres_genre" ("game_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_3549c373e01bdee0f24ed47649" ON "game_genres_genre" ("genre_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_6366e7093c3571f85f1b5ffd4f" ON "game_tags_tag" ("game_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_d12253f0cbce01f030a9ced11d" ON "game_tags_tag" ("tag_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_8f769182cc4e5958b3b57ec14a" ON "game_stores_store" ("game_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_2ab30a2cbcda7798a4cc0ea6d6" ON "game_stores_store" ("store_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_f5bea91f3185bcf27a60a83377" ON "game_developers_developer" ("game_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_c030afb1f3be8ccb7f5761588f" ON "game_developers_developer" ("developer_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_0161ee9a5742c8ab26f481cace" ON "game_publishers_publisher" ("game_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_d7a940ba0d1d6af4fa6532ffd4" ON "game_publishers_publisher" ("publisher_id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_2ae1c183b1ca4b831efcb9e673"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_3549c373e01bdee0f24ed47649"
        `);
    await queryRunner.query(`
            ALTER TABLE "game_genres_genre"
                RENAME TO "temporary_game_genres_genre"
        `);
    await queryRunner.query(`
            CREATE TABLE "game_genres_genre" (
                "game_id" integer NOT NULL,
                "genre_id" integer NOT NULL,
                CONSTRAINT "FK_3549c373e01bdee0f24ed476497" FOREIGN KEY ("genre_id") REFERENCES "genre" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT "FK_2ae1c183b1ca4b831efcb9e673d" FOREIGN KEY ("game_id") REFERENCES "game" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
                PRIMARY KEY ("game_id", "genre_id")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "game_genres_genre"("game_id", "genre_id")
            SELECT "game_id",
                "genre_id"
            FROM "temporary_game_genres_genre"
        `);
    await queryRunner.query(`
            DROP TABLE "temporary_game_genres_genre"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_2ae1c183b1ca4b831efcb9e673" ON "game_genres_genre" ("game_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_3549c373e01bdee0f24ed47649" ON "game_genres_genre" ("genre_id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_6366e7093c3571f85f1b5ffd4f"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_d12253f0cbce01f030a9ced11d"
        `);
    await queryRunner.query(`
            ALTER TABLE "game_tags_tag"
                RENAME TO "temporary_game_tags_tag"
        `);
    await queryRunner.query(`
            CREATE TABLE "game_tags_tag" (
                "game_id" integer NOT NULL,
                "tag_id" integer NOT NULL,
                CONSTRAINT "FK_d12253f0cbce01f030a9ced11d6" FOREIGN KEY ("tag_id") REFERENCES "tag" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT "FK_6366e7093c3571f85f1b5ffd4f1" FOREIGN KEY ("game_id") REFERENCES "game" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
                PRIMARY KEY ("game_id", "tag_id")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "game_tags_tag"("game_id", "tag_id")
            SELECT "game_id",
                "tag_id"
            FROM "temporary_game_tags_tag"
        `);
    await queryRunner.query(`
            DROP TABLE "temporary_game_tags_tag"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_6366e7093c3571f85f1b5ffd4f" ON "game_tags_tag" ("game_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_d12253f0cbce01f030a9ced11d" ON "game_tags_tag" ("tag_id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_8f769182cc4e5958b3b57ec14a"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_2ab30a2cbcda7798a4cc0ea6d6"
        `);
    await queryRunner.query(`
            ALTER TABLE "game_stores_store"
                RENAME TO "temporary_game_stores_store"
        `);
    await queryRunner.query(`
            CREATE TABLE "game_stores_store" (
                "game_id" integer NOT NULL,
                "store_id" integer NOT NULL,
                CONSTRAINT "FK_2ab30a2cbcda7798a4cc0ea6d60" FOREIGN KEY ("store_id") REFERENCES "store" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT "FK_8f769182cc4e5958b3b57ec14a0" FOREIGN KEY ("game_id") REFERENCES "game" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
                PRIMARY KEY ("game_id", "store_id")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "game_stores_store"("game_id", "store_id")
            SELECT "game_id",
                "store_id"
            FROM "temporary_game_stores_store"
        `);
    await queryRunner.query(`
            DROP TABLE "temporary_game_stores_store"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_8f769182cc4e5958b3b57ec14a" ON "game_stores_store" ("game_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_2ab30a2cbcda7798a4cc0ea6d6" ON "game_stores_store" ("store_id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_f5bea91f3185bcf27a60a83377"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_c030afb1f3be8ccb7f5761588f"
        `);
    await queryRunner.query(`
            ALTER TABLE "game_developers_developer"
                RENAME TO "temporary_game_developers_developer"
        `);
    await queryRunner.query(`
            CREATE TABLE "game_developers_developer" (
                "game_id" integer NOT NULL,
                "developer_id" integer NOT NULL,
                CONSTRAINT "FK_c030afb1f3be8ccb7f5761588ff" FOREIGN KEY ("developer_id") REFERENCES "developer" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT "FK_f5bea91f3185bcf27a60a833772" FOREIGN KEY ("game_id") REFERENCES "game" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
                PRIMARY KEY ("game_id", "developer_id")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "game_developers_developer"("game_id", "developer_id")
            SELECT "game_id",
                "developer_id"
            FROM "temporary_game_developers_developer"
        `);
    await queryRunner.query(`
            DROP TABLE "temporary_game_developers_developer"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_f5bea91f3185bcf27a60a83377" ON "game_developers_developer" ("game_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_c030afb1f3be8ccb7f5761588f" ON "game_developers_developer" ("developer_id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_0161ee9a5742c8ab26f481cace"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_d7a940ba0d1d6af4fa6532ffd4"
        `);
    await queryRunner.query(`
            ALTER TABLE "game_publishers_publisher"
                RENAME TO "temporary_game_publishers_publisher"
        `);
    await queryRunner.query(`
            CREATE TABLE "game_publishers_publisher" (
                "game_id" integer NOT NULL,
                "publisher_id" integer NOT NULL,
                CONSTRAINT "FK_d7a940ba0d1d6af4fa6532ffd43" FOREIGN KEY ("publisher_id") REFERENCES "publisher" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT "FK_0161ee9a5742c8ab26f481cace7" FOREIGN KEY ("game_id") REFERENCES "game" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
                PRIMARY KEY ("game_id", "publisher_id")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "game_publishers_publisher"("game_id", "publisher_id")
            SELECT "game_id",
                "publisher_id"
            FROM "temporary_game_publishers_publisher"
        `);
    await queryRunner.query(`
            DROP TABLE "temporary_game_publishers_publisher"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_0161ee9a5742c8ab26f481cace" ON "game_publishers_publisher" ("game_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_d7a940ba0d1d6af4fa6532ffd4" ON "game_publishers_publisher" ("publisher_id")
        `);
    await queryRunner.query(`
            ALTER TABLE "crackpipe_user"
                RENAME TO "temporary_crackpipe_user"
        `);
    await queryRunner.query(`
            CREATE TABLE "crackpipe_user" (
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
                CONSTRAINT "UQ_d0e7d50057240e5752a2c303ffb" UNIQUE ("email"),
                CONSTRAINT "UQ_ad2fda40ce941655c838fb1435f" UNIQUE ("username"),
                CONSTRAINT "FK_c7f85d117085d0c2add94649cbf" FOREIGN KEY ("background_image_id") REFERENCES "image" ("id") ON DELETE
                SET NULL ON UPDATE NO ACTION,
                    CONSTRAINT "FK_ca78001001650ae341575a18cc6" FOREIGN KEY ("profile_picture_id") REFERENCES "image" ("id") ON DELETE
                SET NULL ON UPDATE NO ACTION
            )
        `);
    await queryRunner.query(`
            INSERT INTO "crackpipe_user"(
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
            FROM "temporary_crackpipe_user"
        `);
    await queryRunner.query(`
            DROP TABLE "temporary_crackpipe_user"
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
                "state" varchar NOT NULL DEFAULT ('UNPLAYED'),
                "last_played_at" datetime,
                "user_id" integer,
                "game_id" integer,
                CONSTRAINT "FK_409f34cf4dcfc645e8c93b0a8c2" FOREIGN KEY ("game_id") REFERENCES "game" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT "FK_0366c96237f98ea1c8ba6e1ec35" FOREIGN KEY ("user_id") REFERENCES "crackpipe_user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
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
                CONSTRAINT "UQ_7770cb331bdc54951bb9046fa9d" UNIQUE ("file_path"),
                CONSTRAINT "FK_1260b3922420ccd9c54ea0e841e" FOREIGN KEY ("background_image_id") REFERENCES "image" ("id") ON DELETE
                SET NULL ON UPDATE NO ACTION,
                    CONSTRAINT "FK_fcb87541065fd19c533f64ef64d" FOREIGN KEY ("box_image_id") REFERENCES "image" ("id") ON DELETE
                SET NULL ON UPDATE NO ACTION
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
                    "background_image_id"
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
                "background_image_id"
            FROM "temporary_game"
        `);
    await queryRunner.query(`
            DROP TABLE "temporary_game"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_0152ed47a9e8963b5aaceb51e7" ON "game" ("title")
        `);
  }
}
