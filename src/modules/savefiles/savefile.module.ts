import { forwardRef, Module } from "@nestjs/common";

import { GamesModule } from "../games/games.module";
import { UsersModule } from "../users/users.module";
import { SavefileController } from "./savefile.controller";
import { SavefileService } from "./savefile.service";

@Module({
  imports: [forwardRef(() => UsersModule), forwardRef(() => GamesModule)],
  controllers: [SavefileController],
  providers: [SavefileService],
  exports: [SavefileService],
})
export class SavefileModule {}
