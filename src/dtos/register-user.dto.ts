import { ApiProperty } from "@nestjs/swagger";
import {
  IsAlpha,
  IsAlphanumeric,
  IsEmail,
  IsNotEmpty,
  IsUrl,
  MinLength,
} from "class-validator";

export class RegisterUserDto {
  @IsAlphanumeric()
  @IsNotEmpty()
  @ApiProperty({ example: "JohnDoe", description: "username of the user" })
  username: string;

  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    example: "john.doe@mail.com",
    description: "email of the user",
  })
  email: string;

  @MinLength(8)
  @IsNotEmpty()
  @ApiProperty({
    example: "SecretPw822!",
    minLength: 8,
    description: "password of the user",
  })
  password: string;

  @IsAlpha()
  @IsNotEmpty()
  @ApiProperty({ example: "John", description: "first name of the user" })
  first_name: string;

  @IsAlpha()
  @IsNotEmpty()
  @ApiProperty({ example: "Doe", description: "last name of the user" })
  last_name: string;

  @IsUrl()
  @IsNotEmpty()
  @ApiProperty({
    pattern: "url",
    example: "https://example.com/profile-picture.png",
    description: "url to the profile picture of the user",
  })
  profile_picture_url: string;

  @IsUrl()
  @IsNotEmpty()
  @ApiProperty({
    pattern: "url",
    example: "https://example.com/profile-art.png",
    description: "url to the profile art (background-image) of the User",
  })
  background_image_url: string;
}
