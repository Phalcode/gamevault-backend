import { Injectable } from "@nestjs/common";
import { Builder } from "builder-pattern";
import { randomUUID } from "crypto";

import configuration from "../../../../configuration";
import { DeveloperMetadata } from "../../developers/developer.metadata.entity";
import { GameMetadata } from "../../games/game.metadata.entity";
import { MinimalGameMetadataDto } from "../../games/minimal-game.metadata.dto";
import { GenreMetadata } from "../../genres/genre.metadata.entity";
import { PublisherMetadata } from "../../publishers/publisher.metadata.entity";
import { TagMetadata } from "../../tags/tag.metadata.entity";
import { MetadataProvider } from "../abstract.metadata-provider.service";

@Injectable()
export class TestLowPriorityProviderService extends MetadataProvider {
  enabled = configuration.TESTING.MOCK_PROVIDERS;
  slug = "test-low-priority";
  name = "Test Low Priority";
  priority = -9999;

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
    return Builder<GameMetadata>()
      .provider_slug(this.slug)
      .provider_data_id(randomUUID())
      .title(this.name)
      .description(this.name)
      .developers([
        {
          provider_slug: this.slug,
          provider_data_id: randomUUID(),
          name: this.name,
        } as DeveloperMetadata,
      ])
      .publishers([
        {
          provider_slug: this.slug,
          provider_data_id: randomUUID(),
          name: this.name,
        } as PublisherMetadata,
      ])
      .genres([
        {
          provider_slug: this.slug,
          provider_data_id: randomUUID(),
          name: this.name,
        } as GenreMetadata,
      ])
      .tags([
        {
          provider_slug: this.slug,
          provider_data_id: randomUUID(),
          name: this.name,
        } as TagMetadata,
      ])
      .build();
  }

  private fakeMinimalGame(): MinimalGameMetadataDto {
    return Builder<MinimalGameMetadataDto>()
      .provider_probability(Math.random())
      .provider_slug(this.slug)
      .provider_data_id(randomUUID())
      .release_date(new Date())
      .description(this.name)
      .title(this.name)
      .build();
  }
}
