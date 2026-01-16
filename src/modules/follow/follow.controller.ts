import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { FollowService } from './follow.service';
import { JwtAccessTokenGuard } from '../auth/guards/jwt-access-token.guard';
import { AuthUser } from '@/shared/decorators/auth-user.decorator';
import { User } from '@/entities/user.entity';

@Controller('follows')
@UseGuards(JwtAccessTokenGuard)
export class FollowController {
  constructor(private readonly followService: FollowService) {}

  @Post(':id')
  async follow(@AuthUser() user: User, @Param('id') followeeId: string) {
    return this.followService.follow(user.id, followeeId);
  }

  @Delete(':id')
  async unfollow(@AuthUser() user: User, @Param('id') followeeId: string) {
    return this.followService.unfollow(user.id, followeeId);
  }

  @Get('followers')
  async getMyFollowers(
    @AuthUser() user: User,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return this.followService.getFollowers(user.id, page, limit);
  }

  @Get('followings')
  async getMyFollowings(
    @AuthUser() user: User,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return this.followService.getFollowings(user.id, page, limit);
  }

  @Get(':userId/followers')
  async getUserFollowers(
    @Param('userId') userId: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return this.followService.getFollowers(userId, page, limit);
  }

  @Get(':userId/followings')
  async getUserFollowings(
    @Param('userId') userId: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return this.followService.getFollowings(userId, page, limit);
  }
}
