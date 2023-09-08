import { MigrationInterface, QueryRunner } from "typeorm";

export class ImageUploader1694211775520 implements MigrationInterface {
  name = "ImageUploader1694211775520";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE IF EXISTS "gamevault_user" DROP CONSTRAINT IF EXISTS "FK_3a56876605551fa369cbcd09c41"
        `);
    await queryRunner.query(`
            ALTER TABLE IF EXISTS "gamevault_user" DROP CONSTRAINT IF EXISTS "FK_4a135b04a00cf3e3653cd585334"
        `);
    await queryRunner.query(`
            ALTER TABLE "image"
            ADD "uploader_id" integer
        `);

    await queryRunner.query(
      `ALTER TABLE "image" DROP CONSTRAINT IF EXISTS "UQ_e0626148aee5829fd312447001a"`,
    );
    await queryRunner.query(`
            ALTER TABLE "image"
            ADD CONSTRAINT "UQ_e0626148aee5829fd312447001a" UNIQUE ("source")
        `);

    await queryRunner.query(`
            ALTER TABLE "progress" DROP CONSTRAINT IF EXISTS "FK_ddcaca3a9db9d77105d51c02c24"
        `);
    await queryRunner.query(`
            CREATE SEQUENCE IF NOT EXISTS "gamevault_user_id_seq" OWNED BY "gamevault_user"."id"
        `);
    await queryRunner.query(`
            ALTER TABLE "gamevault_user"
            ALTER COLUMN "id"
            SET DEFAULT nextval('"gamevault_user_id_seq"')
        `);
    await queryRunner.query(`
            ALTER TABLE "gamevault_user"
            ALTER COLUMN "id" DROP DEFAULT
        `);
    await queryRunner.query(`
        DO $$ 
        BEGIN 
            IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'crackpipe_user_role_enum' AND typtype = 'e') THEN 
                ALTER TYPE "public"."crackpipe_user_role_enum" RENAME TO "crackpipe_user_role_enum_old"; 
            END IF; 
        END $$;
    `);
    await queryRunner.query(`
    DO $$ 
    BEGIN 
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gamevault_user_role_enum' AND typtype = 'e') THEN 
            CREATE TYPE "public"."gamevault_user_role_enum" AS ENUM('0', '1', '2', '3'); 
        END IF; 
    END $$;
`);
    await queryRunner.query(`
            ALTER TABLE "gamevault_user"
            ALTER COLUMN "role" DROP DEFAULT
        `);
    await queryRunner.query(`
            ALTER TABLE "gamevault_user"
            ALTER COLUMN "role" TYPE "public"."gamevault_user_role_enum" USING "role"::"text"::"public"."gamevault_user_role_enum"
        `);
    await queryRunner.query(`
            ALTER TABLE "gamevault_user"
            ALTER COLUMN "role"
            SET DEFAULT '1'
        `);
    await queryRunner.query(`
            DROP TYPE IF EXISTS "public"."crackpipe_user_role_enum_old"
        `);

    await queryRunner.query(
      `ALTER TABLE "image" DROP CONSTRAINT IF EXISTS "FK_81cba867ad852a0b6402f0e82fb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "gamevault_user" DROP CONSTRAINT IF EXISTS "FK_c1779b9b22212754248aa404bad"`,
    );
    await queryRunner.query(
      `ALTER TABLE "gamevault_user" DROP CONSTRAINT IF EXISTS "FK_4b83e27ed50c1e183a69fceef68"`,
    );
    await queryRunner.query(
      `ALTER TABLE "progress" DROP CONSTRAINT IF EXISTS "FK_ddcaca3a9db9d77105d51c02c24"`,
    );

    await queryRunner.query(`
            ALTER TABLE "image"
            ADD CONSTRAINT "FK_81cba867ad852a0b6402f0e82fb" FOREIGN KEY ("uploader_id") REFERENCES "gamevault_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "gamevault_user"
            ADD CONSTRAINT "FK_c1779b9b22212754248aa404bad" FOREIGN KEY ("profile_picture_id") REFERENCES "image"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "gamevault_user"
            ADD CONSTRAINT "FK_4b83e27ed50c1e183a69fceef68" FOREIGN KEY ("background_image_id") REFERENCES "image"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "progress"
            ADD CONSTRAINT "FK_ddcaca3a9db9d77105d51c02c24" FOREIGN KEY ("user_id") REFERENCES "gamevault_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "progress" DROP CONSTRAINT "FK_ddcaca3a9db9d77105d51c02c24"
        `);
    await queryRunner.query(`
            ALTER TABLE "gamevault_user" DROP CONSTRAINT "FK_4b83e27ed50c1e183a69fceef68"
        `);
    await queryRunner.query(`
            ALTER TABLE "gamevault_user" DROP CONSTRAINT "FK_c1779b9b22212754248aa404bad"
        `);
    await queryRunner.query(`
            ALTER TABLE "image" DROP CONSTRAINT "FK_81cba867ad852a0b6402f0e82fb"
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."crackpipe_user_role_enum_old" AS ENUM('0', '1', '2', '3')
        `);
    await queryRunner.query(`
            ALTER TABLE "gamevault_user"
            ALTER COLUMN "role" DROP DEFAULT
        `);
    await queryRunner.query(`
            ALTER TABLE "gamevault_user"
            ALTER COLUMN "role" TYPE "public"."crackpipe_user_role_enum_old" USING "role"::"text"::"public"."crackpipe_user_role_enum_old"
        `);
    await queryRunner.query(`
            ALTER TABLE "gamevault_user"
            ALTER COLUMN "role"
            SET DEFAULT '1'
        `);
    await queryRunner.query(`
            DROP TYPE "public"."gamevault_user_role_enum"
        `);
    await queryRunner.query(`
            ALTER TYPE "public"."crackpipe_user_role_enum_old"
            RENAME TO "crackpipe_user_role_enum"
        `);
    await queryRunner.query(`
            ALTER TABLE "gamevault_user"
            ALTER COLUMN "id"
            SET DEFAULT nextval('crackpipe_user_id_seq')
        `);
    await queryRunner.query(`
            ALTER TABLE "gamevault_user"
            ALTER COLUMN "id" DROP DEFAULT
        `);
    await queryRunner.query(`
            DROP SEQUENCE "gamevault_user_id_seq"
        `);
    await queryRunner.query(`
            ALTER TABLE "progress"
            ADD CONSTRAINT "FK_ddcaca3a9db9d77105d51c02c24" FOREIGN KEY ("user_id") REFERENCES "gamevault_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "image" DROP CONSTRAINT "UQ_e0626148aee5829fd312447001a"
        `);
    await queryRunner.query(`
            ALTER TABLE "image" DROP COLUMN "uploader_id"
        `);
    await queryRunner.query(`
            ALTER TABLE "gamevault_user"
            ADD CONSTRAINT "FK_4a135b04a00cf3e3653cd585334" FOREIGN KEY ("background_image_id") REFERENCES "image"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "gamevault_user"
            ADD CONSTRAINT "FK_3a56876605551fa369cbcd09c41" FOREIGN KEY ("profile_picture_id") REFERENCES "image"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }
}
