"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('database', () => ({
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    database: process.env.DB_NAME ?? 'salesweakness',
    username: process.env.DB_USER ?? 'salesweakness',
    password: process.env.DB_PASSWORD ?? 'salesweakness',
    autoLoadEntities: true,
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    ssl: process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
    extra: {
        application_name: 'salesweakness-api',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
    },
}));
//# sourceMappingURL=database.config.js.map