import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Public } from "../pagination/public.decorator";
import { Health } from "./models/health.model";
import { HealthService } from "./health.service";
import { MinimumRole } from "../pagination/minimum-role.decorator";
import { Role } from "../users/models/role.enum";
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
  async healthcheck(): Promise<Health> {
    return this.healthService.get();
  }

  @Get("admin")
  @ApiOkResponse({ type: () => Health })
  @ApiOperation({
    summary:
      "returns a lifesign and additional server metrics for administrators",
    operationId: "healthcheck",
  })
  @MinimumRole(Role.ADMIN)
  async extensiveHealthcheck(): Promise<Health> {
    return this.healthService.getExtensive();
  }
}
