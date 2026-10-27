import { NotFoundException, StreamableFile } from "@nestjs/common";
import type { Mock } from "vitest";

vi.mock("fs-extra", () => ({
  __esModule: true,
  default: {
    createReadStream: vi.fn(),
    pathExists: vi.fn(),
    outputFile: vi.fn(),
  },
}));

import fsExtra from "fs-extra";
import { ConfigController } from "./config.controller.js";

describe("ConfigController", () => {
  let controller: ConfigController;
  let pathExists: Mock;
  let createReadStream: Mock;
  let outputFile: Mock;

  beforeEach(() => {
    pathExists = (fsExtra as any).pathExists;
    createReadStream = (fsExtra as any).createReadStream;
    outputFile = (fsExtra as any).outputFile;
    controller = new ConfigController({
      VOLUMES: { CONFIG: "/tmp/config" },
    } as any);
  });

  it("returns a stream when news.md exists", async () => {
    pathExists.mockResolvedValue(true);
    createReadStream.mockReturnValue({});
    const result = await controller.getNews();
    expect(result).toBeInstanceOf(StreamableFile);
    expect(pathExists).toHaveBeenCalledWith("/tmp/config/news.md");
    expect(createReadStream).toHaveBeenCalledWith("/tmp/config/news.md");
  });

  it("throws NotFoundException when news.md is missing", async () => {
    pathExists.mockResolvedValue(false);
    await expect(controller.getNews()).rejects.toThrow(NotFoundException);
  });

  it("writes the news content", async () => {
    outputFile.mockResolvedValue(undefined);
    await controller.putNews({ content: "Hello" } as any);
    expect(outputFile).toHaveBeenCalledWith("/tmp/config/news.md", "Hello");
  });
});
