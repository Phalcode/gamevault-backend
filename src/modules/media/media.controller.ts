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
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBasicAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiTags,
} from "@nestjs/swagger";
import bytes from "bytes";
import { Response } from "express";
import fs from "fs";

import configuration from "../../configuration";
import { DisableApiIf } from "../../decorators/disable-api-if.decorator";
import { MinimumRole } from "../../decorators/minimum-role.decorator";
import { GamevaultUser } from "../users/gamevault-user.entity";
import { Role } from "../users/models/role.enum";
import { Media } from "./media.entity";
import { MediaService } from "./media.service";

@ApiTags("media")
@Controller("media")
@ApiBasicAuth()
export class MediaController {
  private readonly logger = new Logger(this.constructor.name);

  constructor(private readonly mediaService: MediaService) {}

  /** Retrieve media by its ID and send it as the response. */
  @Get(":id")
  @ApiOperation({
    summary: "Retrieve media using its id",
    operationId: "getMediaByMediaId",
  })
  @ApiOkResponse({
    type: () => Buffer,
    description: "The requested media",
  })
  @ApiProduces("image/*", "video/*", "audio/*")
  @MinimumRole(Role.GUEST)
  async getMediaByMediaId(
    @Param("id") id: string,
    @Res() res: Response,
  ): Promise<void> {
    const media = await this.mediaService.findOneByMediaIdOrFail(Number(id));
    res.set("Content-Type", media.type);
    fs.createReadStream(media.file_path).pipe(res);
  }

  @Post()
  @ApiOperation({
    summary: "Upload a media file to the server",
    description:
      "You can use the id of the uploaded media in subsequent requests.",
    operationId: "postMedia",
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      properties: {
        file: {
          type: "string",
          format: "binary",
          description: "The media file to upload",
        },
      },
    },
  })
  @ApiOkResponse({
    type: () => Media,
    description: "The uploaded media",
  })
  @UseInterceptors(FileInterceptor("file"))
  @MinimumRole(Role.USER)
  @DisableApiIf(configuration.SERVER.DEMO_MODE_ENABLED)
  postMedia(
    @Request() req: { user: GamevaultUser },
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: configuration.MEDIA.MAX_SIZE,
            message: `File exceeds maximum allowed size of ${bytes(configuration.MEDIA.MAX_SIZE, { unit: "MB", thousandsSeparator: "." })}.`,
          }),
          new FileTypeValidator({ fileType: /^(image|video|audio)\/.*/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.mediaService.upload(file, req.user.username);
  }
}
