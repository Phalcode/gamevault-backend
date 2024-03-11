import { SetMetadata } from "@nestjs/common";
import { Role } from "../modules/users/models/role.enum";

export const MinimumRole = (role: Role) => SetMetadata("minimumRole", role);
