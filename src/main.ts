import * as dotenv from "dotenv";
dotenv.config();

import { ValidationPipe } from "@nestjs/common";
import { NestFactory, Reflector } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
//import { AsyncApiDocumentBuilder, AsyncApiModule } from "nestjs-asyncapi";
import cookieparser from "cookie-parser";
import compression from "compression";
import helmet from "helmet";
import morgan from "morgan";
import { AppModule } from "./app.module";
import configuration, { getCensoredConfiguration } from "./configuration";
import { default as logger, default as winston, stream } from "./logging";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AuthenticationGuard } from "./modules/guards/authentication.guard";
import { AuthorizationGuard } from "./modules/guards/authorization.guard";
import { LoggingExceptionFilter } from "./filters/http-exception.filter";
import { ApiVersionMiddleware } from "./middleware/remove-api-version.middleware";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: winston,
  });

  // To Support Reverse Proxies
  app.set("trust proxy", 1);
  // Fancy JSON Responses
  app.set("json spaces", 2);
  // CORS Configuration
  if (configuration.SERVER.CORS_ALLOWED_ORIGINS.length) {
    app.enableCors({
      origin: configuration.SERVER.CORS_ALLOWED_ORIGINS,
      credentials: true,
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    });
  } else {
    app.enableCors();
  }

  // GZIP
  app.use(compression());
  // Security Measurements
  app.use(helmet({ contentSecurityPolicy: false }));
  // Cookies
  app.use(cookieparser());

  app.use(new ApiVersionMiddleware().use);

  // Skips logs for /health calls
  app.use(
    morgan(configuration.SERVER.REQUEST_LOG_FORMAT, {
      stream: stream,
      skip: (req) => req.url.includes("/health"),
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
  const reflector = app.get(Reflector);

  // Enable automatic HTTP Error Response Logging
  app.useGlobalFilters(new LoggingExceptionFilter());

  // Enable Authentication and Authorization
  app.useGlobalGuards(
    new AuthenticationGuard(reflector),
    new AuthorizationGuard(reflector),
  );

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
          .addBasicAuth()
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
    /* Skip until it works on docker
    await AsyncApiModule.setup(
      "api/docs/async",
      app,
      AsyncApiModule.createDocument(
        app,
        new AsyncApiDocumentBuilder()
          .setTitle("GameVault Backend Server")
          .setDescription(
            "Asynchronous Socket.IO Backend for GameVault, the self-hosted gaming platform for drm-free games. To make a request, you need to authenticate with the X-Socket-Secret Header during the handshake. You can get this secret by using the /users/me REST API.",
          )
          .setContact("Phalcode", "https://phalco.de", "contact@phalco.de")
          .setExternalDoc("Documentation", "https://gamevau.lt")
          .setDefaultContentType("application/json")
          .setVersion(configuration.SERVER.VERSION)
          .addServer("Local GameVault Server", {
            url: "localhost:8080",
            protocol: "ws",
          })
          .addServer("Demo GameVault Server", {
            url: "demo.gamevau.lt",
            protocol: "wss",
          })
          .setLicense(
            "Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)",
            "https://github.com/Phalcode/gamevault-backend/LICENSE",
          )
          .build(),
      ),
    );
   */
  }

  // Provide fancy pants landing page
  app
    .getHttpAdapter()
    .getInstance()
    .get("/", (_request, response) => {
      response.send(
        '<p style=\'font-family: Arial, sans-serif; font-size: 16px; color: #333; line-height: 1.5; text-align: center;\'\'><strong>🕹️ GameVault UI is in Another Castle! 🏰</strong><br/>The server is operational, but there is currently no Web UI available for GameVault.<br/><br/><strong>Simply connect to the server using the <a target="_blank" href="https://www.microsoft.com/store/apps/9PCKDV76GL75" >GameVault Client Application</a> for now.</strong></p>',
      );
    });

  await app.listen(configuration.SERVER.PORT);

  logger.log({
    message: `Started GameVault Server.`,
    version: configuration.SERVER.VERSION,
    port: configuration.SERVER.PORT,
    config: getCensoredConfiguration(),
  });
}
bootstrap();
