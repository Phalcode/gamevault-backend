import { MigrationInterface, QueryRunner } from "typeorm";
import { AddDirectPlay1689638400000 } from "./1689638400000-add-direct-play";

export class AddGameType1689984000000 implements MigrationInterface {
  name = "AddGameType1689984000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."game_type_enum" AS ENUM (
        'UNDETECTABLE',
        'SETUP_NEEDED',
        'DIRECT_PLAY'
      );`);

    await queryRunner.query(`
      ALTER TABLE "public"."game"
      ADD COLUMN "type" "public"."game_type_enum" NOT NULL DEFAULT 'UNDETECTABLE';`);

    await queryRunner.query(`
      UPDATE "public"."game"
      SET "type" = CASE
                    WHEN "direct_play" = true THEN 'DIRECT_PLAY'::game_type_enum
                    ELSE 'UNDETECTABLE'::game_type_enum
                  END;
      `);

    await new AddDirectPlay1689638400000().down(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await new AddDirectPlay1689638400000().up(queryRunner);

    await queryRunner.query(`
    UPDATE "public"."game"
    SET "direct_play" = CASE
                 WHEN type = "DIRECT_PLAY" THEN true
                 ELSE false
                 END;`);

    await queryRunner.query(`
      ALTER TABLE "public"."game" DROP COLUMN "type";`);

    await queryRunner.query(`
      DROP TYPE IF EXISTS "public"."game_type_enum";`);
  }
}
