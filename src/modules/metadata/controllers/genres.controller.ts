import { Controller, Get } from "@nestjs/common";
import {
  ApiBasicAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { MinimumRole } from "../../../decorators/minimum-role.decorator";
import { Role } from "../../users/models/role.enum";
import { GenreMetadata } from "../entities/genre-metadata.entity";

@Controller("genres")
@ApiTags("genres")
@ApiBasicAuth()
export class GenresController {
  constructor(
    @InjectRepository(GenreMetadata)
    private readonly genreRepository: Repository<GenreMetadata>,
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
  @ApiOkResponse({ type: () => GenreMetadata, isArray: true })
  async getGenres(): Promise<GenreMetadata[]> {
    const genres = await this.genreRepository.find({
      relations: ["games"],
      loadEagerRelations: false,
    });
    genres.sort((a, b) => b.games?.length - a.games?.length);
    return genres;
  }
}
