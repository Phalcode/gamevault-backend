import { ApiProperty } from "@nestjs/swagger";
import {
  IsAlpha,
  IsAlphanumeric,
  IsEmail,
  IsNotEmpty,
  MinLength,
  ValidateIf,
} from "class-validator";
import configuration from "../../../configuration";

export class RegisterUserDto {
  @IsAlphanumeric()
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
  })
  email?: string;

  @ValidateIf(() => configuration.USERS.REQUIRE_FIRST_NAME)
  @IsAlpha("de-DE")
  @IsNotEmpty()
  @ApiProperty({ example: "John", description: "first name of the user" })
  first_name?: string;

  @ValidateIf(() => configuration.USERS.REQUIRE_LAST_NAME)
  @IsAlpha("de-DE")
  @IsNotEmpty()
  @ApiProperty({ example: "Doe", description: "last name of the user" })
  last_name?: string;
}
