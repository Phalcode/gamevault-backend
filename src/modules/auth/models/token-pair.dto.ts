import { IntersectionType } from '@nestjs/swagger';
import { AccessTokenDto } from './access-token.dto';
import { RefreshTokenDto } from './refresh-token.dto';

export class TokenPairDto extends IntersectionType(AccessTokenDto, RefreshTokenDto) {}
