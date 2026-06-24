import { EndUserRepository } from "../repositories/end-user.repository.js";
import { PointsLedgerRepository } from "../repositories/points-ledger.repository.js";
export class EndUserService {
    app;
    repository;
    pointsLedgerRepository;
    constructor(app) {
        this.app = app;
        this.repository = new EndUserRepository();
        this.pointsLedgerRepository = new PointsLedgerRepository();
    }
    async list() {
        console.log('[EndUserService] Encaminhando chamada de listagem para o repositório');
        const users = await this.repository.findAll();
        return Promise.all(users.map(async (user) => {
            const memberId = Number(user.id);
            if (!isNaN(memberId)) {
                const pointsBalance = await this.pointsLedgerRepository.getUserBalance(memberId);
                return { ...user, pointsBalance };
            }
            return user;
        }));
    }
    async findById(id) {
        console.log('[EndUserService] Buscando usuário final por ID:', { id });
        const user = await this.repository.findById(id);
        if (!user)
            return null;
        const memberId = Number(user.id);
        if (!isNaN(memberId)) {
            const pointsBalance = await this.pointsLedgerRepository.getUserBalance(memberId);
            return { ...user, pointsBalance };
        }
        return user;
    }
}
//# sourceMappingURL=end-user.service.js.map