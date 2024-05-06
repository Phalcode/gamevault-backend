import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { FilesModule } from "../files/files.module";
import { Genre } from "./genre.entity";
import { GenresController } from "./genres.controller";
import { GenresService } from "./genres.service";

@Module({
  imports: [TypeOrmModule.forFeature([Genre]), forwardRef(() => FilesModule)],
  controllers: [GenresController],
  providers: [GenresService],
  exports: [GenresService],
})
export class GenresModule {}
