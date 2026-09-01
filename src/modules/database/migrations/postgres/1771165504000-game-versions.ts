import { MigrationInterface, type QueryRunner } from "typeorm";

export class GameVersions1771165504000 implements MigrationInterface {
  name = "GameVersions1771165504000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS game_version (
        id SERIAL NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now(),
        deleted_at TIMESTAMP,
        entity_version integer NOT NULL DEFAULT 1,
        game_id integer NOT NULL,
        file_path character varying NOT NULL,
        version character varying,
        size bigint NOT NULL DEFAULT '0',
        release_date TIMESTAMP,
        early_access boolean NOT NULL DEFAULT false,
        type character varying NOT NULL DEFAULT 'UNDETECTABLE',
        indexed_at TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT PK_272f36b21fb4f0c43edd12fcfbe PRIMARY KEY (id),
        CONSTRAINT UQ_b0b88b548562b921436bdacea35 UNIQUE (game_id, file_path)
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_272f36b21fb4f0c43edd12fcfb ON game_version (id);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_5a4e407c2898e29b00136632b3 ON game_version (game_id);
    `);

    await queryRunner.query(`
      ALTER TABLE game_version
      ADD CONSTRAINT FK_5a4e407c2898e29b00136632b33
      FOREIGN KEY (game_id) REFERENCES gamevault_game(id)
      ON DELETE CASCADE ON UPDATE NO ACTION;
    `);

    await queryRunner.query(`
      INSERT INTO game_version (
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
        g.type::text,
        COALESCE(g.updated_at, g.created_at, now())
      FROM gamevault_game g
      WHERE g.file_path IS NOT NULL
      ON CONFLICT (game_id, file_path) DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE game_version
      DROP CONSTRAINT IF EXISTS FK_5a4e407c2898e29b00136632b33;
    `);

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
