import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { TokenPayload } from '@/modules/auth/types/token-payload.type';
import * as cookie from 'cookie';
import { AuthenticatedSocket } from '@/modules/events/types';
import { IAuthService } from '@/modules/auth/auth';
import { Services } from '@/shared/constants/services.enum';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    @Inject(Services.AUTH)
    private readonly authService: IAuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'ws') {
      return true;
    }
    const client: AuthenticatedSocket = context.switchToWs().getClient();

    try {
      await WsJwtGuard.validateToken(client, this.authService);
      return true;
    } catch (err) {
      Logger.error('Token validation failed', err);
      return false;
    }
  }

  static async validateToken(
    client: AuthenticatedSocket,
    authService: IAuthService,
  ) {
    const cookies = client.handshake.headers.cookie;
    const parsedCookies = cookie.parse(cookies);
    const accessToken = parsedCookies['accessToken'];
    const payload: TokenPayload =
      await authService.verifyAccessToken(accessToken);
    client.user = await authService.findUser({ id: payload.id });
    return payload;
  }
}
