import configuration from "../../configuration.js";
import { createStreamedUploadOptions } from "../../uploads/streamed-upload.js";

/**
 * Multer options for savefile uploads. The upload is streamed to a temporary
 * file on disk so it is never buffered in memory. The savefile service
 * validates the file content and moves the temporary file to its final
 * location.
 */
export const savefileUploadMulterOptions = createStreamedUploadOptions({
  directory: () => configuration.VOLUMES.SAVEFILES,
  maxFileSize: configuration.SAVEFILES.MAX_SIZE,
});
