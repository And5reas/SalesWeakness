import type { Request } from 'express';
import type { JwtPayload } from './jwt-payload.interface';
export interface RequestWithTenant extends Request {
    tenantId: number;
    user: JwtPayload;
}
