import type { AudienceSegment, AutomationRule, Campaign, CampaignRecipient, CollectionPoint, EndUser, PartnerStore, PointsLedgerEntry } from "@reciclotron/contracts";
import type { AdminUserRepository, AudienceSegmentRepository, AutomationRuleRepository, CampaignRecipientRepository, CampaignRepository, CollectionPointRepository, EndUserRepository, PartnerStoreRepository, PointsLedgerRepository } from "@reciclotron/domain";
export { prisma } from "./client.js";
declare class InMemoryAdminUserRepository implements AdminUserRepository {
    findByEmail(email: string): Promise<{
        email: string;
        createdAt: string;
        updatedAt: string;
        id: string;
        name: string;
        role: "super_admin" | "operator" | "analyst";
        passwordHash: string;
        lastLoginAt: string | null;
    } | null>;
    findAll(): Promise<{
        email: string;
        createdAt: string;
        updatedAt: string;
        id: string;
        name: string;
        role: "super_admin" | "operator" | "analyst";
        passwordHash: string;
        lastLoginAt: string | null;
    }[]>;
    updateLastLogin(userId: string, lastLoginAt: string): Promise<{
        email: string;
        createdAt: string;
        updatedAt: string;
        id: string;
        name: string;
        role: "super_admin" | "operator" | "analyst";
        passwordHash: string;
        lastLoginAt: string | null;
    } | null>;
}
declare class InMemoryEndUserRepository implements EndUserRepository {
    findAll(): Promise<{
        status: "active" | "inactive";
        email: string;
        createdAt: string;
        updatedAt: string;
        id: string;
        name: string;
        city: string;
        pointsBalance: number;
        phone: string | null;
    }[]>;
    findById(userId: string): Promise<{
        status: "active" | "inactive";
        email: string;
        createdAt: string;
        updatedAt: string;
        id: string;
        name: string;
        city: string;
        pointsBalance: number;
        phone: string | null;
    } | null>;
    findByIds(ids: number[]): Promise<{
        status: "active" | "inactive";
        email: string;
        createdAt: string;
        updatedAt: string;
        id: string;
        name: string;
        city: string;
        pointsBalance: number;
        phone: string | null;
    }[]>;
    update(user: EndUser): Promise<{
        status: "active" | "inactive";
        email: string;
        createdAt: string;
        updatedAt: string;
        id: string;
        name: string;
        city: string;
        pointsBalance: number;
        phone: string | null;
    }>;
}
declare class InMemoryCollectionPointRepository implements CollectionPointRepository {
    findAll(filters?: {
        search?: string;
        status?: boolean;
    }): Promise<{
        active: boolean;
        createdAt: string;
        updatedAt: string;
        id: string;
        name: string;
        city: string;
        description: string;
        address?: string | undefined;
    }[]>;
    findById(pointId: string): Promise<{
        active: boolean;
        createdAt: string;
        updatedAt: string;
        id: string;
        name: string;
        city: string;
        description: string;
        address?: string | undefined;
    } | null>;
    create(data: Omit<CollectionPoint, "id" | "createdAt" | "updatedAt">): Promise<{
        id: string;
        createdAt: string;
        updatedAt: string;
        active: boolean;
        name: string;
        city: string;
        description: string;
        address?: string | undefined;
    }>;
    update(pointId: string, data: Partial<Omit<CollectionPoint, "id" | "createdAt" | "updatedAt">>): Promise<{
        active: boolean;
        createdAt: string;
        updatedAt: string;
        id: string;
        name: string;
        city: string;
        description: string;
        address?: string | undefined;
    } | null>;
    delete(pointId: string): Promise<boolean>;
}
declare class InMemoryPartnerStoreRepository implements PartnerStoreRepository {
    findAll(filters?: {
        search?: string;
        status?: boolean;
    }): Promise<{
        active: boolean;
        createdAt: string;
        updatedAt: string;
        id: string;
        name: string;
        city: string;
        description: string;
        email?: string | null | undefined;
        address?: string | null | undefined;
        partnershipDetails?: string | undefined;
        cnpj?: string | null | undefined;
        state?: string | null | undefined;
        pinLoja?: string | null | undefined;
        categoryName?: string | null | undefined;
        categoria?: number | null | undefined;
        cStoreId?: number | null | undefined;
        logoUrl?: string | null | undefined;
    }[]>;
    findById(storeId: string): Promise<{
        active: boolean;
        createdAt: string;
        updatedAt: string;
        id: string;
        name: string;
        city: string;
        description: string;
        email?: string | null | undefined;
        address?: string | null | undefined;
        partnershipDetails?: string | undefined;
        cnpj?: string | null | undefined;
        state?: string | null | undefined;
        pinLoja?: string | null | undefined;
        categoryName?: string | null | undefined;
        categoria?: number | null | undefined;
        cStoreId?: number | null | undefined;
        logoUrl?: string | null | undefined;
    } | null>;
    create(data: Omit<PartnerStore, "id" | "createdAt" | "updatedAt">): Promise<{
        id: string;
        createdAt: string;
        updatedAt: string;
        active: boolean;
        email?: string | null | undefined;
        name: string;
        city: string;
        description: string;
        address?: string | null | undefined;
        partnershipDetails?: string | undefined;
        cnpj?: string | null | undefined;
        state?: string | null | undefined;
        pinLoja?: string | null | undefined;
        categoryName?: string | null | undefined;
        categoria?: number | null | undefined;
        cStoreId?: number | null | undefined;
        logoUrl?: string | null | undefined;
    }>;
    update(storeId: string, data: Partial<Omit<PartnerStore, "id" | "createdAt" | "updatedAt">>): Promise<{
        active: boolean;
        createdAt: string;
        updatedAt: string;
        id: string;
        name: string;
        city: string;
        description: string;
        email?: string | null | undefined;
        address?: string | null | undefined;
        partnershipDetails?: string | undefined;
        cnpj?: string | null | undefined;
        state?: string | null | undefined;
        pinLoja?: string | null | undefined;
        categoryName?: string | null | undefined;
        categoria?: number | null | undefined;
        cStoreId?: number | null | undefined;
        logoUrl?: string | null | undefined;
    } | null>;
    delete(storeId: string): Promise<boolean>;
}
declare class InMemoryPointsLedgerRepository implements PointsLedgerRepository {
    findAll(): Promise<{
        type: "credit" | "debit";
        createdAt: string;
        updatedAt: string;
        id: string;
        description: string;
        userId: string;
        points: number;
        source: string;
    }[]>;
    create(data: Omit<PointsLedgerEntry, "id" | "createdAt" | "updatedAt">): Promise<{
        id: string;
        createdAt: string;
        updatedAt: string;
        type: "credit" | "debit";
        description: string;
        userId: string;
        points: number;
        source: string;
    }>;
}
declare class PrismaAudienceSegmentRepository implements AudienceSegmentRepository {
    private mapRow;
    findAll(): Promise<AudienceSegment[]>;
    create(data: Omit<AudienceSegment, "id" | "createdAt" | "updatedAt">): Promise<AudienceSegment>;
}
declare class InMemoryAutomationRuleRepository implements AutomationRuleRepository {
    findAll(): Promise<{
        active: boolean;
        createdAt: string;
        updatedAt: string;
        id: string;
        name: string;
        channel: "email" | "sms";
        segmentId: string | null;
        trigger: "user_inactive" | "high_points_balance" | "manual_event";
        template: string;
    }[]>;
    create(data: Omit<AutomationRule, "id" | "createdAt" | "updatedAt">): Promise<{
        id: string;
        createdAt: string;
        updatedAt: string;
        active: boolean;
        name: string;
        channel: "email" | "sms";
        segmentId: string | null;
        trigger: "user_inactive" | "high_points_balance" | "manual_event";
        template: string;
    }>;
    update(rule: AutomationRule): Promise<{
        active: boolean;
        createdAt: string;
        updatedAt: string;
        id: string;
        name: string;
        channel: "email" | "sms";
        segmentId: string | null;
        trigger: "user_inactive" | "high_points_balance" | "manual_event";
        template: string;
    }>;
}
declare class PrismaCampaignRepository implements CampaignRepository {
    private mapRow;
    findAll(): Promise<Campaign[]>;
    findById(campaignId: string): Promise<Campaign | null>;
    create(data: Omit<Campaign, "id" | "createdAt" | "updatedAt">): Promise<Campaign>;
    update(campaign: Campaign): Promise<Campaign>;
}
declare class PrismaCampaignRecipientRepository implements CampaignRecipientRepository {
    createMany(recipients: Omit<CampaignRecipient, "id">[]): Promise<void>;
    findByCampaign(campaignId: string): Promise<CampaignRecipient[]>;
}
export declare class RepositoryRegistry {
    adminUsers: InMemoryAdminUserRepository;
    endUsers: InMemoryEndUserRepository;
    collectionPoints: InMemoryCollectionPointRepository;
    partnerStores: InMemoryPartnerStoreRepository;
    pointsLedger: InMemoryPointsLedgerRepository;
    audienceSegments: PrismaAudienceSegmentRepository;
    campaigns: PrismaCampaignRepository;
    campaignRecipients: PrismaCampaignRecipientRepository;
    automationRules: InMemoryAutomationRuleRepository;
}
export declare class LegacyDbAdapter {
    readonly mode = "stub";
    healthcheck(): Promise<{
        readonly status: "not_configured";
        readonly details: "Aguardando acesso ao banco legado do cliente.";
    }>;
}
