import { MigrationInterface, QueryRunner } from "typeorm";

export class InstallerParam1749920390990 implements MigrationInterface {
  name = "InstallerParam1749920390990";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          ALTER TABLE game_metadata
          ADD COLUMN installer_parameters varchar;
        `);
    await queryRunner.query(`
          ALTER TABLE game_metadata
          ADD COLUMN uninstaller_executable varchar;
        `);
    await queryRunner.query(`
          ALTER TABLE game_metadata
          ADD COLUMN uninstaller_parameters varchar;
        `);
    await queryRunner.query(`
        UPDATE game_metadata
        SET installer_parameters = '/D="%INSTALLDIR%" /S /DIR="%INSTALLDIR%" /SILENT'
        WHERE provider_slug = 'igdb';
      `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "IDX_8602b8a76c7952d1155118933f"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_0b9f583ebc16b0bb8cbfaf00f8"
        `);
    await queryRunner.query(`
            ALTER TABLE "gamevault_game_provider_metadata_game_metadata"
                RENAME TO "temporary_gamevault_game_provider_metadata_game_metadata"
        `);
    await queryRunner.query(`
            CREATE TABLE "gamevault_game_provider_metadata_game_metadata" (
                "gamevault_game_id" integer NOT NULL,
                "game_metadata_id" integer NOT NULL,
                CONSTRAINT "FK_8602b8a76c7952d1155118933f4" FOREIGN KEY ("gamevault_game_id") REFERENCES "gamevault_game" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
                PRIMARY KEY ("gamevault_game_id", "game_metadata_id")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "gamevault_game_provider_metadata_game_metadata"("gamevault_game_id", "game_metadata_id")
            SELECT "gamevault_game_id",
                "game_metadata_id"
            FROM "temporary_gamevault_game_provider_metadata_game_metadata"
        `);
    await queryRunner.query(`
            DROP TABLE "temporary_gamevault_game_provider_metadata_game_metadata"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_8602b8a76c7952d1155118933f" ON "gamevault_game_provider_metadata_game_metadata" ("gamevault_game_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_0b9f583ebc16b0bb8cbfaf00f8" ON "gamevault_game_provider_metadata_game_metadata" ("game_metadata_id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_7af272a017b850a4ce7a6c2886"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_e9a00e38e7969570d9ab66dd27"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_4f0b69ca308a906932c84ea0d5"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_21c321551d9c772d56e07b2a1a"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_47070ef56d911fa9824f3277e2"
        `);
    await queryRunner.query(`
            DROP INDEX "UQ_GAME_METADATA"
        `);
    await queryRunner.query(`
            ALTER TABLE "game_metadata"
                RENAME TO "temporary_game_metadata"
        `);
    await queryRunner.query(`
            CREATE TABLE "game_metadata" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_at" datetime,
                "entity_version" integer NOT NULL,
                "provider_slug" varchar,
                "provider_data_id" varchar,
                "provider_data_url" varchar,
                "provider_priority" integer,
                "age_rating" integer,
                "title" varchar,
                "release_date" datetime,
                "description" varchar,
                "notes" varchar,
                "average_playtime" integer,
                "url_screenshots" text,
                "url_trailers" text,
                "url_gameplays" text,
                "url_websites" text,
                "rating" float,
                "early_access" boolean,
                "launch_parameters" varchar,
                "launch_executable" varchar,
                "installer_executable" varchar,
                "cover_id" integer,
                "background_id" integer,
                CONSTRAINT "FK_6f44518f2a088b90a8cc804d12f" FOREIGN KEY ("background_id") REFERENCES "media" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT "FK_9aefd37a55b610cea5ea583cdf6" FOREIGN KEY ("cover_id") REFERENCES "media" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `);
    await queryRunner.query(`
            INSERT INTO "game_metadata"(
                    "id",
                    "created_at",
                    "updated_at",
                    "deleted_at",
                    "entity_version",
                    "provider_slug",
                    "provider_data_id",
                    "provider_data_url",
                    "provider_priority",
                    "age_rating",
                    "title",
                    "release_date",
                    "description",
                    "notes",
                    "average_playtime",
                    "url_screenshots",
                    "url_trailers",
                    "url_gameplays",
                    "url_websites",
                    "rating",
                    "early_access",
                    "launch_parameters",
                    "launch_executable",
                    "installer_executable",
                    "cover_id",
                    "background_id"
                )
            SELECT "id",
                "created_at",
                "updated_at",
                "deleted_at",
                "entity_version",
                "provider_slug",
                "provider_data_id",
                "provider_data_url",
                "provider_priority",
                "age_rating",
                "title",
                "release_date",
                "description",
                "notes",
                "average_playtime",
                "url_screenshots",
                "url_trailers",
                "url_gameplays",
                "url_websites",
                "rating",
                "early_access",
                "launch_parameters",
                "launch_executable",
                "installer_executable",
                "cover_id",
                "background_id"
            FROM "temporary_game_metadata"
        `);
    await queryRunner.query(`
            DROP TABLE "temporary_game_metadata"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_7af272a017b850a4ce7a6c2886" ON "game_metadata" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_e9a00e38e7969570d9ab66dd27" ON "game_metadata" ("provider_slug")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_4f0b69ca308a906932c84ea0d5" ON "game_metadata" ("provider_data_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_21c321551d9c772d56e07b2a1a" ON "game_metadata" ("title")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_47070ef56d911fa9824f3277e2" ON "game_metadata" ("release_date")
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "UQ_GAME_METADATA" ON "game_metadata" ("provider_slug", "provider_data_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_30e98e8746699fb9af235410af" ON "session" ("user_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_40ec9e3de37043686fc51ca39e" ON "session" ("revoked")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_2223e981900a413ce4ce6386f9" ON "session" ("expires_at")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_8602b8a76c7952d1155118933f"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_0b9f583ebc16b0bb8cbfaf00f8"
        `);
    await queryRunner.query(`
            ALTER TABLE "gamevault_game_provider_metadata_game_metadata"
                RENAME TO "temporary_gamevault_game_provider_metadata_game_metadata"
        `);
    await queryRunner.query(`
            CREATE TABLE "gamevault_game_provider_metadata_game_metadata" (
                "gamevault_game_id" integer NOT NULL,
                "game_metadata_id" integer NOT NULL,
                CONSTRAINT "FK_0b9f583ebc16b0bb8cbfaf00f8f" FOREIGN KEY ("game_metadata_id") REFERENCES "game_metadata" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT "FK_8602b8a76c7952d1155118933f4" FOREIGN KEY ("gamevault_game_id") REFERENCES "gamevault_game" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
                PRIMARY KEY ("gamevault_game_id", "game_metadata_id")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "gamevault_game_provider_metadata_game_metadata"("gamevault_game_id", "game_metadata_id")
            SELECT "gamevault_game_id",
                "game_metadata_id"
            FROM "temporary_gamevault_game_provider_metadata_game_metadata"
        `);
    await queryRunner.query(`
            DROP TABLE "temporary_gamevault_game_provider_metadata_game_metadata"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_8602b8a76c7952d1155118933f" ON "gamevault_game_provider_metadata_game_metadata" ("gamevault_game_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_0b9f583ebc16b0bb8cbfaf00f8" ON "gamevault_game_provider_metadata_game_metadata" ("game_metadata_id")
        `);
  }
}
