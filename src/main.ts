import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { Transport } from '@nestjs/microservices';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService: ConfigService = app.get<ConfigService>(ConfigService);
  const port = +configService.get('config.port');

  app.use(cookieParser());
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.enableCors({
    origin:
      configService.get<string>('config.cors.origin') ||
      'http://localhost:3000',
    credentials: true,
  });

  // Connect RabbitMQ Microservice
  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [
        configService.get<string>('config.rabbitmq.uri') ||
          'amqp://localhost:5672',
      ],
      queue: 'timeline_queue',
      queueOptions: {
        durable: false,
      },
    },
  });

  // Start both Microservices and HTTP Server
  await app.startAllMicroservices();
  await app.listen(port);
}
bootstrap();
