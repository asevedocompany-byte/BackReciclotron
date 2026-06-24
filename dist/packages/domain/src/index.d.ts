import type { AdminUser, AudienceSegment, AutomationRule, Campaign, CampaignRecipient, CollectionPoint, EndUser, PartnerStore, PointsLedgerEntry } from "@reciclotron/contracts";
export interface AdminUserRepository {
    findByEmail(email: string): Promise<AdminUser | null>;
    findAll(): Promise<AdminUser[]>;
    updateLastLogin(userId: string, lastLoginAt: string): Promise<AdminUser | null>;
}
export interface EndUserRepository {
    findAll(): Promise<EndUser[]>;
    findById(id: string): Promise<EndUser | null>;
    findByIds(ids: number[]): Promise<EndUser[]>;
    update(user: EndUser): Promise<EndUser>;
}
export interface CollectionPointRepository {
    findAll(filters?: {
        search?: string;
        status?: boolean;
    }): Promise<CollectionPoint[]>;
    findById(id: string): Promise<CollectionPoint | null>;
    create(data: Omit<CollectionPoint, "id" | "createdAt" | "updatedAt">): Promise<CollectionPoint>;
    update(id: string, data: Partial<Omit<CollectionPoint, "id" | "createdAt" | "updatedAt">>): Promise<CollectionPoint | null>;
    delete(id: string): Promise<boolean>;
}
export interface PartnerStoreRepository {
    findAll(filters?: {
        search?: string;
        status?: boolean;
    }): Promise<PartnerStore[]>;
    findById(id: string): Promise<PartnerStore | null>;
    create(data: Omit<PartnerStore, "id" | "createdAt" | "updatedAt">): Promise<PartnerStore>;
    update(id: string, data: Partial<Omit<PartnerStore, "id" | "createdAt" | "updatedAt">>): Promise<PartnerStore | null>;
    delete(id: string): Promise<boolean>;
}
export interface PointsLedgerRepository {
    findAll(): Promise<PointsLedgerEntry[]>;
    create(data: Omit<PointsLedgerEntry, "id" | "createdAt" | "updatedAt">): Promise<PointsLedgerEntry>;
}
export interface CampaignRepository {
    findAll(): Promise<Campaign[]>;
    findById(id: string): Promise<Campaign | null>;
    create(data: Omit<Campaign, "id" | "createdAt" | "updatedAt">): Promise<Campaign>;
    update(campaign: Campaign): Promise<Campaign>;
}
export interface CampaignRecipientRepository {
    createMany(recipients: Omit<CampaignRecipient, "id">[]): Promise<void>;
    findByCampaign(campaignId: string): Promise<CampaignRecipient[]>;
}
export interface AudienceSegmentRepository {
    findAll(): Promise<AudienceSegment[]>;
    create(data: Omit<AudienceSegment, "id" | "createdAt" | "updatedAt">): Promise<AudienceSegment>;
}
export interface AutomationRuleRepository {
    findAll(): Promise<AutomationRule[]>;
    create(data: Omit<AutomationRule, "id" | "createdAt" | "updatedAt">): Promise<AutomationRule>;
    update(rule: AutomationRule): Promise<AutomationRule>;
}
export interface EmailProvider {
    sendCampaign(input: {
        subject?: string;
        message: string;
        recipients: string[];
    }): Promise<{
        providerMessageId: string;
        accepted: number;
    }>;
}
export interface SmsProvider {
    estimateCost(input: {
        recipients: string[];
        message: string;
    }): Promise<{
        recipients: number;
        estimatedCost: number;
    }>;
    sendCampaign(input: {
        message: string;
        recipients: string[];
    }): Promise<{
        providerMessageId: string;
        accepted: number;
    }>;
}
