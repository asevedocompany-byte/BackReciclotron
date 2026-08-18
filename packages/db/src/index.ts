import crypto from "crypto";
import type { AdminUser, AudienceSegment, AutomationRule, Campaign, CampaignRecipient, CollectionPoint, EndUser, PartnerStore, PointsLedgerEntry } from "@reciclotron/contracts";
import type { AdminUserRepository, AudienceSegmentRepository, AutomationRuleRepository, CampaignRecipientRepository, CampaignRepository, CollectionPointRepository, EndUserRepository, PartnerStoreRepository, PointsLedgerRepository } from "@reciclotron/domain";
import { prisma } from "./client.js";
export { prisma } from "./client.js";

const now = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

const endUsers: EndUser[] = [
  { id: "user_1", email: "maria@example.com", name: "Maria", city: "São Paulo", status: "active", pointsBalance: 120, phone: "+5511999999999", lastMovementAt: null, createdAt: now(), updatedAt: now() },
  { id: "user_2", email: "joao@example.com", name: "João", city: "Campinas", status: "inactive", pointsBalance: 40, phone: "+5511988888888", lastMovementAt: null, createdAt: now(), updatedAt: now() }
];
const collectionPoints: CollectionPoint[] = [
  { id: "cp_seed_1", name: "EcoPonto Centro", city: "São Paulo", description: "Recebimento de eletrônicos leves.", address: "Rua das Flores, 120", active: true, createdAt: now(), updatedAt: now() },
  { id: "cp_seed_2", name: "Hub Zona Norte", city: "Guarulhos", description: "Triagem local com agendamento.", address: "Av. Paulista Norte, 455", active: true, createdAt: now(), updatedAt: now() }
];
const partnerStores: PartnerStore[] = [
  { id: "ps_seed_1", name: "Tech Verde", city: "São Paulo", description: "Aceita resgates com reciclopontos no balcão.", partnershipDetails: "1 cupom / 500 pts", active: true, createdAt: now(), updatedAt: now() },
  { id: "ps_seed_2", name: "Eco Troca Campinas", city: "Campinas", description: "Parceria local para campanhas sazonais.", partnershipDetails: "Descontos progressivos em acessórios", active: true, createdAt: now(), updatedAt: now() }
];
const ledgerEntries: PointsLedgerEntry[] = [];
const audienceSegments: AudienceSegment[] = [{ id: "95831e5e-63f5-4674-a026-c22822a9ff3a", name: "Ativos SP", description: "Usuários ativos em São Paulo", city: "São Paulo", status: "active", minimumPoints: 0, createdAt: now(), updatedAt: now() }];
const automationRules: AutomationRule[] = [{ id: "rule_inactive_email", name: "Reativação por inatividade", trigger: "user_inactive", channel: "email", template: "Sentimos sua falta!", active: true, segmentId: null, createdAt: now(), updatedAt: now() }];

// ── Repositórios In-Memory (módulos que não são campanhas) ──────────────────

class PrismaAdminUserRepository implements AdminUserRepository {
  private mapRow(row: { id: string; email: string; name: string; role: string; lastLoginAt: Date | null; createdAt: Date; updatedAt: Date }): AdminUser {
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role as AdminUser["role"],
      lastLoginAt: row.lastLoginAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString()
    };
  }

  async findById(id: string) {
    const row = await prisma.adminUser.findUnique({ where: { id } });
    return row ? this.mapRow(row) : null;
  }

  async findByEmail(email: string) {
    const row = await prisma.adminUser.findUnique({ where: { email } });
    return row ? this.mapRow(row) : null;
  }

  async findAll() {
    const rows = await prisma.adminUser.findMany({ orderBy: { createdAt: "asc" } });
    return rows.map((row) => this.mapRow(row));
  }

  async updateLastLogin(userId: string, lastLoginAt: string) {
    const row = await prisma.adminUser.update({ where: { id: userId }, data: { lastLoginAt: new Date(lastLoginAt) } });
    return this.mapRow(row);
  }
}
class InMemoryEndUserRepository implements EndUserRepository {
  async findAll() { return [...endUsers]; }
  async findById(userId: string) { return endUsers.find((item) => item.id === userId) ?? null; }
  async findByIds(ids: number[]) {
    return endUsers.filter((item) => {
      const numericId = Number.parseInt(String(item.id).replace(/\D+/g, ""), 10);
      return Number.isFinite(numericId) && ids.includes(numericId);
    });
  }
  async update(user: EndUser) { const index = endUsers.findIndex((item) => item.id === user.id); endUsers[index] = { ...user, updatedAt: now() }; return endUsers[index]; }
}
class InMemoryCollectionPointRepository implements CollectionPointRepository {
  async findAll(filters?: { search?: string; status?: boolean }) {
    let result = [...collectionPoints];
    if (filters?.search) {
      const query = filters.search.toLowerCase();
      result = result.filter((item) => item.name.toLowerCase().includes(query) || item.city.toLowerCase().includes(query) || item.description.toLowerCase().includes(query));
    }
    if (filters?.status !== undefined) {
      result = result.filter((item) => item.active === filters.status);
    }
    return result;
  }
  async findById(pointId: string) { return collectionPoints.find((item) => item.id === pointId) ?? null; }
  async create(data: Omit<CollectionPoint, "id" | "createdAt" | "updatedAt">) { const item = { ...data, id: id("cp"), createdAt: now(), updatedAt: now() }; collectionPoints.push(item); return item; }
  async update(pointId: string, data: Partial<Omit<CollectionPoint, "id" | "createdAt" | "updatedAt">>) { const index = collectionPoints.findIndex((item) => item.id === pointId); if (index === -1) return null; collectionPoints[index] = { ...collectionPoints[index], ...data, updatedAt: now() }; return collectionPoints[index]; }
  async delete(pointId: string) { const index = collectionPoints.findIndex((item) => item.id === pointId); if (index === -1) return false; collectionPoints.splice(index, 1); return true; }
}
class InMemoryPartnerStoreRepository implements PartnerStoreRepository {
  async findAll(filters?: { search?: string; status?: boolean }) {
    let result = [...partnerStores];
    if (filters?.search) {
      const query = filters.search.toLowerCase();
      result = result.filter((item) => item.name.toLowerCase().includes(query) || item.city.toLowerCase().includes(query) || item.description.toLowerCase().includes(query));
    }
    if (filters?.status !== undefined) {
      result = result.filter((item) => item.active === filters.status);
    }
    return result;
  }
  async findById(storeId: string) { return partnerStores.find((item) => item.id === storeId) ?? null; }
  async create(data: Omit<PartnerStore, "id" | "createdAt" | "updatedAt">) { const item = { ...data, id: id("ps"), createdAt: now(), updatedAt: now() }; partnerStores.push(item); return item; }
  async update(storeId: string, data: Partial<Omit<PartnerStore, "id" | "createdAt" | "updatedAt">>) { const index = partnerStores.findIndex((item) => item.id === storeId); if (index === -1) return null; partnerStores[index] = { ...partnerStores[index], ...data, updatedAt: now() }; return partnerStores[index]; }
  async delete(storeId: string) { const index = partnerStores.findIndex((item) => item.id === storeId); if (index === -1) return false; partnerStores.splice(index, 1); return true; }
}
class PrismaPointsLedgerRepository implements PointsLedgerRepository {
  private mapRow(r: {
    id: string;
    userId: string;
    type: string;
    points: number;
    description: string;
    source: string;
    createdAt: Date;
    updatedAt: Date;
  }): PointsLedgerEntry {
    return {
      id: r.id,
      userId: r.userId,
      type: r.type as PointsLedgerEntry["type"],
      points: r.points,
      description: r.description,
      source: r.source,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString()
    };
  }

  async findAll(filters?: { userId?: string }): Promise<PointsLedgerEntry[]> {
    const where = filters?.userId ? { userId: filters.userId } : {};
    let dbMapped: PointsLedgerEntry[] = [];
    try {
      const dbRows = await prisma.pointsLedgerEntry.findMany({
        where,
        orderBy: { createdAt: "desc" }
      });
      dbMapped = dbRows.map((r) => this.mapRow(r));
    } catch (err) {
      console.warn("[PrismaPointsLedgerRepository] findAll prisma query failed", err);
    }

    const memFiltered = filters?.userId
      ? ledgerEntries.filter((e) => e.userId === filters.userId)
      : ledgerEntries;

    const map = new Map<string, PointsLedgerEntry>();
    for (const item of [...dbMapped, ...memFiltered]) {
      map.set(item.id, item);
    }
    const combined = Array.from(map.values());
    combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return combined;
  }

  async findById(id: string): Promise<PointsLedgerEntry | null> {
    try {
      const row = await prisma.pointsLedgerEntry.findUnique({ where: { id } });
      if (row) return this.mapRow(row);
    } catch {
      // fallback
    }
    const mem = ledgerEntries.find((e) => e.id === id);
    return mem ?? null;
  }

  async create(data: Omit<PointsLedgerEntry, "id" | "createdAt" | "updatedAt"> & { createdAt?: string }): Promise<PointsLedgerEntry> {
    try {
      const row = await prisma.pointsLedgerEntry.create({
        data: {
          userId: data.userId,
          type: data.type,
          points: data.points,
          description: data.description,
          source: data.source,
          ...(data.createdAt ? { createdAt: new Date(data.createdAt) } : {})
        }
      });
      return this.mapRow(row);
    } catch (err) {
      console.warn("[PrismaPointsLedgerRepository] Prisma create failed, falling back to memory", err);
      const item: PointsLedgerEntry = {
        id: id("ple"),
        userId: data.userId,
        type: data.type,
        points: data.points,
        description: data.description,
        source: data.source,
        createdAt: data.createdAt ? new Date(data.createdAt).toISOString() : now(),
        updatedAt: now()
      };
      ledgerEntries.push(item);
      return item;
    }
  }

}
class PrismaAudienceSegmentRepository implements AudienceSegmentRepository {
  private mapRow(r: {
    id: string;
    name: string;
    description: string;
    city: string | null;
    status: string | null;
    minimumPoints: number | null;
    maximumPoints: number | null;
    createdAt: Date;
    updatedAt: Date;
  }): AudienceSegment {
    return {
      id: r.id,
      name: r.name,
      description: r.description,
      city: r.city ?? undefined,
      status: r.status as AudienceSegment["status"],
      minimumPoints: r.minimumPoints ?? undefined,
      maximumPoints: r.maximumPoints ?? undefined,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString()
    };
  }

  async findAll(): Promise<AudienceSegment[]> {
    console.info("[PrismaAudienceSegmentRepository] findAll called");
    let rows = await prisma.audienceSegment.findMany({ orderBy: { createdAt: "desc" } });
    if (rows.length === 0) {
      console.info("[PrismaAudienceSegmentRepository] seeding default segment");
      try {
        const defaultSeg = await prisma.audienceSegment.create({
          data: {
            id: "95831e5e-63f5-4674-a026-c22822a9ff3a",
            name: "Ativos SP",
            description: "Usuários ativos em São Paulo",
            city: "São Paulo",
            status: "active",
            minimumPoints: 0,
            maximumPoints: null
          }
        });
        rows = [defaultSeg];
      } catch (err) {
        console.warn("[PrismaAudienceSegmentRepository] seeding failed (might already exist)", err);
        rows = await prisma.audienceSegment.findMany({ orderBy: { createdAt: "desc" } });
      }
    }
    console.info("[PrismaAudienceSegmentRepository] findAll completed", { count: rows.length });
    return rows.map((r) => this.mapRow(r));
  }

  async create(data: Omit<AudienceSegment, "id" | "createdAt" | "updatedAt">): Promise<AudienceSegment> {
    console.info("[PrismaAudienceSegmentRepository] create called", { name: data.name });
    const r = await prisma.audienceSegment.create({
      data: {
        name: data.name,
        description: data.description,
        city: data.city ?? null,
        status: data.status ?? null,
        minimumPoints: data.minimumPoints ?? null,
        maximumPoints: data.maximumPoints ?? null
      }
    });
    console.info("[PrismaAudienceSegmentRepository] create completed", { id: r.id });
    return this.mapRow(r);
  }
}
class InMemoryAutomationRuleRepository implements AutomationRuleRepository {
  async findAll() { return [...automationRules]; }
  async create(data: Omit<AutomationRule, "id" | "createdAt" | "updatedAt">) { const item = { ...data, id: id("rule"), createdAt: now(), updatedAt: now() }; automationRules.push(item); return item; }
  async update(rule: AutomationRule) { const index = automationRules.findIndex((item) => item.id === rule.id); if (index === -1) throw new Error("Automation rule not found"); automationRules[index] = { ...rule, updatedAt: now() }; return automationRules[index]; }
}

// ── Repositórios Prisma (Supabase) — campanhas ─────────────────────────────

class PrismaCampaignRepository implements CampaignRepository {
  private mapRow(r: {
    id: string; name: string; channel: string; status: string;
    subject: string | null; message: string; attachments: string[];
    estimatedCost: { toNumber(): number } | number;
    providerMessageId: string | null; sentAt: Date | null;
    segmentId: string | null; createdAt: Date; updatedAt: Date;
  }): Campaign {
    return {
      id: r.id,
      name: r.name,
      channel: r.channel as Campaign["channel"],
      status: r.status as Campaign["status"],
      subject: r.subject ?? undefined,
      message: r.message,
      attachments: r.attachments ?? [],
      estimatedCost: typeof r.estimatedCost === "object" && "toNumber" in r.estimatedCost
        ? r.estimatedCost.toNumber()
        : Number(r.estimatedCost),
      providerMessageId: r.providerMessageId ?? null,
      sentAt: r.sentAt?.toISOString() ?? null,
      segmentId: r.segmentId ?? null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString()
    };
  }

  async findAll(): Promise<Campaign[]> {
    console.info("[PrismaCampaignRepository] findAll called");
    const rows = await prisma.campaign.findMany({ orderBy: { createdAt: "desc" } });
    console.info("[PrismaCampaignRepository] findAll completed", { count: rows.length });
    return rows.map((r) => this.mapRow(r));
  }

  async findById(campaignId: string): Promise<Campaign | null> {
    console.info("[PrismaCampaignRepository] findById called", { campaignId });
    const r = await prisma.campaign.findUnique({ where: { id: campaignId } });
    console.info("[PrismaCampaignRepository] findById completed", { found: Boolean(r) });
    return r ? this.mapRow(r) : null;
  }

  async create(data: Omit<Campaign, "id" | "createdAt" | "updatedAt">): Promise<Campaign> {
    console.info("[PrismaCampaignRepository] create called", {
      channel: data.channel,
      status: data.status,
      segmentId: data.segmentId
    });
    const r = await prisma.campaign.create({
      data: {
        name: data.name,
        channel: data.channel,
        status: data.status,
        subject: data.subject ?? null,
        message: data.message,
        attachments: data.attachments ?? [],
        estimatedCost: data.estimatedCost,
        providerMessageId: data.providerMessageId ?? null,
        sentAt: data.sentAt ? new Date(data.sentAt) : null,
        segmentId: data.segmentId ?? null
      }
    });
    console.info("[PrismaCampaignRepository] create completed", { id: r.id });
    return this.mapRow(r);
  }

  async update(campaign: Campaign): Promise<Campaign> {
    console.info("[PrismaCampaignRepository] update called", {
      campaignId: campaign.id,
      status: campaign.status,
      providerMessageId: campaign.providerMessageId
    });
    const r = await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        name: campaign.name,
        channel: campaign.channel,
        status: campaign.status,
        subject: campaign.subject ?? null,
        message: campaign.message,
        attachments: campaign.attachments ?? [],
        estimatedCost: campaign.estimatedCost,
        providerMessageId: campaign.providerMessageId ?? null,
        sentAt: campaign.sentAt ? new Date(campaign.sentAt) : null,
        segmentId: campaign.segmentId ?? null
      }
    });
    console.info("[PrismaCampaignRepository] update completed", { id: r.id });
    return this.mapRow(r);
  }

  async delete(campaignId: string): Promise<boolean> {
    console.info("[PrismaCampaignRepository] delete called", { campaignId });
    await prisma.campaignRecipient.deleteMany({ where: { campaignId } });
    const r = await prisma.campaign.deleteMany({ where: { id: campaignId } });
    console.info("[PrismaCampaignRepository] delete completed", { count: r.count });
    return r.count > 0;
  }
}

class PrismaCampaignRecipientRepository implements CampaignRecipientRepository {
  private mapRow(r: {
    id: string;
    campaignId: string;
    legacyId: number;
    email: string;
    phone: string | null;
    recipientName: string | null;
    status: string;
    messageId: string | null;
    errorReason: string | null;
    sentAt: Date;
  }): CampaignRecipient {
    return {
      id: r.id,
      campaignId: r.campaignId,
      legacyId: r.legacyId,
      email: r.email,
      phone: r.phone ?? null,
      recipientName: r.recipientName ?? null,
      status: r.status as "sent" | "failed" | "pending",
      messageId: r.messageId ?? null,
      errorReason: r.errorReason ?? null,
      sentAt: r.sentAt.toISOString()
    };
  }

  async createMany(recipients: Omit<CampaignRecipient, "id">[]): Promise<void> {
    console.info("[PrismaCampaignRecipientRepository] createMany called", { count: recipients.length });
    if (recipients.length === 0) return;
    await prisma.campaignRecipient.createMany({
      data: recipients.map((r) => ({
        campaignId: r.campaignId,
        legacyId: r.legacyId,
        email: r.email,
        phone: r.phone ?? null,
        recipientName: r.recipientName ?? null,
        status: r.status,
        messageId: r.messageId ?? null,
        errorReason: r.errorReason ?? null,
        sentAt: new Date(r.sentAt)
      }))
    });
    console.info("[PrismaCampaignRecipientRepository] createMany completed");
  }

  async upsertMany(recipients: Omit<CampaignRecipient, "id">[]): Promise<void> {
    console.info("[PrismaCampaignRecipientRepository] upsertMany called", { count: recipients.length });
    for (const recipient of recipients) {
      await this.upsert(recipient);
    }
    console.info("[PrismaCampaignRecipientRepository] upsertMany completed");
  }

  async upsert(recipient: Omit<CampaignRecipient, "id">): Promise<CampaignRecipient> {
    console.info("[PrismaCampaignRecipientRepository] upsert called", {
      campaignId: recipient.campaignId,
      legacyId: recipient.legacyId,
      status: recipient.status
    });

    const existing = await prisma.campaignRecipient.findFirst({
      where: {
        campaignId: recipient.campaignId,
        legacyId: recipient.legacyId
      }
    });

    if (existing) {
      const updated = await prisma.campaignRecipient.update({
        where: { id: existing.id },
        data: {
          email: recipient.email,
          phone: recipient.phone ?? null,
          recipientName: recipient.recipientName ?? null,
          status: recipient.status,
          messageId: recipient.messageId ?? null,
          errorReason: recipient.errorReason ?? null,
          sentAt: new Date(recipient.sentAt)
        }
      });
      return this.mapRow(updated);
    }

    const created = await prisma.campaignRecipient.create({
      data: {
        campaignId: recipient.campaignId,
        legacyId: recipient.legacyId,
        email: recipient.email,
        phone: recipient.phone ?? null,
        recipientName: recipient.recipientName ?? null,
        status: recipient.status,
        messageId: recipient.messageId ?? null,
        errorReason: recipient.errorReason ?? null,
        sentAt: new Date(recipient.sentAt)
      }
    });
    return this.mapRow(created);
  }

  async findByCampaign(campaignId: string): Promise<CampaignRecipient[]> {
    console.info("[PrismaCampaignRecipientRepository] findByCampaign called", { campaignId });
    const rows = await prisma.campaignRecipient.findMany({
      where: { campaignId },
      orderBy: { sentAt: "desc" }
    });
    console.info("[PrismaCampaignRecipientRepository] findByCampaign completed", { count: rows.length });
    return rows.map((r) => this.mapRow(r));
  }

  async findByIds(ids: string[]): Promise<CampaignRecipient[]> {
    console.info("[PrismaCampaignRecipientRepository] findByIds called", { idsCount: ids.length });
    if (ids.length === 0) return [];

    const rows = await prisma.campaignRecipient.findMany({
      where: { id: { in: ids } }
    });

    console.info("[PrismaCampaignRecipientRepository] findByIds completed", { count: rows.length });
    return rows.map((r) => this.mapRow(r));
  }

  async findByCampaignAndStatus(campaignId: string, status: CampaignRecipient["status"]): Promise<CampaignRecipient[]> {
    console.info("[PrismaCampaignRecipientRepository] findByCampaignAndStatus called", { campaignId, status });
    const rows = await prisma.campaignRecipient.findMany({
      where: { campaignId, status },
      orderBy: { sentAt: "desc" }
    });
    console.info("[PrismaCampaignRecipientRepository] findByCampaignAndStatus completed", { count: rows.length });
    return rows.map((r) => this.mapRow(r));
  }

  async deleteByCampaign(campaignId: string): Promise<void> {
    console.info("[PrismaCampaignRecipientRepository] deleteByCampaign called", { campaignId });
    await prisma.campaignRecipient.deleteMany({ where: { campaignId } });
    console.info("[PrismaCampaignRecipientRepository] deleteByCampaign completed", { campaignId });
  }
}

export class RepositoryRegistry {
  adminUsers = new PrismaAdminUserRepository();
  endUsers = new InMemoryEndUserRepository();
  collectionPoints = new InMemoryCollectionPointRepository();
  partnerStores = new InMemoryPartnerStoreRepository();
  pointsLedger = new PrismaPointsLedgerRepository();
  audienceSegments = new PrismaAudienceSegmentRepository();
  campaigns = new PrismaCampaignRepository();
  campaignRecipients = new PrismaCampaignRecipientRepository();
  automationRules = new InMemoryAutomationRuleRepository();
}

export class LegacyDbAdapter {
  readonly mode = "stub";
  async healthcheck() { return { status: "not_configured", details: "Aguardando acesso ao banco legado do cliente." } as const; }
}
