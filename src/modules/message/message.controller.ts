import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  UseInterceptors,
} from '@nestjs/common';

import { User } from '@/entities/user.entity';
import { ROUTES } from '@/shared/constants/routes.enum';
import { AuthUser } from '@/shared/decorators/auth-user.decorator';
import { CreateMessageDto } from './dto/create-message.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EditMessageDto } from '@/modules/message/dto/edit-message.dto';
import { Services } from '@/shared/constants/services.enum';
import { IMessageService } from '@/modules/message/messages';

@UseInterceptors(ClassSerializerInterceptor)
@Controller(ROUTES.MESSAGES)
export class MessageController {
  constructor(
    @Inject(Services.MESSAGES) private readonly messageService: IMessageService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Post()
  async createMessage(
    @AuthUser() user: User,
    @Param('conversationId') conversationId: string,
    @Body() { content, attachments, parentMessageId }: CreateMessageDto,
  ): Promise<void> {
    const response = await this.messageService.createMessage({
      user,
      content,
      conversationId,
      parentMessageId,
      attachments,
    });
    this.eventEmitter.emit('message.create', response);
    return;
  }

  @Get()
  async getMessages(
    @AuthUser() user: User,
    @Param('conversationId') conversationId: string,
  ): Promise<any> {
    return {
      conversationId,
      messages: await this.messageService.getMessages(user, conversationId),
    };
  }

  @Patch(':messageId')
  async editMessage(
    @AuthUser() { id: userId }: User,
    @Param('conversationId') conversationId: string,
    @Param('messageId') messageId: string,
    @Body() { content }: EditMessageDto,
  ) {
    const params = { userId, content, conversationId, messageId };
    const message = await this.messageService.editMessage(params);
    this.eventEmitter.emit('message.update', message);
    return message;
  }

  @Delete(':messageId')
  async deleteMessage(
    @AuthUser() user: User,
    @Param('conversationId') conversationId: string,
    @Param('messageId') messageId: string,
  ): Promise<any> {
    const params = { userId: user.id, conversationId, messageId };
    await this.messageService.deleteMessage(params);
    this.eventEmitter.emit('message.delete', params);
    return { conversationId, messageId };
  }
}
