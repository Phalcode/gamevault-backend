import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";

import configuration from "../../../../configuration.js";
import { DeveloperMetadata } from "../../developers/developer.metadata.entity.js";
import { GameMetadata } from "../../games/game.metadata.entity.js";
import { MinimalGameMetadataDto } from "../../games/minimal-game.metadata.dto.js";
import { GenreMetadata } from "../../genres/genre.metadata.entity.js";
import { PublisherMetadata } from "../../publishers/publisher.metadata.entity.js";
import { TagMetadata } from "../../tags/tag.metadata.entity.js";
import { MetadataProvider } from "../abstract.metadata-provider.service.js";

@Injectable()
export class TestHighPriorityProviderService extends MetadataProvider {
  readonly enabled = configuration.TESTING.MOCK_PROVIDERS;
  readonly slug = "test-high-priority";
  readonly name = "Test High Priority";
  readonly priority = 9999;

  public override async search(): Promise<MinimalGameMetadataDto[]> {
    const minimalGameMetadata = [];
    for (let i = 0; i < 10; i++) {
      minimalGameMetadata.push(this.fakeMinimalGame());
    }
    return minimalGameMetadata;
  }

  public override async getByProviderDataIdOrFail(): Promise<GameMetadata> {
    return this.fakeGame();
  }

  private fakeGame(): GameMetadata {
    return {
      provider_slug: this.slug,
      provider_data_id: randomUUID(),
      title: this.name,
      description: this.name,
      developers: [
        {
          provider_slug: this.slug,
          provider_data_id: randomUUID(),
          name: this.name,
        } as DeveloperMetadata,
      ],
      publishers: [
        {
          provider_slug: this.slug,
          provider_data_id: randomUUID(),
          name: this.name,
        } as PublisherMetadata,
      ],
      genres: [
        {
          provider_slug: this.slug,
          provider_data_id: randomUUID(),
          name: this.name,
        } as GenreMetadata,
      ],
      tags: [
        {
          provider_slug: this.slug,
          provider_data_id: randomUUID(),
          name: this.name,
        } as TagMetadata,
      ],
    } as GameMetadata;
  }

  private fakeMinimalGame(): MinimalGameMetadataDto {
    return {
      provider_slug: this.slug,
      provider_data_id: randomUUID(),
      release_date: new Date(),
      description: this.name,
      title: this.name,
    } as MinimalGameMetadataDto;
  }
}
