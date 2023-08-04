import { Module, forwardRef } from "@nestjs/common";
import { BoxArtsService } from "./boxarts.service";
import { GamesModule } from "../games/games.module";
import { ImagesModule } from "../images/images.module";

@Module({
  imports: [forwardRef(() => GamesModule), ImagesModule],
  controllers: [],
  providers: [BoxArtsService],
  exports: [BoxArtsService],
})
export class BoxartsModule {}
