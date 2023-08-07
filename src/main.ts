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
  app.use(helmet({ contentSecurityPolicy: false }));
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
        .setTitle("GameVault Backend Server")
        .setContact("Phalcode", "https://phalco.de", "contact@phalco.de")
        .setExternalDoc("Documentation", "https://gamevau.lt")
        .setDescription(
          "Backend for GameVault, the self-hosted gaming platform for drm-free games",
        )
        .setVersion(process.env.npm_package_version)
        .addBasicAuth()
        .addServer(`http://localhost:8080`, "Local GameVault Server")
        .setLicense(
          "Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)",
          "https://github.com/Phalcode/gamevault-backend/LICENSE",
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

  app
    .getHttpAdapter()
    .getInstance()
    .get("/", (_request, response) => {
      response.send(
        "<p style='font-family: Arial, sans-serif; font-size: 16px; color: #333; line-height: 1.5; text-align: center;''><strong>Web UI is in Another Castle!</strong><br/>The server is operational, but there is currently no Web UI available for GameVault.<br/><br/><strong>Simply connect to the server using the GameVault Client Application for now.</strong></p>",
      );
    });

  await app.listen(8080);
  logger.debug("Loaded Configuration", configuration);
  logger.log(
    `Started GameVault Server with version ${process.env.npm_package_version} on port 8080.`,
  );
}
bootstrap();
