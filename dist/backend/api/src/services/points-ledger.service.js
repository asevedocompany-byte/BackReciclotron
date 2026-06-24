import { AppError } from "../shared/errors/app-error.js";
import { PointsLedgerRepository } from "../repositories/points-ledger.repository.js";
export class PointsLedgerService {
    app;
    repository;
    constructor(app) {
        this.app = app;
        this.repository = new PointsLedgerRepository();
    }
    list() {
        console.log('[PointsLedgerService] Encaminhando chamada de listagem de movimentações para o repositório');
        return this.repository.findAll();
    }
    async create(input) {
        const user = await this.app.container.repositories.endUsers.findById(input.userId);
        if (!user)
            throw new AppError(404, "Usuário não encontrado.");
        const nextBalance = input.type === "credit" ? user.pointsBalance + input.points : user.pointsBalance - input.points;
        if (nextBalance < 0)
            throw new AppError(400, "Saldo insuficiente para débito.");
        await this.app.container.repositories.endUsers.update({ ...user, pointsBalance: nextBalance });
        return this.app.container.repositories.pointsLedger.create(input);
    }
}
//# sourceMappingURL=points-ledger.service.js.map