import { AdminUserService } from "../services/admin-user.service.js";
export class AdminUserController {
    async list(request, reply) { return reply.send(await new AdminUserService(request.server).list()); }
}
//# sourceMappingURL=admin-user.controller.js.map