import { MigrationInterface, QueryRunner } from "typeorm";

export class QueryResultCache1715437343720 implements MigrationInterface {
  name = "QueryResultCache1715437343720";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "query-result-cache" (
                "id" SERIAL NOT NULL,
                "identifier" character varying,
                "time" bigint NOT NULL,
                "duration" integer NOT NULL,
                "query" text NOT NULL,
                "result" text NOT NULL,
                CONSTRAINT "PK_6a98f758d8bfd010e7e10ffd3d3" PRIMARY KEY ("id")
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP TABLE IF EXISTS "query-result-cache"
        `);
  }
}
