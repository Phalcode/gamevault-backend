import { forwardRef, Module } from "@nestjs/common";

import { GamesModule } from "../games/games.module";
import { ImagesModule } from "../images/images.module";
import { BoxArtsService } from "./boxarts.service";

@Module({
  imports: [forwardRef(() => GamesModule), ImagesModule],
  controllers: [],
  providers: [BoxArtsService],
  exports: [BoxArtsService],
})
export class BoxartsModule {}
