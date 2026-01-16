import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { TimelineService } from './timeline.service';
import { JwtAccessTokenGuard } from '../auth/guards/jwt-access-token.guard';
import { AuthUser } from '@/shared/decorators/auth-user.decorator';
import { User } from '@/entities/user.entity';

@Controller('timeline')
@UseGuards(JwtAccessTokenGuard)
export class TimelineController {
  constructor(private readonly timelineService: TimelineService) {}

  @Get()
  async getTimeline(
    @AuthUser() user: User,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.timelineService.getTimeline(
      user.id,
      Number(page),
      Number(limit),
    );
  }
}
