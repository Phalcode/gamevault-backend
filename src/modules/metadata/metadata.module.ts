import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { MetadataController } from "./controllers/metadata.controller";
import { DeveloperMetadata } from "./entities/data/developer-metadata.entity";
import { GameMetadata } from "./entities/data/game-metadata.entity";
import { GenreMetadata } from "./entities/data/genre-metadata.entity";
import { PublisherMetadata } from "./entities/data/publisher-metadata.entity";
import { StoreMetadata } from "./entities/data/store-metadata.entity";
import { TagMetadata } from "./entities/data/tag-metadata.entity";
import { MetadataProvider } from "./entities/metadata-provider.entity";
import { DeveloperMetadataService } from "./services/data/developers-metadata.service";
import { GameMetadataService } from "./services/data/game-metadata.service";
import { GenreMetadataService } from "./services/data/genre-metadata.service";
import { PublisherMetadataService } from "./services/data/publisher-metadata.service";
import { StoreMetadataService } from "./services/data/store-metadata.service";
import { TagMetadataService } from "./services/data/tag-metadata.service";
import { MetadataProvidersService } from "./services/metadata-providers.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MetadataProvider,
      DeveloperMetadata,
      GameMetadata,
      GenreMetadata,
      PublisherMetadata,
      StoreMetadata,
      TagMetadata,
    ]),
  ],
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
  exports: [
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
