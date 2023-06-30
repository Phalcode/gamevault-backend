import { ApiProperty } from "@nestjs/swagger";
import { Paginated } from "nestjs-paginate";
import { SortBy, Column } from "nestjs-paginate/lib/helper";

export class Metadata<T> {
  @ApiProperty({ example: 50, description: "amount of items per page" })
  itemsPerPage: number;
  @ApiProperty({ example: 5000, description: "total amount of items" })
  totalItems: number;
  @ApiProperty({ example: 5, description: "current page number" })
  currentPage: number;
  @ApiProperty({ example: 12, description: "total number of pages" })
  totalPages: number;
  @ApiProperty({ description: "sorting that was applied by the query" })
  sortBy: SortBy<T>;
  @ApiProperty({ description: "searches that were applied by the query" })
  searchBy: Column<T>[];
  @ApiProperty({ description: "search query" })
  search: string;
  @ApiProperty({ description: "select string" })
  select: string[];
  @ApiProperty({ description: "filters that were applied by the query" })
  filter?: {
    [column: string]: string | string[];
  };
}

export class Links {
  @ApiProperty({
    example:
      "http://localhost:3000/games?limit=5&page=1&sortBy=title:DESC&search=i&filter.early_access=$not:true",
    description: "first page",
  })
  first?: string;
  @ApiProperty({
    example:
      "http://localhost:3000/games?limit=5&page=1&sortBy=title:DESC&search=i&filter.early_access=$not:true",
    description: "previous page",
  })
  previous?: string;
  @ApiProperty({
    example:
      "http://localhost:3000/games?limit=5&page=2&sortBy=title:DESC&search=i&filter.early_access=$not:true",
    description: "current page",
  })
  current: string;
  @ApiProperty({
    example:
      "http://localhost:3000/games?limit=5&page=3&sortBy=title:DESC&search=i&filter.early_access=$not:true",
    description: "next page",
  })
  next?: string;
  @ApiProperty({
    example:
      "http://localhost:3000/games?limit=5&page=3&sortBy=title:DESC&search=i&filter.early_access=$not:true",
    description: "last page",
  })
  last?: string;
}

export class PaginatedEntity<T> implements Paginated<T> {
  data: T[];
  @ApiProperty({ description: "metadata of this list", type: Metadata })
  meta: Metadata<T>;
  @ApiProperty({ description: "links to related queries", type: Links })
  links: Links;
}
