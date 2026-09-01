import { Global, INestApplication, Module } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AddressInfo } from "net";

import configuration from "../../configuration.js";
import { ServerService } from "../server/server.service.js";
import { StatusModule } from "./status.module.js";

const MOCK_SERVER_UUID = "550e8400-e29b-41d4-a716-446655440000";

@Global()
@Module({
  providers: [
    {
      provide: ServerService,
      useValue: { getServerUuid: () => MOCK_SERVER_UUID },
    },
  ],
  exports: [ServerService],
})
class MockServerModule {}

describe("/api/status", () => {
  let app: INestApplication;
  let baseUrl: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [MockServerModule, StatusModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    await app.listen(0);

    const address = app.getHttpServer().address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /api/status", async () => {
    const response = await fetch(`${baseUrl}/status`);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toHaveProperty("status", "HEALTHY");
    expect(payload).toHaveProperty("version", configuration.SERVER.VERSION);
    expect(payload).toHaveProperty("server_uuid", MOCK_SERVER_UUID);
    expect(payload).not.toHaveProperty("protocol");
    expect(payload).not.toHaveProperty("uptime");
  });
});
