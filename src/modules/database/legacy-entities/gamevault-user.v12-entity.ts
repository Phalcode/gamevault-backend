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
import { Role } from "../../users/models/role.enum";
import { DatabaseEntityV12 } from "./database.v12-entity";
import { GameV12 } from "./game.v12-entity";
import { ImageV12 } from "./image.v12-entity";
import { ProgressV12 } from "./progress.v12-entity";
@Entity("v12_gamevault_user", { synchronize: false })
export class GamevaultUserV12 extends DatabaseEntityV12 {
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

  @OneToOne(() => ImageV12, {
    nullable: true,
    eager: true,
    onDelete: "CASCADE",
    orphanedRowAction: "soft-delete",
  })
  @JoinColumn()
  @ApiPropertyOptional({
    type: () => ImageV12,
    description: "the user's profile picture",
  })
  profile_picture?: ImageV12;

  @OneToOne(() => ImageV12, {
    nullable: true,
    eager: true,
    onDelete: "CASCADE",
    orphanedRowAction: "soft-delete",
  })
  @JoinColumn()
  @ApiPropertyOptional({
    type: () => ImageV12,
    description: "the user's profile art (background-picture)",
  })
  background_image?: ImageV12;

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

  @OneToMany(() => ProgressV12, (progress) => progress.user)
  @ApiPropertyOptional({
    description: "progresses of the user",
    type: () => ProgressV12,
    isArray: true,
  })
  progresses?: ProgressV12[];

  @Column({
    type: "simple-enum",
    enum: Role,
    default: Role.USER,
  })
  @ApiProperty({
    type: "string",
    enum: Role,
    example: Role.EDITOR,
    description:
      "The role determines the set of permissions and access rights for a user in the system.",
  })
  role: Role;

  @OneToMany(() => ImageV12, (image) => image.uploader)
  @ApiPropertyOptional({
    description: "images uploaded by this user",
    type: () => ImageV12,
    isArray: true,
  })
  uploaded_images?: ImageV12[];

  @ManyToMany(() => GameV12, (game) => game.bookmarked_users)
  @JoinTable({ name: "v12_bookmark" })
  @ApiProperty({
    description: "games bookmarked by this user",
    type: () => GameV12,
    isArray: true,
  })
  bookmarked_games?: GameV12[];
}
