export default class Otp {
  otp: string;
  username: string;
  createdAt: Date = new Date();
  expiresAt: Date = new Date(Date.now() + 5 * 60 * 1000); // 5 Minutes
  gameId?: number;
  xDownloadSpeedLimit?: number;

  constructor(
    otp: string,
    username: string,
    gameId?: number,
    xDownloadSpeedLimit?: number,
  ) {
    this.otp = otp;
    this.username = username;
    this.gameId = gameId;
    this.xDownloadSpeedLimit = xDownloadSpeedLimit;
  }

  getLoggableData() {
    return {
      otp: "**REDACTED**",
      username: this.username,
      createdAt: this.createdAt,
      expiresAt: this.expiresAt,
      gameId: this.gameId,
      xDownloadSpeedLimit: this.xDownloadSpeedLimit,
    };
  }
}
