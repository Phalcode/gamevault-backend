import { Test } from "@nestjs/testing";

import { AppModule } from "../../app.module";
import { HealthController } from "./health.controller";

describe("/api/health", () => {
  let healthController: HealthController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    healthController = moduleRef.get<HealthController>(HealthController);
  });

  it("GET /api/health", async () => {
    const result = await healthController.getHealth();
    expect(result).toStrictEqual({
      status: "HEALTHY",
    });
  });
});
