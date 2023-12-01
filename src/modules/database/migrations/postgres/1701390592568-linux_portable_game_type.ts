import { MigrationInterface, QueryRunner } from "typeorm";

export class LinuxPortableGameType1701390592568 implements MigrationInterface {
  name = "LinuxPortableGameType1701390592568";

  public async up(queryRunner: QueryRunner): Promise<void> {
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
            CREATE INDEX "IDX_71b846918f80786eed6bfb68b7" ON "developer" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_5c2989f7bc37f907cfd937c0fd" ON "developer" ("name")
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
            CREATE INDEX "IDX_0285d4f1655d080cfcf7d1ab14" ON "genre" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_dd8cd9e50dd049656e4be1f7e8" ON "genre" ("name")
        `);
    await queryRunner.query(`
            CREATE TABLE "image" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                "entity_version" integer NOT NULL,
                "source" character varying,
                "path" character varying,
                "media_type" character varying,
                "uploader_id" integer,
                CONSTRAINT "UQ_f03b89f33671086e6733828e79c" UNIQUE ("path"),
                CONSTRAINT "PK_d6db1ab4ee9ad9dbe86c64e4cc3" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_d6db1ab4ee9ad9dbe86c64e4cc" ON "image" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_f03b89f33671086e6733828e79" ON "image" ("path")
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."gamevault_user_role_enum" AS ENUM('0', '1', '2', '3')
        `);
    await queryRunner.query(`
            CREATE TABLE "gamevault_user" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                "entity_version" integer NOT NULL,
                "username" character varying NOT NULL,
                "password" character varying NOT NULL,
                "socket_secret" character varying(64) NOT NULL,
                "email" character varying,
                "first_name" character varying,
                "last_name" character varying,
                "activated" boolean NOT NULL DEFAULT false,
                "role" "public"."gamevault_user_role_enum" NOT NULL DEFAULT '1',
                "profile_picture_id" integer,
                "background_image_id" integer,
                CONSTRAINT "UQ_4c835305e86b28e416cfe13dace" UNIQUE ("username"),
                CONSTRAINT "UQ_e0da4bbf1074bca2d980a810771" UNIQUE ("socket_secret"),
                CONSTRAINT "UQ_284621e91b3886db5ebd901384a" UNIQUE ("email"),
                CONSTRAINT "PK_c2a3f8b06558be9508161af22e2" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_c2a3f8b06558be9508161af22e" ON "gamevault_user" ("id")
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
            CREATE INDEX "IDX_79abdfd87a688f9de756a162b6" ON "progress" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_ddcaca3a9db9d77105d51c02c2" ON "progress" ("user_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_feaddf361921db1df3a6fe3965" ON "progress" ("game_id")
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
            CREATE INDEX "IDX_70a5936b43177f76161724da3e" ON "publisher" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_9dc496f2e5b912da9edd2aa445" ON "publisher" ("name")
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
            CREATE INDEX "IDX_f3172007d4de5ae8e7692759d7" ON "store" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_66df34da7fb037e24fc7fee642" ON "store" ("name")
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
            CREATE INDEX "IDX_8e4052373c579afc1471f52676" ON "tag" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_6a9775008add570dc3e5a0bab7" ON "tag" ("name")
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."game_type_enum" AS ENUM(
                'UNDETECTABLE',
                'WINDOWS_SETUP',
                'WINDOWS_PORTABLE',
                'LINUX_PORTABLE'
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
                "release_date" TIMESTAMP,
                "rawg_release_date" TIMESTAMP,
                "cache_date" TIMESTAMP,
                "file_path" character varying NOT NULL,
                "size" bigint NOT NULL DEFAULT '0',
                "description" character varying,
                "website_url" character varying,
                "metacritic_rating" integer,
                "average_playtime" integer,
                "early_access" boolean NOT NULL,
                "type" "public"."game_type_enum" NOT NULL DEFAULT 'UNDETECTABLE',
                "box_image_id" integer,
                "background_image_id" integer,
                CONSTRAINT "UQ_7770cb331bdc54951bb9046fa9d" UNIQUE ("file_path"),
                CONSTRAINT "PK_352a30652cd352f552fef73dec5" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_352a30652cd352f552fef73dec" ON "game" ("id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_0152ed47a9e8963b5aaceb51e7" ON "game" ("title")
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
            ALTER TABLE "image"
            ADD CONSTRAINT "FK_81cba867ad852a0b6402f0e82fb" FOREIGN KEY ("uploader_id") REFERENCES "gamevault_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "gamevault_user"
            ADD CONSTRAINT "FK_c1779b9b22212754248aa404bad" FOREIGN KEY ("profile_picture_id") REFERENCES "image"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "gamevault_user"
            ADD CONSTRAINT "FK_4b83e27ed50c1e183a69fceef68" FOREIGN KEY ("background_image_id") REFERENCES "image"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "progress"
            ADD CONSTRAINT "FK_ddcaca3a9db9d77105d51c02c24" FOREIGN KEY ("user_id") REFERENCES "gamevault_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "progress"
            ADD CONSTRAINT "FK_feaddf361921db1df3a6fe3965a" FOREIGN KEY ("game_id") REFERENCES "game"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "game"
            ADD CONSTRAINT "FK_52b4bb990c5a5fe76c6d675c002" FOREIGN KEY ("box_image_id") REFERENCES "image"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "game"
            ADD CONSTRAINT "FK_0e88ada3f37f7cabfb6d59ed0d0" FOREIGN KEY ("background_image_id") REFERENCES "image"("id") ON DELETE CASCADE ON UPDATE NO ACTION
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
            ALTER TABLE "game" DROP CONSTRAINT "FK_0e88ada3f37f7cabfb6d59ed0d0"
        `);
    await queryRunner.query(`
            ALTER TABLE "game" DROP CONSTRAINT "FK_52b4bb990c5a5fe76c6d675c002"
        `);
    await queryRunner.query(`
            ALTER TABLE "progress" DROP CONSTRAINT "FK_feaddf361921db1df3a6fe3965a"
        `);
    await queryRunner.query(`
            ALTER TABLE "progress" DROP CONSTRAINT "FK_ddcaca3a9db9d77105d51c02c24"
        `);
    await queryRunner.query(`
            ALTER TABLE "gamevault_user" DROP CONSTRAINT "FK_4b83e27ed50c1e183a69fceef68"
        `);
    await queryRunner.query(`
            ALTER TABLE "gamevault_user" DROP CONSTRAINT "FK_c1779b9b22212754248aa404bad"
        `);
    await queryRunner.query(`
            ALTER TABLE "image" DROP CONSTRAINT "FK_81cba867ad852a0b6402f0e82fb"
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
            DROP INDEX "public"."IDX_0152ed47a9e8963b5aaceb51e7"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_352a30652cd352f552fef73dec"
        `);
    await queryRunner.query(`
            DROP TABLE "game"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."game_type_enum"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_6a9775008add570dc3e5a0bab7"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_8e4052373c579afc1471f52676"
        `);
    await queryRunner.query(`
            DROP TABLE "tag"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_66df34da7fb037e24fc7fee642"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_f3172007d4de5ae8e7692759d7"
        `);
    await queryRunner.query(`
            DROP TABLE "store"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_9dc496f2e5b912da9edd2aa445"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_70a5936b43177f76161724da3e"
        `);
    await queryRunner.query(`
            DROP TABLE "publisher"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_feaddf361921db1df3a6fe3965"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_ddcaca3a9db9d77105d51c02c2"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_79abdfd87a688f9de756a162b6"
        `);
    await queryRunner.query(`
            DROP TABLE "progress"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."progress_state_enum"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_c2a3f8b06558be9508161af22e"
        `);
    await queryRunner.query(`
            DROP TABLE "gamevault_user"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."gamevault_user_role_enum"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_f03b89f33671086e6733828e79"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_d6db1ab4ee9ad9dbe86c64e4cc"
        `);
    await queryRunner.query(`
            DROP TABLE "image"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_dd8cd9e50dd049656e4be1f7e8"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_0285d4f1655d080cfcf7d1ab14"
        `);
    await queryRunner.query(`
            DROP TABLE "genre"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_5c2989f7bc37f907cfd937c0fd"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_71b846918f80786eed6bfb68b7"
        `);
    await queryRunner.query(`
            DROP TABLE "developer"
        `);
  }
}
