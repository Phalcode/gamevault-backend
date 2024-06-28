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
      where: { provider_slug: provider_slug },
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
   *
   * @param metadata - The GameMetadata to upsert.
   * @returns The upserted GameMetadata entity.
   */
  async upsert(metadata: GameMetadata): Promise<GameMetadata> {
    // Find an existing GameMetadata with the same provider_slug and provider_data_id
    const existingGameMetadata = await this.gameMetadataRepository.findOne({
      where: {
        provider_slug: metadata.provider_slug,
        provider_data_id: metadata.provider_data_id,
      },
      relations: ["developers", "publishers", "genres", "tags"], // Load related entities
    });

    // Update the existing GameMetadata with the provided metadata
    const combinedGameMetadata = {
      ...existingGameMetadata,
      ...metadata,
    } as GameMetadata;

    // Upsert developers
    if (combinedGameMetadata.developers) {
      combinedGameMetadata.developers = await Promise.all(
        combinedGameMetadata.developers.map(async (developer) => ({
          // Upsert developer and spread the upserted developer
          ...(await this.developerMetadataService.upsert(developer)),
        })),
      );
    }

    // Upsert publishers
    if (combinedGameMetadata.publishers) {
      combinedGameMetadata.publishers = await Promise.all(
        combinedGameMetadata.publishers.map(async (publisher) => ({
          // Upsert publisher and spread the upserted publisher
          ...(await this.publisherMetadataService.upsert(publisher)),
        })),
      );
    }

    // Upsert tags
    if (combinedGameMetadata.tags) {
      combinedGameMetadata.tags = await Promise.all(
        combinedGameMetadata.tags.map(async (tag) => ({
          // Upsert tag and spread the upserted tag
          ...(await this.tagMetadataService.upsert(tag)),
        })),
      );
    }
    
    // Upsert genres
    if (combinedGameMetadata.genres) {
      combinedGameMetadata.genres = await Promise.all(
        combinedGameMetadata.genres.map(async (genre) => ({
          // Upsert genre and spread the upserted genre
          ...(await this.genreMetadataService.upsert(genre)),
        })),
      );
    }

    // Save (upsert) the GameMetadata entity
    const upsertedGameMetadata =
      await this.gameMetadataRepository.save(combinedGameMetadata);

    return upsertedGameMetadata;
  }
}
