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
import { AuthenticationGuard } from "./auth/authentication.guard";
import { AuthorizationGuard } from "./auth/authorization.guard";
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

  app.set("trust proxy", 1);
  app.set("json spaces", 2);
  app.enableCors({ origin: configuration.SERVER.CORS_ALLOWED_ORIGINS });
  app.use(compression());
  app.use(helmet());
  app.use(cookieparser());
  app.use(
    morgan(configuration.SERVER.REQUEST_LOG_FORMAT, {
      stream: stream,
      skip: (req) => req.url.endsWith("/health"),
    }),
  );
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );

  app.setGlobalPrefix("api/v1");
  const reflector = app.get(Reflector);
  app.useGlobalGuards(
    new AuthenticationGuard(reflector),
    new AuthorizationGuard(reflector),
  );
  SwaggerModule.setup(
    "api/docs",
    app,
    SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle("Crackpipe Backend Server")
        .setContact("Phalcode", "https://phalco.de", "contact@phalco.de")
        .setExternalDoc("Documentation", "https://crackpipe.de")
        .setDescription(
          "Backend for Crackpipe, the decentralized gaming platform for 'alternatively obtained' games",
        )
        .setVersion(process.env.npm_package_version)
        .addBasicAuth()
        .addServer(
          `http://localhost:${configuration.SERVER.PORT}`,
          "Local Crackpipe Server",
        )
        .setLicense(
          "Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)",
          "https://github.com/Phalcode/crackpipe-backend/LICENSE",
        )
        .addTag("game", "apis for games")
        .addTag("progress", "apis for progresses")
        .addTag("tags", "apis for tags")
        .addTag("genres", "apis for genres")
        .addTag("user", "apis for user management")
        .addTag("utility", "apis for miscellaneous utilities")
        .addTag("rawg", "apis for rawg services")
        .addTag("images", "apis for handling images")
        .build(),
    ),
  );

  await app.listen(configuration.SERVER.PORT);
  logger.debug("Loaded Configuration", configuration);
  logger.log(
    `Started Crackpipe Server with version ${process.env.npm_package_version} on port ${configuration.SERVER.PORT}.`,
  );
}
bootstrap();
