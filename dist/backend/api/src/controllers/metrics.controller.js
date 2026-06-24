import { MetricsService } from "../services/metrics.service.js";
export class MetricsController {
    async dashboard(request, reply) { return reply.send(await new MetricsService(request.server).getDashboard()); }
}
//# sourceMappingURL=metrics.controller.js.map