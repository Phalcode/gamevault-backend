import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { GamevaultUser } from "./gamevault-user.entity";

@Injectable()
export class SocketSecretService {
  constructor(
    @InjectRepository(GamevaultUser)
    private userRepository: Repository<GamevaultUser>,
  ) {}

  async findUserBySocketSecretOrFail(socketSecret: string) {
    return this.userRepository.findOneOrFail({
      where: {
        socket_secret: socketSecret,
      },
      relationLoadStrategy: "query",
    });
  }

  async findSocketSecretOrFail(userId: number): Promise<string> {
    const user = await this.userRepository.findOneOrFail({
      select: ["id", "socket_secret"],
      where: { id: userId },
      relationLoadStrategy: "query",
    });

    return user.socket_secret;
  }
}
