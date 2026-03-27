import { registerAs } from '@nestjs/config';

export interface RedisConfig {
  host: string;
  port: number;
  password: string | undefined;
  ttlSeconds: number;
}

export default registerAs(
  // TODO: Implementar Redis
  'redis',
  (): RedisConfig => ({
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    ttlSeconds: parseInt(process.env.CACHE_TTL_SECONDS ?? '300', 10),
  }),
);
