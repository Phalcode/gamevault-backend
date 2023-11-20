import { FilterOperator, FilterSuffix } from "nestjs-paginate/lib";

export const all_filters = [
  FilterSuffix.NOT,
  FilterOperator.EQ,
  FilterOperator.NULL,
  FilterOperator.IN,
  FilterOperator.GT,
  FilterOperator.GTE,
  FilterOperator.LT,
  FilterOperator.LTE,
  FilterOperator.BTW,
  FilterOperator.SW,
  FilterOperator.ILIKE,
  FilterOperator.CONTAINS,
];
