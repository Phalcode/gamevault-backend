import { Module, OnModuleInit } from "@nestjs/common";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "path";
import configuration from "../../configuration";
import { WebUIService } from "./web-ui.service";

@Module({
  providers: [WebUIService],
  exports: [WebUIService],
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(configuration.VOLUMES.CONFIG, "frontend", "dist"),
    }),
  ],
})
export class WebUIModule implements OnModuleInit {
  constructor(private readonly webUIService: WebUIService) {}

  async onModuleInit() {
    await this.webUIService.prepareFrontend();
  }
}
