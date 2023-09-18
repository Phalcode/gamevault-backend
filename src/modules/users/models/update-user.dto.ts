import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsAlpha,
  IsAlphanumeric,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUrl,
  MinLength,
} from "class-validator";
import { Role } from "./role.enum";

export class UpdateUserDto {
  @IsAlphanumeric()
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

  @IsUrl()
  @IsOptional()
  @ApiPropertyOptional({
    pattern: "url",
    example: "https://example.com/profile-picture.png",
    description: "url to the profile picture of the user",
  })
  profile_picture_url?: string;

  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional({
    example: 69_420,
    description: "id of the profile picture of the user",
  })
  profile_picture_id?: number;

  @IsUrl()
  @IsOptional()
  @ApiPropertyOptional({
    pattern: "url",
    example: "https://example.com/profile-art.png",
    description: "url to the profile art (background-image) of the User",
  })
  background_image_url?: string;

  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional({
    example: 69_420,
    description: "id of the profile art (background-image) of the User",
  })
  background_image_id?: number;

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
    type: "enum",
    enum: Role,
    example: Role.EDITOR,
    description:
      "The role determines the set of permissions and access rights for a user in the system.",
  })
  public role?: Role;
}
