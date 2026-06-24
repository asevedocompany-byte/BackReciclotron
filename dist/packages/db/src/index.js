import { prisma } from "./client.js";
export { prisma } from "./client.js";
const now = () => new Date().toISOString();
const id = (prefix) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
const adminUsers = [{ id: "admin_1", email: "admin@reciclotron.local", name: "Admin Reciclotron", role: "super_admin", passwordHash: "admin1234", lastLoginAt: null, createdAt: now(), updatedAt: now() }];
const endUsers = [
    { id: "user_1", email: "maria@example.com", name: "Maria", city: "São Paulo", status: "active", pointsBalance: 120, phone: "+5511999999999", createdAt: now(), updatedAt: now() },
    { id: "user_2", email: "joao@example.com", name: "João", city: "Campinas", status: "inactive", pointsBalance: 40, phone: "+5511988888888", createdAt: now(), updatedAt: now() }
];
const collectionPoints = [
    { id: "cp_seed_1", name: "EcoPonto Centro", city: "São Paulo", description: "Recebimento de eletrônicos leves.", address: "Rua das Flores, 120", active: true, createdAt: now(), updatedAt: now() },
    { id: "cp_seed_2", name: "Hub Zona Norte", city: "Guarulhos", description: "Triagem local com agendamento.", address: "Av. Paulista Norte, 455", active: true, createdAt: now(), updatedAt: now() }
];
const partnerStores = [
    { id: "ps_seed_1", name: "Tech Verde", city: "São Paulo", description: "Aceita resgates com reciclopontos no balcão.", partnershipDetails: "1 cupom / 500 pts", active: true, createdAt: now(), updatedAt: now() },
    { id: "ps_seed_2", name: "Eco Troca Campinas", city: "Campinas", description: "Parceria local para campanhas sazonais.", partnershipDetails: "Descontos progressivos em acessórios", active: true, createdAt: now(), updatedAt: now() }
];
const ledgerEntries = [];
const audienceSegments = [{ id: "95831e5e-63f5-4674-a026-c22822a9ff3a", name: "Ativos SP", description: "Usuários ativos em São Paulo", city: "São Paulo", status: "active", minimumPoints: 0, createdAt: now(), updatedAt: now() }];
const automationRules = [{ id: "rule_inactive_email", name: "Reativação por inatividade", trigger: "user_inactive", channel: "email", template: "Sentimos sua falta!", active: true, segmentId: null, createdAt: now(), updatedAt: now() }];
// ── Repositórios In-Memory (módulos que não são campanhas) ──────────────────
class InMemoryAdminUserRepository {
    async findByEmail(email) { return adminUsers.find((item) => item.email === email) ?? null; }
    async findAll() { return [...adminUsers]; }
    async updateLastLogin(userId, lastLoginAt) {
        const index = adminUsers.findIndex((item) => item.id === userId);
        if (index === -1)
            return null;
        adminUsers[index] = { ...adminUsers[index], lastLoginAt, updatedAt: now() };
        return adminUsers[index];
    }
}
class InMemoryEndUserRepository {
    async findAll() { return [...endUsers]; }
    async findById(userId) { return endUsers.find((item) => item.id === userId) ?? null; }
    async findByIds(ids) {
        return endUsers.filter((item) => {
            const numericId = Number.parseInt(String(item.id).replace(/\D+/g, ""), 10);
            return Number.isFinite(numericId) && ids.includes(numericId);
        });
    }
    async update(user) { const index = endUsers.findIndex((item) => item.id === user.id); endUsers[index] = { ...user, updatedAt: now() }; return endUsers[index]; }
}
class InMemoryCollectionPointRepository {
    async findAll(filters) {
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
    async findById(pointId) { return collectionPoints.find((item) => item.id === pointId) ?? null; }
    async create(data) { const item = { ...data, id: id("cp"), createdAt: now(), updatedAt: now() }; collectionPoints.push(item); return item; }
    async update(pointId, data) { const index = collectionPoints.findIndex((item) => item.id === pointId); if (index === -1)
        return null; collectionPoints[index] = { ...collectionPoints[index], ...data, updatedAt: now() }; return collectionPoints[index]; }
    async delete(pointId) { const index = collectionPoints.findIndex((item) => item.id === pointId); if (index === -1)
        return false; collectionPoints.splice(index, 1); return true; }
}
class InMemoryPartnerStoreRepository {
    async findAll(filters) {
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
    async findById(storeId) { return partnerStores.find((item) => item.id === storeId) ?? null; }
    async create(data) { const item = { ...data, id: id("ps"), createdAt: now(), updatedAt: now() }; partnerStores.push(item); return item; }
    async update(storeId, data) { const index = partnerStores.findIndex((item) => item.id === storeId); if (index === -1)
        return null; partnerStores[index] = { ...partnerStores[index], ...data, updatedAt: now() }; return partnerStores[index]; }
    async delete(storeId) { const index = partnerStores.findIndex((item) => item.id === storeId); if (index === -1)
        return false; partnerStores.splice(index, 1); return true; }
}
class InMemoryPointsLedgerRepository {
    async findAll() { return [...ledgerEntries]; }
    async create(data) { const item = { ...data, id: id("ple"), createdAt: now(), updatedAt: now() }; ledgerEntries.push(item); return item; }
}
class PrismaAudienceSegmentRepository {
    mapRow(r) {
        return {
            id: r.id,
            name: r.name,
            description: r.description,
            city: r.city ?? undefined,
            status: r.status,
            minimumPoints: r.minimumPoints ?? undefined,
            maximumPoints: r.maximumPoints ?? undefined,
            createdAt: r.createdAt.toISOString(),
            updatedAt: r.updatedAt.toISOString()
        };
    }
    async findAll() {
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
            }
            catch (err) {
                console.warn("[PrismaAudienceSegmentRepository] seeding failed (might already exist)", err);
                rows = await prisma.audienceSegment.findMany({ orderBy: { createdAt: "desc" } });
            }
        }
        console.info("[PrismaAudienceSegmentRepository] findAll completed", { count: rows.length });
        return rows.map((r) => this.mapRow(r));
    }
    async create(data) {
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
class InMemoryAutomationRuleRepository {
    async findAll() { return [...automationRules]; }
    async create(data) { const item = { ...data, id: id("rule"), createdAt: now(), updatedAt: now() }; automationRules.push(item); return item; }
    async update(rule) { const index = automationRules.findIndex((item) => item.id === rule.id); if (index === -1)
        throw new Error("Automation rule not found"); automationRules[index] = { ...rule, updatedAt: now() }; return automationRules[index]; }
}
// ── Repositórios Prisma (Supabase) — campanhas ─────────────────────────────
class PrismaCampaignRepository {
    mapRow(r) {
        return {
            id: r.id,
            name: r.name,
            channel: r.channel,
            status: r.status,
            subject: r.subject ?? undefined,
            message: r.message,
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
    async findAll() {
        console.info("[PrismaCampaignRepository] findAll called");
        const rows = await prisma.campaign.findMany({ orderBy: { createdAt: "desc" } });
        console.info("[PrismaCampaignRepository] findAll completed", { count: rows.length });
        return rows.map((r) => this.mapRow(r));
    }
    async findById(campaignId) {
        console.info("[PrismaCampaignRepository] findById called", { campaignId });
        const r = await prisma.campaign.findUnique({ where: { id: campaignId } });
        console.info("[PrismaCampaignRepository] findById completed", { found: Boolean(r) });
        return r ? this.mapRow(r) : null;
    }
    async create(data) {
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
                estimatedCost: data.estimatedCost,
                providerMessageId: data.providerMessageId ?? null,
                sentAt: data.sentAt ? new Date(data.sentAt) : null,
                segmentId: data.segmentId ?? null
            }
        });
        console.info("[PrismaCampaignRepository] create completed", { id: r.id });
        return this.mapRow(r);
    }
    async update(campaign) {
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
                estimatedCost: campaign.estimatedCost,
                providerMessageId: campaign.providerMessageId ?? null,
                sentAt: campaign.sentAt ? new Date(campaign.sentAt) : null,
                segmentId: campaign.segmentId ?? null
            }
        });
        console.info("[PrismaCampaignRepository] update completed", { id: r.id });
        return this.mapRow(r);
    }
}
class PrismaCampaignRecipientRepository {
    async createMany(recipients) {
        console.info("[PrismaCampaignRecipientRepository] createMany called", { count: recipients.length });
        if (recipients.length === 0)
            return;
        await prisma.campaignRecipient.createMany({
            data: recipients.map((r) => ({
                campaignId: r.campaignId,
                legacyId: r.legacyId,
                email: r.email,
                status: r.status,
                messageId: r.messageId ?? null,
                errorReason: r.errorReason ?? null,
                sentAt: new Date(r.sentAt)
            }))
        });
        console.info("[PrismaCampaignRecipientRepository] createMany completed");
    }
    async findByCampaign(campaignId) {
        console.info("[PrismaCampaignRecipientRepository] findByCampaign called", { campaignId });
        const rows = await prisma.campaignRecipient.findMany({
            where: { campaignId },
            orderBy: { sentAt: "desc" }
        });
        console.info("[PrismaCampaignRecipientRepository] findByCampaign completed", { count: rows.length });
        return rows.map((r) => ({
            id: r.id,
            campaignId: r.campaignId,
            legacyId: r.legacyId,
            email: r.email,
            status: r.status,
            messageId: r.messageId ?? null,
            errorReason: r.errorReason ?? null,
            sentAt: r.sentAt.toISOString()
        }));
    }
}
export class RepositoryRegistry {
    adminUsers = new InMemoryAdminUserRepository();
    endUsers = new InMemoryEndUserRepository();
    collectionPoints = new InMemoryCollectionPointRepository();
    partnerStores = new InMemoryPartnerStoreRepository();
    pointsLedger = new InMemoryPointsLedgerRepository();
    audienceSegments = new PrismaAudienceSegmentRepository();
    campaigns = new PrismaCampaignRepository();
    campaignRecipients = new PrismaCampaignRecipientRepository();
    automationRules = new InMemoryAutomationRuleRepository();
}
export class LegacyDbAdapter {
    mode = "stub";
    async healthcheck() { return { status: "not_configured", details: "Aguardando acesso ao banco legado do cliente." }; }
}
//# sourceMappingURL=index.js.map