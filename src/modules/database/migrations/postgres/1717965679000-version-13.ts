import { existsSync } from "fs";
import { MigrationInterface, QueryRunner } from "typeorm";

export class Version13 implements MigrationInterface {
  name = "Version13";

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (existsSync("/images")) {
      throw new Error(
        "Your media volume mount point is still pointing to /images. This is deprecated in v13.0.0. From now on, mount your media to /media instead.",
      );
    }
    queryRunner.renameTable("image", "media");
    queryRunner.renameColumn(
      "gamevault_user",
      "profile_picture_id",
      "avatar_id",
    );
    queryRunner.renameColumn(
      "gamevault_user",
      "background_image_id",
      "background_id",
    );
    queryRunner.renameColumn("bookmark", "game_id", "gamevault_game_id");
    queryRunner.dropTable("query-result-cache");
    //TODO: Delete all images without a media type or try to find the media type using the file extension
    //TODO: Create a new GamevaultGame for each entry in the "game" table
    //TODO: Create a new rawg-legacy provider
    //TODO: Create a new RAWG GameMetadata for each entry in the "game" table
    //TODO: Create a new RAWG DeveloperMetadata  for each entry in the "developer" table
    //TODO: Create a new RAWG PublisherMetadata for each entry in the "publisher" table
    //TODO: Create a new RAWG TagMetadata for each entry in the "tag" table
    //TODO: Create a new RAWG GenreMetadata for each entry in the "genres" table
    //TODO: Create a new RAWG StoreMetadata for each entry in the "store" table
  }

  public async down(): Promise<void> {
    //Try to generate this migration via AI
  }
}