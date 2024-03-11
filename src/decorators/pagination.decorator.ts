import { applyDecorators } from "@nestjs/common";
import { ApiQuery } from "@nestjs/swagger";

export function PaginateQueryOptions() {
  return applyDecorators(
    ApiQuery({
      name: "page",
      required: false,
      type: () => Number,
      description: "page to retrieve",
    }),
    ApiQuery({
      name: "limit",
      required: false,
      type: () => Number,
      description: `number of items per page to retrieve, default is ${Number.MAX_SAFE_INTEGER} (max safe integer)`,
    }),
    ApiQuery({
      name: "search",
      required: false,
      type: () => String,
      description: "search query",
    }),
    ApiQuery({
      name: "sortBy",
      required: false,
      description:
        "sorting that should be applied. More info on: https://github.com/ppetzold/nestjs-paginate#usage",
      example: "title:DESC",
    }),
    ApiQuery({
      name: "filter",
      required: false,
      description:
        "filters that should be applied. More info on: https://github.com/ppetzold/nestjs-paginate#usage",
      isArray: true,
      example: ["filter.early_access=$not:true"],
    }),
  );
}
