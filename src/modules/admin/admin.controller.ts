import {
  Controller,
  Get,
  Headers,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from "@nestjs/swagger";

import { MinimumRole } from "../../decorators/minimum-role.decorator.js";
import {
  REQUIRED_UPLOAD_FILE_PIPE,
  UPLOAD_FIELD_NAME,
} from "../../uploads/streamed-upload.js";
import { DatabaseService } from "../database/database.service.js";
import { Role } from "../users/models/role.enum.js";
import { WebUIService } from "../web-ui/web-ui.service.js";
import { databaseRestoreMulterOptions } from "./database-restore.multer.js";

@ApiBearerAuth()
@ApiSecurity("apikey")
@Controller("admin")
@ApiTags("admin")
export class AdminController {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly webUIService: WebUIService,
  ) {}

  @Get("database/backup")
  @ApiOperation({
    summary:
      "Create and download a database backup. This process will generate an unencrypted file containing all the data currently stored in the database, which can be restored at a later time.",
    operationId: "getAdminDatabaseBackup",
  })
  @ApiHeader({
    name: "X-Database-Password",
    required: true,
    description:
      "This header should include the database password. Without the correct password, your request will be denied.",
    example: "SecretPassword123",
  })
  @MinimumRole(Role.ADMIN)
  async getAdminDatabaseBackup(
    @Headers("X-Database-Password") password: string,
  ) {
    return this.databaseService.backup(password);
  }

  @Post("database/restore")
  @ApiOperation({
    summary:
      "Upload and restore a previously saved database dump. This action will replace all current data in the database.",
    operationId: "postAdminDatabaseRestore",
  })
  @ApiHeader({
    name: "X-Database-Password",
    required: true,
    description:
      "This header should include the database password. Without the correct password, your request will be denied.",
    example: "SecretPassword123",
  })
  @UseInterceptors(
    FileInterceptor(UPLOAD_FIELD_NAME, databaseRestoreMulterOptions),
  )
  @MinimumRole(Role.ADMIN)
  async postAdminDatabaseRestore(
    // The interceptor streams the dump to a temporary file on disk; the database
    // service reads it directly and cleans it up afterwards.
    @UploadedFile(REQUIRED_UPLOAD_FILE_PIPE)
    file: Express.Multer.File,
    @Headers("X-Database-Password") password: string,
  ) {
    return this.databaseService.restore(file, password);
  }

  @Post("web-ui/restart")
  @ApiOperation({
    summary:
      "Completely restarts the Web User Interface. The current instance will be stopped, cached data deleted, the Web UI will be re-downloaded according to the config, and then restarted.",
    operationId: "postAdminWebUIRestart",
  })
  @MinimumRole(Role.ADMIN)
  async postAdminWebUIRestart() {
    await this.webUIService.cleanCacheExceptZip();
    await this.webUIService.prepareFrontend();
  }
}
