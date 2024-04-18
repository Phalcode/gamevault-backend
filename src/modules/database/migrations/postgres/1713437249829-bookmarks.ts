import { MigrationInterface, QueryRunner } from "typeorm";

export class Bookmarks1713437249829 implements MigrationInterface {
  name = "Bookmarks1713437249829";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "bookmarks" (
                "gamevault_user_id" integer NOT NULL,
                "game_id" integer NOT NULL,
                CONSTRAINT "PK_325b35ab3e3c642acdc990b96bf" PRIMARY KEY ("gamevault_user_id", "game_id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_90b8e2ed41d03127a4a9dbd839" ON "bookmarks" ("gamevault_user_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_8990e34bae4dca1bed3c9ab14d" ON "bookmarks" ("game_id")
        `);
    await queryRunner.query(`
            ALTER TABLE "bookmarks"
            ADD CONSTRAINT "FK_90b8e2ed41d03127a4a9dbd8392" FOREIGN KEY ("gamevault_user_id") REFERENCES "gamevault_user"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `);
    await queryRunner.query(`
            ALTER TABLE "bookmarks"
            ADD CONSTRAINT "FK_8990e34bae4dca1bed3c9ab14d7" FOREIGN KEY ("game_id") REFERENCES "game"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "bookmarks" DROP CONSTRAINT "FK_8990e34bae4dca1bed3c9ab14d7"
        `);
    await queryRunner.query(`
            ALTER TABLE "bookmarks" DROP CONSTRAINT "FK_90b8e2ed41d03127a4a9dbd8392"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_8990e34bae4dca1bed3c9ab14d"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_90b8e2ed41d03127a4a9dbd839"
        `);
    await queryRunner.query(`
            DROP TABLE "bookmarks"
        `);
  }
}
