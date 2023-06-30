import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Public } from "../decorators/public.decorator";

@Controller("health")
@ApiTags("utility")
export class HealthController {
  /**
   * Returns a lifesign.
   *
   * @returns
   */
  @Get()
  @ApiOperation({ summary: "returns a lifesign", operationId: "healthcheck" })
  @ApiOkResponse()
  @Public()
  healthcheck(): void {
    return;
  }
}
