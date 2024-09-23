import { NotImplementedException } from "@nestjs/common";
import { MigrationInterface, QueryRunner } from "typeorm";

export class V13Part4DeleteOldTables1727131216466
  implements MigrationInterface
{
  transaction?: boolean;

  name = "V13Part4DeleteOldTables1727131216466";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "v12_bookmark" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "v12_developer" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "v12_game" CASCADE`);
    await queryRunner.query(
      `DROP TABLE IF EXISTS "v12_game_developers_v12_developer" CASCADE`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "v12_game_genres_v12_genre" CASCADE`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "v12_game_publishers_v12_publisher" CASCADE`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "v12_game_stores_v12_store" CASCADE`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "v12_game_tags_v12_tag" CASCADE`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "v12_gamevault_user" CASCADE`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "v12_genre" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "v12_image" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "v12_progress" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "v12_publisher" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "v12_store" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "v12_tag" CASCADE`);
  }

  public async down(): Promise<void> {
    throw new NotImplementedException(
      "There is no way to undo this migration.",
    );
  }
}
