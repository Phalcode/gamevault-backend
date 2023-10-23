import { randomBytes } from "crypto";
import { MigrationInterface, QueryRunner } from "typeorm";

export class SocketSecret1698013342889 implements MigrationInterface {
  name = "SocketSecret1698013342889";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "gamevault_user"
            ADD "socket_secret" character varying(64)
        `);
    await queryRunner.query(`
            ALTER TABLE "gamevault_user"
            ADD CONSTRAINT "UQ_e0da4bbf1074bca2d980a810771" UNIQUE ("socket_secret")
        `);

    const users = await queryRunner.query("SELECT id FROM gamevault_user");

    for (const user of users) {
      const randomSocketSecret = randomBytes(64).toString("hex");
      await queryRunner.query(
        "UPDATE gamevault_user SET socket_secret = ? WHERE id = ?",
        [randomSocketSecret, user.id],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "gamevault_user" DROP CONSTRAINT "UQ_e0da4bbf1074bca2d980a810771"
        `);
    await queryRunner.query(`
            ALTER TABLE "gamevault_user" DROP COLUMN "socket_secret"
        `);
  }
}
