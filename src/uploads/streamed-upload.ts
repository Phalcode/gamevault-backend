import { type LoggerService, ParseFilePipe } from "@nestjs/common";
import fsExtra from "fs-extra";
import { randomBytes } from "node:crypto";
import { open } from "node:fs/promises";
import path from "node:path";
const { createWriteStream, ensureDirSync, remove } = fsExtra;

/** Form field every streamed upload endpoint reads its file from. */
export const UPLOAD_FIELD_NAME = "file";

/** Presence check shared by every streamed upload endpoint. */
export const REQUIRED_UPLOAD_FILE_PIPE = new ParseFilePipe({
  fileIsRequired: true,
});

export interface StreamedUploadOptions {
  /** Directory the upload is streamed to before it is moved to its final location. */
  directory: () => string;
  /** Maximum accepted upload size in bytes. Unlimited when omitted. */
  maxFileSize?: number | null;
  /** Optional filename validation. Return an error to reject the upload. */
  fileFilter?: (filename: string) => Error | undefined;
}

/**
 * Builds the Multer options for a streamed upload endpoint: the request body is
 * written straight to a temporary file on disk (never buffered in memory),
 * oversized uploads are aborted mid-stream, and rejected filenames never reach
 * the disk at all.
 */
export function createStreamedUploadOptions({
  directory,
  maxFileSize,
  fileFilter,
}: StreamedUploadOptions) {
  return {
    storage: createStreamingTempStorageEngine(directory),
    limits: {
      fileSize: maxFileSize ?? Number.MAX_SAFE_INTEGER,
      files: 1,
    },
    fileFilter(
      _req: unknown,
      file: { originalname: string },
      callback: (error: Error | null, acceptFile: boolean) => void,
    ) {
      const error = fileFilter?.(file.originalname);
      callback(error ?? null, !error);
    },
  };
}

/**
 * Suffix used for the temporary files that are created while an upload is
 * streamed to disk. It is intentionally not a supported game file format (and
 * not a UUID) so the file watcher, the file indexer and the media garbage
 * collector ignore these files while they are still being written.
 */
export const STREAMED_UPLOAD_TEMP_SUFFIX = ".gamevault-upload";

type UploadCallback = (
  error?: unknown,
  info?: Partial<Express.Multer.File>,
) => void;

type RemoveCallback = (error: Error | null) => void;

/**
 * Creates a minimal Multer storage engine that streams the incoming upload
 * directly to a temporary file on disk instead of buffering the whole file in
 * memory.
 *
 * It mirrors `multer.diskStorage` (assigning `file.path` before the stream is
 * piped) so Multer can still remove the partial file when a request is aborted
 * mid-upload. The finished file is moved to its final destination (or removed)
 * by the consuming service.
 *
 * @param getDirectory - Resolves the directory the temporary file is written to.
 */
export function createStreamingTempStorageEngine(getDirectory: () => string) {
  return {
    _handleFile(
      _req: unknown,
      file: Express.Multer.File,
      callback: UploadCallback,
    ) {
      const directory = getDirectory();
      const filename = `.gamevault-${randomBytes(16).toString("hex")}${STREAMED_UPLOAD_TEMP_SUFFIX}`;
      const tempPath = path.join(directory, filename);

      if (file.stream.destroyed) {
        return;
      }

      ensureDirSync(directory);

      const outputStream = createWriteStream(tempPath);
      // Set the path synchronously so Multer can remove the partial file if the
      // request is aborted before the upload finished.
      file.path = tempPath;

      file.stream.pipe(outputStream);
      outputStream.on("error", (error) => callback(error));
      outputStream.on("finish", () =>
        callback(null, {
          destination: directory,
          filename,
          path: tempPath,
          size: outputStream.bytesWritten,
        }),
      );
    },

    _removeFile(
      _req: unknown,
      file: Express.Multer.File,
      callback: RemoveCallback,
    ) {
      const tempPath = file.path;
      delete (file as Partial<Express.Multer.File>).destination;
      delete (file as Partial<Express.Multer.File>).filename;
      delete (file as Partial<Express.Multer.File>).path;
      remove(tempPath).then(
        () => callback(null),
        (error) => callback(error),
      );
    },
  };
}

/**
 * Reads up to `length` bytes from the start of a file. File type detection only
 * inspects the first bytes of a file, so this is enough to validate an upload
 * that was streamed to disk without reading the whole file into memory.
 *
 * @param filePath - The file to read from.
 * @param length - Maximum number of bytes to read.
 */
export async function readFileHeader(
  filePath: string,
  length = 512,
): Promise<Buffer> {
  const handle = await open(filePath, "r");
  try {
    const buffer = Buffer.alloc(length);
    const { bytesRead } = await handle.read(buffer, 0, length, 0);
    return buffer.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }
}

/**
 * Best-effort removal of a streamed temporary upload file. Cleanup failures are
 * only logged, as they must never mask the actual upload result.
 *
 * @param tempPath - The temporary file to remove.
 * @param logger - Optional logger for cleanup failures.
 */
export async function discardStreamedUpload(
  tempPath?: string,
  logger?: LoggerService,
): Promise<void> {
  if (!tempPath) {
    return;
  }
  try {
    await remove(tempPath);
  } catch (error) {
    logger?.warn({
      message: "Failed to clean up a temporary upload file.",
      path: tempPath,
      error,
    });
  }
}
