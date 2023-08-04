import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Publisher } from "./publisher.entity";

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
  async getOrCreatePublisher(
    name: string,
    rawg_id: number,
  ): Promise<Publisher> {
    const existingPublisher = await this.publisherRepository.findOneBy({
      rawg_id,
    });

    if (existingPublisher) return existingPublisher;

    this.logger.log("Creating new Publisher with name: " + name);
    const newPublisher = new Publisher();
    newPublisher.name = name;
    newPublisher.rawg_id = rawg_id;
    return this.publisherRepository.save(newPublisher);
  }
}
