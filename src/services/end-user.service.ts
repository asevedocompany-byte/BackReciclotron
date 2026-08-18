import type { FastifyInstance } from "fastify";
import type { EndUser, UpdateEndUserInput } from "@reciclotron/contracts";
import { EndUserRepository } from "../repositories/end-user.repository.js";
import { PointsLedgerRepository } from "../repositories/points-ledger.repository.js";

export class EndUserService {
  private repository: EndUserRepository;
  private pointsLedgerRepository: PointsLedgerRepository;
  private static listCache: {
    expiresAt: number;
    value: Awaited<ReturnType<EndUserService["loadList"]>> | null;
    pending: Promise<Awaited<ReturnType<EndUserService["loadList"]>>> | null;
  } = {
    expiresAt: 0,
    value: null,
    pending: null
  };
  private static readonly listCacheTtlMs = 5 * 60 * 1000;

  constructor(private app: FastifyInstance) {
    this.repository = new EndUserRepository();
    this.pointsLedgerRepository = new PointsLedgerRepository();
  }

  static invalidateListCache() {
    EndUserService.listCache.expiresAt = 0;
    EndUserService.listCache.value = null;
    EndUserService.listCache.pending = null;
  }

  private async loadList() {
    const startedAt = Date.now();
    const users = await this.repository.findAll();

    const memberIds = users
      .map((user) => Number(user.id))
      .filter((memberId) => Number.isFinite(memberId));
    const balances = await this.pointsLedgerRepository.getUsersBalances(memberIds);
    const latestMovements = await this.pointsLedgerRepository.findLatestByUser();
    const lastMovementByUser = new Map(
      latestMovements.map((movement) => [String(movement.userId), movement.createdAt])
    );
    const enrichedUsers = users.map((user) => ({
      ...user,
      pointsBalance: balances.get(Number(user.id)) ?? 0,
      lastMovementAt: lastMovementByUser.get(String(user.id)) ?? null
    }));

    return enrichedUsers;
  }

  async list() {
    const cache = EndUserService.listCache;
    const now = Date.now();

    if (cache.value && cache.expiresAt > now) {
      return cache.value;
    }

    if (cache.pending) {
      return cache.pending;
    }

    const pending = this.loadList().then((users) => {
      cache.value = users;
      cache.expiresAt = Date.now() + EndUserService.listCacheTtlMs;
      cache.pending = null;
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

  async findById(id: string) {
    const user = await this.repository.findById(id);
    if (!user) return null;

    const memberId = Number(user.id);
    if (!isNaN(memberId)) {
      const pointsBalance = await this.pointsLedgerRepository.getUserBalance(memberId);
      return { ...user, pointsBalance };
    }
    return user;
  }

  async update(id: string, data: UpdateEndUserInput) {
    const current = await this.repository.findById(id);
    if (!current) return null;
    const updated = await this.repository.update({ ...current, ...data, id } as EndUser & UpdateEndUserInput);
    EndUserService.invalidateListCache();
    const memberId = Number(updated.id);
    if (Number.isInteger(memberId)) {
      return {
        ...updated,
        pointsBalance: await this.pointsLedgerRepository.getUserBalance(memberId)
      };
    }
    return updated;
  }
}
