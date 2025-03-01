import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsAlpha,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Length,
  Matches,
  MinLength,
} from "class-validator";

import { IsDateStringBeforeNow } from "../../../validators/is-date-string-before-now.validator";
import { Role } from "./role.enum";

export class UpdateUserDto {
  @Matches(/^\w+$/, {
    message:
      "Usernames can only contain latin letters, numbers and underscores",
  })
  @Length(2, 32)
  @IsOptional()
  @IsNotEmpty()
  @ApiPropertyOptional({
    example: "JohnDoe",
    description: "username of the user",
  })
  username?: string;

  @IsEmail()
  @IsOptional()
  @IsNotEmpty()
  @ApiPropertyOptional({
    example: "john.doe@mail.com",
    description: "email of the user",
  })
  email?: string;

  @MinLength(8)
  @IsOptional()
  @IsNotEmpty()
  @ApiPropertyOptional({
    example: "SecretPw822!",
    minLength: 8,
    description: "password of the user",
  })
  password?: string;

  @IsAlpha("de-DE")
  @IsOptional()
  @IsNotEmpty()
  @ApiPropertyOptional({
    example: "John",
    description: "first name of the user",
  })
  first_name?: string;

  @IsAlpha("de-DE")
  @IsOptional()
  @IsNotEmpty()
  @ApiPropertyOptional({
    example: "Doe",
    description: "last name of the user",
  })
  last_name?: string;

  @IsOptional()
  @IsNotEmpty()
  @IsDateString()
  @IsDateStringBeforeNow()
  @ApiPropertyOptional({
    description: "date of birth of the user in ISO8601 format",
  })
  birth_date?: string;

  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional({
    example: 69_420,
    description: "id of the avatar image of the user",
  })
  avatar_id?: number;

  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional({
    example: 69_420,
    description: "id of the background image of the User",
  })
  background_id?: number;

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({
    pattern: "boolean",
    example: true,
    description: "wether or not the user is activated. Not yet working.",
  })
  activated?: boolean;

  @IsEnum(Role)
  @IsOptional()
  @ApiPropertyOptional({
    type: "string",
    enum: Role,
    example: Role.EDITOR,
    description:
      "The role determines the set of permissions and access rights for a user in the system.",
  })
  public role?: Role;
}
