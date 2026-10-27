import { BadRequestException } from "@nestjs/common";
import lodash from "lodash";
import path from "node:path";
import filenameSanitizer from "sanitize-filename";
import configuration from "../../configuration.js";
import { createStreamedUploadOptions } from "../../uploads/streamed-upload.js";
const { toLower } = lodash;

const supportedFormatsSet = new Set(
  configuration.GAMES.SUPPORTED_FILE_FORMATS.map((format) => toLower(format)),
);

/** Rejects filenames the game indexer could not handle. */
function validateGameFilename(filename: string): Error | undefined {
  const sanitized = filenameSanitizer(filename);
  if (!sanitized) {
    return new BadRequestException(
      "The uploaded file has an invalid filename.",
    );
  }

  const extension = toLower(path.extname(sanitized));
  if (!supportedFormatsSet.has(extension)) {
    return new BadRequestException(
      `Unsupported file format "${extension}". Supported formats: ${Array.from(supportedFormatsSet).join(", ")}`,
    );
  }

  return undefined;
}

/** Streams game uploads to a temporary file inside the files volume. */
export const gameUploadMulterOptions = createStreamedUploadOptions({
  directory: () => configuration.VOLUMES.FILES,
  maxFileSize: configuration.GAMES.MAX_UPLOAD_SIZE,
  fileFilter: validateGameFilename,
});
