import { Module, Global } from '@nestjs/common';
import { ConfigService, ConfigModule } from '@nestjs/config';
import Keyv from 'keyv';
import KeyvRedis from '@keyv/redis';
import Redis from 'ioredis';
import { CacheService } from './cache.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    CacheService,
    {
      provide: 'KEYV_INSTANCE',
      useFactory: (configService: ConfigService) => {
        // Redis URI on Local
        const redisUri = `redis://${configService.get<string>('config.redis.host')}:${configService.get<string>('config.redis.port')}`;

        // Redis URI on Cloud
        // const redisUri = `redis://${configService.get<string>('config.redis.username')}:${configService.get<string>('config.redis.password')}@${configService.get<string>('config.redis.host')}:${configService.get<string>('config.redis.port')}`;

        const keyvRedis = new KeyvRedis(redisUri);
        return new Keyv({ store: keyvRedis });
      },
      inject: [ConfigService],
    },
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) => {
        return new Redis({
          host: configService.get<string>('config.redis.host'),
          port: configService.get<number>('config.redis.port'),
          username: configService.get<string>('config.redis.username'),
          password: configService.get<string>('config.redis.password'),
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: ['KEYV_INSTANCE', CacheService, 'REDIS_CLIENT'],
})
export class CacheModule {}
