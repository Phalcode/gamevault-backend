import { EventEmitter } from "events";
import type { Mock } from "vitest";

vi.mock("fs-extra", () => ({
  __esModule: true,
  default: {
    createReadStream: vi.fn(),
    stat: vi.fn(),
  },
}));

import fsExtra from "fs-extra";
import { MediaController } from "./media.controller.js";

describe("MediaController", () => {
  let controller: MediaController;
  let mediaService: { findOneByMediaIdOrFail: Mock; upload: Mock };
  let stat: Mock;
  let createReadStream: Mock;

  const makeRes = () => {
    const res: any = {
      headersSent: false,
      set: vi.fn(),
      status: vi.fn().mockReturnThis(),
      end: vi.fn(),
      json: vi.fn(),
      pipe: vi.fn(),
    };
    return res;
  };

  const makeReq = (headers: Record<string, string> = {}) => ({
    headers: new Map(Object.entries(headers)),
  });

  const makeStream = () => {
    const stream = new EventEmitter() as any;
    stream.pipe = vi.fn();
    return stream;
  };

  beforeEach(() => {
    stat = (fsExtra as any).stat;
    createReadStream = (fsExtra as any).createReadStream;
    mediaService = { findOneByMediaIdOrFail: vi.fn(), upload: vi.fn() };
    controller = new MediaController(mediaService as any);
  });

  it("sets content-type and cache headers then streams", async () => {
    mediaService.findOneByMediaIdOrFail.mockResolvedValue({
      id: 1,
      type: "image/png",
      file_path: "/x.png",
    });
    stat.mockResolvedValue({
      size: 100,
      mtime: new Date("2026-01-01"),
      mtimeMs: 1000,
    });
    const stream = makeStream();
    createReadStream.mockReturnValue(stream);
    const res = makeRes();

    await controller.getMediaByMediaId("1", makeReq() as any, res);

    expect(res.set).toHaveBeenCalledWith("Content-Type", "image/png");
    expect(res.set).toHaveBeenCalledWith(
      "Cache-Control",
      "public, max-age=31536000, immutable",
    );
    expect(res.set).toHaveBeenCalledWith("ETag", `W/"100-1000"`);
    expect(stream.pipe).toHaveBeenCalledWith(res);
  });

  it("responds 304 when If-None-Match matches the ETag", async () => {
    mediaService.findOneByMediaIdOrFail.mockResolvedValue({
      id: 1,
      type: "image/png",
      file_path: "/x.png",
    });
    stat.mockResolvedValue({
      size: 100,
      mtime: new Date("2026-01-01"),
      mtimeMs: 1000,
    });
    const stream = makeStream();
    createReadStream.mockReturnValue(stream);
    const res = makeRes();

    await controller.getMediaByMediaId(
      "1",
      makeReq({ "if-none-match": 'W/"100-1000"' }) as any,
      res,
    );

    expect(res.status).toHaveBeenCalledWith(304);
    expect(res.end).toHaveBeenCalled();
  });

  it("returns 500 on a stream error before headers are sent", async () => {
    mediaService.findOneByMediaIdOrFail.mockResolvedValue({
      id: 1,
      type: "image/png",
      file_path: "/x.png",
    });
    stat.mockResolvedValue({
      size: 100,
      mtime: new Date("2026-01-01"),
      mtimeMs: 1000,
    });
    const stream = makeStream();
    createReadStream.mockReturnValue(stream);
    const res = makeRes();

    await controller.getMediaByMediaId("1", makeReq() as any, res);
    stream.emit("error", new Error("boom"));

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Internal Server Error" }),
    );
  });

  it("delegates upload to mediaService", async () => {
    mediaService.upload.mockResolvedValue({ id: 9 });
    const req = { user: { username: "dev" } };
    const result = await controller.postMedia(req as any, {
      size: 1,
    } as any);
    expect(mediaService.upload).toHaveBeenCalled();
    expect(result).toEqual({ id: 9 });
  });
});
