import { MigrationInterface, QueryRunner } from "typeorm";
import { AddDirectPlay1689638400000 } from "./1689638400000-add-direct-play";

export class AddGameType1689984000000 implements MigrationInterface {
  name = "AddGameType1689984000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "game"
      ADD COLUMN "type" varchar CHECK(
        "type" IN (
            'UNDETECTABLE',
            'WINDOWS_PORTABLE',
            'WINDOWS_SETUP'
        )
    ) NOT NULL DEFAULT 'UNDETECTABLE';`);

    await queryRunner.query(`
      UPDATE "game"
      SET "type" = CASE
                   WHEN "direct_play" = true THEN 'WINDOWS_PORTABLE'
                   ELSE 'UNDETECTABLE'
                   END;`);

    await new AddDirectPlay1689638400000().down(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await new AddDirectPlay1689638400000().up(queryRunner);

    await queryRunner.query(`
    UPDATE "game"
    SET "direct_play" = CASE
                 WHEN type = 'WINDOWS_PORTABLE' THEN 1
                 ELSE 0
                 END;`);

    await queryRunner.query(`
      ALTER TABLE "game" DROP COLUMN "type";`);
  }
}
