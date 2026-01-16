import { Controller } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { FollowService } from '../follow/follow.service';
import { TimelineService } from './timeline.service';

interface PostCreatedEvent {
  postId: string;
  authorId: string;
  timestamp: number;
}

@Controller()
export class TimelineWorker {
  constructor(
    private readonly followService: FollowService,
    private readonly timelineService: TimelineService,
  ) {}

  @EventPattern('post.created')
  async handlePostCreated(
    @Payload() data: PostCreatedEvent,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      const { postId, authorId, timestamp } = data;
      const BATCH_SIZE = 500;
      let offset = 0;
      let followerIds: string[] = [];

      // Process in batches
      do {
        followerIds = await this.followService.getFollowersBatch(
          authorId,
          offset,
          BATCH_SIZE,
        );

        // Push to each follower's timeline
        // TODO: Parallelism or Pipelining could be improved here using Redis Pipeline if moved to Service
        // For now, we iterate.
        const promises = followerIds.map((followerId) =>
          this.timelineService.pushPostToTimeline(
            followerId,
            postId,
            timestamp,
          ),
        );

        await Promise.all(promises);

        offset += BATCH_SIZE;
      } while (followerIds.length === BATCH_SIZE);

      // Acknowledge the message
      channel.ack(originalMsg);
    } catch (error) {
      console.error('Error processing post.created event:', error);
      // Rejection logic? channel.nack(originalMsg) or just log.
      // Usually we might want to retry.
      channel.ack(originalMsg); // Ack to avoid infinite loop for now if it's a code error.
    }
  }
}
