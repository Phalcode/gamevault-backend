import { Controller, Get, Param, Put, Query } from "@nestjs/common";
import {
  ApiBasicAuth,
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
import { IdDto } from "../../database/models/id.dto";
import { GamesService } from "../../games/games.service";
import { BoxArtsService } from "../../boxarts/boxarts.service";

@ApiTags("rawg")
@Controller("rawg")
@ApiBasicAuth()
export class RawgController {
  constructor(
    private gamesService: GamesService,
    private rawgService: RawgService,
    private mapper: RawgMapperService,
    private boxartService: BoxArtsService,
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

  /**
   * Manually triggers a recache from rawg-api for a specific game, also updates
   * boxart.
   *
   * @param params - An object containing the game's ID.
   * @returns - A promise that resolves with the updated game.
   */
  @Put(":id/recache")
  @ApiOperation({
    summary:
      "manually triggers a recache from rawg-api for a specific game, also updates boxart",
    operationId: "rawgRecacheGame",
  })
  @ApiOkResponse({ type: () => Game })
  @MinimumRole(Role.EDITOR)
  async recacheGame(@Param() params: IdDto): Promise<Game> {
    let game = await this.gamesService.getGameById(Number(params.id));
    game.cache_date = null;
    game = await this.gamesService.saveGame(game);
    await this.rawgService.cacheGames([game]);
    await this.boxartService.checkBoxArt(game);
    return await this.gamesService.getGameById(Number(params.id), true);
  }

  /** Manually triggers a recache from rawg-api for all games. */
  @Put("recache-all")
  @ApiOperation({
    summary: "manually triggers a recache from rawg-api for all games",
    description:
      "DANGER: This is a very expensive operation and should be used sparingly",
    operationId: "rawgRecacheAll",
  })
  @ApiOkResponse({ type: () => Game, isArray: true })
  @MinimumRole(Role.ADMIN)
  async recacheAllGames(): Promise<string> {
    const gamesInDatabase = await this.gamesService.getAllGames();
    for (const game of gamesInDatabase) {
      game.cache_date = null;
      await this.gamesService.saveGame(game);
    }
    await this.rawgService.cacheGames(gamesInDatabase);
    await this.boxartService.checkBoxArts(gamesInDatabase);
    return "Recache successfuly completed";
  }
}
