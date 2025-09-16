import {
    Controller,
    Get,
    Headers,
    Param,
    Res,
    StreamableFile,
} from "@nestjs/common";
import {
    ApiHeader,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
} from "@nestjs/swagger";
import { Response } from "express";
import { SkipGuards } from "../../decorators/skip-guards.decorator";
import { OtpService } from "./otp.service";

@Controller("otp")
@ApiTags("otp")
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Get("game")
  @ApiHeader({
    name: "X-Download-Speed-Limit",
    required: false,
    description:
      "This header lets you set the maximum download speed limit in kibibytes per second (kiB/s) for your request.  If the header is not present the download speed limit will be unlimited.",
    example: "1024",
  })
  @ApiOkResponse({ type: () => StreamableFile })
  @ApiOperation({
    summary: "returns a game download for the otp",
    operationId: "getOtpGame",
  })
  @SkipGuards()
  async getOtpGame(
    @Param("otp") otp: string,
    @Res({ passthrough: true }) response: Response,
    @Headers("X-Download-Speed-Limit") speedlimit?: string,
  ): Promise<StreamableFile> {
    return this.otpService.get(otp, response, speedlimit);
  }
}
