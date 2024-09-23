import { NotImplementedException } from "@nestjs/common";
import { MigrationInterface, QueryRunner } from "typeorm";

export class V13Part5DeleteOldTables1727131216466
  implements MigrationInterface
{
  transaction?: boolean;

  name = "V13Part5DeleteOldTables1727131216466";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "v12_bookmark"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "v12_developer"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "v12_game"`);
    await queryRunner.query(
      `DROP TABLE IF EXISTS "v12_game_developers_v12_developer"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "v12_game_genres_v12_genre"`);
    await queryRunner.query(
      `DROP TABLE IF EXISTS "v12_game_publishers_v12_publisher"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "v12_game_stores_v12_store"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "v12_game_tags_v12_tag"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "v12_gamevault_user"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "v12_genre"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "v12_image"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "v12_progress"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "v12_publisher"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "v12_store"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "v12_tag"`);
  }

  public async down(): Promise<void> {
    throw new NotImplementedException(
      "There is no way to undo this migration.",
    );
  }
}
