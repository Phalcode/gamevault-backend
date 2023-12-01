import { MigrationInterface, QueryRunner } from "typeorm";

export class LinuxPortableGameType1701390536797 implements MigrationInterface {
  name = "LinuxPortableGameType1701390536797";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "IDX_c2a3f8b06558be9508161af22e"
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
                "socket_secret" varchar(64) NOT NULL,
                CONSTRAINT "UQ_ad2fda40ce941655c838fb1435f" UNIQUE ("username"),
                CONSTRAINT "UQ_d0e7d50057240e5752a2c303ffb" UNIQUE ("email"),
                CONSTRAINT "UQ_87a411128cdc9520aede81ba929" UNIQUE ("socket_secret"),
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
                    "background_image_id",
                    "socket_secret"
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
                "background_image_id",
                "socket_secret"
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
            CREATE INDEX "IDX_c2a3f8b06558be9508161af22e" ON "gamevault_user" ("id")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "IDX_c2a3f8b06558be9508161af22e"
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
                "socket_secret" varchar(64) NOT NULL,
                CONSTRAINT "UQ_ad2fda40ce941655c838fb1435f" UNIQUE ("username"),
                CONSTRAINT "UQ_d0e7d50057240e5752a2c303ffb" UNIQUE ("email"),
                CONSTRAINT "UQ_87a411128cdc9520aede81ba929" UNIQUE ("socket_secret"),
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
                    "background_image_id",
                    "socket_secret"
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
                "background_image_id",
                "socket_secret"
            FROM "temporary_gamevault_user"
        `);
    await queryRunner.query(`
            DROP TABLE "temporary_gamevault_user"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_c2a3f8b06558be9508161af22e" ON "gamevault_user" ("id")
        `);
  }
}
