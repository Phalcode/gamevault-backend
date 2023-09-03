import {
  Controller,
  FileTypeValidator,
  Get,
  Logger,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import {
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiTags,
} from "@nestjs/swagger";
import { ImagesService } from "./images.service";
import fs from "fs";
import { Response } from "express";
import { MinimumRole } from "../pagination/minimum-role.decorator";
import { Role } from "../users/models/role.enum";
import { FileInterceptor } from "@nestjs/platform-express";
import { Image } from "./image.entity";
import configuration from "../../configuration";

@ApiTags("images")
@Controller("images")
export class ImagesController {
  private readonly logger = new Logger(ImagesService.name);

  constructor(private imagesService: ImagesService) {}

  /**
   * Retrieve an image by its ID and send it as the response.
   *
   * @param id - The ID of the image to retrieve.
   * @param res - The Express Response object to send the image data.
   * @returns - A Promise that resolves when the response is sent.
   * @throws {NotFoundException} If the image is not found on the server.
   */
  @Get(":id")
  @ApiOperation({
    summary: "Retrieve an image using its id",
    operationId: "getImage",
  })
  @ApiOkResponse({
    type: () => Buffer,
    description: "The requested image",
  })
  @ApiProduces("image/*")
  @MinimumRole(Role.GUEST)
  async getImage(@Param("id") id: string, @Res() res: Response): Promise<void> {
    const image = await this.imagesService.findByIdOrFail(Number(id));
    res.set("Content-Type", image.mediaType);
    fs.createReadStream(image.path).pipe(res);
  }

  @Post()
  @ApiOperation({
    summary: "Upload an image",
    description:
      "You can use the id of the uploaded image in subsequent requests.",
    operationId: "uploadImage",
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
  uploadFile(
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
    return this.imagesService.uploadImage(file);
  }
}
