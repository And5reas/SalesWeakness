import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import type { RequestWithTenant } from '../interfaces/request-with-tenant.interface';

/**
 * Extracts tenant_id from the validated JWT payload and attaches it to
 * `request.tenantId`. This value is later used by TypeORM subscribers or
 * raw query helpers to inject `SET LOCAL app.current_tenant_id = ?` before
 * each query, enabling PostgreSQL RLS to enforce tenant isolation.
 *
 * IMPORTANT: This interceptor runs AFTER Passport populates req.user.
 * Always combine with JwtAuthGuard.
 */
@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<RequestWithTenant>();

    if (req.user?.tenant_id) {
      req.tenantId = req.user.tenant_id;
    }

    return next.handle();
  }
}
