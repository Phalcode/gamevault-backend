import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveNotNullConstraints1693526400000 implements MigrationInterface {
  name = "RemoveNotNullConstraints1693526400000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Drop the NOT NULL constraint from the "source" column in images
    await queryRunner.query(
      "ALTER TABLE image ALTER COLUMN source DROP NOT NULL;",
    );

    // Step 2: Drop the NOT NULL constraint from the "release_date" column in games
    await queryRunner.query(
      "ALTER TABLE game ALTER COLUMN release_date DROP NOT NULL;",
    );
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Add back the NOT NULL constraint to the "source" column in images
    await queryRunner.query(
      "ALTER TABLE image ALTER COLUMN source SET NOT NULL;",
    );

    // Step 2: Add back the NOT NULL constraint to the "release_date" column in games
    await queryRunner.query(
      "ALTER TABLE game ALTER COLUMN release_date SET NOT NULL;",
    );
  }
}
