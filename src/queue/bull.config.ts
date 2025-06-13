import { ConfigService } from '@nestjs/config';
import { RedisOptions } from 'bullmq';

export const getRedisQConfig = (config: ConfigService): RedisOptions => ({
  host: config.get<string>('REDIS_HOST'),
  port: config.get<number>('REDIS_PORT'),
  password: config.get<string>('REDIS_PASSWORD') || undefined,
});
