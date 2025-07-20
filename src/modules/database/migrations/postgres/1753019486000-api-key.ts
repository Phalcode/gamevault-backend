import { MigrationInterface, QueryRunner } from "typeorm";

export class ApiKey1753019486000 implements MigrationInterface {
  name = "ApiKey1753019486000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE gamevault_user
      RENAME COLUMN socket_secret TO api_key;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE gamevault_user
      RENAME COLUMN api_key TO socket_secret;
    `);
  }
}
