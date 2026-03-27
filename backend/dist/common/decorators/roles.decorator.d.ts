import type { JwtPayload } from '../interfaces/jwt-payload.interface';
export declare const ROLES_KEY = "roles";
export declare const Roles: (...roles: JwtPayload["profile"][]) => import("@nestjs/common").CustomDecorator<string>;
