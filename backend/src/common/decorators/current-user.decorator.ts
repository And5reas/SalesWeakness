import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { JwtPayload } from '../interfaces/jwt-payload.interface';
import type { RequestWithTenant } from '../interfaces/request-with-tenant.interface';

/**
 * Extracts the full JWT payload from the request (attached by Passport JWT strategy).
 *
 * @example
 * getProfile(@CurrentUser() user: JwtPayload) {}
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const req = ctx.switchToHttp().getRequest<RequestWithTenant>();
    return req.user;
  },
);
