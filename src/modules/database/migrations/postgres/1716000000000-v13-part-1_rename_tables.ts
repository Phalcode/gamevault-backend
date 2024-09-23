import { Logger, NotImplementedException } from "@nestjs/common";
import { existsSync } from "fs";
import { MigrationInterface, QueryRunner } from "typeorm";

export class V13Part1RenameTables1716000000000 implements MigrationInterface {
  private readonly logger = new Logger(this.constructor.name);
  name = "V13Part1RenameTables1716000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (existsSync("/images")) {
      throw new Error(
        "Your media volume mount point is still pointing to /images. This is deprecated since v13.0.0. From now on, mount your images to /media instead.",
      );
    }

    // Rename all existing tables, so no conflicts appear
    await queryRunner.query(`ALTER TABLE "image" RENAME TO "v12_image"`);
    await queryRunner.query(`DROP INDEX "IDX_f03b89f33671086e6733828e79"`);
    await queryRunner.renameTable("game", "v12_game");
    await queryRunner.renameTable("gamevault_user", "v12_gamevault_user");

    await queryRunner.renameTable("progress", "v12_progress");
    await queryRunner.renameTable("developer", "v12_developer");
    await queryRunner.renameTable("genre", "v12_genre");
    await queryRunner.renameTable("publisher", "v12_publisher");
    await queryRunner.renameTable("store", "v12_store");
    await queryRunner.renameTable("tag", "v12_tag");

    await queryRunner.renameTable("bookmark", "v12_bookmark");
    await queryRunner.renameColumn(
      "v12_bookmark",
      "gamevault_user_id",
      "v12_gamevault_user_id",
    );
    await queryRunner.renameColumn("v12_bookmark", "game_id", "v12_game_id");

    await queryRunner.renameTable(
      "game_developers_developer",
      "v12_game_developers_v12_developer",
    );
    await queryRunner.renameColumn(
      "v12_game_developers_v12_developer",
      "game_id",
      "v12_game_id",
    );
    await queryRunner.renameColumn(
      "v12_game_developers_v12_developer",
      "developer_id",
      "v12_developer_id",
    );

    await queryRunner.renameTable(
      "game_genres_genre",
      "v12_game_genres_v12_genre",
    );
    await queryRunner.renameColumn(
      "v12_game_genres_v12_genre",
      "game_id",
      "v12_game_id",
    );
    await queryRunner.renameColumn(
      "v12_game_genres_v12_genre",
      "genre_id",
      "v12_genre_id",
    );

    await queryRunner.renameTable(
      "game_publishers_publisher",
      "v12_game_publishers_v12_publisher",
    );
    await queryRunner.renameColumn(
      "v12_game_publishers_v12_publisher",
      "game_id",
      "v12_game_id",
    );
    await queryRunner.renameColumn(
      "v12_game_publishers_v12_publisher",
      "publisher_id",
      "v12_publisher_id",
    );

    await queryRunner.renameTable(
      "game_stores_store",
      "v12_game_stores_v12_store",
    );
    await queryRunner.renameColumn(
      "v12_game_stores_v12_store",
      "game_id",
      "v12_game_id",
    );
    await queryRunner.renameColumn(
      "v12_game_stores_v12_store",
      "store_id",
      "v12_store_id",
    );

    await queryRunner.renameTable("game_tags_tag", "v12_game_tags_v12_tag");
    await queryRunner.renameColumn(
      "v12_game_tags_v12_tag",
      "game_id",
      "v12_game_id",
    );
    await queryRunner.renameColumn(
      "v12_game_tags_v12_tag",
      "tag_id",
      "v12_tag_id",
    );

    await queryRunner.dropTable("query-result-cache", true);
  }

  public async down(): Promise<void> {
    throw new NotImplementedException(
      "There is no way to undo this migration.",
    );
  }
}
