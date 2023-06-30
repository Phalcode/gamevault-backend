import { Controller, Get, Param, Res } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ImagesService } from "../services/images.service";
import fs from "fs";
import { Response } from "express";
import { Image } from "../database/entities/image.entity";
import { MinimumRole } from "../decorators/minimum-role.decorator";
import { Role } from "../models/role.enum";

@ApiTags("images")
@Controller("images")
export class ImagesController {
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
    summary: "retrieve an image using its id",
    operationId: "getImage",
  })
  @ApiOkResponse({
    type: Image,
    description: "The requested image",
  })
  @MinimumRole(Role.GUEST)
  async getImage(@Param("id") id: string, @Res() res: Response): Promise<void> {
    const image = await this.imagesService.findByIdOrFail(Number(id));
    res.set("Content-Type", image.mediaType);
    fs.createReadStream(image.path).pipe(res);
  }
}
