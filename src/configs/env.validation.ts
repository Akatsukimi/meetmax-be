import { plainToClass } from 'class-transformer';
import { IsString, IsNumber, IsEnum, validateSync } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsNumber()
  PORT: number;

  @IsString()
  DB_TYPE: string;

  @IsString()
  DB_HOST: string;

  @IsNumber()
  DB_PORT: number;

  @IsString()
  DB_USERNAME: string;

  @IsString()
  DB_PASSWORD: string;

  @IsString()
  DB_NAME: string;

  @IsString()
  REDIS_HOST: string;

  @IsNumber()
  REDIS_PORT: number;

  @IsString()
  RABBITMQ_URI: string;

  @IsString()
  JWT_ACCESS_TOKEN_SECRET: string;

  @IsNumber()
  JWT_ACCESS_TOKEN_EXPIRES_IN: number;

  @IsString()
  JWT_REFRESH_TOKEN_SECRET: string;

  @IsNumber()
  JWT_REFRESH_TOKEN_EXPIRES_IN: number;

  @IsString()
  AWS_S3_BUCKET: string;

  @IsString()
  AWS_S3_REGION: string;

  @IsString()
  AWS_S3_ACCESS_KEY_ID: string;

  @IsString()
  AWS_S3_SECRET_ACCESS_KEY: string;

  @IsString()
  CLOUDFRONT_URL: string;

  @IsString()
  CLOUDFRONT_KEY_PAIR_ID: string;

  @IsString()
  CLOUDFRONT_PRIVATE_KEY: string;

  @IsString()
  CORS_ORIGIN: string;

  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(
      `Environment validation failed:\n${errors.map((e) => Object.values(e.constraints || {}).join(', ')).join('\n')}`,
    );
  }

  return validatedConfig;
}
