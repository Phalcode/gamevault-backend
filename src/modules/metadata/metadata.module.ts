import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { GamesModule } from "../games/games.module";
import { MediaModule } from "../media/media.module";
import { DeveloperMetadata } from "./developers/developer.metadata.entity";
import { DeveloperMetadataService } from "./developers/developer.metadata.service";
import { DeveloperController as DevelopersController } from "./developers/developers.metadata.controller";
import { GameMetadata } from "./games/game.metadata.entity";
import { GameMetadataService } from "./games/game.metadata.service";
import { GenreMetadata } from "./genres/genre.metadata.entity";
import { GenreMetadataService } from "./genres/genre.metadata.service";
import { GenreController as GenresController } from "./genres/genres.metadata.controller";
import { MetadataController } from "./metadata.controller";
import { MetadataService } from "./metadata.service";
import { IgdbMetadataProviderService } from "./providers/igdb/igdb.metadata-provider.service";
import { TestHighPriorityProviderService } from "./providers/testing/test-high-priority.metadata-provider.service";
import { TestLowPriorityProviderService } from "./providers/testing/test-low-priority.metadata-provider.service";
import { PublisherMetadata } from "./publishers/publisher.metadata.entity";
import { PublisherMetadataService } from "./publishers/publisher.metadata.service";
import { PublisherController as PublishersController } from "./publishers/publishers.metadata.controller";
import { TagMetadata } from "./tags/tag.metadata.entity";
import { TagMetadataService } from "./tags/tag.metadata.service";
import { TagsController } from "./tags/tags.metadata.controller";

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
