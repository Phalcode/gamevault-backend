import Otp from "./otp.model";

describe("Otp Model", () => {
  it("should create an OTP with all properties", () => {
    const otp = new Otp("abc123", "testuser", 42, 7, 1024);
    expect(otp.otp).toBe("abc123");
    expect(otp.username).toBe("testuser");
    expect(otp.gameId).toBe(42);
    expect(otp.versionId).toBe(7);
    expect(otp.xDownloadSpeedLimit).toBe(1024);
    expect(otp.createdAt).toBeInstanceOf(Date);
    expect(otp.expiresAt).toBeInstanceOf(Date);
  });

  it("should expire 5 minutes from creation", () => {
    const before = Date.now();
    const otp = new Otp("abc123", "testuser");
    const after = Date.now();

    const fiveMinutesMs = 5 * 60 * 1000;
    expect(otp.expiresAt.getTime()).toBeGreaterThanOrEqual(
      before + fiveMinutesMs,
    );
    expect(otp.expiresAt.getTime()).toBeLessThanOrEqual(
      after + fiveMinutesMs + 10,
    );
  });

  it("should create an OTP without optional parameters", () => {
    const otp = new Otp("abc123", "testuser");
    expect(otp.gameId).toBeUndefined();
    expect(otp.versionId).toBeUndefined();
    expect(otp.xDownloadSpeedLimit).toBeUndefined();
  });

  describe("getLoggableData", () => {
    it("should redact the OTP value", () => {
      const otp = new Otp("secret-value", "testuser", 42, 7, 1024);
      const loggable = otp.getLoggableData();
      expect(loggable.otp).toBe("**REDACTED**");
      expect(loggable.username).toBe("testuser");
      expect(loggable.gameId).toBe(42);
      expect(loggable.versionId).toBe(7);
      expect(loggable.xDownloadSpeedLimit).toBe(1024);
      expect(loggable.createdAt).toBeInstanceOf(Date);
      expect(loggable.expiresAt).toBeInstanceOf(Date);
    });

    it("should never expose the actual OTP value", () => {
      const sensitiveOtp = "very-secret-token-12345";
      const otp = new Otp(sensitiveOtp, "testuser");
      const loggable = otp.getLoggableData();
      expect(loggable.otp).not.toBe(sensitiveOtp);
      expect(JSON.stringify(loggable)).not.toContain(sensitiveOtp);
    });
  });
});
