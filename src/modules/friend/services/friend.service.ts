import { Injectable } from '@nestjs/common';
import { IFriendsService } from '@/modules/friend/interfaces/friends';
import { InjectRepository } from '@nestjs/typeorm';
import { Friend } from '@/entities/friend.entity';
import { Repository } from 'typeorm';
import { DeleteFriendRequestParams } from '@/modules/friend/types/delete-friend-req-params.type';

@Injectable()
export class FriendService implements IFriendsService {
  constructor(
    @InjectRepository(Friend)
    private readonly friendsRepository: Repository<Friend>,
  ) {}

  async deleteFriend(params: DeleteFriendRequestParams) {
    const { id, userId } = params;
    const friend = await this.friendsRepository.findOne({
      where: [
        { id, sender: { id: userId } },
        { id, receiver: { id: userId } },
      ],
    });
    if (!friend) return null;
    return this.friendsRepository.remove(friend);
  }

  findFriendById(id: string): Promise<Friend> {
    return this.friendsRepository.findOne({
      where: { id },
      relations: ['sender', 'receiver'],
    });
  }

  getFriends(id: string): Promise<Friend[]> {
    return this.friendsRepository.find({
      where: [{ sender: { id } }, { receiver: { id } }],
      relations: ['sender', 'receiver', 'sender.profile', 'receiver.profile'],
    });
  }

  isFriends(userOneId: string, userTwoId: string): Promise<Friend | undefined> {
    return this.friendsRepository.findOne({
      where: [
        { sender: { id: userOneId }, receiver: { id: userTwoId } },
        { sender: { id: userTwoId }, receiver: { id: userOneId } },
      ],
    });
  }
}
