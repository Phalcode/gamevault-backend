import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Builder } from "builder-pattern";
import { Repository } from "typeorm";

import { Genre } from "./genre.entity";

@Injectable()
export class GenresService {
  private readonly logger = new Logger(GenresService.name);
  constructor(
    @InjectRepository(Genre)
    private tagRepository: Repository<Genre>,
  ) {}

  /**
   * Returns the genre with the specified RAWG ID, creating a new genre if one
   * does not already exist.
   */
  async getOrCreate(name: string, rawg_id: number): Promise<Genre> {
    const existingGenre = await this.tagRepository.findOneBy({ name });

    if (existingGenre) return existingGenre;

    const genre = this.tagRepository.save(
      Builder(Genre).name(name).rawg_id(rawg_id).build(),
    );
    this.logger.log({
      message: "Created new Genre.",
      genre,
    });
    return genre;
  }
}
