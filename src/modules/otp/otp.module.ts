import { Module, forwardRef } from "@nestjs/common";
import { GamesModule } from "../games/games.module.js";
import { OtpController } from "./otp.controller.js";
import { OtpService } from "./otp.service.js";

@Module({
  imports: [forwardRef(() => GamesModule)],
  controllers: [OtpController],
  exports: [OtpService],
  providers: [OtpService],
})
export class OtpModule {}
