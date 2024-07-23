import { IsOptional } from "class-validator";

export function IsOptionalIf(condition: boolean) {
    if (!condition) {
        return () => {};
    }
    return IsOptional()
  }