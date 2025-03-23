import { Controller, Post, Request, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import { SkipGuards } from "../../../decorators/disable-authentication-guard";
import { GamevaultUser } from "../../users/gamevault-user.entity";
import { AuthenticationService } from "../authentication.service";
import { RefreshAuthenticationGuard } from "../guards/refresh-authentication.guard";
import { LoginDto } from "../models/login.dto";

@Controller("auth")
export class GamevaultJwtController {
  constructor(private readonly authService: AuthenticationService) {}

  @Post("refresh")
  @UseGuards(RefreshAuthenticationGuard)
  @SkipGuards()
  @ApiOperation({
    summary: "refreshes the access token of the user",
    description:
      "This endpoint takes a valid refresh token from the request and issues a new access token. The refresh token must be sent in the request (usually as a cookie or in the authorization header).",
    operationId: "postAuthRefresh",
  })
  @ApiOkResponse({ type: () => LoginDto })
  async postAuthRefresh(
    @Request() req: { user: GamevaultUser },
  ): Promise<LoginDto> {
    return this.authService.refresh(req.user);
  }
}
