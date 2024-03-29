import { SetMetadata } from "@nestjs/common";
import { Role } from "../modules/users/models/role.enum";

export const MINIMUM_ROLE_KEY = "minimumRole";
export const MinimumRole = (role: Role) => SetMetadata(MINIMUM_ROLE_KEY, role);
