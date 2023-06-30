import { FilterOperator, FilterSuffix } from "nestjs-paginate/lib";

export const all_filters = [
  FilterOperator.BTW,
  FilterOperator.EQ,
  FilterOperator.GT,
  FilterOperator.GTE,
  FilterOperator.IN,
  FilterOperator.LT,
  FilterOperator.LTE,
  FilterOperator.NULL,
  FilterOperator.ILIKE,
  FilterOperator.SW,
  FilterSuffix.NOT,
];
