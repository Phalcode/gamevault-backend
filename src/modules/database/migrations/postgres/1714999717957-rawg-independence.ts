import { MigrationInterface, QueryRunner } from "typeorm";

export class RawgIndependence1714999717957 implements MigrationInterface {
  name = "RawgIndependence1714999717957";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "bookmark" DROP CONSTRAINT "FK_90b8e2ed41d03127a4a9dbd8392"
        `);
    await queryRunner.query(`
            ALTER TABLE "bookmark" DROP CONSTRAINT "FK_8990e34bae4dca1bed3c9ab14d7"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_90b8e2ed41d03127a4a9dbd839"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_8990e34bae4dca1bed3c9ab14d"
        `);
    await queryRunner.query(`
            ALTER TABLE "developer"
            ALTER COLUMN "rawg_id" DROP NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "developer" DROP CONSTRAINT "UQ_5c0cd47a75116720223e43db853"
        `);
    await queryRunner.query(`
            ALTER TABLE "genre"
            ALTER COLUMN "rawg_id" DROP NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "genre" DROP CONSTRAINT "UQ_672bce67ec8cb2d7755c158ad65"
        `);
    await queryRunner.query(`
            ALTER TABLE "publisher"
            ALTER COLUMN "rawg_id" DROP NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "publisher" DROP CONSTRAINT "UQ_4a0539222ee1307f657f875003b"
        `);
    await queryRunner.query(`
            ALTER TABLE "store"
            ALTER COLUMN "rawg_id" DROP NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "store" DROP CONSTRAINT "UQ_45c4541783f264043ec2a5864d6"
        `);
    await queryRunner.query(`
            ALTER TABLE "tag"
            ALTER COLUMN "rawg_id" DROP NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "tag" DROP CONSTRAINT "UQ_289102542903593026bd16e4e1b"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_6f00464edf85ddfedbd2580842" ON "bookmark" ("gamevault_user_id")
        `);
    await queryRunner.query(`
            ALTER TABLE "bookmark"
            ADD CONSTRAINT "FK_6f00464edf85ddfedbd25808428" FOREIGN KEY ("gamevault_user_id") REFERENCES "gamevault_user"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `);
    await queryRunner.query(`
            ALTER TABLE "bookmark"
            ADD CONSTRAINT "FK_99bd20f783c41fe05489a0aca5f" FOREIGN KEY ("game_id") REFERENCES "game"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "bookmark" DROP CONSTRAINT "FK_99bd20f783c41fe05489a0aca5f"
        `);
    await queryRunner.query(`
            ALTER TABLE "bookmark" DROP CONSTRAINT "FK_6f00464edf85ddfedbd25808428"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_6f00464edf85ddfedbd2580842"
        `);
    await queryRunner.query(`
            ALTER TABLE "tag"
            ADD CONSTRAINT "UQ_289102542903593026bd16e4e1b" UNIQUE ("rawg_id")
        `);
    await queryRunner.query(`
            ALTER TABLE "tag"
            ALTER COLUMN "rawg_id"
            SET NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "store"
            ADD CONSTRAINT "UQ_45c4541783f264043ec2a5864d6" UNIQUE ("rawg_id")
        `);
    await queryRunner.query(`
            ALTER TABLE "store"
            ALTER COLUMN "rawg_id"
            SET NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "publisher"
            ADD CONSTRAINT "UQ_4a0539222ee1307f657f875003b" UNIQUE ("rawg_id")
        `);
    await queryRunner.query(`
            ALTER TABLE "publisher"
            ALTER COLUMN "rawg_id"
            SET NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "genre"
            ADD CONSTRAINT "UQ_672bce67ec8cb2d7755c158ad65" UNIQUE ("rawg_id")
        `);
    await queryRunner.query(`
            ALTER TABLE "genre"
            ALTER COLUMN "rawg_id"
            SET NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "developer"
            ADD CONSTRAINT "UQ_5c0cd47a75116720223e43db853" UNIQUE ("rawg_id")
        `);
    await queryRunner.query(`
            ALTER TABLE "developer"
            ALTER COLUMN "rawg_id"
            SET NOT NULL
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_8990e34bae4dca1bed3c9ab14d" ON "bookmark" ("game_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_90b8e2ed41d03127a4a9dbd839" ON "bookmark" ("gamevault_user_id")
        `);
    await queryRunner.query(`
            ALTER TABLE "bookmark"
            ADD CONSTRAINT "FK_8990e34bae4dca1bed3c9ab14d7" FOREIGN KEY ("game_id") REFERENCES "game"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "bookmark"
            ADD CONSTRAINT "FK_90b8e2ed41d03127a4a9dbd8392" FOREIGN KEY ("gamevault_user_id") REFERENCES "gamevault_user"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `);
  }
}
