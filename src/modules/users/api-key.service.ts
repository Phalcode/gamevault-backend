import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { GamevaultUser } from "./gamevault-user.entity";

@Injectable()
export class ApiKeyService {
  constructor(
    @InjectRepository(GamevaultUser)
    private readonly userRepository: Repository<GamevaultUser>,
  ) {}

  async findUserByApiKeyOrFail(api_key: string) {
    return this.userRepository.findOneOrFail({
      where: {
        api_key,
      },
      relationLoadStrategy: "query",
    });
  }

  async findApiKeyOrFail(userId: number): Promise<string> {
    const user = await this.userRepository.findOneOrFail({
      select: ["id", "api_key"],
      where: { id: userId },
      relationLoadStrategy: "query",
    });

    return user.api_key;
  }
}
