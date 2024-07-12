import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { GamesModule } from "../games/games.module";
import { MediaModule } from "../media/media.module";
import { DeveloperMetadata } from "./developers/developer.metadata.entity";
import { DeveloperMetadataService } from "./developers/developer.metadata.service";
import { GameMetadata } from "./games/game.metadata.entity";
import { GameMetadataService } from "./games/game.metadata.service";
import { GenresController } from "./genres/genre.metadata.controller";
import { GenreMetadata } from "./genres/genre.metadata.entity";
import { GenreMetadataService } from "./genres/genre.metadata.service";
import { MetadataController } from "./metadata.controller";
import { MetadataService } from "./metadata.service";
import { IgdbMetadataProviderService } from "./providers/igdb/igdb.metadata-provider.service";
import { PublisherMetadata } from "./publishers/publisher.metadata.entity";
import { PublisherMetadataService } from "./publishers/publisher.metadata.service";
import { TagsController } from "./tags/tag.metadata.controller";
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
  ],
  exports: [
    MetadataService,
    DeveloperMetadataService,
    GameMetadataService,
    GenreMetadataService,
    PublisherMetadataService,
    TagMetadataService,
  ],
  controllers: [MetadataController, TagsController, GenresController],
})
export class MetadataModule {}
