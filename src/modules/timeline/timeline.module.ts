import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from '@/entities/post.entity';
import { TimelineService } from './timeline.service';
import { TimelineController } from './timeline.controller';
import { TimelineWorker } from './timeline.worker';
import { FollowModule } from '../follow/follow.module';
import { CacheModule } from '../cache/cache.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post]),
    FollowModule,
    CacheModule,
    UserModule,
  ],
  controllers: [TimelineController, TimelineWorker],
  providers: [TimelineService],
  exports: [TimelineService],
})
export class TimelineModule {}
