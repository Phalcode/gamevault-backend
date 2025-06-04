import { Controller, Get, StreamableFile } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";

import { createReadStream, pathExists } from "fs-extra";
import configuration from "../../configuration";
import { MinimumRole } from "../../decorators/minimum-role.decorator";
import { Status } from "../status/models/status.model";
import { Role } from "../users/models/role.enum";

@ApiBearerAuth()
@Controller("config")
@ApiTags("config")
export class ConfigController {
  @Get("news")
  @ApiOkResponse({ type: () => Status })
  @ApiOperation({
    summary: "returns the news.md file from the config directory.",
    operationId: "getNews",
  })
  @MinimumRole(Role.GUEST)
  async getNews(): Promise<StreamableFile> {
    if (await pathExists(`${configuration.VOLUMES.CONFIG}/news.md`)) {
      return new StreamableFile(
        createReadStream(`${configuration.VOLUMES.CONFIG}/news.md`),
      );
    }
  }
}
