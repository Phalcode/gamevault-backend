import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Genre } from "../database/entities/genre.entity";
import { MinimumRole } from "../decorators/minimum-role.decorator";
import { Role } from "../models/role.enum";

@Controller("genres")
@ApiTags("genres")
export class GenresController {
  constructor(
    @InjectRepository(Genre)
    private readonly genreRepository: Repository<Genre>,
  ) {}

  /**
   * Get a list of genres sorted by the amount of games that are associated with
   * each genre.
   *
   * @returns A promise that resolves to an array of Genre objects.
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
    const genres = await this.genreRepository.find();
    genres.sort((a, b) => b.games?.length - a.games?.length);
    return genres;
  }
}
