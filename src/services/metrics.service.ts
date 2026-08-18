import type { FastifyInstance } from "fastify";
import { CollectionPointRepository } from "../repositories/collection-point.repository.js";
import { PartnerStoreRepository } from "../repositories/partner-store.repository.js";
import { PointsLedgerRepository } from "../repositories/points-ledger.repository.js";

export class MetricsService {
  constructor(private app: FastifyInstance) {}
  async getDashboard() {
    const collectionPointsRepository = new CollectionPointRepository();
    const partnerStoresRepository = new PartnerStoreRepository();
    const pointsLedgerRepository = new PointsLedgerRepository();

    const [users, points, campaigns, stores, collectionPoints, rules] = await Promise.all([
      this.app.container.legacyEndUsers.findAll(),
      pointsLedgerRepository.findAll(),
      this.app.container.repositories.campaigns.findAll(),
      partnerStoresRepository.findAll(),
      collectionPointsRepository.findAll(),
      this.app.container.repositories.automationRules.findAll()
    ]);
    const activeUsers = users.filter((u) => u.status === "active");
    const emailCampaignsSent = campaigns.filter((item) => item.status === "sent" && item.channel === "email").length;
    const smsCampaignsSent = campaigns.filter((item) => item.status === "sent" && item.channel === "sms").length;
    const dashboard = {
      users: { total: users.length, active: activeUsers.length },
      points: { transactions: points.length, totalBalance: users.reduce((acc, item) => acc + item.pointsBalance, 0) },
      campaigns: {
        total: campaigns.length,
        sent: emailCampaignsSent + smsCampaignsSent,
        emailSent: emailCampaignsSent,
        smsSent: smsCampaignsSent
      },
      partnerStores: {
        total: stores.length,
        active: stores.filter((item) => item.active).length
      },
      collectionPoints: {
        total: collectionPoints.length,
        active: collectionPoints.filter((item) => item.active).length
      },
      automationRules: rules.filter((item) => item.active).length,
      legacyDb: await this.app.container.legacyDb.healthcheck()
    };
    console.info("[MetricsService] dashboard calculado com dados reais", {
      users: dashboard.users,
      points: dashboard.points,
      campaigns: dashboard.campaigns,
      partnerStores: dashboard.partnerStores,
      collectionPoints: dashboard.collectionPoints
    });
    return dashboard;
  }
}
