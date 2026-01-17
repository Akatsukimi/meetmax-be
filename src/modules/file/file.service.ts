import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { UploadFileDto, UploadFileResponseDto } from './dto/upload-file.dto';
import { ConfigService } from '@nestjs/config';
import { MessageAttachment } from '@/entities/message-attachment.entity';
import { GroupMessageAttachment } from '@/entities/group-message-attachment.entity';
import { PostAttachment } from '@/entities/post-attachment.entity';
import { AvatarAttachment } from '@/entities/avatar-attachment.entity';
import { FileType } from '@/shared/constants/file-type';
import { CoverPhotoAttachment } from '@/entities/cover-photo-attachment.entity';
import { LoggerService } from '@/shared/utils/logger.service';

@Injectable()
export class FileService {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(PostAttachment)
    private readonly postAttachmentRepository: Repository<PostAttachment>,
    @InjectRepository(MessageAttachment)
    private readonly messageAttachmentRepository: Repository<MessageAttachment>,
    @InjectRepository(GroupMessageAttachment)
    private readonly groupMessageAttachmentRepository: Repository<GroupMessageAttachment>,
    @InjectRepository(AvatarAttachment)
    private readonly avatarAttachmentRepository: Repository<AvatarAttachment>,
    @InjectRepository(CoverPhotoAttachment)
    private readonly coverPhotoAttachmentRepository: Repository<CoverPhotoAttachment>,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('FileService');
  }

  private readonly s3Client = new S3Client({
    region: this.configService.get('config.aws.s3.region'),
    credentials: {
      accessKeyId: this.configService.get('config.aws.s3.accessKeyId'),
      secretAccessKey: this.configService.get('config.aws.s3.secretAccessKey'),
    },
  });

  async uploadFiles(
    files: Express.Multer.File[],
    data: UploadFileDto,
  ): Promise<UploadFileResponseDto[]> {
    const uploadPromises = files.map((file) => this.upload(file, data));
    return Promise.all(uploadPromises);
  }

  async upload(
    file: Express.Multer.File,
    data: UploadFileDto,
  ): Promise<UploadFileResponseDto> {
    const { type } = data;
    const key = `${Date.now().toString()}-${file.originalname}`;

    // Upload file to S3
    const putCommand = new PutObjectCommand({
      Bucket: this.configService.get('config.aws.s3.bucket'),
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    try {
      await this.s3Client.send(putCommand);
    } catch (error) {
      this.logger.error('Error uploading file to S3', error.stack);
      throw new InternalServerErrorException('Failed to upload file');
    }

    let newFile;
    switch (type) {
      case FileType.MESSAGE:
        newFile = await this.messageAttachmentRepository.save({
          id: uuid(),
          name: file.originalname,
          key,
          url: `${this.configService.get('config.aws.cloudfront.url')}/${key}`,
          mimetype: file.mimetype,
        });
        break;
      case FileType.GROUP_MESSAGE:
        newFile = await this.groupMessageAttachmentRepository.save({
          id: uuid(),
          name: file.originalname,
          key,
          url: `${this.configService.get('config.aws.cloudfront.url')}/${key}`,
          mimetype: file.mimetype,
        });
        break;
      case FileType.POST:
        newFile = await this.postAttachmentRepository.save({
          id: uuid(),
          name: file.originalname,
          key,
          url: `${this.configService.get('config.aws.cloudfront.url')}/${key}`,
          mimetype: file.mimetype,
        });
        break;
      case FileType.AVATAR:
        newFile = await this.avatarAttachmentRepository.save({
          id: uuid(),
          name: file.originalname,
          key,
          url: `${this.configService.get('config.aws.cloudfront.url')}/${key}`,
          mimetype: file.mimetype,
        });
        break;
      case FileType.COVER_PHOTO:
        newFile = await this.coverPhotoAttachmentRepository.save({
          id: uuid(),
          name: file.originalname,
          key,
          url: `${this.configService.get('config.aws.cloudfront.url')}/${key}`,
          mimetype: file.mimetype,
        });
        break;
      default:
        throw new InternalServerErrorException('Invalid file type');
    }

    if (!newFile) {
      throw new InternalServerErrorException('Error saving file to database');
    }

    return {
      id: newFile.id,
      url: newFile.url,
      name: newFile.name,
      mimetype: newFile.mimetype,
    };
  }

  async deleteFileFromS3(key: string): Promise<void> {
    const deleteCommand = new DeleteObjectCommand({
      Bucket: this.configService.get('config.aws.s3.bucket'),
      Key: key,
    });

    try {
      await this.s3Client.send(deleteCommand);
    } catch (error) {
      this.logger.error('Error deleting file from S3', error.stack);
      throw new InternalServerErrorException('Error deleting file from S3');
    }
  }

  async cleanUpJunkFiles(): Promise<void> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const junkFiles = await this.postAttachmentRepository.find({
      where: { post: null, createdAt: LessThan(yesterday) },
    });

    for (const file of junkFiles) {
      try {
        await this.deleteFileFromS3(file.key);
        await this.postAttachmentRepository.remove(file);
      } catch (error) {
        this.logger.error(
          `Error cleaning up junk file ${file.key}`,
          error.stack,
        );
      }
    }
  }
}
