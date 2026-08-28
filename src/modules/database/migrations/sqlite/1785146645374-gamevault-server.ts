import { MigrationInterface, QueryRunner } from "typeorm";

export class GamevaultServer1785146645374 implements MigrationInterface {
  name = "GamevaultServer1785146645374";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS gamevault_server (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        created_at datetime NOT NULL DEFAULT (datetime('now')),
        updated_at datetime NOT NULL DEFAULT (datetime('now')),
        deleted_at datetime,
        entity_version integer NOT NULL DEFAULT 1,
        uuid varchar NOT NULL,
        CONSTRAINT UQ_gamevault_server_uuid UNIQUE (uuid)
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_gamevault_server_id ON gamevault_server (id);
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS IDX_gamevault_server_uuid ON gamevault_server (uuid);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS IDX_gamevault_server_uuid;
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS IDX_gamevault_server_id;
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS gamevault_server;
    `);
  }
}
