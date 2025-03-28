import { Controller, Get, StreamableFile } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";

import { createReadStream, existsSync } from "fs";
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
    if (!existsSync(`${configuration.VOLUMES.CONFIG}/news.md`)) {
      return;
    }
    return new StreamableFile(
      createReadStream(`${configuration.VOLUMES.CONFIG}/news.md`),
    );
  }
}
