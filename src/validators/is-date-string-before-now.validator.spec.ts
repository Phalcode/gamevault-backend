import { validate } from "class-validator";
import { IsDateStringBeforeNow } from "./is-date-string-before-now.validator.js";

class TestDto {
  @IsDateStringBeforeNow()
  date!: string;
}

describe("IsDateStringBeforeNow", () => {
  it("should pass for a date in the past", async () => {
    const dto = new TestDto();
    dto.date = "2020-01-01T00:00:00.000Z";
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it("should fail for a date in the future", async () => {
    const dto = new TestDto();
    dto.date = "2099-01-01T00:00:00.000Z";
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toBeDefined();
  });

  it("should fail for an invalid date string", async () => {
    const dto = new TestDto();
    dto.date = "not-a-date";
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("should fail for a non-string value", async () => {
    const dto = new TestDto();
    (dto as any).date = 12345;
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("should produce a meaningful default message", async () => {
    const dto = new TestDto();
    dto.date = "2099-12-31T23:59:59.000Z";
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const message = Object.values(errors[0].constraints!)[0];
    expect(message).toContain("date");
    expect(message).toContain("before");
  });
});
