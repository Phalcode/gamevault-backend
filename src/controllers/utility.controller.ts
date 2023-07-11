import { Body, Controller, Param, Put } from "@nestjs/common";
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { IdDto } from "../dtos/id.dto";
import { ImageUrlDto } from "../dtos/image-url.dto";
import { OverwriteGameRawgIdDto } from "../dtos/overwrite-game-rawg_id.dto";
import { Game } from "../database/entities/game.entity";
import { AutomationService } from "../services/automation.service";
import { GamesService } from "../services/games.service";
import { ImagesService } from "../services/images.service";
import { RawgService } from "../services/rawg.service";
import { MinimumRole } from "../decorators/minimum-role.decorator";
import { Role } from "../models/role.enum";
import { BoxArtService } from "../services/box-art.service";

@ApiTags("utility")
@Controller("utility")
export class UtilityController {
  constructor(
    private gamesService: GamesService,
    private rawgService: RawgService,
    private imagesService: ImagesService,
    private cronService: AutomationService,
    private boxartService: BoxArtService,
  ) {}

  /** Manually triggers a reindex on all games. */
  @Put("reindex")
  @ApiOperation({
    summary: "manually triggers a reindex on all games",
    operationId: "reindexGames",
  })
  @ApiOkResponse({ type: Game, isArray: true })
  @MinimumRole(Role.ADMIN)
  async reindexGames() {
    return await this.cronService.autoindexGames();
  }

  /**
   * Manually triggers a recache from rawg-api for a specific game, also updates
   * boxart.
   *
   * @param params - An object containing the game's ID.
   * @returns - A promise that resolves with the updated game.
   */
  @Put("recache/:id")
  @ApiOperation({
    summary:
      "manually triggers a recache from rawg-api for a specific game, also updates boxart",
    operationId: "recacheGame",
  })
  @ApiOkResponse({ type: Game })
  @MinimumRole(Role.ADMIN)
  async recacheGame(@Param() params: IdDto): Promise<Game> {
    let game = await this.gamesService.getGameById(Number(params.id));
    game.cache_date = null;
    game = await this.gamesService.saveGame(game);
    await this.rawgService.cacheCheck([game]);
    await this.boxartService.checkBoxArt(game);
    return await this.gamesService.getGameById(Number(params.id), true);
  }

  /** Manually triggers a recache from rawg-api for all games. */
  @Put("recache")
  @ApiOperation({
    summary: "manually triggers a recache from rawg-api for all games",
    description:
      "DANGER: This is a very expensive operation and should be used sparingly",
    operationId: "recacheAllGames",
  })
  @ApiOkResponse({ type: Game, isArray: true })
  @MinimumRole(Role.ADMIN)
  async recacheAllGames(): Promise<string> {
    const gamesInDatabase = await this.gamesService.getAllGames();
    for (const game of gamesInDatabase) {
      game.cache_date = null;
      await this.gamesService.saveGame(game);
    }
    await this.rawgService.cacheCheck(gamesInDatabase);
    await this.boxartService.checkBoxArts(gamesInDatabase);
    return "Recache successfuly completed";
  }

  /**
   * Manually remaps a database entry to a rawg game and recaches it.
   *
   * @param params - An object containing the game's ID.
   * @param dto - An object containing the new rawg ID.
   * @returns - A promise that resolves with the updated game.
   */
  @Put("overwrite/:id/rawg_id")
  @ApiOperation({
    summary: "manually remaps a database entry to a rawg game and recaches it",
    operationId: "remapGame",
  })
  @ApiOkResponse({ type: Game })
  @ApiBody({ type: OverwriteGameRawgIdDto })
  @MinimumRole(Role.EDITOR)
  async remapGame(
    @Param() params: IdDto,
    @Body() dto: OverwriteGameRawgIdDto,
  ): Promise<Game> {
    return await this.gamesService.remapGame(Number(params.id), dto.rawg_id);
  }

  /**
   * Manually overwrites box art for a game.
   *
   * @param params - An object containing the game's ID.
   * @param dto - An object containing the new image URL.
   * @returns - A promise that resolves with the updated game.
   */
  @Put("overwrite/:id/box_image")
  @ApiOperation({
    summary: "manually overwrites box art for a game",
    operationId: "remapBoxArt",
  })
  @ApiOkResponse({ type: Game })
  @ApiBody({ type: ImageUrlDto })
  @MinimumRole(Role.EDITOR)
  async remapBoxArt(
    @Param() params: IdDto,
    @Body() dto: ImageUrlDto,
  ): Promise<Game> {
    const game = await this.gamesService.getGameById(Number(params.id));
    game.box_image = await this.imagesService.findBySourceUrlOrDownload(
      dto.image_url,
    );
    return await this.gamesService.saveGame(game);
  }
}
