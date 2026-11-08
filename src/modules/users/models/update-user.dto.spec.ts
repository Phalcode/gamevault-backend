import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { describe, expect, it } from "vitest";
import { Role } from "./role.enum.js";
import { UpdateUserDto } from "./update-user.dto.js";

describe("UpdateUserDto", () => {
  describe("role", () => {
    it("accepts a numeric role", async () => {
      const dto = plainToInstance(UpdateUserDto, { role: Role.EDITOR });

      expect(await validate(dto)).toHaveLength(0);
      expect(dto.role).toBe(Role.EDITOR);
    });

    it("accepts the role as a numeric string, as sent by the web UI", async () => {
      const dto = plainToInstance(UpdateUserDto, {
        role: String(Role.EDITOR),
      });

      expect(await validate(dto)).toHaveLength(0);
      expect(dto.role).toBe(Role.EDITOR);
    });

    it("rejects an unknown role", async () => {
      const dto = plainToInstance(UpdateUserDto, { role: "99" });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0]?.property).toBe("role");
    });
  });
});
