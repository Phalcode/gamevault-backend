import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Builder } from "builder-pattern";
import { Repository } from "typeorm";

import { Developer } from "./developer.entity";

@Injectable()
export class DevelopersService {
  private readonly logger = new Logger(DevelopersService.name);
  constructor(
    @InjectRepository(Developer)
    private developerRepository: Repository<Developer>,
  ) {}

  /**
   * Returns the developer with the specified RAWG ID, creating a new developer
   * if one does not already exist.
   */
  async getOrCreate(name: string, rawg_id: number): Promise<Developer> {
    const existingDeveloper = await this.developerRepository.findOneBy({
      rawg_id,
    });

    if (existingDeveloper) return existingDeveloper;

    const developer = await this.developerRepository.save(
      Builder(Developer).name(name).rawg_id(rawg_id).build(),
    );
    this.logger.log({
      message: "Created new Developer.",
      developer,
    });
    return developer;
  }
}
