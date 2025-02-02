import {
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  Headers,
  Logger,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  Request,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import {
  ApiBasicAuth,
  ApiBody,
  ApiConsumes,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";

import { FileInterceptor } from "@nestjs/platform-express";
import bytes from "bytes";
import configuration from "../../configuration";
import { DisableApiIf } from "../../decorators/disable-api-if.decorator";
import { MinimumRole } from "../../decorators/minimum-role.decorator";
import { UserIdGameIdDto } from "../progresses/models/user-id-game-id.dto";
import { GamevaultUser } from "../users/gamevault-user.entity";
import { Role } from "../users/models/role.enum";
import { SavefileService } from "./savefile.service";

@Controller("savefiles")
@ApiTags("savefile")
@ApiBasicAuth()
export class SavefileController {
  private readonly logger = new Logger(this.constructor.name);

  constructor(private readonly savefileService: SavefileService) {}

  @Post("/user/:user_id/game/:game_id")
  @ApiOperation({
    summary: "Upload a save file to the server",
    description:
      "Only admins or the user who is associated to the savefile can upload a games save file. The savefile must be a .zip file. Device ID is optional for multi-device tracking.",
    operationId: "postSavefileByUserIdAndGameId",
  })
  @ApiHeader({
    name: "X-Device-Id",
    description:
      "Optional device identifier (UUID v4 format) for multi-device save management",
    required: false,
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      properties: {
        file: {
          type: "string",
          format: "binary",
          description: "The save file to upload",
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor("file"))
  @MinimumRole(Role.USER)
  @DisableApiIf(
    configuration.SERVER.DEMO_MODE_ENABLED || !configuration.SAVEFILES.ENABLED,
  )
  postSavefileByUserIdAndGameId(
    @Param() params: UserIdGameIdDto,
    @Request() req: { gamevaultuser: GamevaultUser },
    @Headers("X-Device-Id") deviceId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: configuration.MEDIA.MAX_SIZE,
            message: `File exceeds maximum allowed size of ${bytes(
              configuration.MEDIA.MAX_SIZE,
              {
                unit: "MB",
                thousandsSeparator: ".",
              },
            )}.`,
          }),
          new FileTypeValidator({ fileType: "application/zip" }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.savefileService.upload(
      Number(params.user_id),
      Number(params.game_id),
      file,
      req.gamevaultuser.username,
      deviceId,
    );
  }

  @Get("/user/:user_id/game/:game_id")
  @ApiOperation({
    summary: "Download a save file from the server",
    description:
      "Only admins or the user who is associated to the savefile can download a games save file.",
    operationId: "getSaveFileByUserIdAndGameId",
  })
  @ApiOkResponse({
    type: () => Buffer,
    description: "The requested save file",
  })
  @ApiOkResponse({ type: () => StreamableFile })
  @DisableApiIf(
    configuration.SERVER.DEMO_MODE_ENABLED || !configuration.SAVEFILES.ENABLED,
  )
  @MinimumRole(Role.USER)
  async getSaveFileByUserIdAndGameId(
    @Param() params: UserIdGameIdDto,
    @Request() req: { gamevaultuser: GamevaultUser },
  ): Promise<StreamableFile> {
    return await this.savefileService.download(
      Number(params.user_id),
      Number(params.game_id),
      req.gamevaultuser.username,
    );
  }

  @Delete("/user/:user_id/game/:game_id")
  @ApiOperation({
    summary: "Delete a save file from the server",
    description:
      "Only admins or the user who is associated to the savefile can delete a games save file.",
    operationId: "deleteSaveFileByUserIdAndGameId",
  })
  @DisableApiIf(
    configuration.SERVER.DEMO_MODE_ENABLED || !configuration.SAVEFILES.ENABLED,
  )
  @MinimumRole(Role.USER)
  async deleteSaveFileByUserIdAndGameId(@Param() params: UserIdGameIdDto) {
    await this.savefileService.delete(
      Number(params.user_id),
      Number(params.game_id),
    );
  }
}
