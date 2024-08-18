import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  CreateDateColumn,
  DeleteDateColumn,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VersionColumn,
} from "typeorm";

export abstract class DatabaseEntity {
  @Index()
  @PrimaryGeneratedColumn()
  @ApiProperty({
    example: 1,
    description: "Unique gamevault-identifier of the entity",
  })
  id: number;

  @CreateDateColumn()
  @ApiProperty({
    description: "date the entity was created",
    example: "2021-01-01T00:00:00.000Z",
  })
  created_at: Date;

  @UpdateDateColumn()
  @ApiPropertyOptional({
    description: "date the entity was updated",
    example: "2021-01-01T00:00:00.000Z",
  })
  updated_at?: Date;

  @DeleteDateColumn()
  @ApiPropertyOptional({
    description: "date the entity was soft-deleted (null if not deleted)",
    example: "2021-01-01T00:00:00.000Z",
  })
  deleted_at?: Date;

  @VersionColumn()
  @ApiProperty({
    description: "incremental version number of the entity",
    example: 1,
  })
  entity_version: number;
}
