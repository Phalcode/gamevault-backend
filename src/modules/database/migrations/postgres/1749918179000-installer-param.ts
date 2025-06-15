import { MigrationInterface, QueryRunner } from "typeorm";

export class InstallerParam1749918179000 implements MigrationInterface {
  name = "InstallerParam1749918179000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE game_metadata
      ADD COLUMN installer_parameters character varying;
    `);
    await queryRunner.query(`
      ALTER TABLE game_metadata
      ADD COLUMN uninstaller_executable character varying;
    `);
    await queryRunner.query(`
      ALTER TABLE game_metadata
      ADD COLUMN uninstaller_parameters character varying;
    `);
    await queryRunner.query(`
    UPDATE game_metadata
    SET installer_parameters = '/D="%INSTALLDIR%" /S /DIR="%INSTALLDIR%" /SILENT'
    WHERE provider_slug = 'igdb';
  `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE game_metadata
      DROP COLUMN uninstaller_parameters;
    `);
    await queryRunner.query(`
      ALTER TABLE game_metadata
      DROP COLUMN uninstaller_executable;
    `);
    await queryRunner.query(`
      ALTER TABLE game_metadata
      DROP COLUMN installer_parameters;
    `);
  }
}
