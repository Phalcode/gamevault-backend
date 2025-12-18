import { Controller, Get, Param, Query } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiSecurity,
  ApiTags,
} from "@nestjs/swagger";

import { MinimumRole } from "../../decorators/minimum-role.decorator";
import { Role } from "../users/models/role.enum";
import { MinimalGameMetadataDto } from "./games/minimal-game.metadata.dto";
import { MetadataService } from "./metadata.service";
import { MetadataProviderDto } from "./providers/models/metadata-provider.dto";
import { ProviderSlugDto } from "./providers/models/provider-slug.dto";

@Controller("metadata")
@ApiTags("metadata")
@ApiBearerAuth()
@ApiSecurity("apikey")
export class MetadataController {
  constructor(private readonly metadataService: MetadataService) {}

  @Get("/providers")
  @ApiOperation({
    summary: "Get a list of all registered metadata providers.",
    operationId: "getProviders",
  })
  @MinimumRole(Role.EDITOR)
  @ApiOkResponse({ type: () => MetadataProviderDto, isArray: true })
  async getProviders(): Promise<MetadataProviderDto[]> {
    return this.metadataService.providers.map((provider) => provider.getDto());
  }

  @Get("/providers/:provider_slug/search")
  @ApiOperation({
    summary: "Search for games using a metadata provider.",
    operationId: "getSearchResultsByProvider",
  })
  @ApiQuery({
    name: "query",
    description:
      "Search Query. Usually it is the title of the game but specific providers may have their own syntax.",
  })
  @MinimumRole(Role.EDITOR)
  @ApiOkResponse({ type: () => MinimalGameMetadataDto, isArray: true })
  async getSearchResultsByProvider(
    @Param() params: ProviderSlugDto,
    @Query("query") query: string,
  ): Promise<MinimalGameMetadataDto[]> {
    return this.metadataService
      .getProviderBySlugOrFail(params.provider_slug)
      .search(query);
  }
}
