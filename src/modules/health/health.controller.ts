import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Public } from "../pagination/public.decorator";

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
  healthcheck(): string {
    return "<p style='font-family: Arial, sans-serif; font-size: 16px; color: #333; line-height: 1.5; text-align: center;''><strong>All systems green! 🤖🟢</strong></p>";
  }
}
