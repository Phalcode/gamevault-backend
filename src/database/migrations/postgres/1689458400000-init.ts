import { Logger } from "@nestjs/common";
import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1689458400000 implements MigrationInterface {
  name = "Init1689458400000";
  private readonly logger = new Logger(Init1689458400000.name);
  public async up(queryRunner: QueryRunner): Promise<void> {
    if (
      (await queryRunner.hasTable("crackpipe_user")) &&
      (await queryRunner.hasTable("developer")) &&
      (await queryRunner.hasTable("game")) &&
      (await queryRunner.hasTable("genre")) &&
      (await queryRunner.hasTable("image")) &&
      (await queryRunner.hasTable("progress")) &&
      (await queryRunner.hasTable("publisher")) &&
      (await queryRunner.hasTable("store")) &&
      (await queryRunner.hasTable("tag"))
    ) {
      this.logger.log("Database already exists. Skipping initial Migration.");
      return;
    }

    await queryRunner.query(`
            CREATE TABLE "image" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                "entity_version" integer NOT NULL,
                "source" character varying NOT NULL,
                "path" character varying,
                "media_type" character varying,
                "last_accessed_at" TIMESTAMP NOT NULL,
                CONSTRAINT "UQ_e0626148aee5829fd312447001a" UNIQUE ("source"),
                CONSTRAINT "UQ_f03b89f33671086e6733828e79c" UNIQUE ("path"),
                CONSTRAINT "PK_d6db1ab4ee9ad9dbe86c64e4cc3" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_e0626148aee5829fd312447001" ON "image" ("source")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_f03b89f33671086e6733828e79" ON "image" ("path")
        `);
    await queryRunner.query(`
            CREATE TABLE "developer" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                "entity_version" integer NOT NULL,
                "rawg_id" integer NOT NULL,
                "name" character varying NOT NULL,
                CONSTRAINT "UQ_5c0cd47a75116720223e43db853" UNIQUE ("rawg_id"),
                CONSTRAINT "UQ_5c2989f7bc37f907cfd937c0fd0" UNIQUE ("name"),
                CONSTRAINT "PK_71b846918f80786eed6bfb68b77" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "genre" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                "entity_version" integer NOT NULL,
                "rawg_id" integer NOT NULL,
                "name" character varying NOT NULL,
                CONSTRAINT "UQ_672bce67ec8cb2d7755c158ad65" UNIQUE ("rawg_id"),
                CONSTRAINT "UQ_dd8cd9e50dd049656e4be1f7e8c" UNIQUE ("name"),
                CONSTRAINT "PK_0285d4f1655d080cfcf7d1ab141" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "publisher" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                "entity_version" integer NOT NULL,
                "rawg_id" integer NOT NULL,
                "name" character varying NOT NULL,
                CONSTRAINT "UQ_4a0539222ee1307f657f875003b" UNIQUE ("rawg_id"),
                CONSTRAINT "UQ_9dc496f2e5b912da9edd2aa4455" UNIQUE ("name"),
                CONSTRAINT "PK_70a5936b43177f76161724da3e6" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "store" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                "entity_version" integer NOT NULL,
                "rawg_id" integer NOT NULL,
                "name" character varying NOT NULL,
                CONSTRAINT "UQ_45c4541783f264043ec2a5864d6" UNIQUE ("rawg_id"),
                CONSTRAINT "UQ_66df34da7fb037e24fc7fee642b" UNIQUE ("name"),
                CONSTRAINT "PK_f3172007d4de5ae8e7692759d79" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "tag" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                "entity_version" integer NOT NULL,
                "rawg_id" integer NOT NULL,
                "name" character varying NOT NULL,
                CONSTRAINT "UQ_289102542903593026bd16e4e1b" UNIQUE ("rawg_id"),
                CONSTRAINT "UQ_6a9775008add570dc3e5a0bab7b" UNIQUE ("name"),
                CONSTRAINT "PK_8e4052373c579afc1471f526760" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "game" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                "entity_version" integer NOT NULL,
                "rawg_id" integer,
                "title" character varying NOT NULL,
                "rawg_title" character varying,
                "version" character varying,
                "release_date" TIMESTAMP NOT NULL,
                "rawg_release_date" TIMESTAMP,
                "cache_date" TIMESTAMP,
                "file_path" character varying NOT NULL,
                "size" bigint NOT NULL DEFAULT '0',
                "description" character varying,
                "website_url" character varying,
                "metacritic_rating" integer,
                "average_playtime" integer,
                "early_access" boolean NOT NULL,
                "box_image_id" integer,
                "background_image_id" integer,
                CONSTRAINT "UQ_7770cb331bdc54951bb9046fa9d" UNIQUE ("file_path"),
                CONSTRAINT "PK_352a30652cd352f552fef73dec5" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_0152ed47a9e8963b5aaceb51e7" ON "game" ("title")
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."progress_state_enum" AS ENUM(
                'UNPLAYED',
                'INFINITE',
                'PLAYING',
                'COMPLETED',
                'ABORTED_TEMPORARY',
                'ABORTED_PERMANENT'
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "progress" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                "entity_version" integer NOT NULL,
                "minutes_played" integer NOT NULL DEFAULT '0',
                "state" "public"."progress_state_enum" NOT NULL DEFAULT 'UNPLAYED',
                "last_played_at" TIMESTAMP,
                "user_id" integer,
                "game_id" integer,
                CONSTRAINT "PK_79abdfd87a688f9de756a162b6f" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."crackpipe_user_role_enum" AS ENUM('0', '1', '2', '3')
        `);
    await queryRunner.query(`
            CREATE TABLE "crackpipe_user" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                "entity_version" integer NOT NULL,
                "username" character varying NOT NULL,
                "password" character varying NOT NULL,
                "email" character varying NOT NULL,
                "first_name" character varying NOT NULL,
                "last_name" character varying NOT NULL,
                "activated" boolean NOT NULL DEFAULT false,
                "role" "public"."crackpipe_user_role_enum" NOT NULL DEFAULT '1',
                "profile_picture_id" integer,
                "background_image_id" integer,
                CONSTRAINT "UQ_ad2fda40ce941655c838fb1435f" UNIQUE ("username"),
                CONSTRAINT "UQ_d0e7d50057240e5752a2c303ffb" UNIQUE ("email"),
                CONSTRAINT "PK_0e446a80433f350bae907fac18b" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "game_publishers_publisher" (
                "game_id" integer NOT NULL,
                "publisher_id" integer NOT NULL,
                CONSTRAINT "PK_3f9eefcb8d5d47c396f79df8a67" PRIMARY KEY ("game_id", "publisher_id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_23c7fd8d5ba629387c0ee3beef" ON "game_publishers_publisher" ("game_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_9b62bde5e60ae224ece6212139" ON "game_publishers_publisher" ("publisher_id")
        `);
    await queryRunner.query(`
            CREATE TABLE "game_developers_developer" (
                "game_id" integer NOT NULL,
                "developer_id" integer NOT NULL,
                CONSTRAINT "PK_5400995ae6c18360747cd80743f" PRIMARY KEY ("game_id", "developer_id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_af55594242fcb08c34a7169458" ON "game_developers_developer" ("game_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_086b3f0af45ee3a586f65e279d" ON "game_developers_developer" ("developer_id")
        `);
    await queryRunner.query(`
            CREATE TABLE "game_stores_store" (
                "game_id" integer NOT NULL,
                "store_id" integer NOT NULL,
                CONSTRAINT "PK_9050b4cb011af20db70e08d2fd0" PRIMARY KEY ("game_id", "store_id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_a7f9028303f115fd99e8fa0704" ON "game_stores_store" ("game_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_6b179f1104e52e940718686e0b" ON "game_stores_store" ("store_id")
        `);
    await queryRunner.query(`
            CREATE TABLE "game_tags_tag" (
                "game_id" integer NOT NULL,
                "tag_id" integer NOT NULL,
                CONSTRAINT "PK_fbc56aa6af51f49537820156d08" PRIMARY KEY ("game_id", "tag_id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_0c2a0973b06e6530bdf70522f0" ON "game_tags_tag" ("game_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_24ae8c150d4a878e2260e52624" ON "game_tags_tag" ("tag_id")
        `);
    await queryRunner.query(`
            CREATE TABLE "game_genres_genre" (
                "game_id" integer NOT NULL,
                "genre_id" integer NOT NULL,
                CONSTRAINT "PK_6db8dbbe0c1eb1386e1d1ee8fb6" PRIMARY KEY ("game_id", "genre_id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_76c0e2a6b1c36a0ed08745b4cb" ON "game_genres_genre" ("game_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_ea273d6b68ec2073a7af5d7d28" ON "game_genres_genre" ("genre_id")
        `);
    await queryRunner.query(`
            ALTER TABLE "game"
            ADD CONSTRAINT "FK_52b4bb990c5a5fe76c6d675c002" FOREIGN KEY ("box_image_id") REFERENCES "image"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "game"
            ADD CONSTRAINT "FK_0e88ada3f37f7cabfb6d59ed0d0" FOREIGN KEY ("background_image_id") REFERENCES "image"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "progress"
            ADD CONSTRAINT "FK_ddcaca3a9db9d77105d51c02c24" FOREIGN KEY ("user_id") REFERENCES "crackpipe_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "progress"
            ADD CONSTRAINT "FK_feaddf361921db1df3a6fe3965a" FOREIGN KEY ("game_id") REFERENCES "game"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "crackpipe_user"
            ADD CONSTRAINT "FK_3a56876605551fa369cbcd09c41" FOREIGN KEY ("profile_picture_id") REFERENCES "image"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "crackpipe_user"
            ADD CONSTRAINT "FK_4a135b04a00cf3e3653cd585334" FOREIGN KEY ("background_image_id") REFERENCES "image"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "game_publishers_publisher"
            ADD CONSTRAINT "FK_23c7fd8d5ba629387c0ee3beefe" FOREIGN KEY ("game_id") REFERENCES "game"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `);
    await queryRunner.query(`
            ALTER TABLE "game_publishers_publisher"
            ADD CONSTRAINT "FK_9b62bde5e60ae224ece62121394" FOREIGN KEY ("publisher_id") REFERENCES "publisher"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "game_developers_developer"
            ADD CONSTRAINT "FK_af55594242fcb08c34a7169458e" FOREIGN KEY ("game_id") REFERENCES "game"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `);
    await queryRunner.query(`
            ALTER TABLE "game_developers_developer"
            ADD CONSTRAINT "FK_086b3f0af45ee3a586f65e279da" FOREIGN KEY ("developer_id") REFERENCES "developer"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "game_stores_store"
            ADD CONSTRAINT "FK_a7f9028303f115fd99e8fa07041" FOREIGN KEY ("game_id") REFERENCES "game"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `);
    await queryRunner.query(`
            ALTER TABLE "game_stores_store"
            ADD CONSTRAINT "FK_6b179f1104e52e940718686e0b4" FOREIGN KEY ("store_id") REFERENCES "store"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "game_tags_tag"
            ADD CONSTRAINT "FK_0c2a0973b06e6530bdf70522f0e" FOREIGN KEY ("game_id") REFERENCES "game"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `);
    await queryRunner.query(`
            ALTER TABLE "game_tags_tag"
            ADD CONSTRAINT "FK_24ae8c150d4a878e2260e526240" FOREIGN KEY ("tag_id") REFERENCES "tag"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "game_genres_genre"
            ADD CONSTRAINT "FK_76c0e2a6b1c36a0ed08745b4cb1" FOREIGN KEY ("game_id") REFERENCES "game"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `);
    await queryRunner.query(`
            ALTER TABLE "game_genres_genre"
            ADD CONSTRAINT "FK_ea273d6b68ec2073a7af5d7d281" FOREIGN KEY ("genre_id") REFERENCES "genre"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "game_genres_genre" DROP CONSTRAINT "FK_ea273d6b68ec2073a7af5d7d281"
        `);
    await queryRunner.query(`
            ALTER TABLE "game_genres_genre" DROP CONSTRAINT "FK_76c0e2a6b1c36a0ed08745b4cb1"
        `);
    await queryRunner.query(`
            ALTER TABLE "game_tags_tag" DROP CONSTRAINT "FK_24ae8c150d4a878e2260e526240"
        `);
    await queryRunner.query(`
            ALTER TABLE "game_tags_tag" DROP CONSTRAINT "FK_0c2a0973b06e6530bdf70522f0e"
        `);
    await queryRunner.query(`
            ALTER TABLE "game_stores_store" DROP CONSTRAINT "FK_6b179f1104e52e940718686e0b4"
        `);
    await queryRunner.query(`
            ALTER TABLE "game_stores_store" DROP CONSTRAINT "FK_a7f9028303f115fd99e8fa07041"
        `);
    await queryRunner.query(`
            ALTER TABLE "game_developers_developer" DROP CONSTRAINT "FK_086b3f0af45ee3a586f65e279da"
        `);
    await queryRunner.query(`
            ALTER TABLE "game_developers_developer" DROP CONSTRAINT "FK_af55594242fcb08c34a7169458e"
        `);
    await queryRunner.query(`
            ALTER TABLE "game_publishers_publisher" DROP CONSTRAINT "FK_9b62bde5e60ae224ece62121394"
        `);
    await queryRunner.query(`
            ALTER TABLE "game_publishers_publisher" DROP CONSTRAINT "FK_23c7fd8d5ba629387c0ee3beefe"
        `);
    await queryRunner.query(`
            ALTER TABLE "crackpipe_user" DROP CONSTRAINT "FK_4a135b04a00cf3e3653cd585334"
        `);
    await queryRunner.query(`
            ALTER TABLE "crackpipe_user" DROP CONSTRAINT "FK_3a56876605551fa369cbcd09c41"
        `);
    await queryRunner.query(`
            ALTER TABLE "progress" DROP CONSTRAINT "FK_feaddf361921db1df3a6fe3965a"
        `);
    await queryRunner.query(`
            ALTER TABLE "progress" DROP CONSTRAINT "FK_ddcaca3a9db9d77105d51c02c24"
        `);
    await queryRunner.query(`
            ALTER TABLE "game" DROP CONSTRAINT "FK_0e88ada3f37f7cabfb6d59ed0d0"
        `);
    await queryRunner.query(`
            ALTER TABLE "game" DROP CONSTRAINT "FK_52b4bb990c5a5fe76c6d675c002"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_ea273d6b68ec2073a7af5d7d28"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_76c0e2a6b1c36a0ed08745b4cb"
        `);
    await queryRunner.query(`
            DROP TABLE "game_genres_genre"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_24ae8c150d4a878e2260e52624"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_0c2a0973b06e6530bdf70522f0"
        `);
    await queryRunner.query(`
            DROP TABLE "game_tags_tag"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_6b179f1104e52e940718686e0b"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_a7f9028303f115fd99e8fa0704"
        `);
    await queryRunner.query(`
            DROP TABLE "game_stores_store"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_086b3f0af45ee3a586f65e279d"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_af55594242fcb08c34a7169458"
        `);
    await queryRunner.query(`
            DROP TABLE "game_developers_developer"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_9b62bde5e60ae224ece6212139"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_23c7fd8d5ba629387c0ee3beef"
        `);
    await queryRunner.query(`
            DROP TABLE "game_publishers_publisher"
        `);
    await queryRunner.query(`
            DROP TABLE "crackpipe_user"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."crackpipe_user_role_enum"
        `);
    await queryRunner.query(`
            DROP TABLE "progress"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."progress_state_enum"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_0152ed47a9e8963b5aaceb51e7"
        `);
    await queryRunner.query(`
            DROP TABLE "game"
        `);
    await queryRunner.query(`
            DROP TABLE "tag"
        `);
    await queryRunner.query(`
            DROP TABLE "store"
        `);
    await queryRunner.query(`
            DROP TABLE "publisher"
        `);
    await queryRunner.query(`
            DROP TABLE "genre"
        `);
    await queryRunner.query(`
            DROP TABLE "developer"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_f03b89f33671086e6733828e79"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_e0626148aee5829fd312447001"
        `);
    await queryRunner.query(`
            DROP TABLE "image"
        `);
  }
}
