import configuration from "../../configuration.js";
import { createStreamedUploadOptions } from "../../uploads/streamed-upload.js";

/**
 * Multer options for media uploads. The upload is streamed to a temporary file
 * on disk so it is never buffered in memory. The media service validates the
 * file content and moves the temporary file to its final location.
 */
export const mediaUploadMulterOptions = createStreamedUploadOptions({
  directory: () => configuration.VOLUMES.MEDIA,
  maxFileSize: configuration.MEDIA.MAX_SIZE,
});
