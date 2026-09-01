import { forwardRef, Module } from "@nestjs/common";

import { GamesModule } from "../games/games.module.js";
import { UsersModule } from "../users/users.module.js";
import { SavefileController } from "./savefile.controller.js";
import { SavefileService } from "./savefile.service.js";

@Module({
  imports: [forwardRef(() => UsersModule), forwardRef(() => GamesModule)],
  controllers: [SavefileController],
  providers: [SavefileService],
  exports: [SavefileService],
})
export class SavefileModule {}
