import { SetMetadata } from "@nestjs/common";

import { type Role } from "../modules/users/models/role.enum.js";

export const MINIMUM_ROLE_KEY = "minimumRole";
export const MinimumRole = (role: Role) => SetMetadata(MINIMUM_ROLE_KEY, role);
