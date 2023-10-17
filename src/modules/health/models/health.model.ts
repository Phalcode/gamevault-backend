import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { HealthStatus } from "./health-status.enum";

export class HealthProtocolEntry {
  constructor(status: HealthStatus, reason: string) {
    this.timestamp = new Date();
    this.reason = reason;
    this.status = status;
  }

  @ApiProperty({
    description: "Timestamp of the protocol entry",
    example: "2021-01-01T00:00:00.000Z",
  })
  timestamp: Date;

  @ApiProperty({
    description: "Status that was set",
    type: "enum",
    enum: HealthStatus,
    example: HealthStatus.UNHEALTHY,
  })
  status: HealthStatus;

  @ApiProperty({
    description: "Reason for the status to be set",
    example: "Database disconnected.",
  })
  reason: string;
}

export class Health {
  @ApiProperty({
    description: "Current status of the server",
    type: "enum",
    enum: HealthStatus,
    example: HealthStatus.HEALTHY,
  })
  status: HealthStatus = HealthStatus.HEALTHY;

  @ApiPropertyOptional({
    description: "Server's version (Only visible to admins)",
    example: "1.0.0",
  })
  version?: string = "";

  @ApiPropertyOptional({
    description: "Server's uptime in seconds (Only visible to admins)",
    example: 300,
  })
  uptime?: number = 0;

  @ApiPropertyOptional({
    description: "Server's health protocol (Only visible to admins)",
    type: () => HealthProtocolEntry,
    isArray: true,
  })
  protocol?: HealthProtocolEntry[] = [];
}
