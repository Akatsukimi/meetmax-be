import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayDisconnect,
  OnGatewayConnection,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Logger, Inject } from '@nestjs/common';
import { SocketAuthMiddleware } from '@/modules/auth/ws.mw';
import { AuthenticatedSocket } from '@/modules/events/types';
import { GatewaySessionManager } from '@/modules/events/gateway-session-manager';
import { OnEvent } from '@nestjs/event-emitter';
import { CreateMessageResponse } from '@/modules/message/dto/message-response.dto';
import { Conversation } from '@/entities/conversation.entity';
import { Message } from '@/entities/message.entity';
import { Services } from '@/shared/constants/services.enum';
import { IConversationsService } from '@/modules/conversation/conversations';
import { IAuthService } from '@/modules/auth/auth';
import { CreateGroupMessageResponse } from '@/modules/group/types/create-group-message-res.type';
import { Group } from '@/entities/group.entity';
import { AddGroupUserResponse } from '@/modules/group/types/add-group-user-res.type';
import { LoggerService } from '@/shared/utils/logger.service';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
  pingInterval: 10000,
  pingTimeout: 15000,
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    @Inject(Services.AUTH)
    private readonly authService: IAuthService,
    private readonly sessions: GatewaySessionManager,
    @Inject(Services.CONVERSATIONS)
    private readonly conversationService: IConversationsService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('EventsGateway');
  }

  @WebSocketServer()
  server: Server;

  afterInit(server: AuthenticatedSocket) {
    server.use(SocketAuthMiddleware(this.authService) as any);
  }

  handleConnection(socket: AuthenticatedSocket): any {
    Logger.log('user connected in socket', JSON.stringify(socket.user));
    Logger.log('handleConnection');
    this.sessions.setUserSocket(socket.user.id, socket);
  }

  handleDisconnect(socket: AuthenticatedSocket): any {
    Logger.log('user disconnected in socket', JSON.stringify(socket.user));
    Logger.log('handleDisconnect');
    this.sessions.removeUserSocket(socket.user.id);
  }

  @SubscribeMessage('onConversationJoin')
  onConversationJoin(
    @MessageBody() data: any,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    Logger.log(
      `${client.user?.id} joined a Conversation of ID: ${data.conversationId}`,
    );
    client.join(`conversation-${data.conversationId}`);
    Logger.log(JSON.stringify(client.rooms));
    client.to(`conversation-${data.conversationId}`).emit('userJoin');
  }

  @SubscribeMessage('onConversationLeave')
  onConversationLeave(
    @MessageBody() data: any,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    Logger.log('onConversationLeave');
    client.leave(`conversation-${data.conversationId}`);
    Logger.log(JSON.stringify(client.rooms));
    client.to(`conversation-${data.conversationId}`).emit('userLeave');
  }

  @SubscribeMessage('onTypingStart')
  onTypingStart(
    @MessageBody() data: any,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    Logger.log('onTypingStart');
    Logger.log(data.conversationId);
    Logger.log(data.groupId);
    Logger.log(JSON.stringify(client.rooms));
    if (data.groupId) {
      client.to(`group-${data.groupId}`).emit('onTypingStart', {
        user: client.user,
        groupId: data.groupId,
      });
    } else {
      client.to(`conversation-${data.conversationId}`).emit('onTypingStart', {
        user: client.user,
        conversationId: data.conversationId,
      });
    }
  }

  @SubscribeMessage('onTypingStop')
  onTypingStop(
    @MessageBody() data: any,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    Logger.log('onTypingStop');
    Logger.log(data.conversationId);
    Logger.log(data.groupId);
    Logger.log(JSON.stringify(client.rooms));
    if (data.groupId) {
      client.to(`group-${data.groupId}`).emit('onTypingStop', {
        user: client.user,
        groupId: data.groupId,
      });
    } else {
      client.to(`conversation-${data.conversationId}`).emit('onTypingStop', {
        user: client.user,
        conversationId: data.conversationId,
      });
    }
  }

  @OnEvent('message.create')
  handleMessageCreateEvent(payload: CreateMessageResponse) {
    const usersInSocket = this.sessions.getSockets();
    const userIds = Array.from(usersInSocket.keys());
    Logger.log('message.create event', JSON.stringify(userIds));
    const { messages, conversation } = payload;

    const authorSocket = this.sessions.getUserSocket(messages[0].author.id);
    const recipientSocket =
      messages[0].author.id === conversation.creator.id
        ? this.sessions.getUserSocket(conversation.recipient.id)
        : this.sessions.getUserSocket(conversation.creator.id);

    if (authorSocket) authorSocket.emit('onMessage', payload);
    if (recipientSocket) recipientSocket.emit('onMessage', payload);
  }

  @OnEvent('message.update')
  async handleMessageUpdate(message: Message) {
    const {
      author,
      conversation: { creator, recipient },
    } = message;
    Logger.log(message);
    const recipientSocket =
      author.id === creator.id
        ? this.sessions.getUserSocket(recipient.id)
        : this.sessions.getUserSocket(creator.id);
    if (recipientSocket) recipientSocket.emit('onMessageUpdate', message);
  }

  @OnEvent('message.delete')
  async handleMessageDelete(payload: {
    userId: string;
    messageId: string;
    conversationId: string;
  }) {
    Logger.log('message.delete');
    const conversation = await this.conversationService.findConversationById(
      payload.conversationId,
    );
    if (!conversation) return;
    const { creator, recipient } = conversation;
    const recipientSocket =
      creator.id === payload.userId
        ? this.sessions.getUserSocket(recipient.id)
        : this.sessions.getUserSocket(creator.id);
    if (recipientSocket) recipientSocket.emit('onMessageDelete', payload);
  }

  @OnEvent('conversation.create')
  handleConversationCreateEvent(payload: Conversation) {
    Logger.log('conversation.create');
    const creatorSocket = this.sessions.getUserSocket(payload.creator.id);
    const recipientSocket = this.sessions.getUserSocket(payload.recipient.id);

    if (creatorSocket) creatorSocket.emit('onConversation', payload);
    if (recipientSocket) recipientSocket.emit('onConversation', payload);
  }

  @OnEvent('group.create')
  handleGroupCreate(payload: Group) {
    Logger.log('group.create event');
    payload.users.forEach((user) => {
      const socket = this.sessions.getUserSocket(user.id);
      if (socket) {
        socket.emit('onGroupCreate', payload);
      }
    });
  }

  @SubscribeMessage('onGroupJoin')
  onGroupJoin(
    @MessageBody() data: any,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    Logger.log('onGroupJoin');
    client.join(`group-${data.groupId}`);
    client.to(`group-${data.groupId}`).emit('userGroupJoin');
  }

  @SubscribeMessage('onGroupLeave')
  onGroupLeave(
    @MessageBody() data: any,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    Logger.log('onGroupLeave');
    client.leave(`group-${data.groupId}`);
    client.to(`group-${data.groupId}`).emit('userGroupLeave');
  }

  @OnEvent('group.message.create')
  async handleGroupMessageCreate(payload: CreateGroupMessageResponse) {
    Logger.log('group.message.create');
    const { id } = payload.group;
    this.server.to(`group-${id}`).emit('onGroupMessage', payload);
  }

  @OnEvent('group.message.delete')
  async handleGroupMessageDelete(payload: CreateGroupMessageResponse) {
    Logger.log('group.message.create');
    this.logger.debug(`Received payload: ${JSON.stringify(payload)}`);
    const { id } = payload.group;
    this.server.to(`group-${id}`).emit('onGroupMessageDelete', payload);
  }

  @OnEvent('group.user.add')
  handleGroupUserAdd(payload: AddGroupUserResponse) {
    const recipientSocket = this.sessions.getUserSocket(payload.user.id);
    Logger.log('inside group.user.add');
    Logger.log(`group-${payload.group.id}`);
    this.server
      .to(`group-${payload.group.id}`)
      .emit('onGroupReceivedNewUser', payload);
    if (recipientSocket) {
      recipientSocket.emit('onGroupUserAdd', payload);
    }
  }

  @OnEvent('group.user.leave')
  handleGroupUserLeave(payload: { group: Group; userId: string }) {
    Logger.log('inside group.user.leave');
    const ROOM_NAME = `group-${payload.group.id}`;
    const { rooms } = this.server.sockets.adapter;
    const socketsInRoom = rooms.get(ROOM_NAME);
    const leftUserSocket = this.sessions.getUserSocket(payload.userId);
    /**
     * If socketsInRoom is undefined, this means that there is
     * no one connected to the room. So just emit the event for
     * the connected user if they are online.
     */
    Logger.log(socketsInRoom);
    Logger.log(leftUserSocket);
    if (leftUserSocket && socketsInRoom) {
      Logger.log('user is online, at least 1 person is in the room');
      if (socketsInRoom.has(leftUserSocket.id)) {
        Logger.log('User is in room... room set has socket id');
        return this.server
          .to(ROOM_NAME)
          .emit('onGroupParticipantLeft', payload);
      } else {
        Logger.log('User is not in room, but someone is there');
        leftUserSocket.emit('onGroupParticipantLeft', payload);
        this.server.to(ROOM_NAME).emit('onGroupParticipantLeft', payload);
        return;
      }
    }
    if (leftUserSocket && !socketsInRoom) {
      Logger.log('User is online but there are no sockets in the room');
      return leftUserSocket.emit('onGroupParticipantLeft', payload);
    }
  }
}
