import { ApiProperty } from "@nestjs/swagger";
import {
  IsAlpha,
  IsDateString,
  IsEmail,
  IsNotEmpty,
  Length,
  Matches,
  MinLength,
  ValidateIf,
} from "class-validator";

import configuration from "../../../configuration";

export class RegisterUserDto {
  @Matches(/^\w+$/, {
    message:
      "Usernames can only contain latin letters, numbers and underscores",
  })
  @Length(2, 32)
  @IsNotEmpty()
  @ApiProperty({ example: "JohnDoe", description: "username of the user" })
  username: string;

  @MinLength(8)
  @IsNotEmpty()
  @ApiProperty({
    example: "SecretPw822!",
    minLength: 8,
    description: "password of the user",
  })
  password: string;

  @ValidateIf(() => configuration.USERS.REQUIRE_EMAIL)
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    example: "john.doe@mail.com",
    description: "email of the user",
    required: configuration.USERS.REQUIRE_EMAIL,
  })
  email?: string;

  @ValidateIf(() => configuration.USERS.REQUIRE_FIRST_NAME)
  @IsAlpha("de-DE")
  @IsNotEmpty()
  @ApiProperty({
    example: "John",
    description: "first name of the user",
    required: configuration.USERS.REQUIRE_FIRST_NAME,
  })
  first_name?: string;

  @ValidateIf(() => configuration.USERS.REQUIRE_LAST_NAME)
  @IsAlpha("de-DE")
  @IsNotEmpty()
  @ApiProperty({
    example: "Doe",
    description: "last name of the user",
    required: configuration.USERS.REQUIRE_LAST_NAME,
  })
  last_name?: string;

  @ValidateIf(() => configuration.PARENTAL.AGE_RESTRICTION_ENABLED)
  @IsDateString()
  @IsNotEmpty()
  @ApiProperty({
    description: "date of birth of the user in ISO8601 format",
    required: configuration.PARENTAL.AGE_RESTRICTION_ENABLED,
  })
  birth_date?: string;
}
