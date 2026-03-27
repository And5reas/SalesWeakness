import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import type { RedisClientOptions } from 'redis';
import * as redisStore from 'cache-manager-ioredis';

// Custom Configs
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';

// Feature Modules
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { LeadsModule } from './modules/leads/leads.module';
import { OpportunitiesModule } from './modules/opportunities/opportunities.module';
import { AuditModule } from './modules/audit/audit.module';

@Module({
  imports: [
    // Global Config
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, redisConfig],
    }),

    // Database (PostgreSQL)
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => config.get('database')!,
    }),

    // Cache (Redis)
    CacheModule.registerAsync<RedisClientOptions>({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisCfg = config.get('redis')!;
        return {
          store: redisStore,
          host: redisCfg.host,
          port: redisCfg.port,
          password: redisCfg.password,
          ttl: redisCfg.ttlSeconds,
        };
      },
    }),

    // Domains
    AuthModule,
    TenantsModule,
    LeadsModule,
    OpportunitiesModule,
    AuditModule,
  ],
})
export class AppModule { }
