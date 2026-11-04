import { Repository } from "typeorm";
import type { Mocked } from "vitest";
import { Session } from "./session.entity.js";
import { SessionService } from "./session.service.js";

describe("SessionService", () => {
  let service: SessionService;
  let sessionRepository: Mocked<Repository<Session>>;

  beforeEach(() => {
    sessionRepository = {
      update: vi.fn().mockResolvedValue({ affected: 0 }),
    } as any;

    service = new SessionService(sessionRepository);
  });

  describe("revokeAllUserSessions", () => {
    it("revokes every active session of the user", async () => {
      await service.revokeAllUserSessions({ id: 42 });

      expect(sessionRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          user: { id: 42 },
          revoked: false,
          expires_at: expect.anything(),
        }),
        { revoked: true },
      );
    });
  });
});
