import { MigrationInterface, QueryRunner } from "typeorm";

export class NonUniqueImageSources1694219968449 implements MigrationInterface {
  name = "NonUniqueImageSources1694219968449";

  public async up(queryRunner: QueryRunner): Promise<void> {
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
                "uploader_id" integer,
                CONSTRAINT "UQ_f03b89f33671086e6733828e79c" UNIQUE ("path"),
                CONSTRAINT "FK_81cba867ad852a0b6402f0e82fb" FOREIGN KEY ("uploader_id") REFERENCES "gamevault_user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
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
                    "uploader_id"
                )
            SELECT "id",
                "created_at",
                "updated_at",
                "deleted_at",
                "entity_version",
                "source",
                "path",
                "media_type",
                "uploader_id"
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
                "uploader_id" integer,
                CONSTRAINT "UQ_f03b89f33671086e6733828e79c" UNIQUE ("path"),
                CONSTRAINT "FK_81cba867ad852a0b6402f0e82fb" FOREIGN KEY ("uploader_id") REFERENCES "gamevault_user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
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
                    "uploader_id"
                )
            SELECT "id",
                "created_at",
                "updated_at",
                "deleted_at",
                "entity_version",
                "source",
                "path",
                "media_type",
                "uploader_id"
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
                "email" varchar,
                "first_name" varchar,
                "last_name" varchar,
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
                "email" varchar,
                "first_name" varchar,
                "last_name" varchar,
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
                "source" varchar,
                "path" varchar,
                "media_type" varchar,
                "uploader_id" integer,
                CONSTRAINT "UQ_f03b89f33671086e6733828e79c" UNIQUE ("path"),
                CONSTRAINT "FK_81cba867ad852a0b6402f0e82fb" FOREIGN KEY ("uploader_id") REFERENCES "gamevault_user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
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
                    "media_type",
                    "uploader_id"
                )
            SELECT "id",
                "created_at",
                "updated_at",
                "deleted_at",
                "entity_version",
                "source",
                "path",
                "media_type",
                "uploader_id"
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
                "source" varchar,
                "path" varchar,
                "media_type" varchar,
                "uploader_id" integer,
                CONSTRAINT "UQ_f03b89f33671086e6733828e79c" UNIQUE ("path"),
                CONSTRAINT "FK_81cba867ad852a0b6402f0e82fb" FOREIGN KEY ("uploader_id") REFERENCES "gamevault_user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
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
                    "media_type",
                    "uploader_id"
                )
            SELECT "id",
                "created_at",
                "updated_at",
                "deleted_at",
                "entity_version",
                "source",
                "path",
                "media_type",
                "uploader_id"
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
  }
}
