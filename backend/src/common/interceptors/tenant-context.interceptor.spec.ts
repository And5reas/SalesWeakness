import { ExecutionContext, CallHandler } from '@nestjs/common';
import { TenantContextInterceptor } from './tenant-context.interceptor';
import { of } from 'rxjs';
import type { RequestWithTenant } from '../interfaces/request-with-tenant.interface';
import type { JwtPayload } from '../interfaces/jwt-payload.interface';

function createMockContext(user: Partial<JwtPayload> | undefined): {
  ctx: ExecutionContext;
  req: Partial<RequestWithTenant>;
} {
  const req: Partial<RequestWithTenant> = { user: user as JwtPayload };
  const ctx = {
    switchToHttp: () => ({
      getRequest: () => req,
    }),
  } as unknown as ExecutionContext;
  return { ctx, req };
}

const mockCallHandler: CallHandler = {
  handle: () => of(null),
};

describe('TenantContextInterceptor', () => {
  let interceptor: TenantContextInterceptor;

  beforeEach(() => {
    interceptor = new TenantContextInterceptor();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should attach tenant_id to request when user has tenant_id', (done) => {
    const { ctx, req } = createMockContext({ tenant_id: 42 });

    interceptor.intercept(ctx, mockCallHandler).subscribe(() => {
      expect(req.tenantId).toBe(42);
      done();
    });
  });

  it('should not attach tenantId when user has no tenant_id', (done) => {
    const { ctx, req } = createMockContext({});

    interceptor.intercept(ctx, mockCallHandler).subscribe(() => {
      expect(req.tenantId).toBeUndefined();
      done();
    });
  });

  it('should not attach tenantId when user is undefined', (done) => {
    const { ctx, req } = createMockContext(undefined);

    interceptor.intercept(ctx, mockCallHandler).subscribe(() => {
      expect(req.tenantId).toBeUndefined();
      done();
    });
  });
});
