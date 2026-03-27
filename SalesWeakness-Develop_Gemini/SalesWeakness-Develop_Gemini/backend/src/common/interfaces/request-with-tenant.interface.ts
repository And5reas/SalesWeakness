import type { Request } from 'express';
import type { JwtPayload } from './jwt-payload.interface';

export interface RequestWithTenant extends Request {
  /** Resolved tenant ID from the validated JWT */
  tenantId: number;
  /** Full decoded JWT payload attached by Passport */
  user: JwtPayload;
}
