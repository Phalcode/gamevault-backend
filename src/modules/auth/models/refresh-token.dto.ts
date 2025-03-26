import { ApiProperty } from "@nestjs/swagger";

export class RefreshTokenDto {
  @ApiProperty({
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    description:
      "JWT refresh token that can be used to obtain a new access token",
  })
  refresh_token?: string;
}
