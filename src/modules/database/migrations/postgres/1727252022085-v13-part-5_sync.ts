import { NotImplementedException } from "@nestjs/common";
import { MigrationInterface, QueryRunner } from "typeorm";

export class V13Part5Sync1727252022085 implements MigrationInterface {
  name = "V13Part5Sync1727252022085";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "gamevault_user" 
            DROP CONSTRAINT IF EXISTS "UQ_e0da4bbf1074bca2d980a810771"
        `);
    await queryRunner.query(`
            ALTER TABLE "gamevault_user"
            ADD CONSTRAINT "UQ_e0da4bbf1074bca2d980a810771" UNIQUE ("socket_secret")
        `);
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_c2a3f8b06558be9508161af22e" ON "gamevault_user" ("id")
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "IDX_4c835305e86b28e416cfe13dac" ON "gamevault_user" ("username")
        `);
  }

  public async down(): Promise<void> {
    throw new NotImplementedException(
      "There is no way to undo this migration.",
    );
  }
}
