import { BadRequestException } from "@nestjs/common";
import configuration from "../../configuration.js";
import { gameUploadMulterOptions } from "./game-upload.multer.js";

describe("gameUploadMulterOptions", () => {
  const runFileFilter = (originalname: string) => {
    const callback = vi.fn();
    gameUploadMulterOptions.fileFilter({}, { originalname }, callback);
    return callback;
  };

  it("limits uploads to a single file of the configured maximum size", () => {
    expect(gameUploadMulterOptions.limits.files).toBe(1);
    expect(gameUploadMulterOptions.limits.fileSize).toBe(
      configuration.GAMES.MAX_UPLOAD_SIZE,
    );
  });

  it("accepts supported game file formats", () => {
    expect(runFileFilter("My Game.zip")).toHaveBeenCalledWith(null, true);
  });

  it("rejects unsupported file formats", () => {
    expect(runFileFilter("notes.txt")).toHaveBeenCalledWith(
      expect.any(BadRequestException),
      false,
    );
  });

  it("rejects filenames that sanitize to an empty string", () => {
    expect(runFileFilter("///")).toHaveBeenCalledWith(
      expect.any(BadRequestException),
      false,
    );
  });
});
