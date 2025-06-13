import { User } from 'src/modules/user/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

@Entity('posts')
@Index('IDX_POST_USER_ID', ['userId']) // Index for userId lookups
@Index('IDX_POST_CREATED_AT', ['createdAt']) // Index for sorting/filtering by date
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('IDX_POST_EMBEDDING_VECTOR') // optional, actual index created manually
  @Column({
    type: 'vector' as any,
    nullable: true,
  })
  embedding: number[];

  @Column()
  content: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @Column({ default: 0 })
  likes: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
