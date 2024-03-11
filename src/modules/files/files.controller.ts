import { Controller, Put } from "@nestjs/common";
import {
  ApiOperation,
  ApiOkResponse,
  ApiTags,
  ApiBasicAuth,
} from "@nestjs/swagger";
import { Game } from "../games/game.entity";
import { MinimumRole } from "../../decorators/minimum-role.decorator";
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
