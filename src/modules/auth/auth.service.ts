import { Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';

import {
  access_token_private_key,
  access_token_public_key,
  refresh_token_private_key,
} from 'src/private/jwt.constraint';
import { User } from '@/entities/user.entity';
import { compareText, hashText } from '@/shared/utils/auth-helpers';
import { CookieHelper } from '@/shared/utils/cookie.helper';

import { SignupDto } from './dto/signup.dto';
import { TokenPayload } from './types/token-payload.type';
import { AuthResponse } from './types/auth-response.type';
import { Services } from '@/shared/constants/services.enum';
import { IUserService } from '@/modules/user/users';

@Injectable()
export class AuthService {
  constructor(
    @Inject(Services.USERS) private readonly userService: IUserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async signup(signupDto: SignupDto, res: Response): Promise<AuthResponse> {
    const existedUser = await this.userService.findUser({
      email: signupDto.email,
    });
    if (existedUser) throw new UnauthorizedException('User already exists');

    const user = await this.userService.createUser({
      ...signupDto,
      password: hashText(signupDto.password),
    });

    const tokens = await this.generateTokens(user);
    CookieHelper.setAuthCookies(res, user, tokens);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
      },
    };
  }

  async login(user: User, res: Response): Promise<AuthResponse> {
    const tokens = await this.generateTokens(user);
    CookieHelper.setAuthCookies(res, user, tokens);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
      },
    };
  }

  async refreshToken(user: User, res: Response): Promise<AuthResponse> {
    const tokens = await this.generateTokens(user);
    CookieHelper.setAuthCookies(res, user, tokens);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
      },
    };
  }

  async logout(user: User, res: Response): Promise<void> {
    await this.userService.deleteRefreshToken(user.id);
    CookieHelper.clearAuthCookies(res);
  }

  async getUserIfRefreshTokenMatched(
    userId: string,
    refreshToken: string,
  ): Promise<User> {
    const user = await this.userService.findUser({
      id: userId,
    });
    if (!user) throw new UnauthorizedException();
    if (!compareText(refreshToken, user.refreshToken))
      throw new UnauthorizedException();

    return user;
  }

  async validateUser(email: string, password: string): Promise<User> {
    const existedUser = await this.userService.findUser({
      email,
    });
    if (!existedUser)
      throw new UnauthorizedException('Invalid email or password');

    if (!existedUser || !compareText(password, existedUser.password))
      throw new UnauthorizedException('Invalid email or password');

    return existedUser;
  }

  async findUser(params: { id: string }): Promise<User> {
    return await this.userService.findUser({ id: params.id });
  }

  async generateTokens(user: User): Promise<any> {
    const accessToken = this.generateAccessToken({
      id: user.id,
      email: user.email,
    });
    const refreshToken = this.generateRefreshToken({
      id: user.id,
      email: user.email,
    });

    await this.userService.saveRefreshToken(hashText(refreshToken), user.id);

    return {
      accessToken,
      refreshToken,
    };
  }

  async verifyAccessToken(token: string): Promise<TokenPayload> {
    return await this.jwtService.verify(token, {
      algorithms: ['RS256'],
      publicKey: access_token_public_key,
    });
  }

  generateAccessToken(payload: TokenPayload) {
    return this.jwtService.sign(payload, {
      algorithm: 'RS256',
      privateKey: access_token_private_key,
      expiresIn: `${this.configService.get<string>(
        'JWT_ACCESS_TOKEN_EXPIRES_IN',
      )}s`,
    });
  }

  generateRefreshToken(payload: TokenPayload) {
    return this.jwtService.sign(payload, {
      algorithm: 'RS256',
      privateKey: refresh_token_private_key,
      expiresIn: `${this.configService.get<string>(
        'JWT_REFRESH_TOKEN_EXPIRES_IN',
      )}s`,
    });
  }
}
