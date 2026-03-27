export interface JwtPayload {
  /** User ID */
  sub: number;
  /** Tenant identifier */
  tenant_id: number;
  /** User profile: director | marketing_manager | sales_rep */
  profile: 'director' | 'marketing_manager' | 'sales_rep';
  /** Permission scopes, e.g. ['analytics:read', 'deals:write'] */
  scopes: string[];
  /** Token expiry (Unix timestamp) */
  exp: number;
}
