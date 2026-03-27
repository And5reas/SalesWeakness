"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const helmet_1 = __importDefault(require("helmet"));
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const tenant_context_interceptor_1 = require("./common/interceptors/tenant-context.interceptor");
const swagger_config_js_1 = require("./swagger.config.js");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    app.use((0, helmet_1.default)());
    app.enableCors();
    app.setGlobalPrefix('v1');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    app.useGlobalInterceptors(new tenant_context_interceptor_1.TenantContextInterceptor());
    (0, swagger_config_js_1.setupSwagger)(app);
    const port = configService.get('app.port') ?? 3000;
    await app.listen(port);
    console.log(`Application is running on: http://localhost:${port}/v1`);
    console.log(`Swagger docs at: http://localhost:${port}/api/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map