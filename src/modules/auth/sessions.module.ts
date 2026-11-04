import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Session } from "./session.entity.js";
import { SessionService } from "./session.service.js";

/**
 * Session operations that more than one module needs. Kept separate from
 * `AuthModule` because `AuthModule` imports `UsersModule`, and `UsersModule`
 * must be able to revoke sessions without depending on authentication.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Session])],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionsModule {}
