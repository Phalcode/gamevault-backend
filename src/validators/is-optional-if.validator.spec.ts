import { IsString, validateSync } from "class-validator";

import { IsOptionalIf } from "./is-optional-if.validator.js";

class OptionalWhenTrueDto {
  @IsOptionalIf(true)
  @IsString()
  value?: string;
}

class OptionalWhenFalseDto {
  @IsOptionalIf(false)
  @IsString()
  value?: string;
}

describe("IsOptionalIf", () => {
  it("should make property optional when condition is true", () => {
    const dto = new OptionalWhenTrueDto();

    const errors = validateSync(dto);

    expect(errors).toHaveLength(0);
  });

  it("should keep property required for downstream validators when condition is false", () => {
    const dto = new OptionalWhenFalseDto();

    const errors = validateSync(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe("value");
    expect(errors[0].constraints).toHaveProperty("isString");
  });

  it("should still validate value type when condition is true and value is provided", () => {
    const dto = new OptionalWhenTrueDto();
    (dto as any).value = 123;

    const errors = validateSync(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toHaveProperty("isString");
  });
});
