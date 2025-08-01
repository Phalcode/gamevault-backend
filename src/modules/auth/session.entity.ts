import { ApiProperty } from "@nestjs/swagger";
import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";

import { DatabaseEntity } from "../database/database.entity";
import { GamevaultUser } from "../users/gamevault-user.entity";

@Entity()
@Index(["user", "revoked", "expires_at"]) // For querying active sessions
@Index(["refresh_token_hash"]) // For token revocation checks
export class Session extends DatabaseEntity {
  @ManyToOne(() => GamevaultUser, (user) => user.sessions, {
    onDelete: "CASCADE",
  })
  @JoinColumn()
  @ApiProperty({
    type: () => GamevaultUser,
    description: "The user this session belongs to",
  })
  user: GamevaultUser;

  @Column()
  @ApiProperty({
    description: "SHA-256 hash of the refresh token",
    example: "fd9c4f417fb494aeacef28a70eba95128d9f2521374852cdb12ecb746888b892",
  })
  refresh_token_hash: string;

  @Column({ default: false })
  @ApiProperty({
    description: "Whether this session has been revoked",
    example: false,
  })
  revoked: boolean;

  @Column()
  @ApiProperty({
    description: "When this session expires",
    example: "2024-12-31T23:59:59.999Z",
  })
  expires_at: Date;

  @Column()
  @ApiProperty({
    description: "IP address where the session was started from",
    example: "127.0.0.1",
  })
  ip_address: string;

  @Column()
  @ApiProperty({
    description: "User agent string where the session was started from",
    example:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  })
  user_agent: string;
}
