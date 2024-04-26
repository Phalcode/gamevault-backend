import { Controller, Put } from "@nestjs/common";
import {
  ApiBasicAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";

import { MinimumRole } from "../../decorators/minimum-role.decorator";
import { Game } from "../games/game.entity";
import { Role } from "../users/models/role.enum";
import { FilesService } from "./files.service";

@ApiBasicAuth()
@ApiTags("files")
@Controller("files")
export class FilesController {
  constructor(private filesService: FilesService) {}

  @Put("reindex")
  @ApiOperation({
    summary: "manually triggers an index of all games",
    operationId: "putFilesReindex",
  })
  @ApiOkResponse({ type: () => Game, isArray: true })
  @MinimumRole(Role.ADMIN)
  async putFilesReindex() {
    return await this.filesService.index("Reindex API was called");
  }
}
