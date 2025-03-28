import { Controller, Get, Request } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

import { SkipGuards } from "../../decorators/skip-guards.decorator";
import { GamevaultUser } from "../users/gamevault-user.entity";
import { Role } from "../users/models/role.enum";
import { Status } from "./models/status.model";
import { StatusService } from "./status.service";

@Controller("status")
@ApiTags("status")
export class StatusController {
  constructor(private readonly statusService: StatusService) {}

  @Get()
  @ApiOkResponse({ type: () => Status })
  @ApiOperation({
    summary: "returns the status of the server",
    operationId: "getStatus",
  })
  @SkipGuards()
  async getStatus(@Request() req?: { user: GamevaultUser }): Promise<Status> {
    return (req?.user?.role ?? 0) < Role.ADMIN
      ? this.statusService.get()
      : this.statusService.getExtensive();
  }
}
