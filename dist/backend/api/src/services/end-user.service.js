import { EndUserRepository } from "../repositories/end-user.repository.js";
import { PointsLedgerRepository } from "../repositories/points-ledger.repository.js";
export class EndUserService {
    app;
    repository;
    pointsLedgerRepository;
    static listCache = {
        expiresAt: 0,
        value: null,
        pending: null
    };
    static listCacheTtlMs = 5 * 60 * 1000;
    constructor(app) {
        this.app = app;
        this.repository = new EndUserRepository();
        this.pointsLedgerRepository = new PointsLedgerRepository();
    }
    static invalidateListCache() {
        EndUserService.listCache.expiresAt = 0;
        EndUserService.listCache.value = null;
        EndUserService.listCache.pending = null;
    }
    async loadList() {
        const startedAt = Date.now();
        console.log('[EndUserService] loadList started');
        console.log('[EndUserService] loadList fetching users from legacy repository');
        const users = await this.repository.findAll();
        console.log('[EndUserService] loadList users fetched', {
            count: users.length,
            elapsedMs: Date.now() - startedAt
        });
        console.log('[EndUserService] loadList calculating points balance', {
            count: users.length
        });
        const memberIds = users
            .map((user) => Number(user.id))
            .filter((memberId) => Number.isFinite(memberId));
        const balances = await this.pointsLedgerRepository.getUsersBalances(memberIds);
        const enrichedUsers = users.map((user) => ({
            ...user,
            pointsBalance: balances.get(Number(user.id)) ?? 0
        }));
        console.log('[EndUserService] loadList completed', {
            count: enrichedUsers.length,
            elapsedMs: Date.now() - startedAt
        });
        return enrichedUsers;
    }
    async list() {
        const cache = EndUserService.listCache;
        const now = Date.now();
        if (cache.value && cache.expiresAt > now) {
            console.log('[EndUserService] list cache hit', {
                ttlRemainingMs: cache.expiresAt - now
            });
            return cache.value;
        }
        if (cache.pending) {
            console.log('[EndUserService] list cache pending, reusing in-flight promise');
            return cache.pending;
        }
        const pending = this.loadList().then((users) => {
            cache.value = users;
            cache.expiresAt = Date.now() + EndUserService.listCacheTtlMs;
            cache.pending = null;
            console.log('[EndUserService] list cache refreshed', {
                count: users.length,
                ttlMs: EndUserService.listCacheTtlMs
            });
            return users;
        }).catch((error) => {
            cache.pending = null;
            console.error('[EndUserService] list failed', {
                error: error instanceof Error ? { name: error.name, message: error.message } : String(error)
            });
            throw error;
        });
        cache.pending = pending;
        return pending;
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