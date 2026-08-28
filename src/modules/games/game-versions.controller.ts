import {
  Controller,
  Delete,
  Get,
  Header,
  Headers,
  Param,
  ParseIntPipe,
  Request,
  Res,
  StreamableFile,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiHeader,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from "@nestjs/swagger";
import { Response } from "express";

import configuration from "../../configuration";
import { DisableApiIf } from "../../decorators/disable-api-if.decorator";
import { MinimumRole } from "../../decorators/minimum-role.decorator";
import { OtpService } from "../otp/otp.service";
import { GamevaultUser } from "../users/gamevault-user.entity";
import { Role } from "../users/models/role.enum";
import { UsersService } from "../users/users.service";
import { FilesService } from "./files.service";

@ApiBearerAuth()
@ApiTags("game")
@Controller("game")
@ApiSecurity("apikey")
export class GameVersionsController {
  constructor(
    private readonly filesService: FilesService,
    private readonly usersService: UsersService,
    private readonly otpService: OtpService,
  ) {}

  @Delete(":game_id/versions/:version_id")
  @ApiOperation({
    summary: "deletes a specific game version file from disk",
    description:
      "Deletes exactly one version of a game identified by version_id for the specified game.",
    operationId: "deleteGameVersion",
  })
  @ApiNoContentResponse({
    description: "Game version deletion accepted.",
  })
  @MinimumRole(Role.ADMIN)
  @DisableApiIf(configuration.SERVER.DEMO_MODE_ENABLED)
  async deleteGameVersion(
    @Param("game_id", ParseIntPipe) gameId: number,
    @Param("version_id", ParseIntPipe) versionId: number,
  ): Promise<void> {
    return this.filesService.deleteGameFile(gameId, versionId);
  }

  @Get(":game_id/versions/:version_id")
  @ApiHeader({
    name: "X-Download-Speed-Limit",
    required: false,
    description:
      "This header lets you set the maximum download speed limit in kibibytes per second (kiB/s) for your request. If the header is not present the download speed limit will be unlimited.",
    example: "1024",
  })
  @ApiHeader({
    name: "Range",
    required: false,
    description:
      "This header lets you control the range of bytes to download. If the header is not present or not valid the entire file will be downloaded.",
  })
  @ApiOperation({
    summary: "download a specific game version",
    description:
      "Downloads exactly one version of a game identified by version_id for the specified game.",
    operationId: "downloadGameVersion",
  })
  @MinimumRole(Role.USER)
  @ApiOkResponse({ type: () => StreamableFile })
  @Header("Accept-Ranges", "bytes")
  async downloadGameVersion(
    @Request() request: { user: GamevaultUser },
    @Param("game_id", ParseIntPipe) gameId: number,
    @Param("version_id", ParseIntPipe) versionId: number,
    @Res({ passthrough: true }) response: Response,
    @Headers("X-Download-Speed-Limit") speedlimit?: string,
    @Headers("Range") range?: string,
  ): Promise<StreamableFile> {
    response.setHeader(
      "X-Otp",
      this.otpService.create(
        request.user.username,
        gameId,
        versionId,
        Number(speedlimit),
      ),
    );

    return this.filesService.download(
      response,
      gameId,
      versionId,
      Number(speedlimit),
      range,
      await this.usersService.findUserAgeByUsername(request.user.username),
    );
  }
}
