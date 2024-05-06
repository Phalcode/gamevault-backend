import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Builder } from "builder-pattern";
import { Repository } from "typeorm";

import { Tag } from "./tag.entity";

@Injectable()
export class TagsService {
  private readonly logger = new Logger(TagsService.name);

  constructor(
    @InjectRepository(Tag)
    private tagRepository: Repository<Tag>,
  ) {}

  /**
   * Returns the tag with the specified RAWG ID, creating a new tag if one does
   * not already exist.
   */
  async getOrCreate(name: string, rawg_id: number): Promise<Tag> {
    const existingTag = await this.tagRepository.findOneBy({ name });

    if (existingTag) return existingTag;

    const tag = await this.tagRepository.save(
      Builder(Tag).name(name).rawg_id(rawg_id).build(),
    );

    this.logger.log({
      message: "Created new Tag.",
      tag,
    });
    return tag;
  }
}
