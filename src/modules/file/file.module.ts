import { Module } from '@nestjs/common';
import { FileService } from './file.service';
import { FileController } from './file.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageAttachment } from '@/entities/message-attachment.entity';
import { GroupMessageAttachment } from '@/entities/group-message-attachment.entity';
import { PostAttachment } from '@/entities/post-attachment.entity';
import { AvatarAttachment } from '@/entities/avatar-attachment.entity';
import { CoverPhotoAttachment } from '@/entities/cover-photo-attachment.entity';
import { LoggerService } from '@/shared/utils/logger.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PostAttachment,
      MessageAttachment,
      GroupMessageAttachment,
      AvatarAttachment,
      CoverPhotoAttachment,
    ]),
  ],
  controllers: [FileController],
  providers: [FileService, LoggerService],
  exports: [FileService],
})
export class FileModule {}
