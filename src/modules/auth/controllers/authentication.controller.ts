import {
  Body,
  Controller,
  Logger,
  Post,
  Request,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { SkipGuards } from "../../../decorators/skip-guards.decorator";
import { GamevaultUser } from "../../users/gamevault-user.entity";
import { AuthenticationService } from "../authentication.service";
import { RefreshTokenGuard } from "../guards/refresh-token.guard";
import { RefreshTokenDto } from "../models/refresh-token.dto";
import { TokenPairDto } from "../models/token-pair.dto";

@Controller("auth")
@ApiTags("auth")
@ApiBearerAuth()
export class GamevaultJwtController {
  private readonly logger = new Logger(this.constructor.name);
  constructor(private readonly authService: AuthenticationService) {}

  @Post("refresh")
  @UseGuards(RefreshTokenGuard)
  @SkipGuards()
  @ApiOperation({
    summary: "refreshes the access token of the user",
    description:
      "This endpoint takes a valid refresh token from the request and issues a new access token. The refresh token must be sent in the request (usually as a cookie or in the authorization header).",
    operationId: "postAuthRefresh",
  })
  @ApiOkResponse({ type: () => TokenPairDto })
  async postAuthRefresh(
    @Request() req: { user: GamevaultUser },
  ): Promise<TokenPairDto> {
    return this.authService.refresh(req.user);
  }

  @Post("revoke")
  @ApiBody({ type: () => RefreshTokenDto })
  @SkipGuards()
  @ApiOperation({
    summary: "revokes the refresh token of the user",
    description:
      "This endpoint takes a valid refresh token from the request and revokes it. The refresh token must be sent in the request (usually as a cookie or in the authorization header).",
    operationId: "postAuthRevoke",
  })
  async postAuthRevoke(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<void> {
    return this.authService.revoke(refreshTokenDto);
  }
}
