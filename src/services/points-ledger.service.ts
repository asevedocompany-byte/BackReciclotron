import type { FastifyInstance } from "fastify";
import type { CreateLedgerEntryInput } from "@reciclotron/contracts";
import { AppError } from "../shared/errors/app-error.js";
import { EndUserService } from "./end-user.service.js";
import { PointsLedgerRepository } from "../repositories/points-ledger.repository.js";

export class PointsLedgerService {
  private repository: PointsLedgerRepository;

  constructor(private app: FastifyInstance) {
    this.repository = new PointsLedgerRepository();
  }

  async list(filters: { userId?: string; limit?: number; offset?: number } = {}) {
    console.log('[PointsLedgerService] Encaminhando chamada de listagem de movimentações para o repositório');
    const legacyList = await this.repository.findAll(filters);
    // Usuários do banco legado usam memberid numérico e não podem ser
    // consultados na tabela Prisma, cujo userId é UUID.
    const dbList = filters.userId && /^\d+$/.test(filters.userId)
      ? []
      : await this.app.container.repositories.pointsLedger.findAll(filters);

    const map = new Map<string, any>();
    for (const item of [...legacyList, ...dbList]) {
      map.set(item.id, item);
    }

    const combined = Array.from(map.values());
    combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (filters.limit !== undefined) {
      const offset = filters.offset ?? 0;
      return combined.slice(offset, offset + filters.limit);
    }

    return combined;
  }

  listLatestByUser() {
    return this.repository.findLatestByUser();
  }

  async create(input: CreateLedgerEntryInput & { createdAt?: string }) {
    const isLegacyUser = /^\d+$/.test(String(input.userId));
    console.info('[PointsLedger][create] solicitação recebida', {
      userIdType: typeof input.userId,
      isLegacyUser,
      type: input.type,
      points: input.points,
      hasCreatedAt: Boolean(input.createdAt)
    });
    const user = isLegacyUser
      ? await this.app.container.legacyEndUsers.findById(input.userId)
      : await this.app.container.repositories.endUsers.findById(input.userId);
    if (!user) {
      console.warn('[PointsLedger][create] usuário não encontrado', { isLegacyUser });
      throw new AppError(404, "Usuário não encontrado.");
    }
    const points = Math.abs(Number(input.points));
    if (!points || isNaN(points)) throw new AppError(400, "Quantidade de pontos inválida.");

    const currentBalance = isLegacyUser
      ? await this.repository.getUserBalance(Number(input.userId))
      : user.pointsBalance;
    const nextBalance = input.type === "credit" ? currentBalance + points : currentBalance - points;
    console.info('[PointsLedger][create] saldo validado', {
      isLegacyUser,
      currentBalance,
      points,
      nextBalance,
      type: input.type
    });
    if (nextBalance < 0) throw new AppError(400, "Saldo insuficiente para débito.");

    if (isLegacyUser) {
      try {
        const created = await this.repository.createLegacyEntry({
          ...input,
          userId: String(input.userId),
          points,
          source: input.source
        });
        EndUserService.invalidateListCache();
        return created;
      } catch (err) {
        console.error('[PointsLedger][create] falha ao gravar no legado', {
          isLegacyUser,
          error: err instanceof Error ? { name: err.name, message: err.message } : String(err)
        });
        throw new AppError(
          409,
          err instanceof Error
            ? `Não foi possível registrar a movimentação no banco legado: ${err.message}`
            : 'Não foi possível registrar a movimentação no banco legado.'
        );
      }
    }

    await this.app.container.repositories.endUsers.update({ ...user, pointsBalance: nextBalance });
    PointsLedgerRepository.invalidateBalanceCache(Number(input.userId));
    EndUserService.invalidateListCache();
    return this.app.container.repositories.pointsLedger.create({
      ...input,
      points
    });
  }

}
