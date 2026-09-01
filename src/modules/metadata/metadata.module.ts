import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { GamesModule } from "../games/games.module.js";
import { MediaModule } from "../media/media.module.js";
import { DeveloperMetadata } from "./developers/developer.metadata.entity.js";
import { DeveloperMetadataService } from "./developers/developer.metadata.service.js";
import { DeveloperController as DevelopersController } from "./developers/developers.metadata.controller.js";
import { GameMetadata } from "./games/game.metadata.entity.js";
import { GameMetadataService } from "./games/game.metadata.service.js";
import { GenreMetadata } from "./genres/genre.metadata.entity.js";
import { GenreMetadataService } from "./genres/genre.metadata.service.js";
import { GenreController as GenresController } from "./genres/genres.metadata.controller.js";
import { MetadataController } from "./metadata.controller.js";
import { MetadataService } from "./metadata.service.js";
import { IgdbMetadataProviderService } from "./providers/igdb/igdb.metadata-provider.service.js";
import { RawgLegacyMetadataProviderService } from "./providers/rawg-legacy/rawg-legacy.metadata-provider.service.js";
import { TestHighPriorityProviderService } from "./providers/testing/test-high-priority.metadata-provider.service.js";
import { TestLowPriorityProviderService } from "./providers/testing/test-low-priority.metadata-provider.service.js";
import { PublisherMetadata } from "./publishers/publisher.metadata.entity.js";
import { PublisherMetadataService } from "./publishers/publisher.metadata.service.js";
import { PublisherController as PublishersController } from "./publishers/publishers.metadata.controller.js";
import { TagMetadata } from "./tags/tag.metadata.entity.js";
import { TagMetadataService } from "./tags/tag.metadata.service.js";
import { TagsController } from "./tags/tags.metadata.controller.js";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DeveloperMetadata,
      GameMetadata,
      GenreMetadata,
      PublisherMetadata,
      TagMetadata,
    ]),
    forwardRef(() => GamesModule),
    MediaModule,
  ],
  providers: [
    MetadataService,
    DeveloperMetadataService,
    GameMetadataService,
    GenreMetadataService,
    PublisherMetadataService,
    TagMetadataService,
    RawgLegacyMetadataProviderService,
    IgdbMetadataProviderService,
    TestLowPriorityProviderService,
    TestHighPriorityProviderService,
  ],
  exports: [
    MetadataService,
    DeveloperMetadataService,
    GameMetadataService,
    GenreMetadataService,
    PublisherMetadataService,
    TagMetadataService,
  ],
  controllers: [
    MetadataController,
    TagsController,
    GenresController,
    PublishersController,
    DevelopersController,
  ],
})
export class MetadataModule {}
