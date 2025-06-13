import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../user.entity';

@Entity('user_vectors')
export class UserVector {
  @PrimaryColumn()
  userId: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('float', { array: true })
  embedding: number[];
}
