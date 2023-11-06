import { Test } from "@nestjs/testing";
import { RawgController } from "./rawg.controller";
import { HttpService } from "@nestjs/axios";
import { AppModule } from "../../../app.module";

describe("RawgController", () => {
  let rawgController: RawgController;
  const mockHttpService =
    jest.createMockFromModule<HttpService>("@nestjs/axios");

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [],
      providers: [
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();
    rawgController = moduleRef.get<RawgController>(RawgController);
  });

  it("should be defined", () => {
    expect(rawgController).toBeDefined();
  });
});
