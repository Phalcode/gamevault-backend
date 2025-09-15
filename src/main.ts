import * as dotenv from "dotenv";
dotenv.config();

import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import compression from "compression";
import cookieparser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
//import { AsyncApiDocumentBuilder, AsyncApiModule } from "nestjs-asyncapi";

import { Response } from "express";
import { AppModule } from "./app.module";
import configuration, {
  getCensoredConfiguration,
  getMaxBodySizeInBytes,
} from "./configuration";
import { LoggingExceptionFilter } from "./filters/http-exception.filter";
import { default as logger, stream, default as winston } from "./logging";
import { LegacyRoutesMiddleware } from "./middleware/legacy-routes.middleware";
import loadPlugins from "./plugin";

const customHeaders = [
  "Authorization",
  "Accept-Ranges",
  "Content-Length",
  "Content-Disposition",
  "Range",
  "X-Api-Key",
  "X-Database-Password",
  "X-Download-Size",
  "X-Download-Speed-Limit",
  "X-Installation-Id",
];

async function bootstrap(): Promise<void> {
  // Load Modules & Plugins
  const builtinModules = Reflect.getOwnMetadata("imports", AppModule);
  const pluginModules = await loadPlugins();
  const modules = [...builtinModules, ...pluginModules];

  Reflect.defineMetadata("imports", modules, AppModule);
  // Create App
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: winston,
  });

  // To Support Reverse Proxies
  app.set("trust proxy", 1);
  // Fancy JSON Responses
  app.set("json spaces", 2);
  // CORS Configuration
  app.enableCors({
    origin: configuration.SERVER.CORS_ALLOWED_ORIGINS.length
      ? configuration.SERVER.CORS_ALLOWED_ORIGINS
      : "*",
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    exposedHeaders: customHeaders,
    allowedHeaders: customHeaders,
  });
  // GZIP
  app.use(compression());

  // Set Max Body Size

  const maxBodySettings = {
    limit: `${getMaxBodySizeInBytes()}b`,
    extended: true,
  };
  app.useBodyParser("json", maxBodySettings);
  app.useBodyParser("urlencoded", maxBodySettings);
  app.useBodyParser("text", maxBodySettings);
  app.useBodyParser("raw", maxBodySettings);

  // Security Measurements
  app.use(helmet({ contentSecurityPolicy: false }));

  // Cookies
  app.use(cookieparser());

  // Support Legacy Routes
  app.use(new LegacyRoutesMiddleware().use);

  // Skips logs for /status and /health calls
  app.use(
    morgan(configuration.SERVER.REQUEST_LOG_FORMAT, {
      stream,
      skip: (req) => req.url.includes("/status") || req.url.includes("/health"),
    }),
  );

  // Validates incoming data
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );
  // Logs HTTP 4XX and 5XX as warns and errors
  app.useGlobalFilters(new LoggingExceptionFilter());

  // Basepath
  app.setGlobalPrefix("api");

  // Enable automatic HTTP Error Response Logging
  app.useGlobalFilters(new LoggingExceptionFilter());

  // Provide API Specification
  if (configuration.SERVER.API_DOCS_ENABLED) {
    SwaggerModule.setup(
      "api/docs",
      app,
      SwaggerModule.createDocument(
        app,
        new DocumentBuilder()
          .setTitle("GameVault Backend Server")
          .setContact("Phalcode", "https://phalco.de", "contact@phalco.de")
          .setExternalDoc("Documentation", "https://gamevau.lt")
          .setDescription(
            "Backend for GameVault, the self-hosted gaming platform for drm-free games",
          )
          .setVersion(configuration.SERVER.VERSION)
          .addBearerAuth(
            {
              type: "http",
              scheme: "bearer",
              bearerFormat: "JWT",
              description:
                "Access token obtained from /api/auth/*/login endpoint.",
            },
            "bearer",
          )
          .addBasicAuth(
            {
              type: "http",
              scheme: "basic",
              description: "Basic Authentication",
            },
            "basic",
          )
          .addApiKey(
            {
              type: "apiKey",
              name: "X-Api-Key",
              in: "header",
              description: "API-Key Authentication",
            },
            "apikey",
          )
          .addServer(
            `http://localhost:${configuration.SERVER.PORT}`,
            "Local GameVault Server",
          )
          .addServer(`https://demo.gamevau.lt`, "Demo GameVault Server")
          .setLicense(
            "Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)",
            "https://github.com/Phalcode/gamevault-backend/LICENSE",
          )
          .build(),
      ),
    );
    // TODO: Leads to EACCES: permission denied, mkdir '/root/.npm/_cacache/tmp' running in docker for some reason
    //await AsyncApiModule.setup(
    //  "api/docs/async",
    //  app,
    //  AsyncApiModule.createDocument(
    //    app,
    //    new AsyncApiDocumentBuilder()
    //      .setTitle("GameVault Backend Server")
    //      .setDescription(
    //        "Asynchronous Socket.IO Backend for GameVault, the self-hosted gaming platform for drm-free games. To make a request, you need to authenticate with the X-Api-Key Header during the handshake. You can get this secret by using the /users/me REST API.",
    //      )
    //      .setContact("Phalcode", "https://phalco.de", "contact@phalco.de")
    //      .setExternalDoc("Documentation", "https://gamevau.lt")
    //      .setDefaultContentType("application/json")
    //      .setVersion(configuration.SERVER.VERSION)
    //      .addServer("Local GameVault Server", {
    //        url: "localhost:8080",
    //        protocol: "ws",
    //      })
    //      .addServer("Demo GameVault Server", {
    //        url: "demo.gamevau.lt",
    //        protocol: "wss",
    //      })
    //      .setLicense(
    //        "Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)",
    //        "https://github.com/Phalcode/gamevault-backend/LICENSE",
    //      )
    //      .build(),
    //  ),
    //);
  }

  // Redirect /health to /status
  app.use("/api/health", (_req, res: Response) => {
    res.redirect(308, "/api/status");
  });

  if (configuration.SERVER.LANDING_PAGE_ENABLED) {
    app
      .getHttpAdapter()
      .getInstance()
      .get("/", (_request, response) => {
        response.send(
          '<p style=\'font-family: Arial, sans-serif; font-size: 16px; color: #333; line-height: 1.5; text-align: center;\'\'><strong>🕹️ GameVault UI is in Another Castle! 🏰</strong><br/>The server is operational, but there is currently no Web UI available for GameVault.<br/><br/><strong>Simply connect to the server using the <a target="_blank" href="https://www.microsoft.com/store/apps/9PCKDV76GL75" >GameVault Client Application</a> for now.</strong></p>',
        );
      });
  }

  await app.listen(configuration.SERVER.PORT);

  logger.log({
    context: "Initialization",
    message: `Started GameVault Server.`,
    version: configuration.SERVER.VERSION,
    port: configuration.SERVER.PORT,
    config: getCensoredConfiguration(),
  });
}

Error.stackTraceLimit = configuration.SERVER.STACK_TRACE_LIMIT;
bootstrap().catch((error) => {
  logger.fatal({ message: "A fatal error occured", error });
  throw error;
});
