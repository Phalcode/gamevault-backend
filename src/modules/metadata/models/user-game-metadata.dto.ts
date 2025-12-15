import { Optional } from "@nestjs/common";
import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  NotContains,
} from "class-validator";

import { MediaValidator } from "../../../validators/media.validator";
import { Media } from "../../media/media.entity";

export class UpdateGameUserMetadataDto {
  @ApiPropertyOptional({
    description: "the minimum age required to play the game",
    example: 18,
    default: 0,
  })
  @IsOptional()
  @IsNotEmpty()
  @IsInt()
  @Min(0)
  age_rating?: number = 0;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @ApiPropertyOptional({
    description: "title of the game",
    example: "Grand Theft Auto V",
  })
  title?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @ApiPropertyOptional({
    description:
      "sort title of the game, generated and used to optimize sorting.",
    example: "grand theft auto 5",
  })
  sort_title?: string;

  @ApiPropertyOptional({
    description: "release date of the game as ISO8601 string",
    example: "2013-09-17T00:00:00.000Z",
  })
  @IsOptional()
  @IsDateString()
  @IsNotEmpty()
  release_date?: string;

  @ApiPropertyOptional({
    description: "description of the game. markdown supported.",
    example:
      "An open world action-adventure video game developed by **Rockstar North** and published by **Rockstar Games**.",
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @ApiPropertyOptional({
    description:
      "public notes from the admin for the game. markdown supported.",
    example: "# README \n Install other game first!",
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  notes?: string;

  @ApiPropertyOptional({
    description: "average playtime of other people in the game in minutes",
    example: 180,
  })
  @IsInt()
  @Min(0)
  @Optional()
  @IsNotEmpty()
  average_playtime?: number;

  @MediaValidator("image")
  @Optional()
  @IsNotEmpty()
  @ApiPropertyOptional({
    description: "cover/boxart image of the game",
    type: () => Media,
  })
  cover?: Media;

  @MediaValidator("image")
  @Optional()
  @IsNotEmpty()
  @ApiPropertyOptional({
    description: "background image of the game",
    type: () => Media,
  })
  background?: Media;

  @ApiPropertyOptional({
    description: "rating of the provider",
    example: 90,
  })
  @IsOptional()
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  rating?: number;

  @ApiPropertyOptional({
    description: "indicates if the game is in early access",
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  @IsNotEmpty()
  early_access?: boolean;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @ApiPropertyOptional({
    description: "Predefined launch parameters for the game.",
    example: "-fullscreen -dx11",
  })
  launch_parameters?: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @ApiPropertyOptional({
    description: "Predefined launch executable for the game.",
    example: "ShooterGame.exe",
  })
  launch_executable?: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @ApiPropertyOptional({
    description:
      "Predefined installer parameters for the game. You can use %INSTALLDIR% as a placeholder for the installation directory.",
    example: '/D="%INSTALLDIR%" /S /DIR="%INSTALLDIR%" /SILENT',
  })
  installer_parameters?: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @ApiPropertyOptional({
    description: "Predefined installer executable for the game.",
    example: "setup.exe",
  })
  installer_executable?: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @ApiPropertyOptional({
    description: "Predefined uninstaller parameters for the game.",
    example: "/SILENT",
  })
  uninstaller_parameters?: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @ApiPropertyOptional({
    description: "Predefined uninstaller executable for the game.",
    example: "uninst.exe",
  })
  uninstaller_executable?: string;

  @IsArray()
  @IsOptional()
  @IsUrl(undefined, { each: true })
  @NotContains(",", { each: true })
  @IsNotEmpty({ each: true })
  @ApiPropertyOptional({
    description: "URLs of externally hosted screenshots of the game",
    type: () => String,
    isArray: true,
  })
  url_screenshots?: string[];

  @IsArray()
  @IsOptional()
  @IsUrl(undefined, { each: true })
  @NotContains(",", { each: true })
  @IsNotEmpty({ each: true })
  @ApiPropertyOptional({
    description: "URLs of externally hosted trailer videos of the game",
    type: () => String,
    isArray: true,
  })
  url_trailers?: string[];

  @IsArray()
  @IsOptional()
  @IsUrl(undefined, { each: true })
  @NotContains(",", { each: true })
  @IsNotEmpty({ each: true })
  @ApiPropertyOptional({
    description: "URLs of externally hosted gameplay videos of the game",
    type: () => String,
    isArray: true,
  })
  url_gameplays?: string[];

  @IsArray()
  @IsOptional()
  @IsUrl(undefined, { each: true })
  @NotContains(",", { each: true })
  @IsNotEmpty({ each: true })
  @ApiPropertyOptional({
    description: "URLs of websites of the game",
    example: "https://www.escapefromtarkov.com/",
    type: () => String,
    isArray: true,
  })
  url_websites?: string[];

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ApiPropertyOptional({
    description: "publishers of the game",
    type: () => String,
    isArray: true,
  })
  publishers?: string[];

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ApiPropertyOptional({
    description: "developers of the game",
    type: () => String,
    isArray: true,
  })
  developers?: string[];

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ApiPropertyOptional({
    description: "tags of the game",
    type: () => String,
    isArray: true,
  })
  tags?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @IsOptional()
  @ApiPropertyOptional({
    description: "genres of the game",
    type: () => String,
    isArray: true,
  })
  genres?: string[];
}
