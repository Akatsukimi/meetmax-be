import { registerAs } from '@nestjs/config';

export default registerAs('config', () => ({
  port: parseInt(process.env.PORT, 10) || 8000,

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },

  database: {
    type: process.env.DB_TYPE || 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    username: process.env.DB_USERNAME || 'chatapp_user',
    password: process.env.DB_PASSWORD || 'chatapp_password_123',
    database: process.env.DB_NAME || 'chatapp',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    username: process.env.REDIS_USERNAME || 'user',
    password: process.env.REDIS_PASSWORD || 'pass',
  },

  rabbitmq: {
    uri: process.env.RABBITMQ_URI || 'amqp://localhost:5672',
  },

  access_token: {
    secret: process.env.JWT_ACCESS_TOKEN_SECRET || 'defaultSecretKey',
    expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || '1800',
  },

  refresh_token: {
    secret: process.env.JWT_REFRESH_TOKEN_SECRET || 'defaultRefreshSecretKey',
    expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || '25200',
  },

  apiKey: process.env.API_KEY || 'your-api-key',

  aws: {
    s3: {
      bucket: process.env.AWS_S3_BUCKET || 'your-bucket',
      region: process.env.AWS_S3_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID || 'your-access-key-id',
      secretAccessKey:
        process.env.AWS_S3_SECRET_ACCESS_KEY || 'your-secret-access-key',
    },
    cloudfront: {
      url: process.env.CLOUDFRONT_URL || 'your-cloudfront-url',
      keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID || 'your-key-pair-id',
      privateKey: process.env.CLOUDFRONT_PRIVATE_KEY || 'your-private-key',
    },
  },
}));
