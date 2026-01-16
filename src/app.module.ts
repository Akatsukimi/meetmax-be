import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';

import configuration from '@/configs/configuration';
import { UserModule } from '@/modules/user/user.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { DatabaseType } from '@/shared/constants/db.type';

import entities from './entities';
import { MessageModule } from './modules/message/message.module';
import { ExpiredTokenFilter } from './shared/filters/expired-token.filter';
import { ConversationModule } from './modules/conversation/conversation.module';
import { JwtAccessTokenGuard } from './modules/auth/guards/jwt-access-token.guard';
import { EventsModule } from './modules/events/events.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PostModule } from './modules/post/post.module';
import { FileModule } from './modules/file/file.module';
import { LikeModule } from './modules/like/like.module';
import { CacheModule } from './modules/cache/cache.module';
import { GroupModule } from './modules/group/group.module';
import { CommentModule } from './modules/comment/comment.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CronjobsModule } from './modules/cronjobs/cronjobs.module';
import { NotificationModule } from './modules/notification/notification.module';
import { RabbitMQModule } from './modules/rabbitmq/rabbitmq.module';
import { FollowModule } from './modules/follow/follow.module';
import { TimelineModule } from './modules/timeline/timeline.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => ({
        type: configService.get<string>('config.database.type') as DatabaseType,
        host: configService.get<string>('config.database.host'),
        port: configService.get<number>('config.database.port'),
        username: configService.get<string>('config.database.username'),
        password: configService.get<string>('config.database.password'),
        database: configService.get<string>('config.database.database'),
        entities,
        synchronize: true,
      }),
    }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    CronjobsModule,
    CacheModule,
    AuthModule,
    UserModule,
    ConversationModule,
    MessageModule,
    EventsModule,
    PostModule,
    FileModule,
    LikeModule,
    GroupModule,
    CommentModule,
    NotificationModule,
    RabbitMQModule,
    FollowModule,
    TimelineModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAccessTokenGuard,
    },
    {
      provide: APP_FILTER,
      useClass: ExpiredTokenFilter,
    },
  ],
})
export class AppModule {}
