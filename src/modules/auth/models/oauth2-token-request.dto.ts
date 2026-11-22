import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Matches } from "class-validator";

export class OAuth2TokenRequestDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: "Tm90IGEgcmVhbCBjb2RlLCBqdXN0IGFuIGV4YW1wbGU",
    description:
      "one-time code the login redirected to the loopback listener with",
  })
  code!: string;

  @Matches(/^[A-Za-z0-9._~-]{43,128}$/, {
    message: "code_verifier must be a PKCE code verifier (RFC 7636)",
  })
  @ApiProperty({
    example: "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk",
    description:
      "PKCE code verifier whose S256 code_challenge was sent with the login request",
  })
  code_verifier!: string;
}
