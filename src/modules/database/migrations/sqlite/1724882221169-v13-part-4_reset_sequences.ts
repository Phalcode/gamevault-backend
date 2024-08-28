import { MigrationInterface, QueryRunner } from "typeorm";

export class V13Part4ResetSequences1724882221169 implements MigrationInterface {
  name = "V13Part4ResetSequences1724882221169";

  public async up(queryRunner: QueryRunner): Promise<void> {
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
            CREATE TABLE "temporary_v12_developer" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_54a35803b834868362fa4c26290" UNIQUE ("name"),
                CONSTRAINT "UQ_039ad5528f914321b2fc6b1fffc" UNIQUE ("rawg_id")
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
            CREATE INDEX "IDX_039ad5528f914321b2fc6b1fff" ON "v12_developer" ("rawg_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_54a35803b834868362fa4c2629" ON "v12_developer" ("name")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_907a95c00ab6d81140c1a1b4a3" ON "v12_developer" ("id")
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
            CREATE TABLE "temporary_v12_genre" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_8a0e8d0364e3637f00d655af947" UNIQUE ("name"),
                CONSTRAINT "UQ_888c3736e64117aba956e90f658" UNIQUE ("rawg_id")
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
            CREATE INDEX "IDX_888c3736e64117aba956e90f65" ON "v12_genre" ("rawg_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_8a0e8d0364e3637f00d655af94" ON "v12_genre" ("name")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_cf2ba84ceb90f80049fce15995" ON "v12_genre" ("id")
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
            CREATE TABLE "temporary_v12_publisher" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_2263bfd2f8ed59b0f54f6d3ae99" UNIQUE ("name"),
                CONSTRAINT "UQ_ba10ea475597187820c3b4fd281" UNIQUE ("rawg_id")
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
            CREATE INDEX "IDX_ba10ea475597187820c3b4fd28" ON "v12_publisher" ("rawg_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_2263bfd2f8ed59b0f54f6d3ae9" ON "v12_publisher" ("name")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_f2f05b756501810d84eea1d651" ON "v12_publisher" ("id")
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
            CREATE TABLE "temporary_v12_store" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_6695d0cc38a598edd65fcba0ee4" UNIQUE ("name"),
                CONSTRAINT "UQ_4a2e62473659b6263b17a5497c3" UNIQUE ("rawg_id")
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
            CREATE INDEX "IDX_4a2e62473659b6263b17a5497c" ON "v12_store" ("rawg_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_6695d0cc38a598edd65fcba0ee" ON "v12_store" ("name")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_e2db9da8c8288f3ff795994d4d" ON "v12_store" ("id")
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
            CREATE TABLE "temporary_v12_tag" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_636a93cb92150e4660bf07a3bc1" UNIQUE ("name"),
                CONSTRAINT "UQ_b60ff4525bb354df761a2eba441" UNIQUE ("rawg_id")
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
            CREATE INDEX "IDX_b60ff4525bb354df761a2eba44" ON "v12_tag" ("rawg_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_636a93cb92150e4660bf07a3bc" ON "v12_tag" ("name")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_0e129f8ad40f587596e0f8d8ff" ON "v12_tag" ("id")
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
            CREATE TABLE "temporary_v12_developer" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_54a35803b834868362fa4c26290" UNIQUE ("name"),
                CONSTRAINT "UQ_039ad5528f914321b2fc6b1fffc" UNIQUE ("rawg_id")
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
            CREATE INDEX "IDX_039ad5528f914321b2fc6b1fff" ON "v12_developer" ("rawg_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_54a35803b834868362fa4c2629" ON "v12_developer" ("name")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_907a95c00ab6d81140c1a1b4a3" ON "v12_developer" ("id")
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
            CREATE TABLE "temporary_v12_genre" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_8a0e8d0364e3637f00d655af947" UNIQUE ("name"),
                CONSTRAINT "UQ_888c3736e64117aba956e90f658" UNIQUE ("rawg_id")
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
            CREATE INDEX "IDX_888c3736e64117aba956e90f65" ON "v12_genre" ("rawg_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_8a0e8d0364e3637f00d655af94" ON "v12_genre" ("name")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_cf2ba84ceb90f80049fce15995" ON "v12_genre" ("id")
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
            CREATE TABLE "temporary_v12_publisher" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_2263bfd2f8ed59b0f54f6d3ae99" UNIQUE ("name"),
                CONSTRAINT "UQ_ba10ea475597187820c3b4fd281" UNIQUE ("rawg_id")
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
            CREATE INDEX "IDX_ba10ea475597187820c3b4fd28" ON "v12_publisher" ("rawg_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_2263bfd2f8ed59b0f54f6d3ae9" ON "v12_publisher" ("name")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_f2f05b756501810d84eea1d651" ON "v12_publisher" ("id")
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
            CREATE TABLE "temporary_v12_store" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_6695d0cc38a598edd65fcba0ee4" UNIQUE ("name"),
                CONSTRAINT "UQ_4a2e62473659b6263b17a5497c3" UNIQUE ("rawg_id")
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
            CREATE INDEX "IDX_4a2e62473659b6263b17a5497c" ON "v12_store" ("rawg_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_6695d0cc38a598edd65fcba0ee" ON "v12_store" ("name")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_e2db9da8c8288f3ff795994d4d" ON "v12_store" ("id")
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
            CREATE TABLE "temporary_v12_tag" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_636a93cb92150e4660bf07a3bc1" UNIQUE ("name"),
                CONSTRAINT "UQ_b60ff4525bb354df761a2eba441" UNIQUE ("rawg_id")
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
            CREATE INDEX "IDX_b60ff4525bb354df761a2eba44" ON "v12_tag" ("rawg_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_636a93cb92150e4660bf07a3bc" ON "v12_tag" ("name")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_0e129f8ad40f587596e0f8d8ff" ON "v12_tag" ("id")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
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
                CONSTRAINT "UQ_636a93cb92150e4660bf07a3bc1" UNIQUE ("name"),
                CONSTRAINT "UQ_b60ff4525bb354df761a2eba441" UNIQUE ("rawg_id")
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
            CREATE INDEX "IDX_0e129f8ad40f587596e0f8d8ff" ON "v12_tag" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_636a93cb92150e4660bf07a3bc" ON "v12_tag" ("name")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_b60ff4525bb354df761a2eba44" ON "v12_tag" ("rawg_id")
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
                CONSTRAINT "UQ_6695d0cc38a598edd65fcba0ee4" UNIQUE ("name"),
                CONSTRAINT "UQ_4a2e62473659b6263b17a5497c3" UNIQUE ("rawg_id")
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
            CREATE INDEX "IDX_e2db9da8c8288f3ff795994d4d" ON "v12_store" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_6695d0cc38a598edd65fcba0ee" ON "v12_store" ("name")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_4a2e62473659b6263b17a5497c" ON "v12_store" ("rawg_id")
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
                CONSTRAINT "UQ_2263bfd2f8ed59b0f54f6d3ae99" UNIQUE ("name"),
                CONSTRAINT "UQ_ba10ea475597187820c3b4fd281" UNIQUE ("rawg_id")
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
            CREATE INDEX "IDX_f2f05b756501810d84eea1d651" ON "v12_publisher" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_2263bfd2f8ed59b0f54f6d3ae9" ON "v12_publisher" ("name")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_ba10ea475597187820c3b4fd28" ON "v12_publisher" ("rawg_id")
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
                CONSTRAINT "UQ_8a0e8d0364e3637f00d655af947" UNIQUE ("name"),
                CONSTRAINT "UQ_888c3736e64117aba956e90f658" UNIQUE ("rawg_id")
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
            CREATE INDEX "IDX_cf2ba84ceb90f80049fce15995" ON "v12_genre" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_8a0e8d0364e3637f00d655af94" ON "v12_genre" ("name")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_888c3736e64117aba956e90f65" ON "v12_genre" ("rawg_id")
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
                CONSTRAINT "UQ_54a35803b834868362fa4c26290" UNIQUE ("name"),
                CONSTRAINT "UQ_039ad5528f914321b2fc6b1fffc" UNIQUE ("rawg_id")
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
            CREATE INDEX "IDX_907a95c00ab6d81140c1a1b4a3" ON "v12_developer" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_54a35803b834868362fa4c2629" ON "v12_developer" ("name")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_039ad5528f914321b2fc6b1fff" ON "v12_developer" ("rawg_id")
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
                CONSTRAINT "UQ_636a93cb92150e4660bf07a3bc1" UNIQUE ("name"),
                CONSTRAINT "UQ_b60ff4525bb354df761a2eba441" UNIQUE ("rawg_id")
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
            CREATE INDEX "IDX_0e129f8ad40f587596e0f8d8ff" ON "v12_tag" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_636a93cb92150e4660bf07a3bc" ON "v12_tag" ("name")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_b60ff4525bb354df761a2eba44" ON "v12_tag" ("rawg_id")
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
                CONSTRAINT "UQ_6695d0cc38a598edd65fcba0ee4" UNIQUE ("name"),
                CONSTRAINT "UQ_4a2e62473659b6263b17a5497c3" UNIQUE ("rawg_id")
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
            CREATE INDEX "IDX_e2db9da8c8288f3ff795994d4d" ON "v12_store" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_6695d0cc38a598edd65fcba0ee" ON "v12_store" ("name")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_4a2e62473659b6263b17a5497c" ON "v12_store" ("rawg_id")
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
                CONSTRAINT "UQ_2263bfd2f8ed59b0f54f6d3ae99" UNIQUE ("name"),
                CONSTRAINT "UQ_ba10ea475597187820c3b4fd281" UNIQUE ("rawg_id")
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
            CREATE INDEX "IDX_f2f05b756501810d84eea1d651" ON "v12_publisher" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_2263bfd2f8ed59b0f54f6d3ae9" ON "v12_publisher" ("name")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_ba10ea475597187820c3b4fd28" ON "v12_publisher" ("rawg_id")
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
                CONSTRAINT "UQ_8a0e8d0364e3637f00d655af947" UNIQUE ("name"),
                CONSTRAINT "UQ_888c3736e64117aba956e90f658" UNIQUE ("rawg_id")
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
            CREATE INDEX "IDX_cf2ba84ceb90f80049fce15995" ON "v12_genre" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_8a0e8d0364e3637f00d655af94" ON "v12_genre" ("name")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_888c3736e64117aba956e90f65" ON "v12_genre" ("rawg_id")
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
                CONSTRAINT "UQ_54a35803b834868362fa4c26290" UNIQUE ("name"),
                CONSTRAINT "UQ_039ad5528f914321b2fc6b1fffc" UNIQUE ("rawg_id")
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
            CREATE INDEX "IDX_907a95c00ab6d81140c1a1b4a3" ON "v12_developer" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_54a35803b834868362fa4c2629" ON "v12_developer" ("name")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_039ad5528f914321b2fc6b1fff" ON "v12_developer" ("rawg_id")
        `);
  }
}
