import { FilterOperator, FilterSuffix } from "nestjs-paginate/lib";

export const all_filters = [
  FilterOperator.EQ,
  FilterSuffix.NOT,
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
