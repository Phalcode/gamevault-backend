import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Builder } from "builder-pattern";
import { Repository } from "typeorm";

import { Store } from "./store.entity";

@Injectable()
export class StoresService {
  private readonly logger = new Logger(StoresService.name);
  constructor(
    @InjectRepository(Store)
    private storeRepository: Repository<Store>,
  ) {}

  /**
   * Returns the store with the specified RAWG ID, creating a new store if one
   * does not already exist.
   */
  async getOrCreate(name: string, rawg_id: number): Promise<Store> {
    const existingStore = await this.storeRepository.findOneBy({ rawg_id });

    if (existingStore) return existingStore;

    const store = await this.storeRepository.save(
      Builder(Store).name(name).rawg_id(rawg_id).build(),
    );
    this.logger.log({
      message: "Created new Store.",
      store,
    });
    return store;
  }
}
