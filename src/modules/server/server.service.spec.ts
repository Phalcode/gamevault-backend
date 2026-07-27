import { ServerService } from "./server.service";

describe("ServerService", () => {
  let service: ServerService;
  let mockRepository: any;

  beforeEach(() => {
    mockRepository = {
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };
    service = new ServerService(mockRepository);
  });

  describe("onModuleInit", () => {
    it("should create a new UUID when no row exists", async () => {
      mockRepository.find.mockResolvedValue([]);
      mockRepository.create.mockReturnValue({ uuid: "test-uuid" });
      mockRepository.save.mockResolvedValue({ uuid: "test-uuid" });

      await service.onModuleInit();

      expect(mockRepository.find).toHaveBeenCalledWith({ take: 2 });
      expect(mockRepository.create).toHaveBeenCalledWith({
        uuid: expect.any(String),
      });
      expect(mockRepository.save).toHaveBeenCalled();
      expect(service.getServerUuid()).toBeDefined();
      expect(service.getServerUuid()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it("should return existing UUID when a row already exists", async () => {
      mockRepository.find.mockResolvedValue([{ uuid: "existing-uuid-1234" }]);

      await service.onModuleInit();

      expect(mockRepository.find).toHaveBeenCalledWith({ take: 2 });
      expect(mockRepository.create).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
      expect(service.getServerUuid()).toBe("existing-uuid-1234");
    });

    it("should clean up duplicate rows and keep the first", async () => {
      const row1 = { id: 1, uuid: "first-uuid" };
      const row2 = { id: 2, uuid: "second-uuid" };
      mockRepository.find.mockResolvedValue([row1, row2]);
      mockRepository.remove.mockResolvedValue(undefined);

      await service.onModuleInit();

      expect(mockRepository.remove).toHaveBeenCalledWith([row2]);
      expect(service.getServerUuid()).toBe("first-uuid");
    });
  });

  describe("getServerUuid", () => {
    it("should return cached UUID after initialization", async () => {
      mockRepository.find.mockResolvedValue([{ uuid: "cached-uuid" }]);

      await service.onModuleInit();
      const uuid = service.getServerUuid();

      expect(uuid).toBe("cached-uuid");
    });

    it("should return undefined before initialization", () => {
      mockRepository.find.mockResolvedValue([]);
      expect(service.getServerUuid()).toBeUndefined();
    });

    it("should return valid UUID v4 format after creation", async () => {
      mockRepository.find.mockResolvedValue([]);
      mockRepository.create.mockImplementation(({ uuid }) => ({
        uuid,
      }));
      mockRepository.save.mockImplementation((entity) => entity);

      await service.onModuleInit();

      expect(service.getServerUuid()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });
  });
});
