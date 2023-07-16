import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameToGamevault1689550215000 implements MigrationInterface {
  name = "RenameToGamevault1689550215000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.renameTable("crackpipe_user", "gamevault_user");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.renameTable("gamevault_user", "crackpipe_user");
  }
}
