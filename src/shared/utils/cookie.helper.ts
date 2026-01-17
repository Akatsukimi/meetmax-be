import { Response } from 'express';

export class CookieHelper {
  private static readonly COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
  };

  static setAuthCookies(
    res: Response,
    user: any,
    tokens: { accessToken: string; refreshToken: string },
  ): void {
    const userCookie = {
      id: user.id,
      email: user.email,
      username: user.username,
      avatar: user.avatar,
    };

    res.cookie('user', JSON.stringify(userCookie), this.COOKIE_OPTIONS);
    res.cookie('accessToken', tokens.accessToken, this.COOKIE_OPTIONS);
    res.cookie('refreshToken', tokens.refreshToken, this.COOKIE_OPTIONS);
  }

  static clearAuthCookies(res: Response): void {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.clearCookie('user');
  }
}
