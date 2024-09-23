import { Controller, Get, StreamableFile } from "@nestjs/common";
import {
  ApiBasicAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";

import { createReadStream, existsSync } from "fs";
import configuration from "../../configuration";
import { MinimumRole } from "../../decorators/minimum-role.decorator";
import { Health } from "../health/models/health.model";
import { Role } from "../users/models/role.enum";

@ApiBasicAuth()
@Controller("config")
@ApiTags("config")
export class ConfigController {
  constructor() {}

  @Get("news")
  @ApiOkResponse({ type: () => Health })
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
