import { MigrationInterface, QueryRunner } from "typeorm";
import { Logger } from "@nestjs/common";
export class DeleteEmptyProgresses1696967362000 implements MigrationInterface {
  private readonly logger = new Logger(DeleteEmptyProgresses1696967362000.name);
  name?: string;
  transaction?: boolean;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "progress" WHERE minutes_played = 0 AND state = 'UNPLAYED';`,
    );
  }

  public async down(): Promise<void> {
    // This is a migration to delete useless data, no down function needed
  }
}
