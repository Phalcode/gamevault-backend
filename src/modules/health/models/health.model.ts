import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import configuration from "../../../configuration";
import { HealthStatus } from "./health-status.enum";

export class HealthProtocolEntry {
  @ApiProperty({
    description: "Timestamp of the protocol entry",
    example: "2021-01-01T00:00:00.000Z",
  })
  timestamp: Date;

  @ApiProperty({
    description: "Status that was set",
    type: "string",
    enum: HealthStatus,
    example: HealthStatus.UNHEALTHY,
  })
  status: HealthStatus;

  @ApiProperty({
    description: "Reason for the status to be set",
    example: "Database disconnected.",
  })
  reason: string;

  constructor(status: HealthStatus, reason: string) {
    this.timestamp = new Date();
    this.status = status;
    this.reason = reason;
  }
}

export class Health {
  @ApiProperty({
    description: "Current status of the server",
    type: "string",
    enum: HealthStatus,
    example: HealthStatus.HEALTHY,
  })
  status: HealthStatus;

  @ApiPropertyOptional({
    description: "Server's version",
    example: "1.0.0",
  })
  version?: string;

  @ApiPropertyOptional({
    description: "Whether user registration is enabled",
    example: true,
  })
  registration_enabled?: boolean;

  @ApiPropertyOptional({
    description: "List of available authentication methods",
    example: ["basic", "oauth2"],
    isArray: true,
    type: String,
  })
  available_authentication_methods?: string[];

  @ApiPropertyOptional({
    description: "Server's uptime in seconds (Only visible to admins)",
    example: 300,
  })
  uptime?: number;

  @ApiPropertyOptional({
    description: "Server's health protocol (Only visible to admins)",
    type: () => HealthProtocolEntry,
    isArray: true,
  })
  protocol?: HealthProtocolEntry[];

  constructor(epoch: Date, protocol: HealthProtocolEntry[] = []) {
    this.status = HealthStatus.HEALTHY;
    this.version = configuration.SERVER.VERSION;
    this.registration_enabled = !configuration.SERVER.REGISTRATION_DISABLED;

    this.available_authentication_methods = [
      configuration.AUTH.BASIC_AUTH.ENABLED ? "basic" : null,
      configuration.AUTH.OAUTH2.ENABLED ? "oauth2" : null,
    ].filter(Boolean);

    this.uptime = Math.floor((Date.now() - epoch.getTime()) / 1000);
    this.protocol = protocol;
  }
}
