import type { Mock } from "vitest";
import { SavefileController } from "./savefile.controller.js";

describe("SavefileController", () => {
  let controller: SavefileController;
  let savefileService: { upload: Mock; download: Mock; delete: Mock };

  beforeEach(() => {
    savefileService = {
      upload: vi.fn(),
      download: vi.fn(),
      delete: vi.fn(),
    };
    controller = new SavefileController(savefileService as any);
  });

  it("uploads a save file with the user/game ids and installation id", async () => {
    const params = { user_id: 1, game_id: 2 } as any;
    const req = { user: { username: "dev" } } as any;
    const file = { originalname: "save.zip" } as any;
    await controller.postSavefileByUserIdAndGameId(
      params,
      req,
      "inst-1",
      file,
    );
    expect(savefileService.upload).toHaveBeenCalledWith(
      1,
      2,
      file,
      "dev",
      "inst-1",
    );
  });

  it("downloads a save file", async () => {
    const params = { user_id: 1, game_id: 2 } as any;
    const req = { user: { username: "dev" } } as any;
    savefileService.download.mockResolvedValue("stream");
    const result = await controller.getSaveFileByUserIdAndGameId(params, req);
    expect(savefileService.download).toHaveBeenCalledWith(1, 2, "dev");
    expect(result).toBe("stream");
  });

  it("deletes a save file", async () => {
    const params = { user_id: 1, game_id: 2 } as any;
    await controller.deleteSaveFileByUserIdAndGameId(params);
    expect(savefileService.delete).toHaveBeenCalledWith(1, 2);
  });
});
