import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateIndices1695590724678 implements MigrationInterface {
  name = "CreateIndices1695590724678";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "IDX_e0626148aee5829fd312447001"
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
                CONSTRAINT "UQ_d0e7d50057240e5752a2c303ffb" UNIQUE ("email"),
                CONSTRAINT "UQ_ad2fda40ce941655c838fb1435f" UNIQUE ("username"),
                CONSTRAINT "FK_4b83e27ed50c1e183a69fceef68" FOREIGN KEY ("background_image_id") REFERENCES "image" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_c1779b9b22212754248aa404bad" FOREIGN KEY ("profile_picture_id") REFERENCES "image" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
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
            CREATE INDEX "IDX_0285d4f1655d080cfcf7d1ab14" ON "genre" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_dd8cd9e50dd049656e4be1f7e8" ON "genre" ("name")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_d6db1ab4ee9ad9dbe86c64e4cc" ON "image" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_c2a3f8b06558be9508161af22e" ON "gamevault_user" ("id")
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
            CREATE INDEX "IDX_70a5936b43177f76161724da3e" ON "publisher" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_9dc496f2e5b912da9edd2aa445" ON "publisher" ("name")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_f3172007d4de5ae8e7692759d7" ON "store" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_66df34da7fb037e24fc7fee642" ON "store" ("name")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_8e4052373c579afc1471f52676" ON "tag" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_6a9775008add570dc3e5a0bab7" ON "tag" ("name")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_352a30652cd352f552fef73dec" ON "game" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_71b846918f80786eed6bfb68b7" ON "developer" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_5c2989f7bc37f907cfd937c0fd" ON "developer" ("name")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "IDX_5c2989f7bc37f907cfd937c0fd"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_71b846918f80786eed6bfb68b7"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_352a30652cd352f552fef73dec"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_6a9775008add570dc3e5a0bab7"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_8e4052373c579afc1471f52676"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_66df34da7fb037e24fc7fee642"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_f3172007d4de5ae8e7692759d7"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_9dc496f2e5b912da9edd2aa445"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_70a5936b43177f76161724da3e"
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
            DROP INDEX "IDX_c2a3f8b06558be9508161af22e"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_d6db1ab4ee9ad9dbe86c64e4cc"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_dd8cd9e50dd049656e4be1f7e8"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_0285d4f1655d080cfcf7d1ab14"
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
                CONSTRAINT "UQ_d0e7d50057240e5752a2c303ffb" UNIQUE ("email"),
                CONSTRAINT "UQ_ad2fda40ce941655c838fb1435f" UNIQUE ("username"),
                CONSTRAINT "FK_4b83e27ed50c1e183a69fceef68" FOREIGN KEY ("background_image_id") REFERENCES "image" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
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
            CREATE INDEX "IDX_e0626148aee5829fd312447001" ON "image" ("source")
        `);
  }
}
