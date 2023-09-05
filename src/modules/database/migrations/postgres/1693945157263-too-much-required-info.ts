import { MigrationInterface, QueryRunner } from "typeorm";

export class TooMuchRequiredInfo1693945157263 implements MigrationInterface {
  name = "TooMuchRequiredInfo1693945157263";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "gamevault_user"
            ALTER COLUMN "email" DROP NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "gamevault_user"
            ALTER COLUMN "first_name" DROP NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "gamevault_user"
            ALTER COLUMN "last_name" DROP NOT NULL
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "gamevault_user"
            ALTER COLUMN "last_name"
            SET NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "gamevault_user"
            ALTER COLUMN "first_name"
            SET NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "gamevault_user"
            ALTER COLUMN "email"
            SET NOT NULL
        `);
  }
}
