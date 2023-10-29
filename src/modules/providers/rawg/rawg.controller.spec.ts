import { Test } from "@nestjs/testing";
import { RawgController } from "./rawg.controller";
import { RawgMapperService } from "./mapper.service";
import { RawgService } from "./rawg.service";
import { GamesService } from "../../games/games.service";
import { BoxArtsService } from "../../boxarts/boxarts.service";
import { HttpService } from "@nestjs/axios";

describe("RawgController", () => {
  let rawgController: RawgController;
  const mockGamesService = jest.mocked<GamesService>;
  const mockHttpService = {
    get: jest.fn(),
  };
  const mockBoxArtService = jest.mocked<BoxArtsService>;
  const mockRawgMapperService = jest.mocked<RawgMapperService>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [],
      controllers: [RawgController],
      providers: [
        RawgService,
        {
          provide: RawgMapperService,
          useValue: mockRawgMapperService,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: GamesService,
          useValue: mockGamesService,
        },
        {
          provide: BoxArtsService,
          useValue: mockBoxArtService,
        },
      ],
    }).compile();
    rawgController = moduleRef.get<RawgController>(RawgController);
  });

  it("should be defined", () => {
    expect(rawgController).toBeDefined();
  });
});
