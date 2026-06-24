import { getLegacyPool } from "../legacy-db/connection.js";

export class PointsLedgerRepository {
  async getUserBalance(memberId: number): Promise<number> {
    const pool = getLegacyPool();
    if (!pool) return 0;

    try {
      const [rows] = await pool.query(
        "SELECT SUM(points) AS balance FROM qwpurchase WHERE memberid = ?",
        [memberId]
      );
      const result = rows as Array<{ balance: number | null }>;
      const balance = Number(result[0]?.balance ?? 0);
      return balance;
    } catch (err) {
      console.error(`[PointsLedgerRepository] Erro ao calcular saldo de pontos para o cliente ${memberId}:`, err);
      return 0;
    }
  }

  private mapToContract(row: any): any {
    if (String(row.memberid) === "3041") {
      console.log("RAW PURCHASE FOR 3041:", JSON.stringify(row, null, 2));
    }
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

  async findAll() {
    const pool = getLegacyPool();
    if (!pool) return [];

    try {
      const [rows] = await pool.query("SELECT * FROM qwpurchase ORDER BY date DESC");
      const result = rows as any[];
      return result.map(row => this.mapToContract(row));
    } catch (err) {
      console.error("[PointsLedgerRepository] Erro ao buscar lançamentos no MySQL legado:", err);
      return [];
    }
  }
}
