import { Module, OnModuleInit } from "@nestjs/common";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "path";
import configuration from "../../configuration";
import { FrontendService } from "./frontend.service";

@Module({
  providers: [FrontendService],
  exports: [FrontendService],
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(configuration.VOLUMES.CONFIG, "frontend", "dist"),
    }),
  ],
})
export class FrontendModule implements OnModuleInit {
  constructor(private readonly frontendService: FrontendService) {}

  async onModuleInit() {
    await this.frontendService.prepareFrontend();
  }
}
