import { SetMetadata } from "@nestjs/common";
export const DISABLE_API_IF_KEY = "disableApiIf";
export const DisableApiIf = (disabled: boolean) =>
  SetMetadata(DISABLE_API_IF_KEY, disabled);
