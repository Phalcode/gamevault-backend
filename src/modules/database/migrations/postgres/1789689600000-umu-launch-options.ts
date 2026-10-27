import { MigrationInterface, type QueryRunner } from "typeorm";

export class UmuLaunchOptions1789689600000 implements MigrationInterface {
  name = "UmuLaunchOptions1789689600000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE game_metadata
      ADD COLUMN umu_game_id character varying;
    `);
    await queryRunner.query(`
      ALTER TABLE game_metadata
      ADD COLUMN umu_store character varying;
    `);
    await queryRunner.query(`
      ALTER TABLE game_metadata
      ADD COLUMN umu_proton_path character varying;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE game_metadata
      DROP COLUMN umu_proton_path;
    `);
    await queryRunner.query(`
      ALTER TABLE game_metadata
      DROP COLUMN umu_store;
    `);
    await queryRunner.query(`
      ALTER TABLE game_metadata
      DROP COLUMN umu_game_id;
    `);
  }
}
