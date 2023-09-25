import { Controller, Get, Param, Put, Query } from "@nestjs/common";
import {
  ApiBasicAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { RawgService } from "./rawg.service";
import { Game } from "../../games/game.entity";
import { MinimumRole } from "../../pagination/minimum-role.decorator";
import { Role } from "../../users/models/role.enum";
import { IdDto } from "../../database/models/id.dto";
import { GamesService } from "../../games/games.service";
import { BoxArtsService } from "../../boxarts/boxarts.service";
import { MinimalGame } from "../../games/models/minimal-game";

@ApiTags("rawg")
@Controller("rawg")
@ApiBasicAuth()
export class RawgController {
  constructor(
    private gamesService: GamesService,
    private rawgService: RawgService,
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
    type: () => MinimalGame,
    isArray: true,
    description:
      "These are minimal game objects, without a lot of information.",
  })
  @MinimumRole(Role.EDITOR)
  async searchRawg(@Query("query") query: string): Promise<MinimalGame[]> {
    const rawgGames = await this.rawgService.getRawgGames(query);
    // for each search result return a minimal gamevault game
    const games: MinimalGame[] = [];
    for (const rawgGame of rawgGames) {
      const newGame = new MinimalGame();
      newGame.rawg_id = rawgGame.id;
      newGame.title = rawgGame.name;
      newGame.box_image_url = rawgGame.background_image;
      newGame.release_date = new Date(rawgGame.released);
      games.push(newGame);
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
