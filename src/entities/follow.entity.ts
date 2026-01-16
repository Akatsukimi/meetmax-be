import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Index,
  Column,
} from 'typeorm';
import { User } from '@/entities/user.entity';

@Entity()
@Index(['followerId', 'followingId'], { unique: true })
export class Follow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'followerId' })
  follower: User;

  @Index()
  @Column()
  followerId: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'followingId' })
  following: User;

  @Index()
  @Column()
  followingId: string;

  @CreateDateColumn()
  createdAt: Date;
}
