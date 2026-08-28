import { ServerService } from "./server.service";

describe("ServerService", () => {
  let service: ServerService;
  let mockRepository: any;

  beforeEach(() => {
    mockRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    service = new ServerService(mockRepository);
  });

  describe("onModuleInit", () => {
    it("should create and persist a new UUID when no row exists", async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue({ uuid: "test-uuid" });
      mockRepository.save.mockResolvedValue({ uuid: "test-uuid" });

      await service.onModuleInit();

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: {} });
      expect(mockRepository.create).toHaveBeenCalledWith({
        uuid: expect.any(String),
      });
      expect(mockRepository.save).toHaveBeenCalled();
      expect(service.getServerUuid()).toBeDefined();
      expect(service.getServerUuid()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it("should reuse the existing UUID when a row already exists", async () => {
      mockRepository.findOne.mockResolvedValue({
        uuid: "existing-uuid-1234",
      });

      await service.onModuleInit();

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: {} });
      expect(mockRepository.create).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
      expect(service.getServerUuid()).toBe("existing-uuid-1234");
    });
  });

  describe("getServerUuid", () => {
    it("should return the UUID after initialization", async () => {
      mockRepository.findOne.mockResolvedValue({ uuid: "cached-uuid" });
      await service.onModuleInit();
      expect(service.getServerUuid()).toBe("cached-uuid");
    });

    it("should return undefined before initialization", () => {
      expect(service.getServerUuid()).toBeUndefined();
    });
  });
});
