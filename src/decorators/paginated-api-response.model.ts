import { applyDecorators, Type } from "@nestjs/common";
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from "@nestjs/swagger";
import { PaginatedEntity } from "../models/paginated-entity.model";

export const ApiOkResponsePaginated = <DataDto extends Type<unknown>>(
  dataDto: DataDto,
) =>
  applyDecorators(
    ApiExtraModels(PaginatedEntity, dataDto),
    ApiOkResponse({
      schema: {
        required: ["data", "meta", "links"],
        allOf: [
          {
            properties: {
              data: {
                description: "paginated list of entities",
                type: "array",
                items: { $ref: getSchemaPath(dataDto) },
              },
            },
          },
          { $ref: getSchemaPath(PaginatedEntity) },
        ],
      },
    }),
  );
