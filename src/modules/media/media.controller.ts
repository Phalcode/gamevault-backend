import {
  Controller,
  FileTypeValidator,
  Get,
  Logger,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  Req,
  Request,
  Res,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiSecurity,
  ApiTags,
} from "@nestjs/swagger";
import bytes from "bytes";
import { Response } from "express";
import fsExtra from "fs-extra";
const { createReadStream, stat } = fsExtra;

import configuration from "../../configuration.js";
import { DisableApiIf } from "../../decorators/disable-api-if.decorator.js";
import { MinimumRole } from "../../decorators/minimum-role.decorator.js";
import { GamevaultUser } from "../users/gamevault-user.entity.js";
import { Role } from "../users/models/role.enum.js";
import { Media } from "./media.entity.js";
import { MediaService } from "./media.service.js";

@ApiTags("media")
@Controller("media")
@ApiBearerAuth()
@ApiSecurity("apikey")
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
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const media = await this.mediaService.findOneByMediaIdOrFail(Number(id));
    res.set("Content-Type", media.type);

    // Media is keyed by a unique id and never changes, so allow long-lived
    // HTTP caching so clients can reuse covers/art without re-downloading.
    res.set("Cache-Control", "public, max-age=31536000, immutable");

    try {
      const fileStat = await stat(media.file_path);
      const etag = `W/"${fileStat.size}-${Math.floor(fileStat.mtimeMs)}"`;
      res.set("Last-Modified", fileStat.mtime.toUTCString());
      res.set("ETag", etag);

      const ifNoneMatch = req.headers["if-none-match"];
      const ifModifiedSince = req.headers["if-modified-since"];
      const notModified =
        (ifNoneMatch != null && ifNoneMatch.includes(etag)) ||
        (ifNoneMatch == null &&
          ifModifiedSince != null &&
          new Date(ifModifiedSince).getTime() >= fileStat.mtime.getTime());

      if (notModified) {
        res.status(304).end();
        return;
      }
    } catch {
      // If statting the file fails, fall back to streaming it as before.
    }

    const stream = createReadStream(media.file_path);

    // Handle stream errors to prevent hanging responses or truncated data
    // when the file on disk is corrupt or unreadable.
    stream.on("error", (error) => {
      this.logger.error({
        message: "Error streaming media file.",
        mediaId: id,
        filePath: media.file_path,
        error,
      });
      if (!res.headersSent) {
        res.status(500).json({
          error: "Internal Server Error",
          message: "Failed to read media file.",
        });
      } else {
        res.end();
      }
    });

    stream.pipe(res);
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
