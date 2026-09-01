import { Body, Controller, Get, Put, StreamableFile } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from "@nestjs/swagger";
import fsExtra from "fs-extra";
import type { AppConfiguration } from "../../configuration.js";
import { InjectGamevaultConfig } from "../../decorators/inject-gamevault-config.decorator.js";
import { MinimumRole } from "../../decorators/minimum-role.decorator.js";
import { Status } from "../status/models/status.model.js";
import { Role } from "../users/models/role.enum.js";
import { UpdateNewsDto } from "./models/update-news.dto.js";

const { createReadStream, outputFile, pathExists } = fsExtra;

@ApiBearerAuth()
@Controller("config")
@ApiTags("config")
@ApiSecurity("apikey")
export class ConfigController {
  constructor(
    @InjectGamevaultConfig() private readonly config: AppConfiguration,
  ) {}

  @Get("news")
  @ApiOkResponse({ type: () => Status })
  @ApiOperation({
    summary: "returns the news.md file from the config directory.",
    operationId: "getNews",
  })
  @MinimumRole(Role.GUEST)
  async getNews(): Promise<StreamableFile> {
    if (await pathExists(`${this.config.VOLUMES.CONFIG}/news.md`)) {
      return new StreamableFile(
        createReadStream(`${this.config.VOLUMES.CONFIG}/news.md`),
      );
    }
  }

  @Put("news")
  @ApiBody({ type: () => UpdateNewsDto })
  @ApiOkResponse()
  @ApiOperation({
    summary: "updates the news.md file in the config directory.",
    operationId: "putNews",
  })
  @MinimumRole(Role.ADMIN)
  async putNews(@Body() dto: UpdateNewsDto): Promise<void> {
    await outputFile(`${this.config.VOLUMES.CONFIG}/news.md`, dto.content);
  }
}
