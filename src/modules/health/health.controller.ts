import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Public } from "../../decorators/public.decorator";
import { Health } from "./models/health.model";
import { HealthService } from "./health.service";
import { MinimumRole } from "../../decorators/minimum-role.decorator";
import { Role } from "../users/models/role.enum";
@Controller("health")
@ApiTags("health")
export class HealthController {
  constructor(private healthService: HealthService) {}

  @Get()
  @ApiOkResponse({ type: () => Health })
  @ApiOperation({
    summary: "returns a lifesign",
    operationId: "getHealth",
  })
  @Public()
  async getHealth(): Promise<Health> {
    return this.healthService.get();
  }

  @Get("admin")
  @ApiOkResponse({ type: () => Health })
  @ApiOperation({
    summary:
      "returns a lifesign and additional server metrics for administrators. **DEPRECATED. MOVED TO /admin/health**",
    operationId: "getHealthAdmin",
    deprecated: true,
  })
  @MinimumRole(Role.ADMIN)
  async getHealthAdmin(): Promise<Health> {
    return this.healthService.getExtensive();
  }
}
