import { toLower } from "lodash";
import { MigrationInterface, QueryRunner } from "typeorm";

export class V13Part6SortingTitle1727255309224 implements MigrationInterface {
  name = "V13Part6SortingTitle1727255309224";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "gamevault_game"
      ADD "sort_title" TEXT
    `);

    const gameRepository = queryRunner.manager.getRepository("gamevault_game");

    // Fetch all games
    const games = await gameRepository.find({
      withDeleted: true,
      select: ["id", "title"],
    });

    // Start a transaction for bulk updates
    await queryRunner.startTransaction();
    try {
      // Update each game with the new sort_title
      for (const game of games) {
        const sortTitle = this.createSortTitle(game.title); // Apply the sorting function
        await gameRepository.update(game.id, { sort_title: sortTitle });
      }
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "gamevault_game" DROP COLUMN "sort_title"
    `);
  }

  private createSortTitle(title: string): string {
    // List of leading articles to be removed
    const articles: string[] = ["the", "a", "an"];

    // Convert the title to lowercase
    let sortTitle: string = toLower(title).trim();

    // Remove any leading article
    for (const article of articles) {
      const articleWithSpace = `${article} `;
      if (sortTitle.startsWith(articleWithSpace)) {
        sortTitle = sortTitle.substring(articleWithSpace.length);
        break;
      }
    }

    // Remove special characters except alphanumeric and spaces
    // Replace multiple spaces with a single space and trim
    return sortTitle
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }
}
