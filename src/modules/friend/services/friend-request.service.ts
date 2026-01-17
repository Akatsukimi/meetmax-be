import { Inject, Injectable } from '@nestjs/common';
import { IFriendRequestService } from '@/modules/friend/interfaces/friend-requests';
import { InjectRepository } from '@nestjs/typeorm';
import { Friend } from '@/entities/friend.entity';
import { Repository } from 'typeorm';
import { FriendRequest } from '@/entities/friend-request.entity';
import { Services } from '@/shared/constants/services.enum';
import { IFriendsService } from '@/modules/friend/interfaces/friends';
import { IUserService } from '@/modules/user/users';
import { FriendRequestParams } from '@/modules/friend/types/friend-req-params.type';
import { AcceptFriendResponse } from '@/modules/friend/types/accept-friend-res.type';
import { CancelFriendRequestParams } from '@/modules/friend/types/cancel-friend-req-params.type';
import { CreateFriendParams } from '@/modules/friend/types/create-friend-params.type';

@Injectable()
export class FriendRequestService implements IFriendRequestService {
  constructor(
    @InjectRepository(Friend)
    private readonly friendRepository: Repository<Friend>,
    @InjectRepository(FriendRequest)
    private readonly friendRequestRepository: Repository<FriendRequest>,
    @Inject(Services.USERS)
    private readonly userService: IUserService,
    @Inject(Services.FRIENDS_SERVICE)
    private readonly friendsService: IFriendsService,
  ) {}

  async accept(params: FriendRequestParams): Promise<AcceptFriendResponse> {
    const { id, userId } = params;
    const friendRequest = await this.friendRequestRepository.findOne({
      where: { id, receiver: { id: userId } },
      relations: ['sender', 'receiver'],
    });
    if (!friendRequest) return null;

    // Create friend relationship
    const friend = this.friendRepository.create({
      sender: friendRequest.sender,
      receiver: friendRequest.receiver,
    });
    await this.friendRepository.save(friend);

    // Update friend request status
    friendRequest.status = 'accepted';
    await this.friendRequestRepository.save(friendRequest);

    return { friend, friendRequest };
  }

  async cancel(params: CancelFriendRequestParams): Promise<FriendRequest> {
    const { id, userId } = params;
    const friendRequest = await this.friendRequestRepository.findOne({
      where: { id, sender: { id: userId } },
    });
    if (!friendRequest) return null;
    return this.friendRequestRepository.remove(friendRequest);
  }

  async create(params: CreateFriendParams) {
    const { user, username } = params;
    const receiver = await this.userService.findUser({ username });
    if (!receiver) return null;

    const friendRequest = this.friendRequestRepository.create({
      sender: user,
      receiver,
      status: 'pending',
    });
    return this.friendRequestRepository.save(friendRequest);
  }

  findById(id: string): Promise<FriendRequest> {
    return this.friendRequestRepository.findOne({
      where: { id },
      relations: ['sender', 'receiver', 'sender.profile', 'receiver.profile'],
    });
  }

  getFriendRequests(userId: string): Promise<FriendRequest[]> {
    const status = 'pending';
    return this.friendRequestRepository.find({
      where: [
        { sender: { id: userId }, status },
        { receiver: { id: userId }, status },
      ],
      relations: ['sender', 'receiver', 'receiver.profile', 'sender.profile'],
    });
  }

  async isPending(userOneId: string, userTwoId: string) {
    return this.friendRequestRepository.findOne({
      where: [
        {
          sender: { id: userOneId },
          receiver: { id: userTwoId },
          status: 'pending',
        },
        {
          sender: { id: userTwoId },
          receiver: { id: userOneId },
          status: 'pending',
        },
      ],
    });
  }

  async reject(params: CancelFriendRequestParams): Promise<FriendRequest> {
    const { id, userId } = params;
    const friendRequest = await this.friendRequestRepository.findOne({
      where: { id, receiver: { id: userId } },
    });
    if (!friendRequest) return null;

    friendRequest.status = 'rejected';
    return this.friendRequestRepository.save(friendRequest);
  }
}
