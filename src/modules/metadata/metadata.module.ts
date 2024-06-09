import { Module } from "@nestjs/common";

import { MetadataController } from "./controllers/metadata.controller";
import { DeveloperMetadataService } from "./services/data/developers-metadata.service";
import { GameMetadataService } from "./services/data/game-metadata.service";
import { GenreMetadataService } from "./services/data/genre-metadata.service";
import { PublisherMetadataService } from "./services/data/publisher-metadata.service";
import { StoreMetadataService } from "./services/data/store-metadata.service";
import { TagMetadataService } from "./services/data/tag-metadata.service";
import { MetadataProvidersService } from "./services/metadata-providers.service";

@Module({
  imports: [],
  controllers: [MetadataController],
  providers: [
    MetadataProvidersService,
    DeveloperMetadataService,
    GameMetadataService,
    GenreMetadataService,
    PublisherMetadataService,
    StoreMetadataService,
    TagMetadataService,
  ],
})
export class MetadataModule {}
