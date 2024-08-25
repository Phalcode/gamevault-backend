import { Logger, NotImplementedException } from "@nestjs/common";
import { existsSync } from "fs";
import { MigrationInterface, QueryRunner } from "typeorm";

export class V13Part1RenameTables1724019050371 implements MigrationInterface {
  private readonly logger = new Logger(this.constructor.name);
  name = "V13Part1RenameTables1724019050371";

  public async up(queryRunner: QueryRunner): Promise<void> {
    this.logger.log("Starting Migration to V13.0.0 - Part 1");
    if (existsSync("/images")) {
      throw new Error(
        "Your media volume mount point is still pointing to /images. This is deprecated in v13.0.0. From now on, mount your media to /media instead.",
      );
    }

    // Rename all existing tables, so no conflicts appear
    await queryRunner.query("ALTER TABLE image RENAME TO v12_image");
    await queryRunner.renameTable("game", "v12_game"); // TODO: Migrate to gamevault_game & game_metadata
    await queryRunner.renameTable("gamevault_user", "v12_gamevault_user"); // TODO: Migrate to gamevault_user
    await queryRunner.renameTable("bookmark", "v12_bookmark"); // TODO: Migrate to bookmark
    await queryRunner.renameTable("progress", "v12_progress"); // TODO: Migrate to progress
    await queryRunner.renameTable("developer", "v12_developer"); // TODO: Migrate to developer_metadata
    await queryRunner.renameTable("genre", "v12_genre"); // TODO: Migrate to genre_metadata
    await queryRunner.renameTable("publisher", "v12_publisher"); // TODO: Migrate to publisher_metadata
    await queryRunner.renameTable("store", "v12_store"); // This will be abandoned
    await queryRunner.renameTable("tag", "v12_tag"); // TODO: Migrate to tag_metadata
    await queryRunner.renameTable(
      "game_developers_developer",
      "v12_game_developers_developer",
    ); // TODO: Migrate to game_metadata_developers_developer_metadata
    await queryRunner.renameTable("game_genres_genre", "v12_game_genres_genre"); // TODO: Migrate to game_metadata_genres_genre_metadata
    await queryRunner.renameTable(
      "game_publishers_publisher",
      "v12_game_publishers_publisher",
    ); // TODO: Migrate to game_metadata_publishers_publisher_metadata
    await queryRunner.renameTable("game_stores_store", "v12_game_stores_store"); // This will be abandoned
    await queryRunner.renameTable("game_tags_tag", "v12_game_tags_tag"); // Todo: Migrate to game_metadata_tags_tag_metadata
    await queryRunner.dropTable("query-result-cache", true);
    this.logger.log("Migration Part 1 Complete");
  }

  public async down(): Promise<void> {
    throw new NotImplementedException(
      "There is no way to undo this migration.",
    );
  }
}
