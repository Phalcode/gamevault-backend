import { MigrationInterface, QueryRunner } from "typeorm";

export class SocketSecretNotNull1698019992759 implements MigrationInterface {
  name = "SocketSecretNotNull1698019992759";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "gamevault_user"
            ALTER COLUMN "socket_secret"
            SET NOT NULL
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "gamevault_user"
            ALTER COLUMN "socket_secret" DROP NOT NULL
        `);
  }
}
