import { MigrationInterface, QueryRunner } from "typeorm";
import { Progress } from "../../../progress/progress.entity";
import { State } from "../../../progress/models/state.enum";
import { Logger } from "@nestjs/common";
export class DeleteEmptyProgresses1696967362000 implements MigrationInterface {
  private readonly logger = new Logger(DeleteEmptyProgresses1696967362000.name);
  name?: string;
  transaction?: boolean;

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check for State Unplayed progresses with 0 Minutes.
    const progressRepository = queryRunner.connection.getRepository(Progress);
    const progressesToDelete = await progressRepository.findBy({
      minutes_played: 0,
      state: State.UNPLAYED,
    });
    progressRepository.remove(progressesToDelete);
    this.logger.log(
      `Database Migration deleted ${progressesToDelete.length} empty progresses from your database.`,
    );
  }

  public async down(): Promise<void> {
    // This is a migration to delete useless data, no down function needed
  }
}
