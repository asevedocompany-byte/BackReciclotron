import { getLegacyPool } from "../connection.js";
import type { Store } from "../schema.js";

export async function findAllPontosColeta(filters?: {
  search?: string;
  ativa?: boolean;
  limit?: number;
  offset?: number;
}): Promise<Store[]> {
  const pool = getLegacyPool();
  if (!pool) return [];

  const limit = filters?.limit ?? 50;
  const offset = filters?.offset ?? 0;
  const params: unknown[] = [];

  let sql = "SELECT * FROM store WHERE 1=1";

  if (filters?.search) {
    sql += " AND (sname LIKE ? OR scity LIKE ? OR semail LIKE ?)";
    const term = `%${filters.search}%`;
    params.push(term, term, term);
  }

  if (filters?.ativa !== undefined) {
    sql += " AND status = ?";
    params.push(filters.ativa ? 1 : 0);
  }

  sql += " ORDER BY sname ASC LIMIT ? OFFSET ?";
  params.push(limit, offset);

  const [rows] = await pool.query(sql, params);
  return rows as Store[];
}

export async function findPontoColetaById(storeid: number): Promise<Store | null> {
  const pool = getLegacyPool();
  if (!pool) return null;

  const [rows] = await pool.query(
    "SELECT * FROM store WHERE storeid = ? LIMIT 1",
    [storeid]
  );
  const list = rows as Store[];
  return list[0] ?? null;
}

export async function countPontosColeta(filters?: { ativa?: boolean }): Promise<number> {
  const pool = getLegacyPool();
  if (!pool) return 0;

  const params: unknown[] = [];
  let sql = "SELECT COUNT(*) AS total FROM store WHERE 1=1";

  if (filters?.ativa !== undefined) {
    sql += " AND status = ?";
    params.push(filters.ativa ? 1 : 0);
  }

  const [rows] = await pool.query(sql, params);
  const result = rows as Array<{ total: number }>;
  return result[0]?.total ?? 0;
}
