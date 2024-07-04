import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { DeletedEntitiesFilter } from "../../../filters/deleted-entities.filter";
import { FindOptions } from "../../../globals";
import { DeveloperMetadataService } from "../developers/developer.metadata.service";
import { GenreMetadataService } from "../genres/genre.metadata.service";
import { PublisherMetadataService } from "../publishers/publisher.metadata.service";
import { TagMetadataService } from "../tags/tag.metadata.service";
import { GameMetadata } from "./game.metadata.entity";

@Injectable()
export class GameMetadataService {
  constructor(
    @InjectRepository(GameMetadata)
    private gameMetadataRepository: Repository<GameMetadata>,
    private developerMetadataService: DeveloperMetadataService,
    private publisherMetadataService: PublisherMetadataService,
    private tagMetadataService: TagMetadataService,
    private genreMetadataService: GenreMetadataService,
  ) {}

  async find(
    provider_slug: string = "gamevault",
    options: FindOptions = { loadDeletedEntities: false, loadRelations: false },
  ): Promise<GameMetadata[]> {
    let relations = [];

    if (options.loadRelations) {
      if (options.loadRelations === true) {
        relations = ["developers", "publishers", "genres", "tags"];
      } else if (Array.isArray(options.loadRelations))
        relations = options.loadRelations;
    }
    const games = await this.gameMetadataRepository.find({
      where: { provider_slug },
      relations,
      withDeleted: options.loadDeletedEntities,
      relationLoadStrategy: "query",
    });
    return DeletedEntitiesFilter.filterDeleted(games) as GameMetadata[];
  }

  async findOneByGameMetadataIdOrFail(
    id: number,
    options: FindOptions = { loadDeletedEntities: false, loadRelations: false },
  ): Promise<GameMetadata> {
    try {
      let relations = [];

      if (options.loadRelations) {
        if (options.loadRelations === true) {
          relations = ["developers", "publishers", "genres", "tags"];
        } else if (Array.isArray(options.loadRelations))
          relations = options.loadRelations;
      }

      const game = await this.gameMetadataRepository.findOneOrFail({
        where: { id },
        relations,
        withDeleted: options.loadDeletedEntities,
        relationLoadStrategy: "query",
      });
      return DeletedEntitiesFilter.filterDeleted(game) as GameMetadata;
    } catch (error) {
      throw new NotFoundException(
        `GameMetadata with id ${id} was not found on the server.`,
        { cause: error },
      );
    }
  }

  /**
   * Upserts a GameMetadata entity.
   *
   * If a GameMetadata with the same provider_slug and provider_data_id
   * exists, it updates its properties with the ones from the provided
   * metadata. Otherwise, it creates a new GameMetadata entity.
   */
  async upsert(freshMetadata: GameMetadata): Promise<GameMetadata> {
    // Find an existing GameMetadata with the same provider_slug and provider_data_id
    const existingGameMetadata = await this.gameMetadataRepository.findOne({
      where: {
        provider_slug: freshMetadata.provider_slug,
        provider_data_id: freshMetadata.provider_data_id,
      },
    });

    // Update the existing GameMetadata with the provided metadata
    const combinedGameMetadata = {
      ...existingGameMetadata,
      ...freshMetadata,
    } as GameMetadata;

    // Upsert developers
    if (combinedGameMetadata.developers) {
      for (const developer of combinedGameMetadata.developers) {
        const upsertedDeveloper =
          await this.developerMetadataService.upsert(developer);
        combinedGameMetadata.developers = combinedGameMetadata.developers?.map(
          (developer) =>
            developer.id === upsertedDeveloper.id
              ? upsertedDeveloper
              : developer,
        );
      }
    }

    // Upsert publishers
    if (combinedGameMetadata.publishers) {
      for (const publisher of combinedGameMetadata.publishers) {
        const upsertedPublisher =
          await this.publisherMetadataService.upsert(publisher);
        combinedGameMetadata.publishers = combinedGameMetadata.publishers?.map(
          (publisher) =>
            publisher.id === upsertedPublisher.id
              ? upsertedPublisher
              : publisher,
        );
      }
    }

    // Upsert tags
    if (combinedGameMetadata.tags) {
      for (const tag of combinedGameMetadata.tags) {
        const upsertedTag = await this.tagMetadataService.upsert(tag);
        combinedGameMetadata.tags = combinedGameMetadata.tags?.map((tag) =>
          tag.id === upsertedTag.id ? upsertedTag : tag,
        );
      }
    }

    // Upsert genres
    if (combinedGameMetadata.genres) {
      for (const genre of combinedGameMetadata.genres) {
        const upsertedGenre = await this.genreMetadataService.upsert(genre);
        combinedGameMetadata.genres = combinedGameMetadata.genres?.map(
          (game) => (game.id === upsertedGenre.id ? upsertedGenre : game),
        );
      }
    }

    return await this.gameMetadataRepository.save(combinedGameMetadata);
  }
}
