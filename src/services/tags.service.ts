import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Tag } from "../database/entities/tag.entity";

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
  async getOrCreateTag(name: string, rawg_id: number): Promise<Tag> {
    const existingTag = await this.tagRepository.findOneBy({ rawg_id });

    if (existingTag) return existingTag;

    this.logger.log("Creating new Tag with name: " + name);
    const newTag = new Tag();
    newTag.name = name;
    newTag.rawg_id = rawg_id;
    return this.tagRepository.save(newTag);
  }
}
