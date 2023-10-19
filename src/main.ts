import * as dotenv from "dotenv";
dotenv.config();

import { ValidationPipe } from "@nestjs/common";
import { NestFactory, Reflector } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import cookieparser from "cookie-parser";
import compression from "compression";
import helmet from "helmet";
import morgan from "morgan";
import { AppModule } from "./app.module";
import configuration from "./configuration";
import { default as logger, default as winston, stream } from "./logging";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AuthenticationGuard } from "./modules/auth/authentication.guard";
import { AuthorizationGuard } from "./modules/auth/authorization.guard";
import { LoggingExceptionFilter } from "./modules/log/exception.filter";
/**
 * Bootstraps the application by creating a NestJS application, configuring it,
 * and setting up global settings and routes.
 *
 * @returns A promise that resolves when the server is listening.
 */
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

  // TODO: Fix this versioning...
  app.setGlobalPrefix("api/v1");
  const reflector = app.get(Reflector);

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
          .addServer(`http://localhost:8080`, "Local GameVault Server")
          .addServer(`https://demo.gamevau.lt`, "Demo GameVault Server")
          .setLicense(
            "Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)",
            "https://github.com/Phalcode/gamevault-backend/LICENSE",
          )
          .build(),
      ),
    );
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

  await app.listen(8080);
  logger.debug("Loaded Configuration", configuration);
  logger.log(
    `Started GameVault Server v${configuration.SERVER.VERSION} on port 8080.`,
  );
}
bootstrap();
