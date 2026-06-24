import { getLegacyPool } from "../connection.js";
import type { Entidade } from "../schema.js";

export async function findAllEntidades(filters?: {
  search?: string;
  ativa?: boolean;
}): Promise<Entidade[]> {
  const pool = getLegacyPool();
  if (!pool) return [];

  const params: unknown[] = [];
  let sql = "SELECT * FROM entidades WHERE 1=1";

  if (filters?.search) {
    sql += " AND en_name LIKE ?";
    params.push(`%${filters.search}%`);
  }

  if (filters?.ativa !== undefined) {
    sql += " AND status = ?";
    params.push(filters.ativa ? 1 : 0);
  }

  sql += " ORDER BY en_name ASC";

  const [rows] = await pool.query(sql, params);
  return rows as Entidade[];
}

export async function findEntidadeById(en_seq: number): Promise<Entidade | null> {
  const pool = getLegacyPool();
  if (!pool) return null;

  const [rows] = await pool.query(
    "SELECT * FROM entidades WHERE en_seq = ? LIMIT 1",
    [en_seq]
  );
  const list = rows as Entidade[];
  return list[0] ?? null;
}
