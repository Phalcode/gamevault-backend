import { Logger, Module, OnModuleInit } from "@nestjs/common";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join, resolve } from "path";
import configuration from "../../configuration.js";
import { WebUIService } from "./web-ui.service.js";

@Module({
  providers: [WebUIService],
  exports: [WebUIService],
  imports: [
    ServeStaticModule.forRoot({
      rootPath: resolve(join(configuration.VOLUMES.CONFIG, "frontend", "dist")),
    }),
  ],
})
export class WebUIModule implements OnModuleInit {
  private readonly logger = new Logger(this.constructor.name);
  constructor(private readonly webUIService: WebUIService) {}

  async onModuleInit() {
    this.logger.log({
      message: "Initializing WebUIModule",
      rootPath: resolve(join(configuration.VOLUMES.CONFIG, "frontend", "dist")),
    });
    await this.webUIService.prepareFrontend();
  }
}
