export default class Otp {
  otp: string;
  username: string;
  gameId?: number;
  createdAt: Date = new Date();
  expiresAt: Date = new Date(Date.now() + 5 * 60 * 1000); // 5 Minutes

  constructor(otp: string, username: string, gameId?: number) {
    this.otp = otp;
    this.gameId = gameId;
  }

  getLoggableData() {
    return {
      otp: "**REDACTED**",
      username: this.username,
      gameId: this.gameId,
      createdAt: this.createdAt,
      expiresAt: this.expiresAt,
    };
  }
}
