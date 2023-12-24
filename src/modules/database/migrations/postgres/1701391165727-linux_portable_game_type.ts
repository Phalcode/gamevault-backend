import { MigrationInterface, QueryRunner } from "typeorm";

export class LinuxPortableGameType1701391165727 implements MigrationInterface {
  name = "LinuxPortableGameType1701391165727";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TYPE "public"."game_type_enum"
            RENAME TO "game_type_enum_old"
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."game_type_enum" AS ENUM(
                'UNDETECTABLE',
                'WINDOWS_SETUP',
                'WINDOWS_PORTABLE',
                'LINUX_PORTABLE'
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "game"
            ALTER COLUMN "type" DROP DEFAULT
        `);
    await queryRunner.query(`
            ALTER TABLE "game"
            ALTER COLUMN "type" TYPE "public"."game_type_enum" USING "type"::"text"::"public"."game_type_enum"
        `);
    await queryRunner.query(`
            ALTER TABLE "game"
            ALTER COLUMN "type"
            SET DEFAULT 'UNDETECTABLE'
        `);
    await queryRunner.query(`
            DROP TYPE "public"."game_type_enum_old"
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "public"."game_type_enum_old" AS ENUM(
                'UNDETECTABLE',
                'WINDOWS_SETUP',
                'WINDOWS_PORTABLE'
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "game"
            ALTER COLUMN "type" DROP DEFAULT
        `);
    await queryRunner.query(`
            ALTER TABLE "game"
            ALTER COLUMN "type" TYPE "public"."game_type_enum_old" USING "type"::"text"::"public"."game_type_enum_old"
        `);
    await queryRunner.query(`
            ALTER TABLE "game"
            ALTER COLUMN "type"
            SET DEFAULT 'UNDETECTABLE'
        `);
    await queryRunner.query(`
            DROP TYPE "public"."game_type_enum"
        `);
    await queryRunner.query(`
            ALTER TYPE "public"."game_type_enum_old"
            RENAME TO "game_type_enum"
        `);
  }
}
