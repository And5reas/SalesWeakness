import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TenantContextInterceptor } from './common/interceptors/tenant-context.interceptor';
import { setupSwagger } from './swagger.config.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security
  app.use(helmet());
  app.enableCors();

  // Global Config
  app.setGlobalPrefix('v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global Exeption Filter & Interceptors
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TenantContextInterceptor());

  // Swagger Documentation
  setupSwagger(app);

  const port = configService.get<number>('app.port') ?? 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/v1`);
  console.log(`Swagger docs at: http://localhost:${port}/api/docs`);
}

bootstrap();
