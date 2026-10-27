import { type LoggerService } from "@nestjs/common";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { PassThrough } from "node:stream";
import { afterAll, describe, expect, it } from "vitest";
import {
  STREAMED_UPLOAD_TEMP_SUFFIX,
  createStreamedUploadOptions,
  createStreamingTempStorageEngine,
  discardStreamedUpload,
  readFileHeader,
} from "./streamed-upload.js";

describe("createStreamingTempStorageEngine", () => {
  const directory = mkdtempSync(path.join(tmpdir(), "gamevault-upload-"));
  const engine = createStreamingTempStorageEngine(() => directory);

  afterAll(() => {
    rmSync(directory, { recursive: true, force: true });
  });

  const streamFile = async (content: string) => {
    const stream = new PassThrough();
    const file = { stream } as unknown as Express.Multer.File;

    const info = await new Promise<Partial<Express.Multer.File>>(
      (resolve, reject) => {
        // oxlint-disable-next-line no-underscore-dangle -- Multer storage engine API
        engine._handleFile({}, file, (error, result) =>
          error ? reject(error) : resolve(result ?? {}),
        );
        stream.end(content);
      },
    );

    return { file, info };
  };

  it("streams the upload to a temporary file without buffering it whole", async () => {
    const { info } = await streamFile("hello world");

    expect(info.size).toBe(Buffer.byteLength("hello world"));
    expect(info.path).toBeDefined();
    expect(path.dirname(info.path!)).toBe(directory);
    expect(path.extname(info.path!)).toBe(STREAMED_UPLOAD_TEMP_SUFFIX);
    expect(readFileSync(info.path!)).toEqual(Buffer.from("hello world"));
  });

  it("removes the temporary file again", async () => {
    const { file, info } = await streamFile("data");
    expect(existsSync(info.path!)).toBe(true);

    await new Promise<void>((resolve, reject) =>
      // oxlint-disable-next-line no-underscore-dangle -- Multer storage engine API
      engine._removeFile({}, file, (error) =>
        error ? reject(error) : resolve(),
      ),
    );

    expect(existsSync(info.path!)).toBe(false);
  });
});

describe("readFileHeader", () => {
  const directory = mkdtempSync(path.join(tmpdir(), "gamevault-header-"));
  const filePath = path.join(directory, "sample.bin");

  afterAll(() => {
    rmSync(directory, { recursive: true, force: true });
  });

  it("reads the requested number of bytes from the start of the file", async () => {
    writeFileSync(filePath, "PK\x03\x04payload-trailing-data");

    const header = await readFileHeader(filePath, 4);

    expect(header).toEqual(Buffer.from("PK\x03\x04"));
  });

  it("reads at most the file size", async () => {
    writeFileSync(filePath, "short");

    const header = await readFileHeader(filePath, 512);

    expect(header).toEqual(Buffer.from("short"));
  });
});

describe("createStreamedUploadOptions", () => {
  it("uses a streaming storage engine with a single-file, unlimited default limit", () => {
    const options = createStreamedUploadOptions({ directory: () => "/tmp" });

    expect(options.storage).toBeDefined();
    expect(options.limits).toEqual({
      fileSize: Number.MAX_SAFE_INTEGER,
      files: 1,
    });
  });

  it("applies the configured maximum file size", () => {
    const options = createStreamedUploadOptions({
      directory: () => "/tmp",
      maxFileSize: 4096,
    });

    expect(options.limits.fileSize).toBe(4096);
  });

  it("accepts every file when no filter is configured", () => {
    const options = createStreamedUploadOptions({ directory: () => "/tmp" });
    const callback = vi.fn();

    options.fileFilter({}, { originalname: "anything.bin" }, callback);

    expect(callback).toHaveBeenCalledWith(null, true);
  });

  it("delegates the accept/reject decision to the filename filter", () => {
    const rejection = new Error("nope");
    const options = createStreamedUploadOptions({
      directory: () => "/tmp",
      fileFilter: (filename) => (filename === "bad" ? rejection : undefined),
    });

    const rejected = vi.fn();
    options.fileFilter({}, { originalname: "bad" }, rejected);
    expect(rejected).toHaveBeenCalledWith(rejection, false);

    const accepted = vi.fn();
    options.fileFilter({}, { originalname: "good" }, accepted);
    expect(accepted).toHaveBeenCalledWith(null, true);
  });
});

describe("discardStreamedUpload", () => {
  const directory = mkdtempSync(path.join(tmpdir(), "gamevault-discard-"));

  afterAll(() => {
    rmSync(directory, { recursive: true, force: true });
  });

  it("does nothing when there is no temporary file", async () => {
    await expect(discardStreamedUpload(undefined)).resolves.toBeUndefined();
  });

  it("removes the temporary file", async () => {
    const tempPath = path.join(directory, "remove-me.tmp");
    writeFileSync(tempPath, "x");

    await discardStreamedUpload(tempPath);

    expect(existsSync(tempPath)).toBe(false);
  });

  it("logs a warning instead of throwing when removal fails", async () => {
    const blockingFile = path.join(directory, "blocking");
    writeFileSync(blockingFile, "x");
    const logger = { warn: vi.fn() } as unknown as LoggerService;
    const unreachable = path.join(blockingFile, "child");

    await expect(
      discardStreamedUpload(unreachable, logger),
    ).resolves.toBeUndefined();

    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ path: unreachable }),
    );
  });
});
