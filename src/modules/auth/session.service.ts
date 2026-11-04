import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { MoreThan, Repository } from "typeorm";
import { type GamevaultUser } from "../users/gamevault-user.entity.js";
import { Session } from "./session.entity.js";

/**
 * Owns destructive session operations. The explicit revoke-all endpoint and
 * credential changes share this implementation, so a refresh token that leaked
 * before a password change cannot outlive the change.
 */
@Injectable()
export class SessionService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
  ) {}

  /** Revokes every active session of the given user. */
  async revokeAllUserSessions(user: Pick<GamevaultUser, "id">): Promise<void> {
    await this.sessionRepository.update(
      {
        user: { id: user.id },
        revoked: false,
        expires_at: MoreThan(new Date()),
      },
      {
        revoked: true,
      },
    );
    this.logger.debug({
      message: "All active sessions revoked for user",
      user_id: user.id,
    });
  }
}
