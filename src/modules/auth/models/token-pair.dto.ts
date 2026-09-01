import { IntersectionType } from "@nestjs/swagger";
import { AccessTokenDto } from "./access-token.dto.js";
import { RefreshTokenDto } from "./refresh-token.dto.js";

export class TokenPairDto extends IntersectionType(
  AccessTokenDto,
  RefreshTokenDto,
) {}
