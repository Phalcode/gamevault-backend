import { UnauthorizedException } from "@nestjs/common";
import type { Mocked } from "vitest";
import { FilesService } from "../games/files.service.js";
import { OtpService } from "./otp.service.js";

describe("OtpService", () => {
  let service: OtpService;
  let filesService: Mocked<FilesService>;

  beforeEach(() => {
    filesService = {
      download: vi.fn(),
    } as any;

    service = new OtpService(filesService);
  });

  describe("create", () => {
    it("should create an OTP and return the token string", () => {
      const result = service.create("testuser", 42, 7, 1024);
      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("should create unique OTPs for each call", () => {
      const otp1 = service.create("testuser", 1);
      const otp2 = service.create("testuser", 2);
      expect(otp1).not.toBe(otp2);
    });

    it("should create OTPs without optional parameters", () => {
      const result = service.create("testuser");
      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
    });
  });

  describe("get", () => {
    it("should validate and consume a valid OTP", async () => {
      const mockResponse = { setHeader: vi.fn() } as any;
      const otp = service.create("testuser", 42, 7, 1024);
      filesService.download.mockResolvedValue({} as any);

      await service.get(otp, mockResponse);
      expect(filesService.download).toHaveBeenCalledWith(
        mockResponse,
        42,
        7,
        1024,
      );
    });

    it("should throw UnauthorizedException for invalid OTP", async () => {
      const mockResponse = { setHeader: vi.fn() } as any;
      await expect(
        service.get("invalid-otp-value", mockResponse),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should throw UnauthorizedException for already consumed OTP", async () => {
      const mockResponse = { setHeader: vi.fn() } as any;
      const otp = service.create("testuser", 42);
      filesService.download.mockResolvedValue({} as any);

      // First use should succeed
      await service.get(otp, mockResponse);

      // Second use should fail
      await expect(service.get(otp, mockResponse)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should throw UnauthorizedException for expired OTP", async () => {
      const mockResponse = { setHeader: vi.fn() } as any;
      const otp = service.create("testuser", 42);

      // Manually expire the OTP
      const otpMap = (service as any).otps;
      const otpEntry = otpMap.get(otp);
      otpEntry.expiresAt = new Date(Date.now() - 1000);

      await expect(service.get(otp, mockResponse)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should pass download speed limit to filesService", async () => {
      const mockResponse = { setHeader: vi.fn() } as any;
      const otp = service.create("testuser", 99, undefined, 2048);
      filesService.download.mockResolvedValue({} as any);

      await service.get(otp, mockResponse);
      expect(filesService.download).toHaveBeenCalledWith(
        mockResponse,
        99,
        undefined,
        2048,
      );
    });

    it("should bind OTP download to the requested version id", async () => {
      const mockResponse = { setHeader: vi.fn() } as any;
      const otp = service.create("testuser", 101, 33, 4096);
      filesService.download.mockResolvedValue({} as any);

      await service.get(otp, mockResponse);

      expect(filesService.download).toHaveBeenCalledWith(
        mockResponse,
        101,
        33,
        4096,
      );
    });
  });
});
