import { Controller, Get, Request, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { DisableAuthenticationGuard } from "../../../decorators/disable-authentication-guard";
import { GamevaultUser } from "../../users/gamevault-user.entity";
import { AuthenticationService } from "../authentication.service";
import { Oauth2Guard } from "../guards/oauth2.guard";

@Controller("auth/oauth2")
@ApiTags("auth")
@UseGuards(Oauth2Guard)
export class OAuth2Controller {
  constructor(private readonly authenticationService: AuthenticationService) {}
  @Get("login")
  @DisableAuthenticationGuard()
  /* TODO: API DESC
  @ApiOkResponse({ type: () => Health })
  @ApiOperation({
    summary: "returns the news.md file from the config directory.",
    operationId: "getNews",
  })*/
  async login(@Request() request: { user: GamevaultUser }) {
    return this.authenticationService.login(request.user);
  }
}
