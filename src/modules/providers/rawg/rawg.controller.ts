import { Controller, Get, Query } from "@nestjs/common";
import {
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { RawgMapperService } from "./mapper.service";
import { RawgService } from "./rawg.service";
import { Game } from "../../games/game.entity";
import { MinimumRole } from "../../pagination/minimum-role.decorator";
import { Role } from "../../users/models/role.enum";
import { RawgGame } from "./models/game.interface";

@ApiTags("rawg")
@Controller("rawg")
export class RawgController {
  constructor(
    private rawgService: RawgService,
    private mapper: RawgMapperService,
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
