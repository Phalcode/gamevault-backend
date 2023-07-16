import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameToGamevault1689550215000 implements MigrationInterface {
  name = "RenameToGamevault1689550215000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE crackpipe_user RENAME TO gamevault_user;",
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE gamevault_user RENAME TO crackpipe_user;",
    );
  }
}
