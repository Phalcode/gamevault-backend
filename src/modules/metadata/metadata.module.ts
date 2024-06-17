import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { DeveloperMetadata } from "./developers/developer.metadata.entity";
import { DeveloperMetadataService } from "./developers/developer.metadata.service";
import { GameMetadata } from "./games/game.metadata.entity";
import { GameMetadataService } from "./games/game.metadata.service";
import { GenreMetadata } from "./genres/genre.metadata.entity";
import { GenreMetadataService } from "./genres/genre.metadata.service";
import { MetadataService } from "./metadata.service";
import { PublisherMetadata } from "./publishers/publisher.metadata.entity";
import { PublisherMetadataService } from "./publishers/publisher.metadata.service";
import { TagMetadata } from "./tags/tag.metadata.entity";
import { TagMetadataService } from "./tags/tag.metadata.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DeveloperMetadata,
      GameMetadata,
      GenreMetadata,
      PublisherMetadata,
      TagMetadata,
    ]),
  ],
  providers: [
    MetadataService,
    DeveloperMetadataService,
    GameMetadataService,
    GenreMetadataService,
    PublisherMetadataService,
    TagMetadataService,
  ],
  exports: [
    MetadataService,
    DeveloperMetadataService,
    GameMetadataService,
    GenreMetadataService,
    PublisherMetadataService,
    TagMetadataService,
  ],
})
export class MetadataModule {}
