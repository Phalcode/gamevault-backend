import type { Mock } from "vitest";
import { OtpController } from "./otp.controller.js";

describe("OtpController", () => {
  let controller: OtpController;
  let otpService: { get: Mock };

  beforeEach(() => {
    otpService = { get: vi.fn() };
    controller = new OtpController(otpService as any);
  });

  it("delegates to otpService.get with the otp and response", async () => {
    const response = {} as any;
    otpService.get.mockReturnValue("stream");
    const result = await controller.getOtpGame("abc", response);
    expect(otpService.get).toHaveBeenCalledWith("abc", response);
    expect(result).toBe("stream");
  });
});
