import { Body, Controller, Delete, Param, Post, Put } from "@nestjs/common";
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
import { MapGameBodyDto } from "./models/map-game-body.dto";
import { MapGameParamsDto } from "./models/map-game-params.dto";
import { ProviderSlugDto } from "./providers/models/provider-slug.dto";

@Controller("metadata")
@ApiTags("metadata")
@ApiBasicAuth()
export class MetadataController {
  constructor(private metadataService: MetadataService) {}

  @Post(":provider_slug/search")
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

  @Put(":provider_slug/game/:game_id")
  @ApiOperation({
    summary: "Remap a game to a different game on the same provider.",
    operationId: "putGameMapping",
  })
  @ApiBody({ type: () => MapGameBodyDto })
  @MinimumRole(Role.EDITOR)
  @ApiOkResponse({ type: () => GamevaultGame })
  async putGameMapping(
    @Param() params: MapGameParamsDto,
    @Body() dto: MapGameBodyDto,
  ): Promise<GamevaultGame> {
    await this.metadataService.map(
      Number(params.game_id),
      params.provider_slug,
      dto.provider_game_id,
    );
    return this.metadataService.merge(Number(params.game_id));
  }

  @Delete(":provider_slug/game/:game_id")
  @ApiOperation({
    summary: "Unmap a game from a provider.",
    operationId: "deleteGameMapping",
  })
  @MinimumRole(Role.EDITOR)
  @ApiOkResponse({ type: () => GamevaultGame })
  async deleteGameMapping(@Param() params: MapGameParamsDto) {
    await this.metadataService.unmap(
      Number(params.game_id),
      params.provider_slug,
    );
    return this.metadataService.merge(Number(params.game_id));
  }
}
