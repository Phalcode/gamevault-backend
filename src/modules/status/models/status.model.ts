import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import configuration from "../../../configuration.js";
import { AuthenticationMethod } from "./authentication-method.enum.js";
import { RegistrationFields } from "./registration-fields.enum.js";
import { StatusEnum } from "./status.enum.js";

export class StatusEntry {
  @ApiProperty({
    description: "Timestamp of the protocol entry",
    example: "2021-01-01T00:00:00.000Z",
  })
  timestamp: Date;

  @ApiProperty({
    description: "Status that was set",
    type: "string",
    enum: StatusEnum,
    example: StatusEnum.UNHEALTHY,
  })
  status: StatusEnum;
  @ApiProperty({
    description: "Reason for the status to be set",
    example: "Database disconnected.",
  })
  reason: string;

  constructor(status: StatusEnum, reason: string) {
    this.timestamp = new Date();
    this.status = status;
    this.reason = reason;
  }
}

export class Status {
  @ApiProperty({
    description: "Current status of the server",
    type: "string",
    enum: StatusEnum,
    example: StatusEnum.HEALTHY,
  })
  status: StatusEnum;

  @ApiProperty({
    description: "Server's version",
    example: "1.0.0",
  })
  version?: string;

  @ApiProperty({
    description: "Whether user registration is enabled",
    example: true,
  })
  registration_enabled?: boolean;

  @ApiProperty({
    description: "List of required registration fields",
    type: "string",
    enum: RegistrationFields,
    example: [RegistrationFields.BIRTH_DATE, RegistrationFields.EMAIL],
    isArray: true,
  })
  required_registration_fields?: RegistrationFields[];

  @ApiProperty({
    description: "List of available authentication methods",
    type: "string",
    enum: AuthenticationMethod,
    example: [AuthenticationMethod.BASIC, AuthenticationMethod.SSO],
    isArray: true,
  })
  available_authentication_methods?: AuthenticationMethod[];

  @ApiProperty({
    description:
      "Persistent unique identifier of the gamevault server. " +
      "This UUID is generated on first startup and persists across restarts, " +
      "allowing clients to recognize the same server even when accessed at different URLs.",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  server_uuid: string;

  @ApiPropertyOptional({
    description: "Server's uptime in seconds (Only visible to admins)",
    example: 300,
  })
  uptime?: number;

  @ApiPropertyOptional({
    description: "Server's status protocol (Only visible to admins)",
    type: () => StatusEntry,
    isArray: true,
  })
  protocol?: StatusEntry[];

  constructor(epoch: Date, protocol: StatusEntry[] = [], serverUuid?: string) {
    this.status = StatusEnum.HEALTHY;
    this.version = configuration.SERVER.VERSION;
    this.registration_enabled = !configuration.SERVER.REGISTRATION_DISABLED;

    this.required_registration_fields = [
      configuration.USERS.REQUIRE_BIRTH_DATE ||
      configuration.PARENTAL.AGE_RESTRICTION_ENABLED
        ? RegistrationFields.BIRTH_DATE
        : null,
      configuration.USERS.REQUIRE_EMAIL ? RegistrationFields.EMAIL : null,
      configuration.USERS.REQUIRE_FIRST_NAME
        ? RegistrationFields.FIRST_NAME
        : null,
      configuration.USERS.REQUIRE_LAST_NAME
        ? RegistrationFields.LAST_NAME
        : null,
    ].filter((field): field is RegistrationFields => field !== null);

    this.available_authentication_methods = [
      configuration.AUTH.BASIC_AUTH.ENABLED ? AuthenticationMethod.BASIC : null,
      configuration.AUTH.OAUTH2.ENABLED ? AuthenticationMethod.SSO : null,
    ].filter((method): method is AuthenticationMethod => method !== null);

    this.server_uuid = serverUuid ?? "";
    this.uptime = Math.floor((Date.now() - epoch.getTime()) / 1000);
    this.protocol = protocol;
  }
}
