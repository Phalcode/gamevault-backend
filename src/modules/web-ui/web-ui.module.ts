import { Logger, Module, OnModuleInit } from "@nestjs/common";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join, resolve } from "node:path";
import configuration from "../../configuration.js";
import { WebUIService } from "./web-ui.service.js";

/**
 * Content-Security-Policy for the served Web UI. Only applied to the static
 * frontend assets, so API responses and the Swagger UI are unaffected.
 * The analytics hosts are read from the configuration, so no collector domain
 * has to be written out here.
 */
function webUiCsp(): string {
  const collectors = configuration.ANALYTICS.ENABLED
    ? configuration.ANALYTICS.ENDPOINTS.map((endpoint) => {
        try {
          return new URL(endpoint).origin;
        } catch {
          return "";
        }
      }).filter(Boolean)
    : [];
  return [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://rsms.me",
    "font-src 'self' https://rsms.me",
    "img-src 'self' data: blob:",
    "media-src 'self' blob:",
    "frame-src https://www.youtube.com",
    ["connect-src", "'self'", ...collectors].join(" "),
    "base-uri 'none'",
    "object-src 'none'",
    "frame-ancestors 'none'",
  ].join("; ");
}

function setWebUiSecurityHeaders(response: {
  setHeader(name: string, value: string): void;
}): void {
  const mode = configuration.WEB_UI.CSP_MODE;
  if (mode === "off") return;
  response.setHeader(
    mode === "enforce"
      ? "Content-Security-Policy"
      : "Content-Security-Policy-Report-Only",
    webUiCsp(),
  );
}

@Module({
  providers: [WebUIService],
  exports: [WebUIService],
  imports: [
    ServeStaticModule.forRoot({
      rootPath: resolve(join(configuration.VOLUMES.CONFIG, "frontend", "dist")),
      serveStaticOptions: {
        setHeaders: (response) => setWebUiSecurityHeaders(response),
      },
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
