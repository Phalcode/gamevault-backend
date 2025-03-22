import { Controller, Post, Request, UseGuards } from "@nestjs/common";
import { ApiOperation } from "@nestjs/swagger";
import { DisableAuthenticationGuard } from "../../../decorators/disable-authentication-guard";
import { GamevaultUser } from "../../users/gamevault-user.entity";
import { UsersService } from "../../users/users.service";
import { AuthenticationService } from "../authentication.service";
import { RefreshAuthenticationGuard } from "../guards/refresh-authentication.guard";
import LoginDto from "../models/login.dto";

@Controller("auth")
export class GamevaultJwtController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthenticationService,
  ) {}

  @Post("refresh")
  @UseGuards(RefreshAuthenticationGuard)
  @DisableAuthenticationGuard()
  @ApiOperation({
    summary: "refreshes the access token of the user",
    description: "", //TODO
    operationId: "postAuthRefresh",
  })
  //@ApiOkResponse({ type: () => LoginDto }) //TODO
  async postAuthRefresh(
    @Request() req: { user: GamevaultUser },
  ): Promise<LoginDto> {
    return this.authService.refresh(req.user);
  }
}
