import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1689516189048 implements MigrationInterface {
  name = "Init1689516189048";

  public async up(queryRunner: QueryRunner): Promise<void> {
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
                CONSTRAINT "UQ_e0626148aee5829fd312447001a" UNIQUE ("source"),
                CONSTRAINT "UQ_f03b89f33671086e6733828e79c" UNIQUE ("path")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_e0626148aee5829fd312447001" ON "image" ("source")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_f03b89f33671086e6733828e79" ON "image" ("path")
        `);
    await queryRunner.query(`
            CREATE TABLE "developer" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer NOT NULL,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_5c0cd47a75116720223e43db853" UNIQUE ("rawg_id"),
                CONSTRAINT "UQ_5c2989f7bc37f907cfd937c0fd0" UNIQUE ("name")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "genre" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer NOT NULL,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_672bce67ec8cb2d7755c158ad65" UNIQUE ("rawg_id"),
                CONSTRAINT "UQ_dd8cd9e50dd049656e4be1f7e8c" UNIQUE ("name")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "publisher" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer NOT NULL,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_4a0539222ee1307f657f875003b" UNIQUE ("rawg_id"),
                CONSTRAINT "UQ_9dc496f2e5b912da9edd2aa4455" UNIQUE ("name")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "store" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer NOT NULL,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_45c4541783f264043ec2a5864d6" UNIQUE ("rawg_id"),
                CONSTRAINT "UQ_66df34da7fb037e24fc7fee642b" UNIQUE ("name")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "tag" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer NOT NULL,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_289102542903593026bd16e4e1b" UNIQUE ("rawg_id"),
                CONSTRAINT "UQ_6a9775008add570dc3e5a0bab7b" UNIQUE ("name")
            )
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
                "boxImageId" integer,
                "backgroundImageId" integer,
                CONSTRAINT "UQ_7770cb331bdc54951bb9046fa9d" UNIQUE ("file_path")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_0152ed47a9e8963b5aaceb51e7" ON "game" ("title")
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
                "userId" integer,
                "gameId" integer
            )
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
                "profilePictureId" integer,
                "backgroundImageId" integer,
                CONSTRAINT "UQ_ad2fda40ce941655c838fb1435f" UNIQUE ("username"),
                CONSTRAINT "UQ_d0e7d50057240e5752a2c303ffb" UNIQUE ("email")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "game_publishers_publisher" (
                "gameId" integer NOT NULL,
                "publisherId" integer NOT NULL,
                PRIMARY KEY ("gameId", "publisherId")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_0161ee9a5742c8ab26f481cace" ON "game_publishers_publisher" ("gameId")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_d7a940ba0d1d6af4fa6532ffd4" ON "game_publishers_publisher" ("publisherId")
        `);
    await queryRunner.query(`
            CREATE TABLE "game_developers_developer" (
                "gameId" integer NOT NULL,
                "developerId" integer NOT NULL,
                PRIMARY KEY ("gameId", "developerId")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_f5bea91f3185bcf27a60a83377" ON "game_developers_developer" ("gameId")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_c030afb1f3be8ccb7f5761588f" ON "game_developers_developer" ("developerId")
        `);
    await queryRunner.query(`
            CREATE TABLE "game_stores_store" (
                "gameId" integer NOT NULL,
                "storeId" integer NOT NULL,
                PRIMARY KEY ("gameId", "storeId")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_8f769182cc4e5958b3b57ec14a" ON "game_stores_store" ("gameId")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_2ab30a2cbcda7798a4cc0ea6d6" ON "game_stores_store" ("storeId")
        `);
    await queryRunner.query(`
            CREATE TABLE "game_tags_tag" (
                "gameId" integer NOT NULL,
                "tagId" integer NOT NULL,
                PRIMARY KEY ("gameId", "tagId")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_6366e7093c3571f85f1b5ffd4f" ON "game_tags_tag" ("gameId")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_d12253f0cbce01f030a9ced11d" ON "game_tags_tag" ("tagId")
        `);
    await queryRunner.query(`
            CREATE TABLE "game_genres_genre" (
                "gameId" integer NOT NULL,
                "genreId" integer NOT NULL,
                PRIMARY KEY ("gameId", "genreId")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_2ae1c183b1ca4b831efcb9e673" ON "game_genres_genre" ("gameId")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_3549c373e01bdee0f24ed47649" ON "game_genres_genre" ("genreId")
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
                "boxImageId" integer,
                "backgroundImageId" integer,
                CONSTRAINT "UQ_7770cb331bdc54951bb9046fa9d" UNIQUE ("file_path"),
                CONSTRAINT "FK_fcb87541065fd19c533f64ef64d" FOREIGN KEY ("boxImageId") REFERENCES "image" ("id") ON DELETE
                SET NULL ON UPDATE NO ACTION,
                    CONSTRAINT "FK_1260b3922420ccd9c54ea0e841e" FOREIGN KEY ("backgroundImageId") REFERENCES "image" ("id") ON DELETE
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
                    "boxImageId",
                    "backgroundImageId"
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
                "boxImageId",
                "backgroundImageId"
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
                "userId" integer,
                "gameId" integer,
                CONSTRAINT "FK_0366c96237f98ea1c8ba6e1ec35" FOREIGN KEY ("userId") REFERENCES "crackpipe_user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT "FK_409f34cf4dcfc645e8c93b0a8c2" FOREIGN KEY ("gameId") REFERENCES "game" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
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
                    "userId",
                    "gameId"
                )
            SELECT "id",
                "created_at",
                "updated_at",
                "deleted_at",
                "entity_version",
                "minutes_played",
                "state",
                "last_played_at",
                "userId",
                "gameId"
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
                "profilePictureId" integer,
                "backgroundImageId" integer,
                CONSTRAINT "UQ_ad2fda40ce941655c838fb1435f" UNIQUE ("username"),
                CONSTRAINT "UQ_d0e7d50057240e5752a2c303ffb" UNIQUE ("email"),
                CONSTRAINT "FK_ca78001001650ae341575a18cc6" FOREIGN KEY ("profilePictureId") REFERENCES "image" ("id") ON DELETE
                SET NULL ON UPDATE NO ACTION,
                    CONSTRAINT "FK_c7f85d117085d0c2add94649cbf" FOREIGN KEY ("backgroundImageId") REFERENCES "image" ("id") ON DELETE
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
                    "profilePictureId",
                    "backgroundImageId"
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
                "profilePictureId",
                "backgroundImageId"
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
            DROP INDEX "IDX_0161ee9a5742c8ab26f481cace"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_d7a940ba0d1d6af4fa6532ffd4"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_game_publishers_publisher" (
                "gameId" integer NOT NULL,
                "publisherId" integer NOT NULL,
                CONSTRAINT "FK_0161ee9a5742c8ab26f481cace7" FOREIGN KEY ("gameId") REFERENCES "game" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT "FK_d7a940ba0d1d6af4fa6532ffd43" FOREIGN KEY ("publisherId") REFERENCES "publisher" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                PRIMARY KEY ("gameId", "publisherId")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_game_publishers_publisher"("gameId", "publisherId")
            SELECT "gameId",
                "publisherId"
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
            CREATE INDEX "IDX_0161ee9a5742c8ab26f481cace" ON "game_publishers_publisher" ("gameId")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_d7a940ba0d1d6af4fa6532ffd4" ON "game_publishers_publisher" ("publisherId")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_f5bea91f3185bcf27a60a83377"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_c030afb1f3be8ccb7f5761588f"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_game_developers_developer" (
                "gameId" integer NOT NULL,
                "developerId" integer NOT NULL,
                CONSTRAINT "FK_f5bea91f3185bcf27a60a833772" FOREIGN KEY ("gameId") REFERENCES "game" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT "FK_c030afb1f3be8ccb7f5761588ff" FOREIGN KEY ("developerId") REFERENCES "developer" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                PRIMARY KEY ("gameId", "developerId")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_game_developers_developer"("gameId", "developerId")
            SELECT "gameId",
                "developerId"
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
            CREATE INDEX "IDX_f5bea91f3185bcf27a60a83377" ON "game_developers_developer" ("gameId")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_c030afb1f3be8ccb7f5761588f" ON "game_developers_developer" ("developerId")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_8f769182cc4e5958b3b57ec14a"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_2ab30a2cbcda7798a4cc0ea6d6"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_game_stores_store" (
                "gameId" integer NOT NULL,
                "storeId" integer NOT NULL,
                CONSTRAINT "FK_8f769182cc4e5958b3b57ec14a0" FOREIGN KEY ("gameId") REFERENCES "game" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT "FK_2ab30a2cbcda7798a4cc0ea6d60" FOREIGN KEY ("storeId") REFERENCES "store" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                PRIMARY KEY ("gameId", "storeId")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_game_stores_store"("gameId", "storeId")
            SELECT "gameId",
                "storeId"
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
            CREATE INDEX "IDX_8f769182cc4e5958b3b57ec14a" ON "game_stores_store" ("gameId")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_2ab30a2cbcda7798a4cc0ea6d6" ON "game_stores_store" ("storeId")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_6366e7093c3571f85f1b5ffd4f"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_d12253f0cbce01f030a9ced11d"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_game_tags_tag" (
                "gameId" integer NOT NULL,
                "tagId" integer NOT NULL,
                CONSTRAINT "FK_6366e7093c3571f85f1b5ffd4f1" FOREIGN KEY ("gameId") REFERENCES "game" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT "FK_d12253f0cbce01f030a9ced11d6" FOREIGN KEY ("tagId") REFERENCES "tag" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                PRIMARY KEY ("gameId", "tagId")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_game_tags_tag"("gameId", "tagId")
            SELECT "gameId",
                "tagId"
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
            CREATE INDEX "IDX_6366e7093c3571f85f1b5ffd4f" ON "game_tags_tag" ("gameId")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_d12253f0cbce01f030a9ced11d" ON "game_tags_tag" ("tagId")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_2ae1c183b1ca4b831efcb9e673"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_3549c373e01bdee0f24ed47649"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_game_genres_genre" (
                "gameId" integer NOT NULL,
                "genreId" integer NOT NULL,
                CONSTRAINT "FK_2ae1c183b1ca4b831efcb9e673d" FOREIGN KEY ("gameId") REFERENCES "game" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT "FK_3549c373e01bdee0f24ed476497" FOREIGN KEY ("genreId") REFERENCES "genre" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                PRIMARY KEY ("gameId", "genreId")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_game_genres_genre"("gameId", "genreId")
            SELECT "gameId",
                "genreId"
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
            CREATE INDEX "IDX_2ae1c183b1ca4b831efcb9e673" ON "game_genres_genre" ("gameId")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_3549c373e01bdee0f24ed47649" ON "game_genres_genre" ("genreId")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "IDX_3549c373e01bdee0f24ed47649"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_2ae1c183b1ca4b831efcb9e673"
        `);
    await queryRunner.query(`
            ALTER TABLE "game_genres_genre"
                RENAME TO "temporary_game_genres_genre"
        `);
    await queryRunner.query(`
            CREATE TABLE "game_genres_genre" (
                "gameId" integer NOT NULL,
                "genreId" integer NOT NULL,
                PRIMARY KEY ("gameId", "genreId")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "game_genres_genre"("gameId", "genreId")
            SELECT "gameId",
                "genreId"
            FROM "temporary_game_genres_genre"
        `);
    await queryRunner.query(`
            DROP TABLE "temporary_game_genres_genre"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_3549c373e01bdee0f24ed47649" ON "game_genres_genre" ("genreId")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_2ae1c183b1ca4b831efcb9e673" ON "game_genres_genre" ("gameId")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_d12253f0cbce01f030a9ced11d"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_6366e7093c3571f85f1b5ffd4f"
        `);
    await queryRunner.query(`
            ALTER TABLE "game_tags_tag"
                RENAME TO "temporary_game_tags_tag"
        `);
    await queryRunner.query(`
            CREATE TABLE "game_tags_tag" (
                "gameId" integer NOT NULL,
                "tagId" integer NOT NULL,
                PRIMARY KEY ("gameId", "tagId")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "game_tags_tag"("gameId", "tagId")
            SELECT "gameId",
                "tagId"
            FROM "temporary_game_tags_tag"
        `);
    await queryRunner.query(`
            DROP TABLE "temporary_game_tags_tag"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_d12253f0cbce01f030a9ced11d" ON "game_tags_tag" ("tagId")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_6366e7093c3571f85f1b5ffd4f" ON "game_tags_tag" ("gameId")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_2ab30a2cbcda7798a4cc0ea6d6"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_8f769182cc4e5958b3b57ec14a"
        `);
    await queryRunner.query(`
            ALTER TABLE "game_stores_store"
                RENAME TO "temporary_game_stores_store"
        `);
    await queryRunner.query(`
            CREATE TABLE "game_stores_store" (
                "gameId" integer NOT NULL,
                "storeId" integer NOT NULL,
                PRIMARY KEY ("gameId", "storeId")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "game_stores_store"("gameId", "storeId")
            SELECT "gameId",
                "storeId"
            FROM "temporary_game_stores_store"
        `);
    await queryRunner.query(`
            DROP TABLE "temporary_game_stores_store"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_2ab30a2cbcda7798a4cc0ea6d6" ON "game_stores_store" ("storeId")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_8f769182cc4e5958b3b57ec14a" ON "game_stores_store" ("gameId")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_c030afb1f3be8ccb7f5761588f"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_f5bea91f3185bcf27a60a83377"
        `);
    await queryRunner.query(`
            ALTER TABLE "game_developers_developer"
                RENAME TO "temporary_game_developers_developer"
        `);
    await queryRunner.query(`
            CREATE TABLE "game_developers_developer" (
                "gameId" integer NOT NULL,
                "developerId" integer NOT NULL,
                PRIMARY KEY ("gameId", "developerId")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "game_developers_developer"("gameId", "developerId")
            SELECT "gameId",
                "developerId"
            FROM "temporary_game_developers_developer"
        `);
    await queryRunner.query(`
            DROP TABLE "temporary_game_developers_developer"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_c030afb1f3be8ccb7f5761588f" ON "game_developers_developer" ("developerId")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_f5bea91f3185bcf27a60a83377" ON "game_developers_developer" ("gameId")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_d7a940ba0d1d6af4fa6532ffd4"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_0161ee9a5742c8ab26f481cace"
        `);
    await queryRunner.query(`
            ALTER TABLE "game_publishers_publisher"
                RENAME TO "temporary_game_publishers_publisher"
        `);
    await queryRunner.query(`
            CREATE TABLE "game_publishers_publisher" (
                "gameId" integer NOT NULL,
                "publisherId" integer NOT NULL,
                PRIMARY KEY ("gameId", "publisherId")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "game_publishers_publisher"("gameId", "publisherId")
            SELECT "gameId",
                "publisherId"
            FROM "temporary_game_publishers_publisher"
        `);
    await queryRunner.query(`
            DROP TABLE "temporary_game_publishers_publisher"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_d7a940ba0d1d6af4fa6532ffd4" ON "game_publishers_publisher" ("publisherId")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_0161ee9a5742c8ab26f481cace" ON "game_publishers_publisher" ("gameId")
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
                "profilePictureId" integer,
                "backgroundImageId" integer,
                CONSTRAINT "UQ_ad2fda40ce941655c838fb1435f" UNIQUE ("username"),
                CONSTRAINT "UQ_d0e7d50057240e5752a2c303ffb" UNIQUE ("email")
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
                    "profilePictureId",
                    "backgroundImageId"
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
                "profilePictureId",
                "backgroundImageId"
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
                "userId" integer,
                "gameId" integer
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
                    "userId",
                    "gameId"
                )
            SELECT "id",
                "created_at",
                "updated_at",
                "deleted_at",
                "entity_version",
                "minutes_played",
                "state",
                "last_played_at",
                "userId",
                "gameId"
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
                "boxImageId" integer,
                "backgroundImageId" integer,
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
                    "boxImageId",
                    "backgroundImageId"
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
                "boxImageId",
                "backgroundImageId"
            FROM "temporary_game"
        `);
    await queryRunner.query(`
            DROP TABLE "temporary_game"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_0152ed47a9e8963b5aaceb51e7" ON "game" ("title")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_3549c373e01bdee0f24ed47649"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_2ae1c183b1ca4b831efcb9e673"
        `);
    await queryRunner.query(`
            DROP TABLE "game_genres_genre"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_d12253f0cbce01f030a9ced11d"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_6366e7093c3571f85f1b5ffd4f"
        `);
    await queryRunner.query(`
            DROP TABLE "game_tags_tag"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_2ab30a2cbcda7798a4cc0ea6d6"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_8f769182cc4e5958b3b57ec14a"
        `);
    await queryRunner.query(`
            DROP TABLE "game_stores_store"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_c030afb1f3be8ccb7f5761588f"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_f5bea91f3185bcf27a60a83377"
        `);
    await queryRunner.query(`
            DROP TABLE "game_developers_developer"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_d7a940ba0d1d6af4fa6532ffd4"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_0161ee9a5742c8ab26f481cace"
        `);
    await queryRunner.query(`
            DROP TABLE "game_publishers_publisher"
        `);
    await queryRunner.query(`
            DROP TABLE "crackpipe_user"
        `);
    await queryRunner.query(`
            DROP TABLE "progress"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_0152ed47a9e8963b5aaceb51e7"
        `);
    await queryRunner.query(`
            DROP TABLE "game"
        `);
    await queryRunner.query(`
            DROP TABLE "tag"
        `);
    await queryRunner.query(`
            DROP TABLE "store"
        `);
    await queryRunner.query(`
            DROP TABLE "publisher"
        `);
    await queryRunner.query(`
            DROP TABLE "genre"
        `);
    await queryRunner.query(`
            DROP TABLE "developer"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_f03b89f33671086e6733828e79"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_e0626148aee5829fd312447001"
        `);
    await queryRunner.query(`
            DROP TABLE "image"
        `);
  }
}
