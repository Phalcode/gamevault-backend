import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Entity, Column, OneToMany, JoinColumn, OneToOne } from "typeorm";
import { Image } from "../images/image.entity";
import { Progress } from "../progress/progress.entity";
import { DatabaseEntity } from "../database/database.entity";
import { Role } from "./models/role.enum";

@Entity()
export class GamevaultUser extends DatabaseEntity {
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

  @OneToOne(() => Image, {
    nullable: true,
    eager: true,
    onDelete: "CASCADE",
    orphanedRowAction: "soft-delete",
  })
  @JoinColumn()
  @ApiPropertyOptional({
    type: () => Image,
    description: "the user's profile picture",
  })
  profile_picture?: Image;

  @OneToOne(() => Image, {
    nullable: true,
    eager: true,
    onDelete: "CASCADE",
    orphanedRowAction: "soft-delete",
  })
  @JoinColumn()
  @ApiPropertyOptional({
    type: () => Image,
    description: "the user's profile art (background-picture)",
  })
  background_image?: Image;

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

  @OneToMany(() => Image, (image) => image.uploader)
  @ApiPropertyOptional({
    description: "images uploaded by this user",
    type: () => Image,
    isArray: true,
  })
  uploaded_images?: Image[];
}
