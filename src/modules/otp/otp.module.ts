import { Module, forwardRef } from "@nestjs/common";
import { GamesModule } from "../games/games.module";
import { OtpController } from "./otp.controller";
import { OtpService } from "./otp.service";

@Module({
  imports: [forwardRef(() => GamesModule)],
  controllers: [OtpController],
  exports: [OtpService],
  providers: [OtpService],
})
export class OtpModule {}
