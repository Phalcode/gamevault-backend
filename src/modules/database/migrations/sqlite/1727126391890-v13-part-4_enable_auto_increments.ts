import { NotImplementedException } from "@nestjs/common";
import { MigrationInterface, QueryRunner } from "typeorm";

export class V13Part4EnableAutoIncrements1727126391890
  implements MigrationInterface
{
  name = "V13Part4EnableAutoIncrements1727126391890";

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

  public async down(): Promise<void> {
    throw new NotImplementedException(
      "There is no way to undo this migration.",
    );
  }
}
