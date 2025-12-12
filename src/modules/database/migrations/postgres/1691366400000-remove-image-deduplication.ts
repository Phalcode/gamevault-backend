import {
  MigrationInterface,
  QueryRunner,
  TableForeignKey,
  TableUnique,
} from "typeorm";

export class RemoveImageDeduplication1691366400000 implements MigrationInterface {
  name = "RemoveImageDeduplication1691366400000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Drop the UNIQUE constraint from the "source" column
    await queryRunner.dropUniqueConstraint(
      "image",
      "UQ_e0626148aee5829fd312447001a",
    );

    // Step 2: Drop the "last_accessed_at" column
    await queryRunner.query(`
      ALTER TABLE image
      DROP COLUMN IF EXISTS last_accessed_at;`);

    // Step 3: Change Foreign Keys
    const gamevaultUserForeignKeysToDrop = [
      "FK_3a56876605551fa369cbcd09c41",
      "FK_4a135b04a00cf3e3653cd585334",
      "FK_c1779b9b22212754248aa404bad",
      "FK_4b83e27ed50c1e183a69fceef68",
    ];

    for (const foreignKey of gamevaultUserForeignKeysToDrop) {
      try {
        await queryRunner.dropForeignKey("gamevault_user", foreignKey);
      } catch {}
    }

    await queryRunner.createForeignKeys("gamevault_user", [
      new TableForeignKey({
        columnNames: ["profile_picture_id"],
        referencedColumnNames: ["id"],
        referencedTableName: "image",
        onDelete: "CASCADE",
        onUpdate: "NO ACTION",
        name: "FK_3a56876605551fa369cbcd09c41",
      }),
      new TableForeignKey({
        columnNames: ["background_image_id"],
        referencedColumnNames: ["id"],
        referencedTableName: "image",
        onDelete: "CASCADE",
        onUpdate: "NO ACTION",
        name: "FK_4a135b04a00cf3e3653cd585334",
      }),
    ]);

    await queryRunner.dropForeignKey("game", "FK_52b4bb990c5a5fe76c6d675c002");
    await queryRunner.dropForeignKey("game", "FK_0e88ada3f37f7cabfb6d59ed0d0");

    await queryRunner.createForeignKeys("game", [
      new TableForeignKey({
        columnNames: ["box_image_id"],
        referencedColumnNames: ["id"],
        referencedTableName: "image",
        onDelete: "CASCADE",
        onUpdate: "NO ACTION",
        name: "FK_52b4bb990c5a5fe76c6d675c002",
      }),
      new TableForeignKey({
        columnNames: ["background_image_id"],
        referencedColumnNames: ["id"],
        referencedTableName: "image",
        onDelete: "CASCADE",
        onUpdate: "NO ACTION",
        name: "FK_0e88ada3f37f7cabfb6d59ed0d0",
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Add the "last_accessed_at" column back
    await queryRunner.query(`
      ALTER TABLE image
      ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMP NOT NULL;`);

    // Step 2: Add the UNIQUE constraint back to the "source" column
    await queryRunner.createUniqueConstraint(
      "image",
      new TableUnique({
        columnNames: ["source"],
        name: "UQ_e0626148aee5829fd312447001a",
      }),
    );

    // Step 3: Change Foreign Keys
    await queryRunner.dropForeignKey(
      "gamevault_user",
      "FK_3a56876605551fa369cbcd09c41",
    );
    await queryRunner.dropForeignKey(
      "gamevault_user",
      "FK_4a135b04a00cf3e3653cd585334",
    );

    await queryRunner.createForeignKeys("gamevault_user", [
      new TableForeignKey({
        columnNames: ["profile_picture_id"],
        referencedColumnNames: ["id"],
        referencedTableName: "image",
        onDelete: "SET NULL",
        onUpdate: "NO ACTION",
        name: "FK_3a56876605551fa369cbcd09c41",
      }),
      new TableForeignKey({
        columnNames: ["background_image_id"],
        referencedColumnNames: ["id"],
        referencedTableName: "image",
        onDelete: "SET NULL",
        onUpdate: "NO ACTION",
        name: "FK_4a135b04a00cf3e3653cd585334",
      }),
    ]);

    await queryRunner.dropForeignKey("game", "FK_52b4bb990c5a5fe76c6d675c002");
    await queryRunner.dropForeignKey("game", "FK_0e88ada3f37f7cabfb6d59ed0d0");

    await queryRunner.createForeignKeys("game", [
      new TableForeignKey({
        columnNames: ["box_image_id"],
        referencedColumnNames: ["id"],
        referencedTableName: "image",
        onDelete: "SET NULL",
        onUpdate: "NO ACTION",
        name: "FK_52b4bb990c5a5fe76c6d675c002",
      }),
      new TableForeignKey({
        columnNames: ["background_image_id"],
        referencedColumnNames: ["id"],
        referencedTableName: "image",
        onDelete: "SET NULL",
        onUpdate: "NO ACTION",
        name: "FK_0e88ada3f37f7cabfb6d59ed0d0",
      }),
    ]);
  }
}
