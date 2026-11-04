import { ApiProperty } from "@nestjs/swagger";

/**
 * Public representation of a session. Deliberately without the stored
 * `refresh_token_hash`, which is server-side state and not part of the API
 * contract.
 */
export class SessionResponseDto {
  @ApiProperty({
    example: 1,
    description: "Unique gamevault-identifier of the session",
  })
  id!: number;

  @ApiProperty({
    example: "2026-01-01T00:00:00.000Z",
    description: "Date the session was created",
  })
  created_at!: Date;

  @ApiProperty({
    example: "2026-01-31T00:00:00.000Z",
    description: "When the session expires",
  })
  expires_at!: Date;

  @ApiProperty({
    example: false,
    description: "Whether the session has been revoked",
  })
  revoked!: boolean;

  @ApiProperty({
    example: "203.0.113.7",
    description: "IP address where the session was started from",
  })
  ip_address!: string;

  @ApiProperty({
    example: "GameVault/1.17.6",
    description: "User agent string where the session was started from",
  })
  user_agent!: string;
}
