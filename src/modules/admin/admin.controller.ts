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

import { MinimumRole } from "../../decorators/minimum-role.decorator";
import { DatabaseService } from "../database/database.service";
import { StatusService } from "../status/status.service";
import { Role } from "../users/models/role.enum";

@ApiBearerAuth()
@ApiSecurity('apikey')
@Controller("admin")
@ApiTags("admin")
export class AdminController {
  constructor(
    private readonly statusService: StatusService,
    private readonly databaseService: DatabaseService,
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
  @UseInterceptors(FileInterceptor("file"))
  @MinimumRole(Role.ADMIN)
  async postAdminDatabaseRestore(
    @UploadedFile()
    file: Express.Multer.File,
    @Headers("X-Database-Password") password: string,
  ) {
    return this.databaseService.restore(file, password);
  }
}
