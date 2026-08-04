import fp from "fastify-plugin";
import { RepositoryRegistry, LegacyDbAdapter } from "@reciclotron/db";
import type { SmsProvider } from "@reciclotron/domain";
import { MockSmsProvider } from "@reciclotron/integrations";
import { EndUserRepository as LegacyEndUserRepository } from "../repositories/end-user.repository.js";
import { CampaignEmailQueueService } from "../services/email/email-campaign-queue.service.js";
import { CampaignEmailWorkerService } from "../services/email/email-campaign-worker.service.js";
import { SmsCampaignQueueService } from "../services/sms/sms-campaign-queue.service.js";
import { SmsCampaignWorkerService } from "../services/sms/sms-campaign-worker.service.js";

declare module "fastify" {
  interface FastifyInstance {
    container: {
      repositories: RepositoryRegistry;
      legacyEndUsers: LegacyEndUserRepository;
      emailCampaignQueue: CampaignEmailQueueService;
      smsCampaignQueue: SmsCampaignQueueService;
      providers: { sms: SmsProvider; };
      legacyDb: LegacyDbAdapter;
    };
  }
}

export default fp(async (app) => {
  const emailCampaignQueue = new CampaignEmailQueueService();
  const emailCampaignWorker = new CampaignEmailWorkerService(app);
  emailCampaignQueue.setProcessor(emailCampaignWorker.process.bind(emailCampaignWorker));
  const smsCampaignQueue = new SmsCampaignQueueService();
  const smsCampaignWorker = new SmsCampaignWorkerService(app);
  smsCampaignQueue.setProcessor(smsCampaignWorker.process.bind(smsCampaignWorker));

  app.addHook("onClose", async () => {
    emailCampaignQueue.dispose();
    smsCampaignQueue.dispose();
  });

  app.decorate("container", {
    repositories: new RepositoryRegistry(),
    legacyEndUsers: new LegacyEndUserRepository(),
    emailCampaignQueue,
    smsCampaignQueue,
    providers: { sms: new MockSmsProvider() },
    legacyDb: new LegacyDbAdapter()
  });
});
