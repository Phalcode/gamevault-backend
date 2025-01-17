import {
  Controller,
  FileTypeValidator,
  Get,
  Logger,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  Request,
  Res,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import {
  ApiBasicAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiTags,
} from "@nestjs/swagger";
import fs from "fs";

import { FileInterceptor } from "@nestjs/platform-express";
import bytes from "bytes";
import { Response } from "express";
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

  @Post("/user/:user_id/game/:game_id/savefile")
  @ApiOperation({
    summary: "Upload a save file to the server",
    description:
      "Only admins or the user who is associated to the progress can upload a games save file. The Save file must be a .zip file. If the save file already exists, it will be overwritten.",
    operationId: "postSavefileByUserIdAndGameId",
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
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: configuration.MEDIA.MAX_SIZE,
            message: `File exceeds maximum allowed size of ${bytes(configuration.MEDIA.MAX_SIZE, { unit: "MB", thousandsSeparator: "." })}.`,
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
    );
  }

  @Get("/user/:user_id/game/:game_id/savefile")
  @ApiOperation({
    summary: "Download a save file from the server",
    description:
      "Only admins or the user who is associated to the progress can download a games save file.",
    operationId: "getSaveFileByUserIdAndGameId",
  })
  @ApiOkResponse({
    type: () => Buffer,
    description: "The requested save file",
  })
  @ApiProduces("application/zip")
  @DisableApiIf(
    configuration.SERVER.DEMO_MODE_ENABLED || !configuration.SAVEFILES.ENABLED,
  )
  @MinimumRole(Role.USER)
  async getSaveFileByUserIdAndGameId(
    @Param() params: UserIdGameIdDto,
    @Request() req: { gamevaultuser: GamevaultUser },
    @Res() res: Response,
  ): Promise<void> {
    const path = await this.savefileService.download(
      Number(params.user_id),
      Number(params.game_id),
      req.gamevaultuser.username,
    );
    res.set("Content-Type", "application/zip");
    fs.createReadStream(path).pipe(res);
  }
}
