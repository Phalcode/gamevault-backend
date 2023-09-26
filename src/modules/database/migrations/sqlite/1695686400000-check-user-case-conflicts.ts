import { MigrationInterface, QueryRunner } from "typeorm";
export class CheckUserCaseConflicts1695686400000 implements MigrationInterface {
  name?: string;
  transaction?: boolean;

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check for conflicting users with different casing for username or email
    const duplicateUsers = await queryRunner.query(`
            SELECT u.username, u.email
            FROM gamevault_user u
            WHERE (LOWER(u.username), LOWER(u.email)) IN (
                SELECT LOWER(username), LOWER(email)
                FROM gamevault_user
                GROUP BY LOWER(username), LOWER(email)
                HAVING COUNT(*) > 1
            );
        `);

    if (duplicateUsers.length > 0) {
      throw new Error(
        `User conflicts detected with different casing for username or email. Please roll back to GameVault Backend version 6.0.0 and resolve the conflicts before updating to v7.0.0.\nConflicting Users: ${JSON.stringify(
          duplicateUsers,
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
