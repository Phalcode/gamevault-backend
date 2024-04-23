import { MigrationInterface, QueryRunner } from "typeorm";

export class NewIndexes1713526846245 implements MigrationInterface {
  name = "NewIndexes1713526846245";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_99bd20f783c41fe05489a0aca5" ON "bookmark" ("game_id")
        `);
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_5c0cd47a75116720223e43db85" ON "developer" ("rawg_id")
        `);
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_672bce67ec8cb2d7755c158ad6" ON "genre" ("rawg_id")
        `);
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_4a0539222ee1307f657f875003" ON "publisher" ("rawg_id")
        `);
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_45c4541783f264043ec2a5864d" ON "store" ("rawg_id")
        `);
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_289102542903593026bd16e4e1" ON "tag" ("rawg_id")
        `);
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_0b50d89427a7a8aa095340a30f" ON "game" ("release_date")
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "IDX_7770cb331bdc54951bb9046fa9" ON "game" ("file_path")
        `);
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_4c835305e86b28e416cfe13dac" ON "gamevault_user" ("username")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "IDX_99bd20f783c41fe05489a0aca5"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_5c0cd47a75116720223e43db85"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_672bce67ec8cb2d7755c158ad6"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_4a0539222ee1307f657f875003"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_45c4541783f264043ec2a5864d"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_289102542903593026bd16e4e1"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_0b50d89427a7a8aa095340a30f"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_7770cb331bdc54951bb9046fa9"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_4c835305e86b28e416cfe13dac"
        `);
  }
}
