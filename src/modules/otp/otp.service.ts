import {
  Injectable,
  Logger,
  StreamableFile,
  UnauthorizedException,
} from "@nestjs/common";
import { Interval } from "@nestjs/schedule";
import { randomBytes } from "crypto";
import { Response } from "express";
import ms from "ms";
import { FilesService } from "./../games/files.service";
import Otp from "./models/otp.model";

@Injectable()
export class OtpService {
  private readonly logger = new Logger(this.constructor.name);
  private otps = new Map<string, Otp>();

  constructor(private readonly filesService: FilesService) {}

  @Interval("cleanupOtps", ms("5m"))
  private cleanup() {
    this.otps.forEach((otp) => {
      if (otp.expiresAt < new Date(Date.now())) {
        this.otps.delete(otp.otp);
      }
    });
  }

  public create(
    username: string,
    gameId?: number,
    xDownloadSpeedLimit?: number,
  ): string {
    const randomOtp = randomBytes(64).toString("hex");
    const otp = new Otp(randomOtp, username, gameId, xDownloadSpeedLimit);
    this.otps.set(randomOtp, otp);
    this.logger.log("OTP Created.", otp.getLoggableData());
    return randomOtp;
  }

  async get(otp: string, response: Response): Promise<StreamableFile> {
    const existingOtp = this.otps.get(otp);
    if (!existingOtp) {
      throw new UnauthorizedException("Invalid OTP");
    }
    if (existingOtp.expiresAt < new Date(Date.now())) {
      throw new UnauthorizedException("Expired OTP");
    }
    this.logger.log("OTP Validated.", existingOtp.getLoggableData());
    this.otps.delete(otp);
    return this.filesService.download(
      response,
      existingOtp.gameId,
      existingOtp.xDownloadSpeedLimit,
    );
  }
}
