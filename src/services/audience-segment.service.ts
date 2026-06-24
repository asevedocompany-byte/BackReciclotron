import type { FastifyInstance } from "fastify";
import type { CreateAudienceSegmentInput, EndUser } from "@reciclotron/contracts";
export class AudienceSegmentService {
  constructor(private app: FastifyInstance) {}
  list() { return this.app.container.repositories.audienceSegments.findAll(); }
  create(input: CreateAudienceSegmentInput) { return this.app.container.repositories.audienceSegments.create(input); }
  async resolveRecipients(segmentId?: string | null): Promise<EndUser[]> {
    const users = await this.app.container.repositories.endUsers.findAll();
    if (!segmentId) return users;
    const segment = (await this.app.container.repositories.audienceSegments.findAll()).find((item) => item.id === segmentId);
    if (!segment) return [];
    return users.filter((user) => 
      (!segment.city || user.city === segment.city) && 
      (!segment.status || user.status === segment.status) && 
      (segment.minimumPoints === undefined || user.pointsBalance >= segment.minimumPoints) &&
      (segment.maximumPoints === undefined || user.pointsBalance <= segment.maximumPoints)
    );
  }
}
