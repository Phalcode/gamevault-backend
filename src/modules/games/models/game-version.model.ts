import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

import { GameType } from "./game-type.enum";

export class GameVersion {
  @ApiProperty({
    description: "file path of this version",
    example: "/files/Action/Grand Theft Auto V (v1.0.0).zip",
  })
  file_path: string;

  @ApiPropertyOptional({
    description: "version tag extracted from filename",
    example: "v1.0.0",
  })
  version?: string;

  @ApiProperty({
    description: "size of the game file in bytes",
    example: "1234567890",
    type: () => String,
  })
  size: string;

  @ApiPropertyOptional({
    description: "release date extracted from filename",
    example: "2013-01-01T00:00:00.000Z",
  })
  release_date?: Date;

  @ApiProperty({
    description: "indicates if the game build is marked as early access",
    example: false,
  })
  early_access: boolean;

  @ApiProperty({
    description: "detected type for this specific game version",
    type: "string",
    enum: GameType,
    example: GameType.WINDOWS_PORTABLE,
  })
  type: GameType;

  @ApiProperty({
    description: "when this version was indexed",
    example: "2026-02-15T12:00:00.000Z",
  })
  indexed_at: Date;
}
