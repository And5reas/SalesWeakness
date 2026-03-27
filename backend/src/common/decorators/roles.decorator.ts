import { SetMetadata } from '@nestjs/common';
import type { JwtPayload } from '../interfaces/jwt-payload.interface';

export const ROLES_KEY = 'roles';

/**
 * Restricts a route to users with one of the given profiles.
 * Used in combination with RolesGuard.
 *
 * @example
 * @Roles('director', 'marketing_manager')
 * @Get('audit')
 */
export const Roles = (...roles: JwtPayload['profile'][]) =>
  SetMetadata(ROLES_KEY, roles);
