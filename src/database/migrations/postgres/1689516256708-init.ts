import { Logger } from "@nestjs/common";
import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1689516256708 implements MigrationInterface {
  private readonly logger = new Logger(Init1689516256708.name);
  name = "Init1689516256708";

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
                "mediaType" character varying,
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
                "boxImageId" integer,
                "backgroundImageId" integer,
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
                "userId" integer,
                "gameId" integer,
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
                "profilePictureId" integer,
                "backgroundImageId" integer,
                CONSTRAINT "UQ_ad2fda40ce941655c838fb1435f" UNIQUE ("username"),
                CONSTRAINT "UQ_d0e7d50057240e5752a2c303ffb" UNIQUE ("email"),
                CONSTRAINT "PK_0e446a80433f350bae907fac18b" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "game_publishers_publisher" (
                "gameId" integer NOT NULL,
                "publisherId" integer NOT NULL,
                CONSTRAINT "PK_2ea614033fd1689e85ad075f704" PRIMARY KEY ("gameId", "publisherId")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_0161ee9a5742c8ab26f481cace" ON "game_publishers_publisher" ("gameId")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_d7a940ba0d1d6af4fa6532ffd4" ON "game_publishers_publisher" ("publisherId")
        `);
    await queryRunner.query(`
            CREATE TABLE "game_developers_developer" (
                "gameId" integer NOT NULL,
                "developerId" integer NOT NULL,
                CONSTRAINT "PK_8e4540aa861eb835f050cec210c" PRIMARY KEY ("gameId", "developerId")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_f5bea91f3185bcf27a60a83377" ON "game_developers_developer" ("gameId")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_c030afb1f3be8ccb7f5761588f" ON "game_developers_developer" ("developerId")
        `);
    await queryRunner.query(`
            CREATE TABLE "game_stores_store" (
                "gameId" integer NOT NULL,
                "storeId" integer NOT NULL,
                CONSTRAINT "PK_0c7a3fac71d36230bb8b1df1b55" PRIMARY KEY ("gameId", "storeId")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_8f769182cc4e5958b3b57ec14a" ON "game_stores_store" ("gameId")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_2ab30a2cbcda7798a4cc0ea6d6" ON "game_stores_store" ("storeId")
        `);
    await queryRunner.query(`
            CREATE TABLE "game_tags_tag" (
                "gameId" integer NOT NULL,
                "tagId" integer NOT NULL,
                CONSTRAINT "PK_f3cb7a976b0a19f544c65e4b6ec" PRIMARY KEY ("gameId", "tagId")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_6366e7093c3571f85f1b5ffd4f" ON "game_tags_tag" ("gameId")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_d12253f0cbce01f030a9ced11d" ON "game_tags_tag" ("tagId")
        `);
    await queryRunner.query(`
            CREATE TABLE "game_genres_genre" (
                "gameId" integer NOT NULL,
                "genreId" integer NOT NULL,
                CONSTRAINT "PK_4d9817701d31359977772ad19d2" PRIMARY KEY ("gameId", "genreId")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_2ae1c183b1ca4b831efcb9e673" ON "game_genres_genre" ("gameId")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_3549c373e01bdee0f24ed47649" ON "game_genres_genre" ("genreId")
        `);
    await queryRunner.query(`
            ALTER TABLE "game"
            ADD CONSTRAINT "FK_fcb87541065fd19c533f64ef64d" FOREIGN KEY ("boxImageId") REFERENCES "image"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "game"
            ADD CONSTRAINT "FK_1260b3922420ccd9c54ea0e841e" FOREIGN KEY ("backgroundImageId") REFERENCES "image"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "progress"
            ADD CONSTRAINT "FK_0366c96237f98ea1c8ba6e1ec35" FOREIGN KEY ("userId") REFERENCES "crackpipe_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "progress"
            ADD CONSTRAINT "FK_409f34cf4dcfc645e8c93b0a8c2" FOREIGN KEY ("gameId") REFERENCES "game"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "crackpipe_user"
            ADD CONSTRAINT "FK_ca78001001650ae341575a18cc6" FOREIGN KEY ("profilePictureId") REFERENCES "image"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "crackpipe_user"
            ADD CONSTRAINT "FK_c7f85d117085d0c2add94649cbf" FOREIGN KEY ("backgroundImageId") REFERENCES "image"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "game_publishers_publisher"
            ADD CONSTRAINT "FK_0161ee9a5742c8ab26f481cace7" FOREIGN KEY ("gameId") REFERENCES "game"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `);
    await queryRunner.query(`
            ALTER TABLE "game_publishers_publisher"
            ADD CONSTRAINT "FK_d7a940ba0d1d6af4fa6532ffd43" FOREIGN KEY ("publisherId") REFERENCES "publisher"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "game_developers_developer"
            ADD CONSTRAINT "FK_f5bea91f3185bcf27a60a833772" FOREIGN KEY ("gameId") REFERENCES "game"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `);
    await queryRunner.query(`
            ALTER TABLE "game_developers_developer"
            ADD CONSTRAINT "FK_c030afb1f3be8ccb7f5761588ff" FOREIGN KEY ("developerId") REFERENCES "developer"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "game_stores_store"
            ADD CONSTRAINT "FK_8f769182cc4e5958b3b57ec14a0" FOREIGN KEY ("gameId") REFERENCES "game"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `);
    await queryRunner.query(`
            ALTER TABLE "game_stores_store"
            ADD CONSTRAINT "FK_2ab30a2cbcda7798a4cc0ea6d60" FOREIGN KEY ("storeId") REFERENCES "store"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "game_tags_tag"
            ADD CONSTRAINT "FK_6366e7093c3571f85f1b5ffd4f1" FOREIGN KEY ("gameId") REFERENCES "game"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `);
    await queryRunner.query(`
            ALTER TABLE "game_tags_tag"
            ADD CONSTRAINT "FK_d12253f0cbce01f030a9ced11d6" FOREIGN KEY ("tagId") REFERENCES "tag"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "game_genres_genre"
            ADD CONSTRAINT "FK_2ae1c183b1ca4b831efcb9e673d" FOREIGN KEY ("gameId") REFERENCES "game"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `);
    await queryRunner.query(`
            ALTER TABLE "game_genres_genre"
            ADD CONSTRAINT "FK_3549c373e01bdee0f24ed476497" FOREIGN KEY ("genreId") REFERENCES "genre"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "game_genres_genre" DROP CONSTRAINT "FK_3549c373e01bdee0f24ed476497"
        `);
    await queryRunner.query(`
            ALTER TABLE "game_genres_genre" DROP CONSTRAINT "FK_2ae1c183b1ca4b831efcb9e673d"
        `);
    await queryRunner.query(`
            ALTER TABLE "game_tags_tag" DROP CONSTRAINT "FK_d12253f0cbce01f030a9ced11d6"
        `);
    await queryRunner.query(`
            ALTER TABLE "game_tags_tag" DROP CONSTRAINT "FK_6366e7093c3571f85f1b5ffd4f1"
        `);
    await queryRunner.query(`
            ALTER TABLE "game_stores_store" DROP CONSTRAINT "FK_2ab30a2cbcda7798a4cc0ea6d60"
        `);
    await queryRunner.query(`
            ALTER TABLE "game_stores_store" DROP CONSTRAINT "FK_8f769182cc4e5958b3b57ec14a0"
        `);
    await queryRunner.query(`
            ALTER TABLE "game_developers_developer" DROP CONSTRAINT "FK_c030afb1f3be8ccb7f5761588ff"
        `);
    await queryRunner.query(`
            ALTER TABLE "game_developers_developer" DROP CONSTRAINT "FK_f5bea91f3185bcf27a60a833772"
        `);
    await queryRunner.query(`
            ALTER TABLE "game_publishers_publisher" DROP CONSTRAINT "FK_d7a940ba0d1d6af4fa6532ffd43"
        `);
    await queryRunner.query(`
            ALTER TABLE "game_publishers_publisher" DROP CONSTRAINT "FK_0161ee9a5742c8ab26f481cace7"
        `);
    await queryRunner.query(`
            ALTER TABLE "crackpipe_user" DROP CONSTRAINT "FK_c7f85d117085d0c2add94649cbf"
        `);
    await queryRunner.query(`
            ALTER TABLE "crackpipe_user" DROP CONSTRAINT "FK_ca78001001650ae341575a18cc6"
        `);
    await queryRunner.query(`
            ALTER TABLE "progress" DROP CONSTRAINT "FK_409f34cf4dcfc645e8c93b0a8c2"
        `);
    await queryRunner.query(`
            ALTER TABLE "progress" DROP CONSTRAINT "FK_0366c96237f98ea1c8ba6e1ec35"
        `);
    await queryRunner.query(`
            ALTER TABLE "game" DROP CONSTRAINT "FK_1260b3922420ccd9c54ea0e841e"
        `);
    await queryRunner.query(`
            ALTER TABLE "game" DROP CONSTRAINT "FK_fcb87541065fd19c533f64ef64d"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_3549c373e01bdee0f24ed47649"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_2ae1c183b1ca4b831efcb9e673"
        `);
    await queryRunner.query(`
            DROP TABLE "game_genres_genre"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_d12253f0cbce01f030a9ced11d"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_6366e7093c3571f85f1b5ffd4f"
        `);
    await queryRunner.query(`
            DROP TABLE "game_tags_tag"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_2ab30a2cbcda7798a4cc0ea6d6"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_8f769182cc4e5958b3b57ec14a"
        `);
    await queryRunner.query(`
            DROP TABLE "game_stores_store"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_c030afb1f3be8ccb7f5761588f"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_f5bea91f3185bcf27a60a83377"
        `);
    await queryRunner.query(`
            DROP TABLE "game_developers_developer"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_d7a940ba0d1d6af4fa6532ffd4"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_0161ee9a5742c8ab26f481cace"
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
