import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import type { JwtPayload } from '../interfaces/jwt-payload.interface';

function createMockContext(
  profile: JwtPayload['profile'] | undefined,
): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        user: profile !== undefined ? { profile } : undefined,
      }),
    }),
    getHandler: jest.fn(),
    getClass: jest.fn(),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access when no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const ctx = createMockContext('sales_rep');
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should allow access when roles list is empty', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);
    const ctx = createMockContext('sales_rep');
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should allow access when user has the required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['director']);
    const ctx = createMockContext('director');
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should allow access when user has one of the required roles', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['director', 'marketing_manager']);
    const ctx = createMockContext('marketing_manager');
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should throw ForbiddenException when user lacks the required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['director']);
    const ctx = createMockContext('sales_rep');
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('should include required profiles in the ForbiddenException message', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['director', 'marketing_manager']);
    const ctx = createMockContext('sales_rep');
    expect(() => guard.canActivate(ctx)).toThrow(/director.*marketing_manager/);
  });
});
