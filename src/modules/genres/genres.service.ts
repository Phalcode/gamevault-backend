import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
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
  async getOrCreateGenre(name: string, rawg_id: number): Promise<Genre> {
    const existingGenre = await this.tagRepository.findOneBy({ rawg_id });

    if (existingGenre) return existingGenre;

    this.logger.log("Creating new Genre with name: " + name);
    const newGenre = new Genre();
    newGenre.name = name;
    newGenre.rawg_id = rawg_id;
    return this.tagRepository.save(newGenre);
  }
}
