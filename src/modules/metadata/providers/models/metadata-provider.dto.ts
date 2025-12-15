import { ApiProperty } from "@nestjs/swagger";
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNotIn,
  Matches,
} from "class-validator";

import globals from "../../../../globals";

export class MetadataProviderDto {
  @IsNotEmpty()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message:
      "Invalid slug: Only lowercase letters, numbers, and single hyphens inbetween them are allowed.",
  })
  @IsNotIn(globals.RESERVED_PROVIDER_SLUGS, {
    message:
      "Invalid slug: The terms 'gamevault' and 'user' are reserved slugs.",
  })
  @ApiProperty({
    description:
      "slug (url-friendly name) of the provider. This is the primary identifier. Must be formatted like a valid slug.",
    example: "igdb",
  })
  public slug: string;

  @IsNotEmpty()
  @ApiProperty({
    description: "display name of the provider.",
    example: "IGDB",
  })
  public name: string;

  @IsInt()
  @IsNotEmpty()
  @ApiProperty({
    type: Number,
    description:
      "priority of usage for this provider. Lower priority providers are tried first, while higher priority providers fill in gaps.",
  })
  public priority: number;

  @IsBoolean()
  @ApiProperty({
    type: Boolean,
    description: "whether this provider is enabled or not.",
    default: true,
  })
  public enabled = true;
}
