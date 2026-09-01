import { MigrationInterface, type QueryRunner } from "typeorm";

export class GameVersions1771165504000 implements MigrationInterface {
  name = "GameVersions1771165504000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS game_version (
        id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        created_at datetime NOT NULL DEFAULT (datetime('now')),
        updated_at datetime NOT NULL DEFAULT (datetime('now')),
        deleted_at datetime,
        entity_version integer NOT NULL DEFAULT 1,
        game_id integer NOT NULL,
        file_path varchar NOT NULL,
        version varchar,
        size bigint NOT NULL DEFAULT 0,
        release_date datetime,
        early_access boolean NOT NULL DEFAULT 0,
        type varchar NOT NULL DEFAULT 'UNDETECTABLE',
        indexed_at datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT UQ_b0b88b548562b921436bdacea35 UNIQUE (game_id, file_path),
        CONSTRAINT FK_5a4e407c2898e29b00136632b33 FOREIGN KEY (game_id) REFERENCES gamevault_game(id) ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_272f36b21fb4f0c43edd12fcfb ON game_version (id);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_5a4e407c2898e29b00136632b3 ON game_version (game_id);
    `);

    await queryRunner.query(`
      INSERT OR IGNORE INTO game_version (
        game_id,
        deleted_at,
        file_path,
        version,
        size,
        release_date,
        early_access,
        type,
        indexed_at
      )
      SELECT
        g.id,
        g.deleted_at,
        g.file_path,
        g.version,
        g.size,
        g.release_date,
        g.early_access,
        g.type,
        COALESCE(g.updated_at, g.created_at, datetime('now'))
      FROM gamevault_game g
      WHERE g.file_path IS NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS IDX_5a4e407c2898e29b00136632b3;
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS IDX_272f36b21fb4f0c43edd12fcfb;
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS game_version;
    `);
  }
}
