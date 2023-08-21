import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDirectPlay1689638400000 implements MigrationInterface {
  name = "AddDirectPlay1689638400000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE game ADD COLUMN direct_play BOOLEAN NOT NULL DEFAULT 0;",
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("ALTER TABLE game DROP COLUMN direct_play;");
  }
}
