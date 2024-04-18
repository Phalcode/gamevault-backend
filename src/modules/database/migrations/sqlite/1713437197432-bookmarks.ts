import { MigrationInterface, QueryRunner } from "typeorm";

export class Bookmarks1713437197432 implements MigrationInterface {
  name = "Bookmarks1713437197432";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "bookmark" (
                "gamevault_user_id" integer NOT NULL,
                "game_id" integer NOT NULL,
                PRIMARY KEY ("gamevault_user_id", "game_id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_90b8e2ed41d03127a4a9dbd839" ON "bookmark" ("gamevault_user_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_8990e34bae4dca1bed3c9ab14d" ON "bookmark" ("game_id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_90b8e2ed41d03127a4a9dbd839"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_8990e34bae4dca1bed3c9ab14d"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_bookmark" (
                "gamevault_user_id" integer NOT NULL,
                "game_id" integer NOT NULL,
                CONSTRAINT "FK_90b8e2ed41d03127a4a9dbd8392" FOREIGN KEY ("gamevault_user_id") REFERENCES "gamevault_user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT "FK_8990e34bae4dca1bed3c9ab14d7" FOREIGN KEY ("game_id") REFERENCES "game" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                PRIMARY KEY ("gamevault_user_id", "game_id")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_bookmark"("gamevault_user_id", "game_id")
            SELECT "gamevault_user_id",
                "game_id"
            FROM "bookmark"
        `);
    await queryRunner.query(`
            DROP TABLE "bookmark"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_bookmark"
                RENAME TO "bookmark"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_90b8e2ed41d03127a4a9dbd839" ON "bookmark" ("gamevault_user_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_8990e34bae4dca1bed3c9ab14d" ON "bookmark" ("game_id")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "IDX_8990e34bae4dca1bed3c9ab14d"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_90b8e2ed41d03127a4a9dbd839"
        `);
    await queryRunner.query(`
            ALTER TABLE "bookmark"
                RENAME TO "temporary_bookmark"
        `);
    await queryRunner.query(`
            CREATE TABLE "bookmark" (
                "gamevault_user_id" integer NOT NULL,
                "game_id" integer NOT NULL,
                PRIMARY KEY ("gamevault_user_id", "game_id")
            )
        `);
    await queryRunner.query(`
            INSERT INTO "bookmark"("gamevault_user_id", "game_id")
            SELECT "gamevault_user_id",
                "game_id"
            FROM "temporary_bookmark"
        `);
    await queryRunner.query(`
            DROP TABLE "temporary_bookmark"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_8990e34bae4dca1bed3c9ab14d" ON "bookmark" ("game_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_90b8e2ed41d03127a4a9dbd839" ON "bookmark" ("gamevault_user_id")
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_8990e34bae4dca1bed3c9ab14d"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_90b8e2ed41d03127a4a9dbd839"
        `);
    await queryRunner.query(`
            DROP TABLE "bookmark"
        `);
  }
}
