import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToMany,
  OneToOne,
} from "typeorm";

import { DatabaseEntity } from "../database/database.entity";
import { GamevaultGame } from "../games/game.entity";
import { Media } from "../media/media.entity";
import { Progress } from "../progresses/progress.entity";
import { Role } from "./models/role.enum";

@Entity()
export class GamevaultUser extends DatabaseEntity {
  @Index()
  @Column({ unique: true })
  @ApiProperty({ example: "JohnDoe", description: "username of the user" })
  username: string;

  @Column({ select: false })
  @ApiProperty({
    description: "encrypted password of the user",
    example: "Hunter2",
  })
  password: string;

  @Column({ select: false, unique: true, length: 64 })
  @ApiProperty({
    description:
      "the user's socket secret is used for authentication with the server over the websocket protocol.",
    example: "fd9c4f417fb494aeacef28a70eba95128d9f2521374852cdb12ecb746888b892",
  })
  socket_secret: string;

  //TODO: Validate the uploaded media is an image
  @OneToOne(() => Media, {
    nullable: true,
    eager: true,
    onDelete: "CASCADE",
    orphanedRowAction: "soft-delete",
  })
  @JoinColumn()
  @ApiPropertyOptional({
    type: () => Media,
    description: "the user's avatar image",
  })
  avatar?: Media;

  //TODO: Validate the uploaded media is an image
  @OneToOne(() => Media, {
    nullable: true,
    eager: true,
    onDelete: "CASCADE",
    orphanedRowAction: "soft-delete",
  })
  @JoinColumn()
  @ApiPropertyOptional({
    type: () => Media,
    description: "the user's profile background image",
  })
  background?: Media;

  @Column({ unique: true, nullable: true })
  @ApiProperty({
    example: "john.doe@mail.com",
    description: "email address of the user",
  })
  email: string;

  @Column({ nullable: true })
  @ApiProperty({ example: "John", description: "first name of the user" })
  first_name: string;

  @Column({ nullable: true })
  @ApiProperty({ example: "Doe", description: "last name of the user" })
  last_name: string;

  @Index()
  @Column({ nullable: true })
  @ApiPropertyOptional({
    description: "birthday of the user",
    example: "2013-09-17T00:00:00.000Z",
  })
  birth_date?: Date;

  @Column({ default: false })
  @ApiProperty({
    description: "indicates if the user is activated",
    example: false,
  })
  activated: boolean;

  @OneToMany(() => Progress, (progress) => progress.user)
  @ApiPropertyOptional({
    description: "progresses of the user",
    type: () => Progress,
    isArray: true,
  })
  progresses?: Progress[];

  @Column({
    type: "simple-enum",
    enum: Role,
    default: Role.USER,
  })
  @ApiProperty({
    type: "enum",
    enum: Role,
    example: Role.EDITOR,
    description:
      "The role determines the set of permissions and access rights for a user in the system.",
  })
  role: Role;

  @OneToMany(() => Media, (media) => media.uploader)
  @ApiPropertyOptional({
    description: "media uploaded by this user",
    type: () => Media,
    isArray: true,
  })
  uploaded_media?: Media[];

  @ManyToMany(() => GamevaultGame, (game) => game.bookmarked_users)
  @JoinTable({ name: "bookmark" })
  @ApiProperty({
    description: "games bookmarked by this user",
    type: () => GamevaultGame,
    isArray: true,
  })
  bookmarked_games?: GamevaultGame[];
}
