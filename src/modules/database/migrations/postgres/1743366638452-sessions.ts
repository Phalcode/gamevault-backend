import { MigrationInterface, QueryRunner } from "typeorm";

export class Sessions1743366638452 implements MigrationInterface {
  name = "Sessions1743366638452";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "session" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                "entity_version" integer NOT NULL,
                "refresh_token_hash" character varying NOT NULL,
                "revoked" boolean NOT NULL DEFAULT false,
                "expires_at" TIMESTAMP NOT NULL,
                "ip_address" character varying NOT NULL,
                "user_agent" character varying NOT NULL,
                "user_id" integer,
                CONSTRAINT "PK_f55da76ac1c3ac420f444d2ff11" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_f55da76ac1c3ac420f444d2ff1" ON "session" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_30e98e8746699fb9af235410af" ON "session" ("user_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_e131e569c75b7d1aa8a73ffa83" ON "session" ("refresh_token_hash")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_40ec9e3de37043686fc51ca39e" ON "session" ("revoked")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_2223e981900a413ce4ce6386f9" ON "session" ("expires_at")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_112e796e2ae5ea3c66e321a9fb" ON "session" ("user_id", "revoked", "expires_at")
        `);
    await queryRunner.query(`
            ALTER TABLE "session"
            ADD CONSTRAINT "FK_30e98e8746699fb9af235410aff" FOREIGN KEY ("user_id") REFERENCES "gamevault_user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "session" DROP CONSTRAINT "FK_30e98e8746699fb9af235410aff"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_112e796e2ae5ea3c66e321a9fb"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_2223e981900a413ce4ce6386f9"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_40ec9e3de37043686fc51ca39e"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_e131e569c75b7d1aa8a73ffa83"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_30e98e8746699fb9af235410af"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_f55da76ac1c3ac420f444d2ff1"
        `);
    await queryRunner.query(`
            DROP TABLE "session"
        `);
  }
}
