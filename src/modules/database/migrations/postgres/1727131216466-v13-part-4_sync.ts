import { NotImplementedException } from "@nestjs/common";
import { MigrationInterface, QueryRunner } from "typeorm";

export class V13Part4Sync1727131216466 implements MigrationInterface {
  transaction?: boolean;

  name = "V13Part4Sync1727131216466";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "v12_image" DROP CONSTRAINT "FK_81cba867ad852a0b6402f0e82fb"
        `);
    await queryRunner.query(`
            ALTER TABLE "v12_gamevault_user" DROP CONSTRAINT "FK_4b83e27ed50c1e183a69fceef68"
        `);
    await queryRunner.query(`
            ALTER TABLE "v12_gamevault_user" DROP CONSTRAINT "FK_c1779b9b22212754248aa404bad"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_d6db1ab4ee9ad9dbe86c64e4cc"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_c2a3f8b06558be9508161af22e"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_4c835305e86b28e416cfe13dac"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_352a30652cd352f552fef73dec"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_0b50d89427a7a8aa095340a30f"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_7770cb331bdc54951bb9046fa9"
        `);
    await queryRunner.query(`
            ALTER TABLE "v12_game" DROP CONSTRAINT "FK_58972db9052aa0dbc1815defd6a"
        `);
    await queryRunner.query(`
            CREATE SEQUENCE IF NOT EXISTS "v12_image_id_seq" OWNED BY "v12_image"."id"
        `);
    await queryRunner.query(`
            ALTER TABLE "v12_image"
            ALTER COLUMN "id"
            SET DEFAULT nextval('"v12_image_id_seq"')
        `);
    await queryRunner.query(`
            ALTER TABLE "v12_image"
            ALTER COLUMN "id" DROP DEFAULT
        `);
    await queryRunner.query(`
            ALTER TABLE "v12_progress" DROP CONSTRAINT "FK_c20491fd4d90ac21f386d572013"
        `);
    await queryRunner.query(`
            ALTER TABLE "v12_bookmark" DROP CONSTRAINT "FK_ba0312a26cea7e0d2e4f3a47b3f"
        `);
    await queryRunner.query(`
            CREATE SEQUENCE IF NOT EXISTS "v12_gamevault_user_id_seq" OWNED BY "v12_gamevault_user"."id"
        `);
    await queryRunner.query(`
            ALTER TABLE "v12_gamevault_user"
            ALTER COLUMN "id"
            SET DEFAULT nextval('"v12_gamevault_user_id_seq"')
        `);
    await queryRunner.query(`
            ALTER TABLE "v12_gamevault_user"
            ALTER COLUMN "id" DROP DEFAULT
        `);
    await queryRunner.query(`
            ALTER TYPE "public"."gamevault_user_role_enum"
            RENAME TO "gamevault_user_role_enum_old"
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."v12_gamevault_user_role_enum" AS ENUM('0', '1', '2', '3')
        `);
    await queryRunner.query(`
            ALTER TABLE "v12_gamevault_user"
            ALTER COLUMN "role" DROP DEFAULT
        `);
    await queryRunner.query(`
            ALTER TABLE "v12_gamevault_user"
            ALTER COLUMN "role" TYPE "public"."v12_gamevault_user_role_enum" USING "role"::"text"::"public"."v12_gamevault_user_role_enum"
        `);
    await queryRunner.query(`
            ALTER TABLE "v12_gamevault_user"
            ALTER COLUMN "role"
            SET DEFAULT '1'
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_c2a3f8b06558be9508161af22e" ON "gamevault_user" ("id")
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_4c835305e86b28e416cfe13dac" ON "gamevault_user" ("username")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_9104e2e6a962d5cc0b17c3705d" ON "v12_image" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_fe74c6fdec37f411e4e042e1c7" ON "v12_image" ("path")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_59b393e6f4ed2f9a57e15835a9" ON "v12_gamevault_user" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_d8fa7fb9bde6aa79885c4eed33" ON "v12_gamevault_user" ("username")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_d99731b484bc5fec1cfee9e0fc" ON "v12_game" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_179bcdd73ab43366d14defc706" ON "v12_game" ("release_date")
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_95628db340ba8b2c1ed6add021" ON "v12_game" ("file_path")
        `);
    await queryRunner.query(`
            ALTER TABLE "v12_image"
            ADD CONSTRAINT "FK_2feca751bd268e1f80b094c7fff" FOREIGN KEY ("uploader_id") REFERENCES "v12_gamevault_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "v12_progress"
            ADD CONSTRAINT "FK_c20491fd4d90ac21f386d572013" FOREIGN KEY ("user_id") REFERENCES "v12_gamevault_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "v12_gamevault_user"
            ADD CONSTRAINT "FK_add8fb3363cdc1f4f5248797c1f" FOREIGN KEY ("profile_picture_id") REFERENCES "v12_image"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "v12_gamevault_user"
            ADD CONSTRAINT "FK_b67991f386cfd93877a8c42d134" FOREIGN KEY ("background_image_id") REFERENCES "v12_image"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "v12_game"
            ADD CONSTRAINT "FK_58972db9052aa0dbc1815defd6a" FOREIGN KEY ("background_image_id") REFERENCES "v12_image"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "v12_bookmark"
            ADD CONSTRAINT "FK_ba0312a26cea7e0d2e4f3a47b3f" FOREIGN KEY ("v12_gamevault_user_id") REFERENCES "v12_gamevault_user"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `);
  }

  public async down(): Promise<void> {
    throw new NotImplementedException(
      "There is no way to undo this migration.",
    );
  }
}
