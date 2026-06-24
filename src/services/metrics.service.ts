import type { FastifyInstance } from "fastify";
export class MetricsService {
  constructor(private app: FastifyInstance) {}
  async getDashboard() {
    const [users, points, campaigns, stores, collectionPoints, rules] = await Promise.all([
      this.app.container.repositories.endUsers.findAll(),
      this.app.container.repositories.pointsLedger.findAll(),
      this.app.container.repositories.campaigns.findAll(),
      this.app.container.repositories.partnerStores.findAll(),
      this.app.container.repositories.collectionPoints.findAll(),
      this.app.container.repositories.automationRules.findAll()
    ]);
    const activeUsers = users.filter((u) => u.status === "active");
    const emailCampaignsSent = campaigns.filter((item) => item.status === "sent" && item.channel === "email").length;
    const smsCampaignsSent = campaigns.filter((item) => item.status === "sent" && item.channel === "sms").length;
    return {
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
  }
}
