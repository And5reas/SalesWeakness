export declare class Lead {
    id: number;
    tenantId: number;
    campaignId: number | null;
    firstName: string;
    lastName: string;
    email: string;
    source: string;
    isInactive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
