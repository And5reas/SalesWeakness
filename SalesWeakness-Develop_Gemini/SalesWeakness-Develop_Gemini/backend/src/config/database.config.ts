import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export default registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    database: process.env.DB_NAME ?? 'salesweakness',
    username: process.env.DB_USER ?? 'salesweakness',
    password: process.env.DB_PASSWORD ?? 'salesweakness',
    // Entities are auto-loaded via TypeOrmModule.forFeature() in each module
    autoLoadEntities: true,
    // NEVER true in production — use migrations instead
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    // Production SSL
    ssl:
      process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
    extra: {
      application_name: 'salesweakness-api',
      // Connection pool sizing
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    },
  }),
);
