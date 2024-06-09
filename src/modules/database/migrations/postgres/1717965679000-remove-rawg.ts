import { MigrationInterface, QueryRunner } from "typeorm";

export class QueryResultCache1715437343720 implements MigrationInterface {
  name = "QueryResultCache1715437343720";

  public async up(queryRunner: QueryRunner): Promise<void> {
    //TODO: Rename "image" to "media"
    //TODO: Rename column "profile_picture_id" to "avatar_id" in "gamevault_user" table
    //TODO: Rename column "background_image_id" to "background_id" in "gamevault_user" table
    //TODO: Rename column "game_id" to "gamevault_game_id" in "bookmark" table
    //TODO: Create a new GamevaultGame for each entry in the "game" table
    //TODO: Create a new rawg-legacy provider
    //TODO: Create a new RAWG GameMetadata for each entry in the "game" table
    //TODO: Create a new RAWG DeveloperMetadata  for each entry in the "developer" table
    //TODO: Create a new RAWG PublisherMetadata for each entry in the "publisher" table
    //TODO: Create a new RAWG TagMetadata for each entry in the "tag" table
    //TODO: Create a new RAWG GenreMetadata for each entry in the "genres" table
    //TODO: Create a new RAWG StoreMetadata for each entry in the "store" table
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    //There is no going back for this migration
  }
}
