import { tmpdir } from "node:os";
import { createStreamedUploadOptions } from "../../uploads/streamed-upload.js";

/**
 * Multer options for database restore uploads. The dump is streamed to a
 * temporary file on disk so it is never buffered in memory; the database
 * service reads that file directly when restoring.
 */
export const databaseRestoreMulterOptions = createStreamedUploadOptions({
  directory: () => tmpdir(),
});
