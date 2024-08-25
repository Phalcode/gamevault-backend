import { Logger, NotImplementedException } from "@nestjs/common";
import { MigrationInterface, QueryRunner } from "typeorm";
import { GamevaultGame } from "../../../games/gamevault-game.entity";
import { GameV12 } from "../../legacy-entities/game.v12-entity";

export class V13Part2MigrateGames1724019050371 implements MigrationInterface {
  private readonly logger = new Logger(this.constructor.name);
  name = "V13Part2MigrateGames1724019050371";

  public async up(queryRunner: QueryRunner): Promise<void> {
    this.logger.log("Starting Migration to V13.0.0 - Part 2");
    const v12_games = await queryRunner.manager.find(GameV12);
    this.logger.log(`Found ${v12_games.length} games in v12 database.`);

    for (const v12_game of v12_games) {
      this.logger.log(
        `Migrating V12 game #${v12_game.id}: "${v12_game.title}"`,
      );
      const saved_game = await queryRunner.manager.save(GamevaultGame, {
        file_path: v12_game.file_path,
        size: v12_game.size,
        title: "",
        version: v12_game.version,
        release_date: v12_game.release_date,
        early_access: v12_game.early_access,
        download_count: 0,
        type: v12_game.type,
        id: v12_game.id,
        created_at: v12_game.created_at,
        updated_at: v12_game.updated_at,
        deleted_at: v12_game.deleted_at,
        entity_version: (Number(v12_game.version) || 0) + 1,
      } as GamevaultGame);
      this.logger.log(
        `Created V13 game #${saved_game.id}: "${saved_game.title}"`,
      );
    }
  }

  public async down(): Promise<void> {
    throw new NotImplementedException(
      "There is no way to undo this migration.",
    );
  }
}
