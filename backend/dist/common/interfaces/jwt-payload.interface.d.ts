export interface JwtPayload {
    sub: number;
    tenant_id: number;
    profile: 'director' | 'marketing_manager' | 'sales_rep';
    scopes: string[];
    exp: number;
}
