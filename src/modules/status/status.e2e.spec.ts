import { Test } from "@nestjs/testing";

import { AppModule } from "../../app.module";
import configuration from "../../configuration";
import { StatusController } from "./status.controller";

describe("/api/status", () => {
  let controller: StatusController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    controller = moduleRef.get<StatusController>(StatusController);
  });

  it("GET /api/status", async () => {
    const result = await controller.getStatus(null);
    expect(result).toHaveProperty("status", "HEALTHY");
    expect(result).toHaveProperty("version", configuration.SERVER.VERSION);
  });
});
