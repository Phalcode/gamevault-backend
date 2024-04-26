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
import { Response } from "express";
import fs from "fs";

import configuration from "../../configuration";
import { DisableApiIf } from "../../decorators/disable-api-if.decorator";
import { MinimumRole } from "../../decorators/minimum-role.decorator";
import { GamevaultUser } from "../users/gamevault-user.entity";
import { Role } from "../users/models/role.enum";
import { Image } from "./image.entity";
import { ImagesService } from "./images.service";

@ApiTags("images")
@Controller("images")
@ApiBasicAuth()
export class ImagesController {
  private readonly logger = new Logger(ImagesService.name);

  constructor(private imagesService: ImagesService) {}

  /** Retrieve an image by its ID and send it as the response. */
  @Get(":id")
  @ApiOperation({
    summary: "Retrieve an image using its id",
    operationId: "getImageByImageId",
  })
  @ApiOkResponse({
    type: () => Buffer,
    description: "The requested image",
  })
  @ApiProduces("image/*")
  @MinimumRole(Role.GUEST)
  async getImageByImageId(
    @Param("id") id: string,
    @Res() res: Response,
  ): Promise<void> {
    const image = await this.imagesService.findByImageIdOrFail(Number(id));
    res.set("Content-Type", image.mediaType);
    fs.createReadStream(image.path).pipe(res);
  }

  @Post()
  @ApiOperation({
    summary: "Upload an image",
    description:
      "You can use the id of the uploaded image in subsequent requests.",
    operationId: "postImage",
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      properties: {
        file: {
          type: "string",
          format: "binary",
          description: "The image to upload",
        },
      },
    },
  })
  @ApiOkResponse({
    type: () => Image,
    description: "The uploaded image",
  })
  @UseInterceptors(FileInterceptor("file"))
  @MinimumRole(Role.USER)
  @DisableApiIf(configuration.SERVER.DEMO_MODE_ENABLED)
  postImage(
    @Request() req: { gamevaultuser: GamevaultUser },
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: configuration.IMAGE.MAX_SIZE_IN_KB,
          }),
          new FileTypeValidator({ fileType: /image\/.*/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.imagesService.upload(file, req.gamevaultuser.username);
  }
}
