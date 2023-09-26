import { MigrationInterface, QueryRunner } from "typeorm";
import { GamevaultUser } from "../../../users/gamevault-user.entity";

export class CheckUserCaseConflicts1695686400000 implements MigrationInterface {
  name?: string;
  transaction?: boolean;

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check for conflicting users with different casing for username or email
    const conflictingUsers = await queryRunner.connection
      .getRepository(GamevaultUser)
      .createQueryBuilder("gamevault_user")
      .select([
        "gamevault_user.id",
        "gamevault_user.username",
        "gamevault_user.email",
      ])
      .addSelect("COUNT(*)", "count")
      .groupBy("LOWER(gamevault_user.username)")
      .addGroupBy("LOWER(gamevault_user.email)")
      .having("COUNT(*) > 1")
      .getRawMany();

    if (conflictingUsers.length > 0) {
      throw new Error(
        `User conflicts detected with different casing for username or email. Please roll back to GameVault Backend version 6.0.0 and resolve the conflicts before updating to v7.0.0.\nConflicting Users: ${JSON.stringify(
          conflictingUsers,
          null,
          2,
        )}`,
      );
    }
  }

  public async down(): Promise<void> {
    // This is a migration to check for conflicts; no need for a down operation
  }
}
