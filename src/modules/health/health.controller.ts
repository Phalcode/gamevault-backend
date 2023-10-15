import { Controller, Get, Request } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Public } from "../pagination/public.decorator";
import { Health } from "./models/health.model";
import { GamevaultUser } from "../users/gamevault-user.entity";
import { HealthService } from "./health.service";
@Controller("health")
@ApiTags("health")
export class HealthController {
  constructor(private healthService: HealthService) {}

  /**
   * Returns a lifesign.
   *
   * @returns
   */
  @Get()
  @ApiOkResponse({ type: () => Health })
  @ApiOperation({
    summary:
      "returns a lifesign, if an admin calls this api additional server infos are returned.",
    operationId: "healthcheck",
  })
  @Public()
  async healthcheck(
    @Request() request: { gamevaultuser: GamevaultUser },
  ): Promise<Health> {
    return this.healthService.get(request?.gamevaultuser?.username);
  }
}
