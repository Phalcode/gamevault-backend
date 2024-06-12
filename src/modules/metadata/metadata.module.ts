import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { StoreMetadata } from "././entities/store-metadata.entity";
import { DeveloperMetadata } from "./entities/developer-metadata.entity";
import { GameMetadata } from "./entities/game-metadata.entity";
import { GenreMetadata } from "./entities/genre-metadata.entity";
import { PublisherMetadata } from "./entities/publisher-metadata.entity";
import { TagMetadata } from "./entities/tag-metadata.entity";
import { DeveloperMetadataService } from "./services/developers-metadata.service";
import { GameMetadataService } from "./services/game-metadata.service";
import { GenreMetadataService } from "./services/genre-metadata.service";
import { MetadataService } from "./services/metadata.service";
import { PublisherMetadataService } from "./services/publisher-metadata.service";
import { StoreMetadataService } from "./services/store-metadata.service";
import { TagMetadataService } from "./services/tag-metadata.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DeveloperMetadata,
      GameMetadata,
      GenreMetadata,
      PublisherMetadata,
      StoreMetadata,
      TagMetadata,
    ]),
  ],
  providers: [
    MetadataService,
    DeveloperMetadataService,
    GameMetadataService,
    GenreMetadataService,
    PublisherMetadataService,
    StoreMetadataService,
    TagMetadataService,
  ],
  exports: [
    MetadataService,
    DeveloperMetadataService,
    GameMetadataService,
    GenreMetadataService,
    PublisherMetadataService,
    StoreMetadataService,
    TagMetadataService,
  ],
})
export class MetadataModule {}
