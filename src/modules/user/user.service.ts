import { Repository } from 'typeorm';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '@/entities/user.entity';
import { CreateUserParams } from './types/create-user.type';
import { FindUserParams } from './types/find-user-params.type';
import { FileService } from '../file/file.service';
import { FileType } from '@/shared/constants/file-type';
import { Profile } from '@/entities/profile.entity';
import {
  UserAvatarResponseDto,
  UserCoverPhotoResponseDto,
} from './dto/user-photo-response.dto';
import { UserProfileResponseDto } from './dto/user-profile-response.dto';
import { DtoHelper } from '@/shared/utils/dto-helper';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly fileService: FileService,
  ) {}

  async findAllUsers(): Promise<User[]> {
    return await this.userRepository.find();
  }

  async findUser(params: FindUserParams): Promise<User> {
    return await this.userRepository.findOne({
      where: [
        { id: params.id },
        { email: params.email },
        { username: params.username },
      ],
    });
  }

  async saveRefreshToken(token: string, userId: string): Promise<any> {
    return await this.userRepository.update(userId, { refreshToken: token });
  }

  async createUser(params: CreateUserParams): Promise<User> {
    const profile = new Profile();
    profile.gender = params.gender;

    const user = this.userRepository.create({
      email: params.email,
      username: params.username,
      password: params.password,
      profile,
    });

    return await this.userRepository.save(user);
  }

  async deleteRefreshToken(userId: string): Promise<any> {
    return await this.userRepository.update(userId, { refreshToken: null });
  }

  async uploadAvatar(
    userId: string,
    file: Express.Multer.File,
  ): Promise<UserAvatarResponseDto> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const fileResponse = await this.fileService.upload(file, {
      type: FileType.AVATAR,
    });

    user.avatar = fileResponse.url;
    await this.userRepository.save(user);

    return {
      avatar: user.avatar,
    };
  }

  async uploadCoverPhoto(
    userId: string,
    file: Express.Multer.File,
  ): Promise<UserCoverPhotoResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['profile'],
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const fileResponse = await this.fileService.upload(file, {
      type: FileType.COVER_PHOTO,
    });

    user.profile.coverPhoto = fileResponse.url;

    await this.userRepository.save(user);

    return {
      coverPhoto: user.profile.coverPhoto,
    };
  }

  async getUserProfile(userId: string): Promise<UserProfileResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['profile'],
    });

    if (!user) {
      throw new BadRequestException('User or profile not found');
    }

    const responseData = {
      username: user.username,
      avatar: user.avatar,
      ...user.profile,
    };

    return DtoHelper.mapToDto(UserProfileResponseDto, responseData);
  }
}
