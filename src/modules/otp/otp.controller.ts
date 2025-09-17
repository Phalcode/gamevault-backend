import {
  Controller,
  Get,
  Headers,
  Query,
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
  @ApiOkResponse({ type: () => StreamableFile })
  @ApiOperation({
    summary: "returns a game download for the otp",
    operationId: "getOtpGame",
  })
  @SkipGuards()
  async getOtpGame(
    @Query("otp") otp: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    return this.otpService.get(otp, response);
  }
}
