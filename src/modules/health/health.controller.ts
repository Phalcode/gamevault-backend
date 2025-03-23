import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

import { SkipGuards } from "../../decorators/disable-authentication-guard";
import { HealthService } from "./health.service";
import { Health } from "./models/health.model";

@Controller("health")
@ApiTags("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOkResponse({ type: () => Health })
  @ApiOperation({
    summary: "returns a lifesign",
    operationId: "getHealth",
  })
  @SkipGuards()
  async getHealth(): Promise<Health> {
    return this.healthService.get();
  }
}
