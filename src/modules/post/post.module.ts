import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from '@/entities/post.entity';
import { CacheModule } from '../cache/cache.module';
import { RabbitMQModule } from '../rabbitmq/rabbitmq.module';
import { Comment } from '@/entities/comment.entity';
import { PostAttachment } from '@/entities/post-attachment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, Comment, PostAttachment]),
    CacheModule,
    RabbitMQModule,
  ],
  controllers: [PostController],
  providers: [PostService],
  exports: [PostService],
})
export class PostModule {}
