import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { JwtPayload } from '../interfaces/jwt-payload.interface';
import type { RequestWithTenant } from '../interfaces/request-with-tenant.interface';

/**
 * Enforces profile-based access control using @Roles() decorator metadata.
 * Must be used AFTER JwtAuthGuard (requires req.user to be set).
 *
 * @example
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Roles('director')
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<
      JwtPayload['profile'][]
    >(ROLES_KEY, [context.getHandler(), context.getClass()]);

    // No @Roles() decorator = route is accessible to any authenticated user
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest<RequestWithTenant>();
    const { profile } = req.user;

    if (!requiredRoles.includes(profile)) {
      throw new ForbiddenException(
        `Access denied. Required profiles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
