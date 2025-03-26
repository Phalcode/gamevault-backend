import { ApiProperty } from "@nestjs/swagger";

export class AccessTokenDto {
  @ApiProperty({
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    description: "JWT access token used for authenticating subsequent requests",
  })
  access_token?: string;
}
