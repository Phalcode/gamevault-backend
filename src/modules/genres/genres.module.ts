import { Module, forwardRef } from "@nestjs/common";
import { GenresService } from "./genres.service";
import { GenresController } from "./genres.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Genre } from "./genre.entity";
import { FilesModule } from "../files/files.module";

@Module({
  imports: [TypeOrmModule.forFeature([Genre]), forwardRef(() => FilesModule)],
  controllers: [GenresController],
  providers: [GenresService],
  exports: [GenresService],
})
export class GenresModule {}
