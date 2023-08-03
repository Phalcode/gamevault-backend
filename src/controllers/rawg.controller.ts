import { Controller, Get, Query } from "@nestjs/common";
import {
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { Game } from "../database/entities/game.entity";
import { RawgGame } from "../models/rawg/game.interface";
import { MapperService } from "../services/mapper.service";
import { RawgService } from "../services/rawg.service";
import { Role } from "../models/role.enum";
import { MinimumRole } from "../decorators/minimum-role.decorator";

@ApiTags("rawg")
@Controller("rawg")
export class RawgController {
  constructor(
    private rawgService: RawgService,
    private mapper: MapperService,
  ) {}

  /**
   * Searches the Rawg API manually.
   *
   * @param query The search query.
   * @returns An array of game objects.
   */
  @Get("search")
  @ApiOperation({
    summary: "search the rawg-api manually.",
    operationId: "searchRawg",
  })
  @ApiQuery({ name: "query", description: "search query" })
  @ApiOkResponse({
    type: () => Game,
    isArray: true,
    description: "These objects may have lost some data in conversion",
  })
  @MinimumRole(Role.EDITOR)
  async searchRawg(@Query("query") query: string): Promise<Game[]> {
    const rawggames = await this.rawgService.getRawgGames(query, undefined);
    // for each rawggames entry use mapper to map rawg-games to a new game-model and return it as an array
    const games: Game[] = [];
    for (const rawggame of rawggames) {
      games.push(
        await this.mapper.map(new Game(), rawggame as unknown as RawgGame),
      );
    }
    return games;
  }
}
