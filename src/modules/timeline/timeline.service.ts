import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Post } from '@/entities/post.entity';
import Redis from 'ioredis';
import { FollowService } from '../follow/follow.service';

@Injectable()
export class TimelineService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @Inject('REDIS_CLIENT')
    private readonly redisClient: Redis,
    private readonly followService: FollowService,
  ) {}

  async getTimeline(userId: string, page: number = 1, limit: number = 10) {
    const start = (page - 1) * limit;
    const end = start + limit - 1;
    const key = `hometimeline:${userId}`;

    // Check if timeline exists
    const exists = await this.redisClient.exists(key);
    if (!exists) {
      await this.warmupTimeline(userId);
    }

    // Fetch Post IDs from Redis (Sorted by timestamp DESC)
    const postIds = await this.redisClient.zrevrange(key, start, end);

    if (!postIds || postIds.length === 0) {
      return {
        data: [],
        total: 0,
        page,
        limit,
      };
    }

    // Fetch Post Details from DB
    const posts = await this.postRepository.find({
      where: { id: In(postIds) },
      relations: ['author', 'likes', 'comments', 'likes.user', 'attachments'],
    });

    // Re-sort posts
    const postsMap = new Map(posts.map((p) => [p.id, p]));
    const sortedPosts = postIds
      .map((id) => postsMap.get(id))
      .filter((p) => !!p);

    const total = await this.redisClient.zcard(key);

    return {
      data: sortedPosts,
      total,
      page,
      limit,
    };
  }

  async warmupTimeline(userId: string) {
    // 1. Get followings
    const { data: followings } = await this.followService.getFollowings(
      userId,
      1,
      100,
    );
    if (!followings || followings.length === 0) return;

    const followingIds = followings.map((u) => u.id);

    // 2. Fetch latest posts from DB (Limit 50 for warmup)
    const posts = await this.postRepository.find({
      where: { author: { id: In(followingIds) } },
      order: { createdAt: 'DESC' },
      take: 50,
    });

    if (posts.length === 0) return;

    // 3. Push to Redis
    const key = `hometimeline:${userId}`;
    const pipeline = this.redisClient.pipeline();

    for (const post of posts) {
      const timestamp = Math.floor(new Date(post.createdAt).getTime() / 1000);
      pipeline.zadd(key, timestamp, post.id);
    }

    // Set expiry (7 days)
    pipeline.expire(key, 60 * 60 * 24 * 7);

    await pipeline.exec();
  }

  // Helper to add post to timeline (used by Worker)
  async pushPostToTimeline(
    targetUserId: string,
    postId: string,
    timestamp: number,
  ) {
    const key = `hometimeline:${targetUserId}`;
    await this.redisClient.zadd(key, timestamp, postId);

    // Trim timeline to keep only top 800 posts
    // ZREMRANGEBYRANK key 0 -801 (removes from 0 to total-801)
    // Wait, ZREMRANGEBYRANK removes by index.
    // If we want to keep top N (highest scores), we remove the ones with strictly lower ranks (lowest scores).
    // ZREVRANGE is 0-based for highest scores.
    // ZRANGE is 0-based for lowest scores.
    // To keep REVERSE top 800 (latest 800), we want to remove the oldest.
    // The oldest are at rank 0 in ZRANGE (ascending).
    // So we assume we have K items. We want to remove items from 0 to K-801.
    // Or we can simple define: REMOVE items from rank 0 to -801.
    // Let's check logic:
    // If we want to keep last 800.
    // ZREMRANGEBYRANK key 0 -(800 + 1) ?

    const MAX_TIMELINE_SIZE = 800;
    const count = await this.redisClient.zcard(key);
    if (count > MAX_TIMELINE_SIZE) {
      // Remove the oldest (lowest scores).
      // ZREMRANGEBYRANK removes elements with rank from start to stop.
      // Items are ordered by score low to high by default.
      // So rank 0 is the oldest.
      // We want to remove from 0 up to (count - MAX_TIMELINE_SIZE - 1).
      await this.redisClient.zremrangebyrank(
        key,
        0,
        count - MAX_TIMELINE_SIZE - 1,
      );
    }
  }
}
