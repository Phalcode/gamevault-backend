import { Logger, NotImplementedException } from "@nestjs/common";
import { existsSync } from "fs";
import { MigrationInterface, QueryRunner } from "typeorm";

export class V13Part1RenameTables1716000000000 implements MigrationInterface {
  private readonly logger = new Logger(this.constructor.name);
  name = "V13Part1RenameTables1716000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    this.logger.log("Starting Migration to V13.0.0 - Part 1");
    if (existsSync("/images")) {
      throw new Error(
        "Your media volume mount point is still pointing to /images. This is deprecated in v13.0.0. From now on, mount your media to /media instead.",
      );
    }

    // Rename all existing tables, so no conflicts appear
    await queryRunner.renameTable("image", "v12_image");
    await queryRunner.renameTable("game", "v12_game");
    await queryRunner.renameTable("gamevault_user", "v12_gamevault_user");
    await queryRunner.renameTable("bookmark", "v12_bookmark");
    await queryRunner.renameTable("progress", "v12_progress");
    await queryRunner.renameTable("developer", "v12_developer");
    await queryRunner.renameTable("genre", "v12_genre");
    await queryRunner.renameTable("publisher", "v12_publisher");
    await queryRunner.renameTable("store", "v12_store");
    await queryRunner.renameTable("tag", "v12_tag");
    await queryRunner.dropTable("query-result-cache", true);
    this.logger.log("Migration Part 1 Complete");
  }

  public async down(): Promise<void> {
    throw new NotImplementedException(
      "There is no way to undo this migration.",
    );
  }
}
