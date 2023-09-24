import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateIndices1695590841420 implements MigrationInterface {
  name = "CreateIndices1695590841420";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "public"."IDX_e0626148aee5829fd312447001"
        `);
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_0285d4f1655d080cfcf7d1ab14" ON "genre" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_dd8cd9e50dd049656e4be1f7e8" ON "genre" ("name")
        `);
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_d6db1ab4ee9ad9dbe86c64e4cc" ON "image" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_c2a3f8b06558be9508161af22e" ON "gamevault_user" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_79abdfd87a688f9de756a162b6" ON "progress" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_ddcaca3a9db9d77105d51c02c2" ON "progress" ("user_id")
        `);
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_feaddf361921db1df3a6fe3965" ON "progress" ("game_id")
        `);
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_70a5936b43177f76161724da3e" ON "publisher" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_9dc496f2e5b912da9edd2aa445" ON "publisher" ("name")
        `);
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_f3172007d4de5ae8e7692759d7" ON "store" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_66df34da7fb037e24fc7fee642" ON "store" ("name")
        `);
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_8e4052373c579afc1471f52676" ON "tag" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_6a9775008add570dc3e5a0bab7" ON "tag" ("name")
        `);
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_352a30652cd352f552fef73dec" ON "game" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_71b846918f80786eed6bfb68b7" ON "developer" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_5c2989f7bc37f907cfd937c0fd" ON "developer" ("name")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "public"."IDX_5c2989f7bc37f907cfd937c0fd"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_71b846918f80786eed6bfb68b7"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_352a30652cd352f552fef73dec"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_6a9775008add570dc3e5a0bab7"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_8e4052373c579afc1471f52676"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_66df34da7fb037e24fc7fee642"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_f3172007d4de5ae8e7692759d7"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_9dc496f2e5b912da9edd2aa445"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_70a5936b43177f76161724da3e"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_feaddf361921db1df3a6fe3965"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_ddcaca3a9db9d77105d51c02c2"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_79abdfd87a688f9de756a162b6"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_c2a3f8b06558be9508161af22e"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_d6db1ab4ee9ad9dbe86c64e4cc"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_dd8cd9e50dd049656e4be1f7e8"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_0285d4f1655d080cfcf7d1ab14"
        `);
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_e0626148aee5829fd312447001" ON "image" ("source")
        `);
  }
}
