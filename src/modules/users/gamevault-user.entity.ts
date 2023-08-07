import { ApiProperty } from "@nestjs/swagger";
import { Entity, Column, OneToMany, JoinColumn, ManyToOne } from "typeorm";
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

  @ManyToOne(() => Image, {
    nullable: true,
    eager: true,
    onDelete: "CASCADE",
    orphanedRowAction: "soft-delete",
  })
  @JoinColumn()
  @ApiProperty({
    type: () => Image,
    description: "the user's profile picture",
  })
  profile_picture: Image;

  @ManyToOne(() => Image, {
    nullable: true,
    eager: true,
    onDelete: "CASCADE",
    orphanedRowAction: "soft-delete",
  })
  @JoinColumn()
  @ApiProperty({
    type: () => Image,
    description: "the user's profile art (background-picture)",
  })
  background_image: Image;

  @Column({ unique: true })
  @ApiProperty({
    example: "john.doe@mail.com",
    description: "email address of the user",
  })
  email: string;

  @Column()
  @ApiProperty({ example: "John", description: "first name of the user" })
  first_name: string;

  @Column()
  @ApiProperty({ example: "Doe", description: "last name of the user" })
  last_name: string;

  @Column({ default: false })
  @ApiProperty({
    description: "indicates if the user is activated",
    example: false,
  })
  activated: boolean;

  @OneToMany(() => Progress, (progress) => progress.user)
  @ApiProperty({
    description: "progresses of the user",
    type: [() => Progress],
    isArray: true,
  })
  progresses: Progress[];

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
}
