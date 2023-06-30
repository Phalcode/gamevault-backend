import { SetMetadata } from "@nestjs/common";
import { Role } from "../models/role.enum";

export const MinimumRole = (role: Role) => SetMetadata("minimumRole", role);
