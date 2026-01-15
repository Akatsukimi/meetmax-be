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

  deleteFriend(params: DeleteFriendRequestParams) {
    console.log('🚀 ~ FriendService ~ deleteFriend ~ params:', params);
  }

  findFriendById(id: string): Promise<Friend> {
    console.log('🚀 ~ FriendService ~ findFriendById ~ id:', id);
    return Promise.resolve(undefined);
  }

  getFriends(id: string): Promise<Friend[]> {
    console.log('🚀 ~ FriendService ~ getFriends ~ id:', id);
    return Promise.resolve([]);
  }

  isFriends(userOneId: string, userTwoId: string): Promise<Friend | undefined> {
    console.log('🚀 ~ FriendService ~ isFriends ~ userTwoId:', userTwoId);
    console.log('🚀 ~ FriendService ~ isFriends ~ userOneId:', userOneId);
    return Promise.resolve(undefined);
  }
}
