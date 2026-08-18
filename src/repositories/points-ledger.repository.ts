import { getLegacyPool } from "../legacy-db/connection.js";

export class PointsLedgerRepository {
  private static readonly balanceCache = new Map<number, { value: number; expiresAt: number }>();
  private static readonly balancePending = new Map<number, Promise<number>>();
  private static readonly balanceCacheTtlMs = 5 * 60 * 1000;

  static invalidateBalanceCache(memberId?: number) {
    if (memberId === undefined) {
      PointsLedgerRepository.balanceCache.clear();
      PointsLedgerRepository.balancePending.clear();
      return;
    }

    PointsLedgerRepository.balanceCache.delete(memberId);
    PointsLedgerRepository.balancePending.delete(memberId);
  }

  async getUserBalance(memberId: number): Promise<number> {
    const startedAt = Date.now();
    const cached = PointsLedgerRepository.balanceCache.get(memberId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    const pending = PointsLedgerRepository.balancePending.get(memberId);
    if (pending) {
      return pending;
    }

    const pool = getLegacyPool();
    if (!pool) {
      console.warn("[PointsLedgerRepository] getUserBalance skipped because legacy pool is unavailable", {
        memberId
      });
      return 0;
    }

    const queryPromise = (async () => {
      try {
        const [rows] = await pool.query(
          "SELECT SUM(points) AS balance FROM qwpurchase WHERE memberid = ?",
          [memberId]
        );
        const result = rows as Array<{ balance: number | null }>;
        const balance = Number(result[0]?.balance ?? 0);
        PointsLedgerRepository.balanceCache.set(memberId, {
          value: balance,
          expiresAt: Date.now() + PointsLedgerRepository.balanceCacheTtlMs
        });
        return balance;
      } catch (err) {
        console.error(`[PointsLedgerRepository] Erro ao calcular saldo de pontos para o cliente ${memberId}:`, {
          error: err instanceof Error ? { name: err.name, message: err.message } : String(err),
          elapsedMs: Date.now() - startedAt
        });
        return 0;
      } finally {
        PointsLedgerRepository.balancePending.delete(memberId);
      }
    })();

    PointsLedgerRepository.balancePending.set(memberId, queryPromise);
    return queryPromise;
  }

  async getUsersBalances(memberIds: number[]): Promise<Map<number, number>> {
    const balances = new Map<number, number>();
    const uniqueIds = [...new Set(memberIds.filter((memberId) => Number.isFinite(memberId)))];
    const missingIds: number[] = [];

    for (const memberId of uniqueIds) {
      const cached = PointsLedgerRepository.balanceCache.get(memberId);
      if (cached && cached.expiresAt > Date.now()) {
        balances.set(memberId, cached.value);
      } else {
        missingIds.push(memberId);
      }
    }

    const pool = getLegacyPool();
    if (!pool || missingIds.length === 0) {
      return balances;
    }

    const chunkSize = 500;
    for (let index = 0; index < missingIds.length; index += chunkSize) {
      const chunk = missingIds.slice(index, index + chunkSize);
      const placeholders = chunk.map(() => "?").join(",");
      const [rows] = await pool.query(
        `SELECT memberid, COALESCE(SUM(points), 0) AS balance
         FROM qwpurchase
         WHERE memberid IN (${placeholders})
         GROUP BY memberid`,
        chunk
      );

      for (const row of rows as Array<{ memberid: number; balance: number | string | null }>) {
        const memberId = Number(row.memberid);
        const balance = Number(row.balance ?? 0);
        balances.set(memberId, balance);
        PointsLedgerRepository.balanceCache.set(memberId, {
          value: balance,
          expiresAt: Date.now() + PointsLedgerRepository.balanceCacheTtlMs
        });
      }
    }

    for (const memberId of missingIds) {
      if (!balances.has(memberId)) balances.set(memberId, 0);
    }

    return balances;
  }

  private mapToContract(row: any): any {
    let isoDate: string;
    if (row.date instanceof Date) {
      const y = row.date.getUTCFullYear();
      const m = String(row.date.getUTCMonth() + 1).padStart(2, '0');
      const d = String(row.date.getUTCDate()).padStart(2, '0');
      isoDate = `${y}-${m}-${d}T12:00:00.000Z`;
    } else if (row.date) {
      const match = String(row.date).match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        isoDate = `${match[1]}-${match[2]}-${match[3]}T12:00:00.000Z`;
      } else {
        isoDate = new Date(row.date).toISOString();
      }
    } else {
      isoDate = new Date().toISOString();
    }

    return {
      ...row,
      id: String(row.purchaseid),
      userId: String(row.memberid),
      type: String(row.tp).toLowerCase() === "d" ? "debit" : "credit",
      points: Math.abs(Number(row.points || 0)) || 1,
      description: (row.hist || "").trim() || `Pedido ${row.pnum || ""}`.trim() || "Movimentação legada",
      source: row.estabel_parceiro_id ? `Parceiro #${row.estabel_parceiro_id}` : "Ponto de Coleta",
      createdAt: isoDate,
      updatedAt: isoDate
    };
  }

  async findById(id: string): Promise<any | null> {
    const pool = getLegacyPool();
    if (!pool) return null;

    try {
      const [rows] = await pool.query("SELECT * FROM qwpurchase WHERE purchaseid = ?", [Number(id)]);
      const result = rows as any[];
      if (result.length === 0) return null;
      return this.mapToContract(result[0]);
    } catch {
      return null;
    }
  }

  async createLegacyEntry(data: {
    userId: string;
    type: 'credit' | 'debit';
    points: number;
    description: string;
    source: string;
    createdAt?: string;
  }): Promise<any> {
    const pool = getLegacyPool();
    if (!pool) {
      console.warn('[PointsLedger][legacy-create] banco legado indisponível');
      throw new Error('Banco legado indisponível.');
    }

    const memberId = Number(data.userId);
    if (!Number.isInteger(memberId)) {
      console.warn('[PointsLedger][legacy-create] usuário legado inválido', { userIdType: typeof data.userId });
      throw new Error('Usuário legado inválido.');
    }

    const date = data.createdAt
      ? new Date(data.createdAt).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);
    const signedPoints = data.type === 'debit' ? -Math.abs(data.points) : Math.abs(data.points);
    const operationId = `ADMIN-${memberId}-${Date.now()}`;

    console.info('[PointsLedger][legacy-create] iniciando INSERT', {
      memberId,
      type: data.type,
      points: signedPoints,
      date,
      source: data.source
    });

    const [result] = await pool.query(
      `INSERT INTO qwpurchase (
        memberid, qr_reward_id, estabel_parceiro_id, corpora_validante,
        indicador_id, entidade_id, amount, points, qtty, fpgto, date,
        qr_date_expire, date_use_cupom, staffid, tp, tp_voucher, hist,
        recyclablesseq, catprod, qttyprod, pstoreid, reward_id, pnum,
        ped, status_brinde, autonum
      ) VALUES (?, 0, 0, 0, '0', 0, 0, ?, '0', 1, ?, ?, ?, 1, ?, 0, ?, 0, 15, '0', 1, 0, ?, ?, 0, ?)`,
      [
        memberId,
        signedPoints,
        date,
        date,
        date,
        data.type === 'debit' ? 'D' : 'C',
        data.description,
        operationId,
        operationId,
        operationId
      ]
    );

    const purchaseId = Number((result as { insertId?: number }).insertId);
    console.info('[PointsLedger][legacy-create] INSERT concluído', { memberId, purchaseId });
    if (!purchaseId) throw new Error('Movimentação criada, mas não foi possível identificar o lançamento.');

    PointsLedgerRepository.invalidateBalanceCache(memberId);
    return this.findById(String(purchaseId));
  }

  async findAll(filters: { userId?: string; limit?: number; offset?: number } = {}) {
    const pool = getLegacyPool();
    if (!pool) return [];

    try {
      const params: unknown[] = [];
      let sql = "SELECT * FROM qwpurchase WHERE 1=1";
      if (filters.userId) {
        sql += " AND memberid = ?";
        params.push(Number(filters.userId));
      }
      sql += " ORDER BY date DESC, purchaseid DESC";
      if (filters.limit !== undefined) {
        sql += " LIMIT ? OFFSET ?";
        params.push(filters.limit, filters.offset ?? 0);
      }
      const [rows] = await pool.query(sql, params);
      const result = rows as any[];
      return result.map(row => this.mapToContract(row));
    } catch (err) {
      console.error("[PointsLedgerRepository] Erro ao buscar lançamentos no MySQL legado:", err);
      return [];
    }
  }

  async findLatestByUser() {
    const pool = getLegacyPool();
    if (!pool) return [];

    try {
      const [rows] = await pool.query(`
        SELECT purchase.*
        FROM qwpurchase purchase
        INNER JOIN (
          SELECT memberid, MAX(date) AS latest_date
          FROM qwpurchase
          GROUP BY memberid
        ) latest
          ON latest.memberid = purchase.memberid
         AND latest.latest_date = purchase.date
        ORDER BY purchase.date DESC, purchase.purchaseid DESC
      `);
      return (rows as any[]).map((row) => this.mapToContract(row));
    } catch (err) {
      console.error("[PointsLedgerRepository] Erro ao buscar últimos movimentos:", err);
      return [];
    }
  }
}
