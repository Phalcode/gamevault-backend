import {
  Controller,
  Get,
  Headers,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import {
  ApiOperation,
  ApiTags,
  ApiBasicAuth,
  ApiHeader,
} from "@nestjs/swagger";
import { MinimumRole } from "../../decorators/minimum-role.decorator";
import { Role } from "../users/models/role.enum";
import { DatabaseService } from "./database.service";
import { FileInterceptor } from "@nestjs/platform-express";

@ApiBasicAuth()
@ApiTags("database")
@Controller("database")
export class DatabaseController {
  constructor(private databaseService: DatabaseService) {}

  @Get("backup")
  @ApiOperation({
    summary:
      "Create and download a database backup. This process will generate an unencrypted file containing all the data currently stored in the database, which can be restored at a later time. **DEPRECATED** Moved to /admin/database/backup",
    operationId: "getDatabaseBackup",
    deprecated: true,
  })
  @ApiHeader({
    name: "X-Database-Password",
    required: true,
    description:
      "This header should include the database password. Without the correct password, your request will be denied.",
    example: "SecretPassword123",
  })
  @MinimumRole(Role.ADMIN)
  async getDatabaseBackup(@Headers("X-Database-Password") password: string) {
    return this.databaseService.backup(password);
  }

  @Post("restore")
  @ApiOperation({
    summary:
      "Upload and restore a previously saved database dump. This action will replace all current data in the database. **DEPRECATED** Moved to /admin/database/restore",
    operationId: "postDatabaseRestore",
    deprecated: true,
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
  async postDatabaseRestore(
    @UploadedFile()
    file: Express.Multer.File,
    @Headers("X-Database-Password") password: string,
  ) {
    return await this.databaseService.restore(file, password);
  }
}
