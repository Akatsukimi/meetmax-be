import { Controller, Delete, Get, Inject, Param } from '@nestjs/common';
import { ROUTES } from '@/shared/constants/routes.enum';
import { Services } from '@/shared/constants/services.enum';
import { IFriendsService } from '@/modules/friend/interfaces/friends';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuthUser } from '@/shared/decorators/auth-user.decorator';
import { User } from '@/entities/user.entity';

@Controller(ROUTES.FRIENDS)
export class FriendController {
  constructor(
    @Inject(Services.FRIENDS_SERVICE)
    private readonly friendsService: IFriendsService,
    private readonly event: EventEmitter2,
  ) {}

  @Get()
  getAllFriends(@AuthUser() user: User) {
    return this.friendsService.getFriends(user.id);
  }

  @Delete(':id/delete')
  async deleteFriend(
    @AuthUser() { id: userId }: User,
    @Param('id') id: string,
  ) {
    const friend = await this.friendsService.deleteFriend({ id, userId });
    // this.event.emit(ServerEvents.FRIEND_REMOVED, { friend, userId });
    return friend;
  }
}
