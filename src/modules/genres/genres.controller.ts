import { Controller, Get } from "@nestjs/common";
import {
  ApiBasicAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Genre } from "./genre.entity";
import { MinimumRole } from "../pagination/minimum-role.decorator";
import { Role } from "../users/models/role.enum";

@Controller("genres")
@ApiTags("genres")
@ApiBasicAuth()
export class GenresController {
  constructor(
    @InjectRepository(Genre)
    private readonly genreRepository: Repository<Genre>,
  ) {}

  /**
   * Get a list of genres sorted by the amount of games that are associated with
   * each genre.
   */
  @Get()
  @ApiOperation({
    summary: "get a list of genres",
    description:
      "the list is sorted by the amount of games that are associated with each genre.",
    operationId: "getGenres",
  })
  @MinimumRole(Role.GUEST)
  @ApiOkResponse({ type: () => Genre, isArray: true })
  async getGenres(): Promise<Genre[]> {
    const genres = await this.genreRepository.find({
      relations: ["games"],
      loadEagerRelations: false,
    });
    genres.sort((a, b) => b.games?.length - a.games?.length);
    return genres;
  }
}
