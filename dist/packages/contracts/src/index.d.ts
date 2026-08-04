import { z } from "zod";
export declare const roleSchema: z.ZodEnum<["super_admin", "operator", "analyst"]>;
export declare const statusSchema: z.ZodEnum<["active", "inactive"]>;
export declare const campaignChannelSchema: z.ZodEnum<["email", "sms"]>;
export declare const campaignStatusSchema: z.ZodEnum<["draft", "scheduled", "sent"]>;
export declare const ledgerTypeSchema: z.ZodEnum<["credit", "debit"]>;
export declare const ruleTriggerSchema: z.ZodEnum<["user_inactive", "high_points_balance", "manual_event"]>;
export declare const adminUserSchema: z.ZodObject<{
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
} & {
    id: z.ZodString;
    email: z.ZodString;
    name: z.ZodString;
    role: z.ZodEnum<["super_admin", "operator", "analyst"]>;
    passwordHash: z.ZodString;
    lastLoginAt: z.ZodDefault<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    email: string;
    createdAt: string;
    updatedAt: string;
    id: string;
    name: string;
    role: "super_admin" | "operator" | "analyst";
    passwordHash: string;
    lastLoginAt: string | null;
}, {
    email: string;
    createdAt: string;
    updatedAt: string;
    id: string;
    name: string;
    role: "super_admin" | "operator" | "analyst";
    passwordHash: string;
    lastLoginAt?: string | null | undefined;
}>;
export declare const endUserSchema: z.ZodObject<{
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
} & {
    id: z.ZodString;
    email: z.ZodString;
    name: z.ZodString;
    city: z.ZodString;
    status: z.ZodEnum<["active", "inactive"]>;
    pointsBalance: z.ZodNumber;
    phone: z.ZodDefault<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    status: "active" | "inactive";
    email: string;
    createdAt: string;
    updatedAt: string;
    id: string;
    name: string;
    city: string;
    pointsBalance: number;
    phone: string | null;
}, {
    status: "active" | "inactive";
    email: string;
    createdAt: string;
    updatedAt: string;
    id: string;
    name: string;
    city: string;
    pointsBalance: number;
    phone?: string | null | undefined;
}>;
export declare const collectionPointSchema: z.ZodObject<{
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
} & {
    id: z.ZodString;
    name: z.ZodString;
    city: z.ZodString;
    description: z.ZodString;
    address: z.ZodOptional<z.ZodString>;
    active: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    active: boolean;
    createdAt: string;
    updatedAt: string;
    id: string;
    name: string;
    city: string;
    description: string;
    address?: string | undefined;
}, {
    createdAt: string;
    updatedAt: string;
    id: string;
    name: string;
    city: string;
    description: string;
    active?: boolean | undefined;
    address?: string | undefined;
}>;
export declare const partnerStoreSchema: z.ZodObject<{
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
} & {
    id: z.ZodString;
    name: z.ZodString;
    city: z.ZodString;
    description: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    partnershipDetails: z.ZodOptional<z.ZodString>;
    active: z.ZodDefault<z.ZodBoolean>;
    cnpj: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    email: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    address: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    state: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    pinLoja: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    categoryName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    categoria: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    cStoreId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    logoUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
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
}, {
    createdAt: string;
    updatedAt: string;
    id: string;
    name: string;
    city: string;
    active?: boolean | undefined;
    email?: string | null | undefined;
    description?: string | undefined;
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
export declare const pointsLedgerEntrySchema: z.ZodObject<{
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
} & {
    id: z.ZodString;
    userId: z.ZodString;
    type: z.ZodEnum<["credit", "debit"]>;
    points: z.ZodNumber;
    description: z.ZodString;
    source: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "credit" | "debit";
    createdAt: string;
    updatedAt: string;
    id: string;
    description: string;
    userId: string;
    points: number;
    source: string;
}, {
    type: "credit" | "debit";
    createdAt: string;
    updatedAt: string;
    id: string;
    description: string;
    userId: string;
    points: number;
    source: string;
}>;
export declare const audienceSegmentSchema: z.ZodObject<{
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
} & {
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    city: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["active", "inactive"]>>;
    minimumPoints: z.ZodOptional<z.ZodNumber>;
    maximumPoints: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    createdAt: string;
    updatedAt: string;
    id: string;
    name: string;
    description: string;
    status?: "active" | "inactive" | undefined;
    city?: string | undefined;
    minimumPoints?: number | undefined;
    maximumPoints?: number | undefined;
}, {
    createdAt: string;
    updatedAt: string;
    id: string;
    name: string;
    description: string;
    status?: "active" | "inactive" | undefined;
    city?: string | undefined;
    minimumPoints?: number | undefined;
    maximumPoints?: number | undefined;
}>;
export declare const campaignSchema: z.ZodObject<{
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
} & {
    id: z.ZodString;
    name: z.ZodString;
    channel: z.ZodEnum<["email", "sms"]>;
    status: z.ZodEnum<["draft", "scheduled", "sent"]>;
    subject: z.ZodOptional<z.ZodString>;
    message: z.ZodString;
    attachments: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    segmentId: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    estimatedCost: z.ZodDefault<z.ZodNumber>;
    providerMessageId: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    sentAt: z.ZodDefault<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    message: string;
    status: "draft" | "scheduled" | "sent";
    createdAt: string;
    updatedAt: string;
    id: string;
    name: string;
    channel: "email" | "sms";
    attachments: string[];
    segmentId: string | null;
    estimatedCost: number;
    providerMessageId: string | null;
    sentAt: string | null;
    subject?: string | undefined;
}, {
    message: string;
    status: "draft" | "scheduled" | "sent";
    createdAt: string;
    updatedAt: string;
    id: string;
    name: string;
    channel: "email" | "sms";
    subject?: string | undefined;
    attachments?: string[] | undefined;
    segmentId?: string | null | undefined;
    estimatedCost?: number | undefined;
    providerMessageId?: string | null | undefined;
    sentAt?: string | null | undefined;
}>;
export declare const campaignRecipientSchema: z.ZodObject<{
    id: z.ZodString;
    campaignId: z.ZodString;
    legacyId: z.ZodNumber;
    email: z.ZodString;
    phone: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    recipientName: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    status: z.ZodEnum<["sent", "failed", "pending"]>;
    messageId: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    errorReason: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    sentAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: "sent" | "failed" | "pending";
    email: string;
    id: string;
    phone: string | null;
    sentAt: string;
    campaignId: string;
    legacyId: number;
    recipientName: string | null;
    messageId: string | null;
    errorReason: string | null;
}, {
    status: "sent" | "failed" | "pending";
    email: string;
    id: string;
    sentAt: string;
    campaignId: string;
    legacyId: number;
    phone?: string | null | undefined;
    recipientName?: string | null | undefined;
    messageId?: string | null | undefined;
    errorReason?: string | null | undefined;
}>;
export declare const automationRuleSchema: z.ZodObject<{
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
} & {
    id: z.ZodString;
    name: z.ZodString;
    trigger: z.ZodEnum<["user_inactive", "high_points_balance", "manual_event"]>;
    channel: z.ZodEnum<["email", "sms"]>;
    template: z.ZodString;
    active: z.ZodDefault<z.ZodBoolean>;
    segmentId: z.ZodDefault<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    active: boolean;
    createdAt: string;
    updatedAt: string;
    id: string;
    name: string;
    channel: "email" | "sms";
    segmentId: string | null;
    trigger: "user_inactive" | "high_points_balance" | "manual_event";
    template: string;
}, {
    createdAt: string;
    updatedAt: string;
    id: string;
    name: string;
    channel: "email" | "sms";
    trigger: "user_inactive" | "high_points_balance" | "manual_event";
    template: string;
    active?: boolean | undefined;
    segmentId?: string | null | undefined;
}>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const createCollectionPointSchema: z.ZodObject<Omit<{
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
} & {
    id: z.ZodString;
    name: z.ZodString;
    city: z.ZodString;
    description: z.ZodString;
    address: z.ZodOptional<z.ZodString>;
    active: z.ZodDefault<z.ZodBoolean>;
}, "createdAt" | "updatedAt" | "id">, "strip", z.ZodTypeAny, {
    active: boolean;
    name: string;
    city: string;
    description: string;
    address?: string | undefined;
}, {
    name: string;
    city: string;
    description: string;
    active?: boolean | undefined;
    address?: string | undefined;
}>;
export declare const updateCollectionPointSchema: z.ZodObject<{
    active: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    name: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    active?: boolean | undefined;
    name?: string | undefined;
    city?: string | undefined;
    description?: string | undefined;
    address?: string | undefined;
}, {
    active?: boolean | undefined;
    name?: string | undefined;
    city?: string | undefined;
    description?: string | undefined;
    address?: string | undefined;
}>;
export declare const createPartnerStoreSchema: z.ZodObject<Omit<{
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
} & {
    id: z.ZodString;
    name: z.ZodString;
    city: z.ZodString;
    description: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    partnershipDetails: z.ZodOptional<z.ZodString>;
    active: z.ZodDefault<z.ZodBoolean>;
    cnpj: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    email: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    address: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    state: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    pinLoja: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    categoryName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    categoria: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    cStoreId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    logoUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "createdAt" | "updatedAt" | "id">, "strip", z.ZodTypeAny, {
    active: boolean;
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
}, {
    name: string;
    city: string;
    active?: boolean | undefined;
    email?: string | null | undefined;
    description?: string | undefined;
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
export declare const updatePartnerStoreSchema: z.ZodObject<{
    active: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    email: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    name: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodString>>>;
    address: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    partnershipDetails: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    cnpj: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    state: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    pinLoja: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    categoryName: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    categoria: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodNumber>>>;
    cStoreId: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodNumber>>>;
    logoUrl: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
}, "strip", z.ZodTypeAny, {
    active?: boolean | undefined;
    email?: string | null | undefined;
    name?: string | undefined;
    city?: string | undefined;
    description?: string | undefined;
    address?: string | null | undefined;
    partnershipDetails?: string | undefined;
    cnpj?: string | null | undefined;
    state?: string | null | undefined;
    pinLoja?: string | null | undefined;
    categoryName?: string | null | undefined;
    categoria?: number | null | undefined;
    cStoreId?: number | null | undefined;
    logoUrl?: string | null | undefined;
}, {
    active?: boolean | undefined;
    email?: string | null | undefined;
    name?: string | undefined;
    city?: string | undefined;
    description?: string | undefined;
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
export declare const createLedgerEntrySchema: z.ZodObject<Omit<{
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
} & {
    id: z.ZodString;
    userId: z.ZodString;
    type: z.ZodEnum<["credit", "debit"]>;
    points: z.ZodNumber;
    description: z.ZodString;
    source: z.ZodString;
}, "createdAt" | "updatedAt" | "id">, "strip", z.ZodTypeAny, {
    type: "credit" | "debit";
    description: string;
    userId: string;
    points: number;
    source: string;
}, {
    type: "credit" | "debit";
    description: string;
    userId: string;
    points: number;
    source: string;
}>;
export declare const createCampaignSchema: z.ZodObject<Omit<{
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
} & {
    id: z.ZodString;
    name: z.ZodString;
    channel: z.ZodEnum<["email", "sms"]>;
    status: z.ZodEnum<["draft", "scheduled", "sent"]>;
    subject: z.ZodOptional<z.ZodString>;
    message: z.ZodString;
    attachments: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    segmentId: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    estimatedCost: z.ZodDefault<z.ZodNumber>;
    providerMessageId: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    sentAt: z.ZodDefault<z.ZodNullable<z.ZodString>>;
}, "status" | "createdAt" | "updatedAt" | "id" | "providerMessageId" | "sentAt"> & {
    status: z.ZodOptional<z.ZodEnum<["draft", "scheduled", "sent"]>>;
    recipientIds: z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodNumber]>, "many">>;
}, "strip", z.ZodTypeAny, {
    message: string;
    name: string;
    channel: "email" | "sms";
    attachments: string[];
    segmentId: string | null;
    estimatedCost: number;
    status?: "draft" | "scheduled" | "sent" | undefined;
    subject?: string | undefined;
    recipientIds?: (string | number)[] | undefined;
}, {
    message: string;
    name: string;
    channel: "email" | "sms";
    status?: "draft" | "scheduled" | "sent" | undefined;
    subject?: string | undefined;
    attachments?: string[] | undefined;
    segmentId?: string | null | undefined;
    estimatedCost?: number | undefined;
    recipientIds?: (string | number)[] | undefined;
}>;
export declare const createAudienceSegmentSchema: z.ZodObject<Omit<{
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
} & {
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    city: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["active", "inactive"]>>;
    minimumPoints: z.ZodOptional<z.ZodNumber>;
    maximumPoints: z.ZodOptional<z.ZodNumber>;
}, "createdAt" | "updatedAt" | "id">, "strip", z.ZodTypeAny, {
    name: string;
    description: string;
    status?: "active" | "inactive" | undefined;
    city?: string | undefined;
    minimumPoints?: number | undefined;
    maximumPoints?: number | undefined;
}, {
    name: string;
    description: string;
    status?: "active" | "inactive" | undefined;
    city?: string | undefined;
    minimumPoints?: number | undefined;
    maximumPoints?: number | undefined;
}>;
export declare const createAutomationRuleSchema: z.ZodObject<Omit<{
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
} & {
    id: z.ZodString;
    name: z.ZodString;
    trigger: z.ZodEnum<["user_inactive", "high_points_balance", "manual_event"]>;
    channel: z.ZodEnum<["email", "sms"]>;
    template: z.ZodString;
    active: z.ZodDefault<z.ZodBoolean>;
    segmentId: z.ZodDefault<z.ZodNullable<z.ZodString>>;
}, "createdAt" | "updatedAt" | "id">, "strip", z.ZodTypeAny, {
    active: boolean;
    name: string;
    channel: "email" | "sms";
    segmentId: string | null;
    trigger: "user_inactive" | "high_points_balance" | "manual_event";
    template: string;
}, {
    name: string;
    channel: "email" | "sms";
    trigger: "user_inactive" | "high_points_balance" | "manual_event";
    template: string;
    active?: boolean | undefined;
    segmentId?: string | null | undefined;
}>;
export type AdminUser = z.infer<typeof adminUserSchema>;
export type EndUser = z.infer<typeof endUserSchema>;
export type CollectionPoint = z.infer<typeof collectionPointSchema>;
export type PartnerStore = z.infer<typeof partnerStoreSchema>;
export type PointsLedgerEntry = z.infer<typeof pointsLedgerEntrySchema>;
export type Campaign = z.infer<typeof campaignSchema>;
export type CampaignRecipient = z.infer<typeof campaignRecipientSchema>;
export type AudienceSegment = z.infer<typeof audienceSegmentSchema>;
export type AutomationRule = z.infer<typeof automationRuleSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateCollectionPointInput = z.infer<typeof createCollectionPointSchema>;
export type UpdateCollectionPointInput = z.infer<typeof updateCollectionPointSchema>;
export type CreatePartnerStoreInput = z.infer<typeof createPartnerStoreSchema>;
export type UpdatePartnerStoreInput = z.infer<typeof updatePartnerStoreSchema>;
export type CreateLedgerEntryInput = z.infer<typeof createLedgerEntrySchema>;
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type CreateAudienceSegmentInput = z.infer<typeof createAudienceSegmentSchema>;
export type CreateAutomationRuleInput = z.infer<typeof createAutomationRuleSchema>;
