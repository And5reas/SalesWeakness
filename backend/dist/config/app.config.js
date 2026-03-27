"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('app', () => ({
    name: process.env.APP_NAME ?? 'SalesWeakness',
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: parseInt(process.env.PORT ?? '3000', 10),
    isProduction: process.env.NODE_ENV === 'production',
}));
//# sourceMappingURL=app.config.js.map