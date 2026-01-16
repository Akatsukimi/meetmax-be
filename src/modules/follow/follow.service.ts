import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Follow } from '@/entities/follow.entity';
import { UserService } from '../user/user.service';
import { Services } from '@/shared/constants/services.enum';

@Injectable()
export class FollowService {
  constructor(
    @InjectRepository(Follow)
    private readonly followRepository: Repository<Follow>,
    @Inject(Services.USERS)
    private readonly userService: UserService,
  ) {}

  async follow(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    const followingUser = await this.userService.findUser({ id: followingId });
    if (!followingUser) {
      throw new NotFoundException('User to follow not found');
    }

    const existingFollow = await this.followRepository.findOne({
      where: { followerId, followingId },
    });

    if (existingFollow) {
      return existingFollow;
    }

    const follow = this.followRepository.create({
      followerId,
      followingId,
    });

    return await this.followRepository.save(follow);
  }

  async unfollow(followerId: string, followingId: string) {
    const result = await this.followRepository.delete({
      followerId,
      followingId,
    });
    return result.affected > 0;
  }

  async getFollowers(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [follows, total] = await this.followRepository.findAndCount({
      where: { followingId: userId },
      relations: ['follower'],
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: follows.map((f) => f.follower),
      total,
      page,
      limit,
    };
  }

  async getFollowings(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [follows, total] = await this.followRepository.findAndCount({
      where: { followerId: userId },
      relations: ['following'],
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: follows.map((f) => f.following),
      total,
      page,
      limit,
    };
  }

  // Internal method for workers
  async getAllFollowerIds(userId: string): Promise<string[]> {
    const followers = await this.followRepository.find({
      where: { followingId: userId },
      select: ['followerId'],
    });
    return followers.map((f) => f.followerId);
  }

  // Internal method with offset/limit for batching
  async getFollowersBatch(
    userId: string,
    skip: number,
    take: number,
  ): Promise<string[]> {
    const followers = await this.followRepository.find({
      where: { followingId: userId },
      select: ['followerId'],
      skip,
      take,
      order: { createdAt: 'DESC' },
    });
    return followers.map((f) => f.followerId);
  }
}
