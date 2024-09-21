import { MigrationInterface, QueryRunner } from "typeorm";

export class V13Part0Sync1715500000000 implements MigrationInterface {
    name = 'V13Part0Sync1715500000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "IDX_5c0cd47a75116720223e43db85"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_5c2989f7bc37f907cfd937c0fd"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_71b846918f80786eed6bfb68b7"
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_developer" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_5c2989f7bc37f907cfd937c0fd0" UNIQUE ("name"),
                CONSTRAINT "UQ_5c0cd47a75116720223e43db853" UNIQUE ("rawg_id")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_developer"(
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
            FROM "developer"
        `);
        await queryRunner.query(`
            DROP TABLE "developer"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_developer"
                RENAME TO "developer"
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_5c0cd47a75116720223e43db85" ON "developer" ("rawg_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_5c2989f7bc37f907cfd937c0fd" ON "developer" ("name")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_71b846918f80786eed6bfb68b7" ON "developer" ("id")
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_672bce67ec8cb2d7755c158ad6"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_dd8cd9e50dd049656e4be1f7e8"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_0285d4f1655d080cfcf7d1ab14"
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_genre" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_dd8cd9e50dd049656e4be1f7e8c" UNIQUE ("name"),
                CONSTRAINT "UQ_672bce67ec8cb2d7755c158ad65" UNIQUE ("rawg_id")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_genre"(
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
            FROM "genre"
        `);
        await queryRunner.query(`
            DROP TABLE "genre"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_genre"
                RENAME TO "genre"
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_672bce67ec8cb2d7755c158ad6" ON "genre" ("rawg_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_dd8cd9e50dd049656e4be1f7e8" ON "genre" ("name")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_0285d4f1655d080cfcf7d1ab14" ON "genre" ("id")
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_4a0539222ee1307f657f875003"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_9dc496f2e5b912da9edd2aa445"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_70a5936b43177f76161724da3e"
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_publisher" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_9dc496f2e5b912da9edd2aa4455" UNIQUE ("name"),
                CONSTRAINT "UQ_4a0539222ee1307f657f875003b" UNIQUE ("rawg_id")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_publisher"(
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
            FROM "publisher"
        `);
        await queryRunner.query(`
            DROP TABLE "publisher"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_publisher"
                RENAME TO "publisher"
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_4a0539222ee1307f657f875003" ON "publisher" ("rawg_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_9dc496f2e5b912da9edd2aa445" ON "publisher" ("name")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_70a5936b43177f76161724da3e" ON "publisher" ("id")
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_45c4541783f264043ec2a5864d"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_66df34da7fb037e24fc7fee642"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_f3172007d4de5ae8e7692759d7"
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_store" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_66df34da7fb037e24fc7fee642b" UNIQUE ("name"),
                CONSTRAINT "UQ_45c4541783f264043ec2a5864d6" UNIQUE ("rawg_id")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_store"(
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
            FROM "store"
        `);
        await queryRunner.query(`
            DROP TABLE "store"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_store"
                RENAME TO "store"
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_45c4541783f264043ec2a5864d" ON "store" ("rawg_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_66df34da7fb037e24fc7fee642" ON "store" ("name")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_f3172007d4de5ae8e7692759d7" ON "store" ("id")
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_289102542903593026bd16e4e1"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_6a9775008add570dc3e5a0bab7"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_8e4052373c579afc1471f52676"
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_tag" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_6a9775008add570dc3e5a0bab7b" UNIQUE ("name"),
                CONSTRAINT "UQ_289102542903593026bd16e4e1b" UNIQUE ("rawg_id")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_tag"(
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
            FROM "tag"
        `);
        await queryRunner.query(`
            DROP TABLE "tag"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_tag"
                RENAME TO "tag"
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_289102542903593026bd16e4e1" ON "tag" ("rawg_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_6a9775008add570dc3e5a0bab7" ON "tag" ("name")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_8e4052373c579afc1471f52676" ON "tag" ("id")
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_5c0cd47a75116720223e43db85"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_5c2989f7bc37f907cfd937c0fd"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_71b846918f80786eed6bfb68b7"
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_developer" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_5c2989f7bc37f907cfd937c0fd0" UNIQUE ("name"),
                CONSTRAINT "UQ_5c0cd47a75116720223e43db853" UNIQUE ("rawg_id")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_developer"(
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
            FROM "developer"
        `);
        await queryRunner.query(`
            DROP TABLE "developer"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_developer"
                RENAME TO "developer"
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_5c0cd47a75116720223e43db85" ON "developer" ("rawg_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_5c2989f7bc37f907cfd937c0fd" ON "developer" ("name")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_71b846918f80786eed6bfb68b7" ON "developer" ("id")
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_672bce67ec8cb2d7755c158ad6"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_dd8cd9e50dd049656e4be1f7e8"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_0285d4f1655d080cfcf7d1ab14"
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_genre" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_dd8cd9e50dd049656e4be1f7e8c" UNIQUE ("name"),
                CONSTRAINT "UQ_672bce67ec8cb2d7755c158ad65" UNIQUE ("rawg_id")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_genre"(
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
            FROM "genre"
        `);
        await queryRunner.query(`
            DROP TABLE "genre"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_genre"
                RENAME TO "genre"
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_672bce67ec8cb2d7755c158ad6" ON "genre" ("rawg_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_dd8cd9e50dd049656e4be1f7e8" ON "genre" ("name")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_0285d4f1655d080cfcf7d1ab14" ON "genre" ("id")
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_4a0539222ee1307f657f875003"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_9dc496f2e5b912da9edd2aa445"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_70a5936b43177f76161724da3e"
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_publisher" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_9dc496f2e5b912da9edd2aa4455" UNIQUE ("name"),
                CONSTRAINT "UQ_4a0539222ee1307f657f875003b" UNIQUE ("rawg_id")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_publisher"(
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
            FROM "publisher"
        `);
        await queryRunner.query(`
            DROP TABLE "publisher"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_publisher"
                RENAME TO "publisher"
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_4a0539222ee1307f657f875003" ON "publisher" ("rawg_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_9dc496f2e5b912da9edd2aa445" ON "publisher" ("name")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_70a5936b43177f76161724da3e" ON "publisher" ("id")
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_45c4541783f264043ec2a5864d"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_66df34da7fb037e24fc7fee642"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_f3172007d4de5ae8e7692759d7"
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_store" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_66df34da7fb037e24fc7fee642b" UNIQUE ("name"),
                CONSTRAINT "UQ_45c4541783f264043ec2a5864d6" UNIQUE ("rawg_id")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_store"(
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
            FROM "store"
        `);
        await queryRunner.query(`
            DROP TABLE "store"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_store"
                RENAME TO "store"
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_45c4541783f264043ec2a5864d" ON "store" ("rawg_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_66df34da7fb037e24fc7fee642" ON "store" ("name")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_f3172007d4de5ae8e7692759d7" ON "store" ("id")
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_289102542903593026bd16e4e1"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_6a9775008add570dc3e5a0bab7"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_8e4052373c579afc1471f52676"
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_tag" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_6a9775008add570dc3e5a0bab7b" UNIQUE ("name"),
                CONSTRAINT "UQ_289102542903593026bd16e4e1b" UNIQUE ("rawg_id")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_tag"(
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
            FROM "tag"
        `);
        await queryRunner.query(`
            DROP TABLE "tag"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_tag"
                RENAME TO "tag"
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_289102542903593026bd16e4e1" ON "tag" ("rawg_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_6a9775008add570dc3e5a0bab7" ON "tag" ("name")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_8e4052373c579afc1471f52676" ON "tag" ("id")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "IDX_8e4052373c579afc1471f52676"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_6a9775008add570dc3e5a0bab7"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_289102542903593026bd16e4e1"
        `);
        await queryRunner.query(`
            ALTER TABLE "tag"
                RENAME TO "temporary_tag"
        `);
        await queryRunner.query(`
            CREATE TABLE "tag" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_6a9775008add570dc3e5a0bab7b" UNIQUE ("name"),
                CONSTRAINT "UQ_289102542903593026bd16e4e1b" UNIQUE ("rawg_id")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "tag"(
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
            FROM "temporary_tag"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_tag"
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_8e4052373c579afc1471f52676" ON "tag" ("id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_6a9775008add570dc3e5a0bab7" ON "tag" ("name")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_289102542903593026bd16e4e1" ON "tag" ("rawg_id")
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_f3172007d4de5ae8e7692759d7"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_66df34da7fb037e24fc7fee642"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_45c4541783f264043ec2a5864d"
        `);
        await queryRunner.query(`
            ALTER TABLE "store"
                RENAME TO "temporary_store"
        `);
        await queryRunner.query(`
            CREATE TABLE "store" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_66df34da7fb037e24fc7fee642b" UNIQUE ("name"),
                CONSTRAINT "UQ_45c4541783f264043ec2a5864d6" UNIQUE ("rawg_id")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "store"(
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
            FROM "temporary_store"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_store"
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_f3172007d4de5ae8e7692759d7" ON "store" ("id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_66df34da7fb037e24fc7fee642" ON "store" ("name")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_45c4541783f264043ec2a5864d" ON "store" ("rawg_id")
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_70a5936b43177f76161724da3e"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_9dc496f2e5b912da9edd2aa445"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_4a0539222ee1307f657f875003"
        `);
        await queryRunner.query(`
            ALTER TABLE "publisher"
                RENAME TO "temporary_publisher"
        `);
        await queryRunner.query(`
            CREATE TABLE "publisher" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_9dc496f2e5b912da9edd2aa4455" UNIQUE ("name"),
                CONSTRAINT "UQ_4a0539222ee1307f657f875003b" UNIQUE ("rawg_id")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "publisher"(
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
            FROM "temporary_publisher"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_publisher"
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_70a5936b43177f76161724da3e" ON "publisher" ("id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_9dc496f2e5b912da9edd2aa445" ON "publisher" ("name")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_4a0539222ee1307f657f875003" ON "publisher" ("rawg_id")
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_0285d4f1655d080cfcf7d1ab14"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_dd8cd9e50dd049656e4be1f7e8"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_672bce67ec8cb2d7755c158ad6"
        `);
        await queryRunner.query(`
            ALTER TABLE "genre"
                RENAME TO "temporary_genre"
        `);
        await queryRunner.query(`
            CREATE TABLE "genre" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_dd8cd9e50dd049656e4be1f7e8c" UNIQUE ("name"),
                CONSTRAINT "UQ_672bce67ec8cb2d7755c158ad65" UNIQUE ("rawg_id")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "genre"(
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
            FROM "temporary_genre"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_genre"
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_0285d4f1655d080cfcf7d1ab14" ON "genre" ("id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_dd8cd9e50dd049656e4be1f7e8" ON "genre" ("name")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_672bce67ec8cb2d7755c158ad6" ON "genre" ("rawg_id")
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_71b846918f80786eed6bfb68b7"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_5c2989f7bc37f907cfd937c0fd"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_5c0cd47a75116720223e43db85"
        `);
        await queryRunner.query(`
            ALTER TABLE "developer"
                RENAME TO "temporary_developer"
        `);
        await queryRunner.query(`
            CREATE TABLE "developer" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_5c2989f7bc37f907cfd937c0fd0" UNIQUE ("name"),
                CONSTRAINT "UQ_5c0cd47a75116720223e43db853" UNIQUE ("rawg_id")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "developer"(
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
            FROM "temporary_developer"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_developer"
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_71b846918f80786eed6bfb68b7" ON "developer" ("id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_5c2989f7bc37f907cfd937c0fd" ON "developer" ("name")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_5c0cd47a75116720223e43db85" ON "developer" ("rawg_id")
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_8e4052373c579afc1471f52676"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_6a9775008add570dc3e5a0bab7"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_289102542903593026bd16e4e1"
        `);
        await queryRunner.query(`
            ALTER TABLE "tag"
                RENAME TO "temporary_tag"
        `);
        await queryRunner.query(`
            CREATE TABLE "tag" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_6a9775008add570dc3e5a0bab7b" UNIQUE ("name"),
                CONSTRAINT "UQ_289102542903593026bd16e4e1b" UNIQUE ("rawg_id")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "tag"(
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
            FROM "temporary_tag"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_tag"
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_8e4052373c579afc1471f52676" ON "tag" ("id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_6a9775008add570dc3e5a0bab7" ON "tag" ("name")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_289102542903593026bd16e4e1" ON "tag" ("rawg_id")
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_f3172007d4de5ae8e7692759d7"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_66df34da7fb037e24fc7fee642"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_45c4541783f264043ec2a5864d"
        `);
        await queryRunner.query(`
            ALTER TABLE "store"
                RENAME TO "temporary_store"
        `);
        await queryRunner.query(`
            CREATE TABLE "store" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_66df34da7fb037e24fc7fee642b" UNIQUE ("name"),
                CONSTRAINT "UQ_45c4541783f264043ec2a5864d6" UNIQUE ("rawg_id")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "store"(
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
            FROM "temporary_store"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_store"
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_f3172007d4de5ae8e7692759d7" ON "store" ("id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_66df34da7fb037e24fc7fee642" ON "store" ("name")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_45c4541783f264043ec2a5864d" ON "store" ("rawg_id")
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_70a5936b43177f76161724da3e"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_9dc496f2e5b912da9edd2aa445"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_4a0539222ee1307f657f875003"
        `);
        await queryRunner.query(`
            ALTER TABLE "publisher"
                RENAME TO "temporary_publisher"
        `);
        await queryRunner.query(`
            CREATE TABLE "publisher" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_9dc496f2e5b912da9edd2aa4455" UNIQUE ("name"),
                CONSTRAINT "UQ_4a0539222ee1307f657f875003b" UNIQUE ("rawg_id")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "publisher"(
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
            FROM "temporary_publisher"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_publisher"
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_70a5936b43177f76161724da3e" ON "publisher" ("id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_9dc496f2e5b912da9edd2aa445" ON "publisher" ("name")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_4a0539222ee1307f657f875003" ON "publisher" ("rawg_id")
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_0285d4f1655d080cfcf7d1ab14"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_dd8cd9e50dd049656e4be1f7e8"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_672bce67ec8cb2d7755c158ad6"
        `);
        await queryRunner.query(`
            ALTER TABLE "genre"
                RENAME TO "temporary_genre"
        `);
        await queryRunner.query(`
            CREATE TABLE "genre" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_dd8cd9e50dd049656e4be1f7e8c" UNIQUE ("name"),
                CONSTRAINT "UQ_672bce67ec8cb2d7755c158ad65" UNIQUE ("rawg_id")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "genre"(
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
            FROM "temporary_genre"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_genre"
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_0285d4f1655d080cfcf7d1ab14" ON "genre" ("id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_dd8cd9e50dd049656e4be1f7e8" ON "genre" ("name")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_672bce67ec8cb2d7755c158ad6" ON "genre" ("rawg_id")
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_71b846918f80786eed6bfb68b7"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_5c2989f7bc37f907cfd937c0fd"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_5c0cd47a75116720223e43db85"
        `);
        await queryRunner.query(`
            ALTER TABLE "developer"
                RENAME TO "temporary_developer"
        `);
        await queryRunner.query(`
            CREATE TABLE "developer" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "name" varchar NOT NULL,
                CONSTRAINT "UQ_5c2989f7bc37f907cfd937c0fd0" UNIQUE ("name"),
                CONSTRAINT "UQ_5c0cd47a75116720223e43db853" UNIQUE ("rawg_id")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "developer"(
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
            FROM "temporary_developer"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_developer"
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_71b846918f80786eed6bfb68b7" ON "developer" ("id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_5c2989f7bc37f907cfd937c0fd" ON "developer" ("name")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_5c0cd47a75116720223e43db85" ON "developer" ("rawg_id")
        `);
    }

}