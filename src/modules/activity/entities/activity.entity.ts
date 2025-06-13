import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from 'src/modules/user/entities/user.entity';
import { Post } from 'src/modules/post/entities/post.entity';

@Entity('activities')
export class Activity {
  /**
   * Unique identifier for each activity (UUID).
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Type of user activity.
   * 
   * Currently supported types:
   * - 'LIKE'   → when a user likes a post
   * - 'COMMENT' → (future use)
   * - 'SHARE'   → (future use)
   */
  @Column()
  type: 'LIKE' | 'COMMENT' | 'SHARE';

  /**
   * The user who performed the activity.
   * - Eagerly loaded for convenience.
   * - If the user is deleted, related activities are removed.
   */
  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  /**
   * Foreign key reference to the user.
   */
  @Column()
  userId: string;

  /**
   * The post that this activity is associated with.
   * - Eagerly loaded.
   * - If the post is deleted, the activity is also deleted.
   */
  @ManyToOne(() => Post, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: Post;

  /**
   * Foreign key reference to the post.
   */
  @Column()
  postId: string;

  /**
   * Timestamp of when the activity occurred.
   * Automatically set when the record is created.
   */
  @CreateDateColumn()
  createdAt: Date;
}
