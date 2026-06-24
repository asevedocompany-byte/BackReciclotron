import { loginSchema } from "@reciclotron/contracts";
import { AuthService } from "../services/auth.service.js";
export class AuthController {
    async login(request, reply) {
        const input = loginSchema.parse(request.body);
        const service = new AuthService(request.server);
        return reply.send(await service.login(input.email, input.password));
    }
}
//# sourceMappingURL=auth.controller.js.map