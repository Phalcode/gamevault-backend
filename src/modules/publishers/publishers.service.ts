import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Publisher } from "./publisher.entity";
import { Builder } from "builder-pattern";

@Injectable()
export class PublishersService {
  private readonly logger = new Logger(PublishersService.name);
  constructor(
    @InjectRepository(Publisher)
    private publisherRepository: Repository<Publisher>,
  ) {}

  /**
   * Returns the publisher with the specified RAWG ID, creating a new publisher
   * if one does not already exist.
   */
  async getOrCreate(name: string, rawg_id: number): Promise<Publisher> {
    const existingPublisher = await this.publisherRepository.findOneBy({
      rawg_id,
    });

    if (existingPublisher) return existingPublisher;

    const publisher = await this.publisherRepository.save(
      Builder(Publisher).name(name).rawg_id(rawg_id).build(),
    );
    this.logger.log({
      message: "Created new Publisher.",
      publisher,
    });
    return publisher;
  }
}
