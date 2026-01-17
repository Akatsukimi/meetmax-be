import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { AuthModule } from '@/modules/auth/auth.module';
import { GatewaySessionManager } from '@/modules/events/gateway-session-manager';
import { ConversationModule } from '@/modules/conversation/conversation.module';
import { LoggerService } from '@/shared/utils/logger.service';

@Module({
  imports: [AuthModule, ConversationModule],
  providers: [EventsGateway, GatewaySessionManager, LoggerService],
  exports: [EventsGateway, GatewaySessionManager],
})
export class EventsModule {}
