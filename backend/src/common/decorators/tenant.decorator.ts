import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { RequestWithTenant } from '../interfaces/request-with-tenant.interface';

/**
 * Extracts the tenant_id from the request object.
 * The value is populated by TenantContextInterceptor after JWT validation.
 *
 * @example
 * findAll(@TenantId() tenantId: number) {}
 */
export const TenantId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): number => {
    const req = ctx.switchToHttp().getRequest<RequestWithTenant>();
    return req.tenantId;
  },
);
