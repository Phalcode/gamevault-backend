import { Body, Controller, Param, Put, Request } from "@nestjs/common";
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ImageUrlDto } from "../modules/images/models/image-url.dto";
import { RawgIdDto } from "../modules/games/models/rawg_id.dto";
import { Game } from "../modules/games/game.entity";
import { GamesService } from "../modules/games/games.service";
import { ImagesService } from "../modules/images/images.service";
import { RawgService } from "../modules/providers/rawg/rawg.service";
import { MinimumRole } from "../modules/pagination/minimum-role.decorator";
import { Role } from "../modules/users/models/role.enum";
import { BoxArtsService } from "../modules/boxarts/boxarts.service";
import { IdDto } from "../modules/database/models/id.dto";
import { FilesService } from "../modules/files/files.service";
import { GamevaultUser } from "../modules/users/gamevault-user.entity";

@ApiTags("utility")
@Controller("utility")
export class UtilityController {
  constructor(
    private gamesService: GamesService,
    private rawgService: RawgService,
    private imagesService: ImagesService,
    private boxartService: BoxArtsService,
    private filesService: FilesService,
  ) {}

  /** Manually triggers a reindex on all games. */
  @Put("reindex")
  @ApiOperation({
    summary: "manually triggers a reindex on all games",
    operationId: "reindexGames",
    deprecated: true,
  })
  @ApiOkResponse({ type: () => Game, isArray: true })
  @MinimumRole(Role.ADMIN)
  async reindexGames() {
    return await this.filesService.index();
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
    deprecated: true,
  })
  @ApiOkResponse({ type: () => Game })
  @MinimumRole(Role.ADMIN)
  async recacheGame(@Param() params: IdDto): Promise<Game> {
    let game = await this.gamesService.getGameById(Number(params.id));
    game.cache_date = null;
    game = await this.gamesService.saveGame(game);
    await this.rawgService.cacheGames([game]);
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
    deprecated: true,
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
    deprecated: true,
  })
  @ApiOkResponse({ type: () => Game })
  @ApiBody({ type: () => RawgIdDto })
  @MinimumRole(Role.EDITOR)
  async remapGame(
    @Param() params: IdDto,
    @Body() dto: RawgIdDto,
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
    deprecated: true,
  })
  @ApiOkResponse({ type: () => Game })
  @ApiBody({ type: () => ImageUrlDto })
  @MinimumRole(Role.EDITOR)
  async remapBoxArt(
    @Param() params: IdDto,
    @Body() dto: ImageUrlDto,
    @Request() req: { gamevaultuser: GamevaultUser },
  ): Promise<Game> {
    const game = await this.gamesService.getGameById(Number(params.id));
    game.box_image = await this.imagesService.downloadImageByUrl(
      dto.image_url,
      req.gamevaultuser.username,
    );
    return await this.gamesService.saveGame(game);
  }
}
