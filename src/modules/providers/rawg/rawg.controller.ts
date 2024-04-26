import { Controller, Get, Param, Put, Query } from "@nestjs/common";
import {
  ApiBasicAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";

import { MinimumRole } from "../../../decorators/minimum-role.decorator";
import { BoxArtsService } from "../../boxarts/boxarts.service";
import { IdDto } from "../../database/models/id.dto";
import { Game } from "../../games/game.entity";
import { GamesService } from "../../games/games.service";
import { MinimalGame } from "../../games/models/minimal-game";
import { Role } from "../../users/models/role.enum";
import { RawgService } from "./rawg.service";

@ApiTags("rawg")
@Controller("rawg")
@ApiBasicAuth()
export class RawgController {
  constructor(
    private gamesService: GamesService,
    private rawgService: RawgService,
    private boxartService: BoxArtsService,
  ) {}

  /** Searches the Rawg API manually. */
  @Get("search")
  @ApiOperation({
    summary: "search the rawg-api manually.",
    operationId: "getRawgSearch",
  })
  @ApiQuery({ name: "query", description: "search query" })
  @ApiOkResponse({
    type: () => MinimalGame,
    isArray: true,
    description:
      "These are minimal game objects, without a lot of information.",
  })
  @MinimumRole(Role.EDITOR)
  async getRawgSearch(@Query("query") query: string): Promise<MinimalGame[]> {
    const rawgGames = await this.rawgService.fetchMatching(query);
    // for each search result return a minimal gamevault game
    const games: MinimalGame[] = [];
    for (const rawgGame of rawgGames) {
      const newGame = new MinimalGame();
      newGame.rawg_id = rawgGame.id;
      newGame.title = rawgGame.name;
      newGame.box_image_url = rawgGame.background_image;
      if (rawgGame.released) {
        newGame.release_date = new Date(rawgGame.released);
      }
      games.push(newGame);
    }
    return games;
  }

  /**
   * Manually triggers a recache from rawg-api for a specific game, also updates
   * boxart.
   */
  @Put(":id/recache")
  @ApiOperation({
    summary:
      "manually triggers a recache from rawg-api for a specific game, also updates boxart",
    operationId: "putRawgRecacheGameByGameId",
  })
  @ApiOkResponse({ type: () => Game })
  @MinimumRole(Role.EDITOR)
  async putRawgRecacheGameByGameId(@Param() params: IdDto): Promise<Game> {
    let game = await this.gamesService.findByGameIdOrFail(Number(params.id));
    game.cache_date = null;
    game = (await this.rawgService.checkCache([game]))[0];
    game = await this.boxartService.check(game);
    return game;
  }

  /** Manually triggers a recache from rawg-api for all games. */
  @Put("recache-all")
  @ApiOperation({
    summary: "manually triggers a recache from rawg-api for all games",
    description:
      "DANGER: This is a very expensive operation and should be used sparingly",
    operationId: "putRawgRecacheAll",
  })
  @ApiOkResponse({ type: () => Game, isArray: true })
  @MinimumRole(Role.ADMIN)
  async putRawgRecacheAll(): Promise<string> {
    let games = (await this.gamesService.getAll()).map((game) => {
      game.cache_date = null;
      return game;
    });
    games = await this.rawgService.checkCache(games);
    games = await this.boxartService.checkMultiple(games);
    return `Successfully recached ${games.length} games`;
  }
}
