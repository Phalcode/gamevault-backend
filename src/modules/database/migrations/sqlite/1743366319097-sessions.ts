import { MigrationInterface, QueryRunner } from "typeorm";

export class Sessions1743366319097 implements MigrationInterface {
    name = 'Sessions1743366319097'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "session" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "refresh_token_hash" varchar NOT NULL,
                "revoked" boolean NOT NULL DEFAULT (0),
                "expires_at" datetime NOT NULL,
                "ip_address" varchar NOT NULL,
                "user_agent" varchar NOT NULL,
                "user_id" integer
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_f55da76ac1c3ac420f444d2ff1" ON "session" ("id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_30e98e8746699fb9af235410af" ON "session" ("user_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_e131e569c75b7d1aa8a73ffa83" ON "session" ("refresh_token_hash")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_40ec9e3de37043686fc51ca39e" ON "session" ("revoked")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_2223e981900a413ce4ce6386f9" ON "session" ("expires_at")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_112e796e2ae5ea3c66e321a9fb" ON "session" ("user_id", "revoked", "expires_at")
        `);
        await queryRunner.query(`
            CREATE TABLE "v12_bookmark" (
                "v12_gamevault_user_id" integer NOT NULL,
                "v12_game_id" integer NOT NULL,
                PRIMARY KEY ("v12_gamevault_user_id", "v12_game_id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_ba0312a26cea7e0d2e4f3a47b3" ON "v12_bookmark" ("v12_gamevault_user_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_dac42c27eb34c76294db5d7d4f" ON "v12_bookmark" ("v12_game_id")
        `);
        await queryRunner.query(`
            CREATE TABLE "v12_game_publishers_v12_publisher" (
                "v12_game_id" integer NOT NULL,
                "v12_publisher_id" integer NOT NULL,
                PRIMARY KEY ("v12_game_id", "v12_publisher_id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_0f7f0bb5375218cffd6a516db2" ON "v12_game_publishers_v12_publisher" ("v12_game_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_4159b4c54928adc7aaf9b090c2" ON "v12_game_publishers_v12_publisher" ("v12_publisher_id")
        `);
        await queryRunner.query(`
            CREATE TABLE "v12_game_developers_v12_developer" (
                "v12_game_id" integer NOT NULL,
                "v12_developer_id" integer NOT NULL,
                PRIMARY KEY ("v12_game_id", "v12_developer_id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_e607a8e2a70e43e38f646a7576" ON "v12_game_developers_v12_developer" ("v12_game_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_d923d013a5b9c8239aa2c9329b" ON "v12_game_developers_v12_developer" ("v12_developer_id")
        `);
        await queryRunner.query(`
            CREATE TABLE "v12_game_stores_v12_store" (
                "v12_game_id" integer NOT NULL,
                "v12_store_id" integer NOT NULL,
                PRIMARY KEY ("v12_game_id", "v12_store_id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_064788571341aa91d701d59d92" ON "v12_game_stores_v12_store" ("v12_game_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_c75eed11e0830940a357729451" ON "v12_game_stores_v12_store" ("v12_store_id")
        `);
        await queryRunner.query(`
            CREATE TABLE "v12_game_tags_v12_tag" (
                "v12_game_id" integer NOT NULL,
                "v12_tag_id" integer NOT NULL,
                PRIMARY KEY ("v12_game_id", "v12_tag_id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_018e37c76b56558d129934e73c" ON "v12_game_tags_v12_tag" ("v12_game_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_70283a5d69a40852158b7282ea" ON "v12_game_tags_v12_tag" ("v12_tag_id")
        `);
        await queryRunner.query(`
            CREATE TABLE "v12_game_genres_v12_genre" (
                "v12_game_id" integer NOT NULL,
                "v12_genre_id" integer NOT NULL,
                PRIMARY KEY ("v12_game_id", "v12_genre_id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_77658a51c38ce9ec3fab40cc33" ON "v12_game_genres_v12_genre" ("v12_game_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_a304c4069af1814bf7840b3248" ON "v12_game_genres_v12_genre" ("v12_genre_id")
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_f55da76ac1c3ac420f444d2ff1"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_30e98e8746699fb9af235410af"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_e131e569c75b7d1aa8a73ffa83"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_40ec9e3de37043686fc51ca39e"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_2223e981900a413ce4ce6386f9"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_112e796e2ae5ea3c66e321a9fb"
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_session" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "refresh_token_hash" varchar NOT NULL,
                "revoked" boolean NOT NULL DEFAULT (0),
                "expires_at" datetime NOT NULL,
                "ip_address" varchar NOT NULL,
                "user_agent" varchar NOT NULL,
                "user_id" integer,
                CONSTRAINT "FK_30e98e8746699fb9af235410aff" FOREIGN KEY ("user_id") REFERENCES "gamevault_user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_session"(
                    "id",
                    "created_at",
                    "updated_at",
                    "deleted_at",
                    "entity_version",
                    "refresh_token_hash",
                    "revoked",
                    "expires_at",
                    "ip_address",
                    "user_agent",
                    "user_id"
                )
            SELECT "id",
                "created_at",
                "updated_at",
                "deleted_at",
                "entity_version",
                "refresh_token_hash",
                "revoked",
                "expires_at",
                "ip_address",
                "user_agent",
                "user_id"
            FROM "session"
        `);
        await queryRunner.query(`
            DROP TABLE "session"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_session"
                RENAME TO "session"
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_f55da76ac1c3ac420f444d2ff1" ON "session" ("id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_30e98e8746699fb9af235410af" ON "session" ("user_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_e131e569c75b7d1aa8a73ffa83" ON "session" ("refresh_token_hash")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_40ec9e3de37043686fc51ca39e" ON "session" ("revoked")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_2223e981900a413ce4ce6386f9" ON "session" ("expires_at")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_112e796e2ae5ea3c66e321a9fb" ON "session" ("user_id", "revoked", "expires_at")
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_ba0312a26cea7e0d2e4f3a47b3"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_dac42c27eb34c76294db5d7d4f"
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_v12_bookmark" (
                "v12_gamevault_user_id" integer NOT NULL,
                "v12_game_id" integer NOT NULL,
                CONSTRAINT "FK_ba0312a26cea7e0d2e4f3a47b3f" FOREIGN KEY ("v12_gamevault_user_id") REFERENCES "v12_gamevault_user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT "FK_dac42c27eb34c76294db5d7d4f3" FOREIGN KEY ("v12_game_id") REFERENCES "v12_game" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                PRIMARY KEY ("v12_gamevault_user_id", "v12_game_id")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_v12_bookmark"("v12_gamevault_user_id", "v12_game_id")
            SELECT "v12_gamevault_user_id",
                "v12_game_id"
            FROM "v12_bookmark"
        `);
        await queryRunner.query(`
            DROP TABLE "v12_bookmark"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_v12_bookmark"
                RENAME TO "v12_bookmark"
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_ba0312a26cea7e0d2e4f3a47b3" ON "v12_bookmark" ("v12_gamevault_user_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_dac42c27eb34c76294db5d7d4f" ON "v12_bookmark" ("v12_game_id")
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_0f7f0bb5375218cffd6a516db2"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_4159b4c54928adc7aaf9b090c2"
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_v12_game_publishers_v12_publisher" (
                "v12_game_id" integer NOT NULL,
                "v12_publisher_id" integer NOT NULL,
                CONSTRAINT "FK_0f7f0bb5375218cffd6a516db28" FOREIGN KEY ("v12_game_id") REFERENCES "v12_game" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT "FK_4159b4c54928adc7aaf9b090c28" FOREIGN KEY ("v12_publisher_id") REFERENCES "v12_publisher" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                PRIMARY KEY ("v12_game_id", "v12_publisher_id")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_v12_game_publishers_v12_publisher"("v12_game_id", "v12_publisher_id")
            SELECT "v12_game_id",
                "v12_publisher_id"
            FROM "v12_game_publishers_v12_publisher"
        `);
        await queryRunner.query(`
            DROP TABLE "v12_game_publishers_v12_publisher"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_v12_game_publishers_v12_publisher"
                RENAME TO "v12_game_publishers_v12_publisher"
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_0f7f0bb5375218cffd6a516db2" ON "v12_game_publishers_v12_publisher" ("v12_game_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_4159b4c54928adc7aaf9b090c2" ON "v12_game_publishers_v12_publisher" ("v12_publisher_id")
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_e607a8e2a70e43e38f646a7576"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_d923d013a5b9c8239aa2c9329b"
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_v12_game_developers_v12_developer" (
                "v12_game_id" integer NOT NULL,
                "v12_developer_id" integer NOT NULL,
                CONSTRAINT "FK_e607a8e2a70e43e38f646a75767" FOREIGN KEY ("v12_game_id") REFERENCES "v12_game" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT "FK_d923d013a5b9c8239aa2c9329b9" FOREIGN KEY ("v12_developer_id") REFERENCES "v12_developer" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                PRIMARY KEY ("v12_game_id", "v12_developer_id")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_v12_game_developers_v12_developer"("v12_game_id", "v12_developer_id")
            SELECT "v12_game_id",
                "v12_developer_id"
            FROM "v12_game_developers_v12_developer"
        `);
        await queryRunner.query(`
            DROP TABLE "v12_game_developers_v12_developer"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_v12_game_developers_v12_developer"
                RENAME TO "v12_game_developers_v12_developer"
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_e607a8e2a70e43e38f646a7576" ON "v12_game_developers_v12_developer" ("v12_game_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_d923d013a5b9c8239aa2c9329b" ON "v12_game_developers_v12_developer" ("v12_developer_id")
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_064788571341aa91d701d59d92"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_c75eed11e0830940a357729451"
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_v12_game_stores_v12_store" (
                "v12_game_id" integer NOT NULL,
                "v12_store_id" integer NOT NULL,
                CONSTRAINT "FK_064788571341aa91d701d59d927" FOREIGN KEY ("v12_game_id") REFERENCES "v12_game" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT "FK_c75eed11e0830940a3577294517" FOREIGN KEY ("v12_store_id") REFERENCES "v12_store" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                PRIMARY KEY ("v12_game_id", "v12_store_id")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_v12_game_stores_v12_store"("v12_game_id", "v12_store_id")
            SELECT "v12_game_id",
                "v12_store_id"
            FROM "v12_game_stores_v12_store"
        `);
        await queryRunner.query(`
            DROP TABLE "v12_game_stores_v12_store"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_v12_game_stores_v12_store"
                RENAME TO "v12_game_stores_v12_store"
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_064788571341aa91d701d59d92" ON "v12_game_stores_v12_store" ("v12_game_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_c75eed11e0830940a357729451" ON "v12_game_stores_v12_store" ("v12_store_id")
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_018e37c76b56558d129934e73c"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_70283a5d69a40852158b7282ea"
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_v12_game_tags_v12_tag" (
                "v12_game_id" integer NOT NULL,
                "v12_tag_id" integer NOT NULL,
                CONSTRAINT "FK_018e37c76b56558d129934e73c5" FOREIGN KEY ("v12_game_id") REFERENCES "v12_game" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT "FK_70283a5d69a40852158b7282ea3" FOREIGN KEY ("v12_tag_id") REFERENCES "v12_tag" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                PRIMARY KEY ("v12_game_id", "v12_tag_id")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_v12_game_tags_v12_tag"("v12_game_id", "v12_tag_id")
            SELECT "v12_game_id",
                "v12_tag_id"
            FROM "v12_game_tags_v12_tag"
        `);
        await queryRunner.query(`
            DROP TABLE "v12_game_tags_v12_tag"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_v12_game_tags_v12_tag"
                RENAME TO "v12_game_tags_v12_tag"
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_018e37c76b56558d129934e73c" ON "v12_game_tags_v12_tag" ("v12_game_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_70283a5d69a40852158b7282ea" ON "v12_game_tags_v12_tag" ("v12_tag_id")
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_77658a51c38ce9ec3fab40cc33"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_a304c4069af1814bf7840b3248"
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_v12_game_genres_v12_genre" (
                "v12_game_id" integer NOT NULL,
                "v12_genre_id" integer NOT NULL,
                CONSTRAINT "FK_77658a51c38ce9ec3fab40cc339" FOREIGN KEY ("v12_game_id") REFERENCES "v12_game" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT "FK_a304c4069af1814bf7840b3248a" FOREIGN KEY ("v12_genre_id") REFERENCES "v12_genre" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                PRIMARY KEY ("v12_game_id", "v12_genre_id")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_v12_game_genres_v12_genre"("v12_game_id", "v12_genre_id")
            SELECT "v12_game_id",
                "v12_genre_id"
            FROM "v12_game_genres_v12_genre"
        `);
        await queryRunner.query(`
            DROP TABLE "v12_game_genres_v12_genre"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_v12_game_genres_v12_genre"
                RENAME TO "v12_game_genres_v12_genre"
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_77658a51c38ce9ec3fab40cc33" ON "v12_game_genres_v12_genre" ("v12_game_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_a304c4069af1814bf7840b3248" ON "v12_game_genres_v12_genre" ("v12_genre_id")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "IDX_a304c4069af1814bf7840b3248"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_77658a51c38ce9ec3fab40cc33"
        `);
        await queryRunner.query(`
            ALTER TABLE "v12_game_genres_v12_genre"
                RENAME TO "temporary_v12_game_genres_v12_genre"
        `);
        await queryRunner.query(`
            CREATE TABLE "v12_game_genres_v12_genre" (
                "v12_game_id" integer NOT NULL,
                "v12_genre_id" integer NOT NULL,
                PRIMARY KEY ("v12_game_id", "v12_genre_id")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "v12_game_genres_v12_genre"("v12_game_id", "v12_genre_id")
            SELECT "v12_game_id",
                "v12_genre_id"
            FROM "temporary_v12_game_genres_v12_genre"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_v12_game_genres_v12_genre"
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_a304c4069af1814bf7840b3248" ON "v12_game_genres_v12_genre" ("v12_genre_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_77658a51c38ce9ec3fab40cc33" ON "v12_game_genres_v12_genre" ("v12_game_id")
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_70283a5d69a40852158b7282ea"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_018e37c76b56558d129934e73c"
        `);
        await queryRunner.query(`
            ALTER TABLE "v12_game_tags_v12_tag"
                RENAME TO "temporary_v12_game_tags_v12_tag"
        `);
        await queryRunner.query(`
            CREATE TABLE "v12_game_tags_v12_tag" (
                "v12_game_id" integer NOT NULL,
                "v12_tag_id" integer NOT NULL,
                PRIMARY KEY ("v12_game_id", "v12_tag_id")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "v12_game_tags_v12_tag"("v12_game_id", "v12_tag_id")
            SELECT "v12_game_id",
                "v12_tag_id"
            FROM "temporary_v12_game_tags_v12_tag"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_v12_game_tags_v12_tag"
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_70283a5d69a40852158b7282ea" ON "v12_game_tags_v12_tag" ("v12_tag_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_018e37c76b56558d129934e73c" ON "v12_game_tags_v12_tag" ("v12_game_id")
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_c75eed11e0830940a357729451"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_064788571341aa91d701d59d92"
        `);
        await queryRunner.query(`
            ALTER TABLE "v12_game_stores_v12_store"
                RENAME TO "temporary_v12_game_stores_v12_store"
        `);
        await queryRunner.query(`
            CREATE TABLE "v12_game_stores_v12_store" (
                "v12_game_id" integer NOT NULL,
                "v12_store_id" integer NOT NULL,
                PRIMARY KEY ("v12_game_id", "v12_store_id")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "v12_game_stores_v12_store"("v12_game_id", "v12_store_id")
            SELECT "v12_game_id",
                "v12_store_id"
            FROM "temporary_v12_game_stores_v12_store"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_v12_game_stores_v12_store"
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_c75eed11e0830940a357729451" ON "v12_game_stores_v12_store" ("v12_store_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_064788571341aa91d701d59d92" ON "v12_game_stores_v12_store" ("v12_game_id")
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_d923d013a5b9c8239aa2c9329b"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_e607a8e2a70e43e38f646a7576"
        `);
        await queryRunner.query(`
            ALTER TABLE "v12_game_developers_v12_developer"
                RENAME TO "temporary_v12_game_developers_v12_developer"
        `);
        await queryRunner.query(`
            CREATE TABLE "v12_game_developers_v12_developer" (
                "v12_game_id" integer NOT NULL,
                "v12_developer_id" integer NOT NULL,
                PRIMARY KEY ("v12_game_id", "v12_developer_id")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "v12_game_developers_v12_developer"("v12_game_id", "v12_developer_id")
            SELECT "v12_game_id",
                "v12_developer_id"
            FROM "temporary_v12_game_developers_v12_developer"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_v12_game_developers_v12_developer"
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_d923d013a5b9c8239aa2c9329b" ON "v12_game_developers_v12_developer" ("v12_developer_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_e607a8e2a70e43e38f646a7576" ON "v12_game_developers_v12_developer" ("v12_game_id")
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_4159b4c54928adc7aaf9b090c2"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_0f7f0bb5375218cffd6a516db2"
        `);
        await queryRunner.query(`
            ALTER TABLE "v12_game_publishers_v12_publisher"
                RENAME TO "temporary_v12_game_publishers_v12_publisher"
        `);
        await queryRunner.query(`
            CREATE TABLE "v12_game_publishers_v12_publisher" (
                "v12_game_id" integer NOT NULL,
                "v12_publisher_id" integer NOT NULL,
                PRIMARY KEY ("v12_game_id", "v12_publisher_id")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "v12_game_publishers_v12_publisher"("v12_game_id", "v12_publisher_id")
            SELECT "v12_game_id",
                "v12_publisher_id"
            FROM "temporary_v12_game_publishers_v12_publisher"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_v12_game_publishers_v12_publisher"
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_4159b4c54928adc7aaf9b090c2" ON "v12_game_publishers_v12_publisher" ("v12_publisher_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_0f7f0bb5375218cffd6a516db2" ON "v12_game_publishers_v12_publisher" ("v12_game_id")
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_dac42c27eb34c76294db5d7d4f"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_ba0312a26cea7e0d2e4f3a47b3"
        `);
        await queryRunner.query(`
            ALTER TABLE "v12_bookmark"
                RENAME TO "temporary_v12_bookmark"
        `);
        await queryRunner.query(`
            CREATE TABLE "v12_bookmark" (
                "v12_gamevault_user_id" integer NOT NULL,
                "v12_game_id" integer NOT NULL,
                PRIMARY KEY ("v12_gamevault_user_id", "v12_game_id")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "v12_bookmark"("v12_gamevault_user_id", "v12_game_id")
            SELECT "v12_gamevault_user_id",
                "v12_game_id"
            FROM "temporary_v12_bookmark"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_v12_bookmark"
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_dac42c27eb34c76294db5d7d4f" ON "v12_bookmark" ("v12_game_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_ba0312a26cea7e0d2e4f3a47b3" ON "v12_bookmark" ("v12_gamevault_user_id")
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_112e796e2ae5ea3c66e321a9fb"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_2223e981900a413ce4ce6386f9"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_40ec9e3de37043686fc51ca39e"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_e131e569c75b7d1aa8a73ffa83"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_30e98e8746699fb9af235410af"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_f55da76ac1c3ac420f444d2ff1"
        `);
        await queryRunner.query(`
            ALTER TABLE "session"
                RENAME TO "temporary_session"
        `);
        await queryRunner.query(`
            CREATE TABLE "session" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "refresh_token_hash" varchar NOT NULL,
                "revoked" boolean NOT NULL DEFAULT (0),
                "expires_at" datetime NOT NULL,
                "ip_address" varchar NOT NULL,
                "user_agent" varchar NOT NULL,
                "user_id" integer
            )
        `);
        await queryRunner.query(`
            INSERT INTO "session"(
                    "id",
                    "created_at",
                    "updated_at",
                    "deleted_at",
                    "entity_version",
                    "refresh_token_hash",
                    "revoked",
                    "expires_at",
                    "ip_address",
                    "user_agent",
                    "user_id"
                )
            SELECT "id",
                "created_at",
                "updated_at",
                "deleted_at",
                "entity_version",
                "refresh_token_hash",
                "revoked",
                "expires_at",
                "ip_address",
                "user_agent",
                "user_id"
            FROM "temporary_session"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_session"
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_112e796e2ae5ea3c66e321a9fb" ON "session" ("user_id", "revoked", "expires_at")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_2223e981900a413ce4ce6386f9" ON "session" ("expires_at")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_40ec9e3de37043686fc51ca39e" ON "session" ("revoked")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_e131e569c75b7d1aa8a73ffa83" ON "session" ("refresh_token_hash")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_30e98e8746699fb9af235410af" ON "session" ("user_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_f55da76ac1c3ac420f444d2ff1" ON "session" ("id")
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_a304c4069af1814bf7840b3248"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_77658a51c38ce9ec3fab40cc33"
        `);
        await queryRunner.query(`
            DROP TABLE "v12_game_genres_v12_genre"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_70283a5d69a40852158b7282ea"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_018e37c76b56558d129934e73c"
        `);
        await queryRunner.query(`
            DROP TABLE "v12_game_tags_v12_tag"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_c75eed11e0830940a357729451"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_064788571341aa91d701d59d92"
        `);
        await queryRunner.query(`
            DROP TABLE "v12_game_stores_v12_store"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_d923d013a5b9c8239aa2c9329b"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_e607a8e2a70e43e38f646a7576"
        `);
        await queryRunner.query(`
            DROP TABLE "v12_game_developers_v12_developer"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_4159b4c54928adc7aaf9b090c2"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_0f7f0bb5375218cffd6a516db2"
        `);
        await queryRunner.query(`
            DROP TABLE "v12_game_publishers_v12_publisher"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_dac42c27eb34c76294db5d7d4f"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_ba0312a26cea7e0d2e4f3a47b3"
        `);
        await queryRunner.query(`
            DROP TABLE "v12_bookmark"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_112e796e2ae5ea3c66e321a9fb"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_2223e981900a413ce4ce6386f9"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_40ec9e3de37043686fc51ca39e"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_e131e569c75b7d1aa8a73ffa83"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_30e98e8746699fb9af235410af"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_f55da76ac1c3ac420f444d2ff1"
        `);
        await queryRunner.query(`
            DROP TABLE "session"
        `);
    }

}
