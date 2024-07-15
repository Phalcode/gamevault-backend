import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import {
  ApiBasicAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";

import { MinimumRole } from "../../decorators/minimum-role.decorator";
import { GamevaultGame } from "../games/gamevault-game.entity";
import { Role } from "../users/models/role.enum";
import { MinimalGameMetadataDto } from "./games/minimal-game.metadata.dto";
import { MetadataService } from "./metadata.service";
import { MetadataProviderDto } from "./providers/models/metadata-provider.dto";
import { ProviderSlugDto } from "./providers/models/provider-slug.dto";

@Controller("metadata")
@ApiTags("metadata")
@ApiBasicAuth()
export class MetadataController {
  constructor(private metadataService: MetadataService) {}

  @Get("/providers")
  @ApiOperation({
    summary: "Get a list of all registered metadata providers.",
    operationId: "getProviders",
  })
  @MinimumRole(Role.EDITOR)
  @ApiOkResponse({ type: () => MetadataProviderDto, isArray: true })
  async getProviders(): Promise<MetadataProviderDto[]> {
    return this.metadataService.providers.map(
      (provider) =>
        ({
          slug: provider.slug,
          priority: provider.priority,
          enabled: provider.enabled,
        }) as MetadataProviderDto,
    );
  }

  @Post("/providers/:provider_slug/search")
  @ApiOperation({
    summary: "Search for games using a metadata provider.",
    operationId: "getSearchResultsByProvider",
  })
  @ApiBody({
    type: () => GamevaultGame,
    description:
      "The game to search for. Theoretically you could search by any GamevaultGame property but most providers likely only support sarches via title and release_date.",
  })
  @MinimumRole(Role.EDITOR)
  @ApiOkResponse({ type: () => MinimalGameMetadataDto, isArray: true })
  async getSearchResultsByProvider(
    @Param() params: ProviderSlugDto,
    @Body() search: GamevaultGame,
  ): Promise<MinimalGameMetadataDto[]> {
    return this.metadataService
      .getProviderBySlugOrFail(params.provider_slug)
      .search(search);
  }
}
