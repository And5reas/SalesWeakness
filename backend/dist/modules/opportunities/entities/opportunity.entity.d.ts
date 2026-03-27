export declare class Opportunity {
    id: number;
    tenantId: number;
    leadId: number;
    stageId: number;
    assignedUserId: number | null;
    value: number | null;
    status: string;
    lostReason: string | null;
    expectedCloseDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
