import { getLegacyPool } from "../connection.js";
import type { Store } from "../schema.js";

export type CollectionPointWriteData = {
  name: string;
  city: string;
  description: string;
  address?: string;
  state?: string;
  email?: string;
  active?: boolean;
};

export async function findAllPontosColeta(filters?: {
  search?: string;
  ativa?: boolean;
  limit?: number;
  offset?: number;
}): Promise<Store[]> {
  const pool = getLegacyPool();
  if (!pool) return [];

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

  sql += " ORDER BY sname ASC";

  if (filters?.limit !== undefined) {
    sql += " LIMIT ? OFFSET ?";
    params.push(filters.limit, filters.offset ?? 0);
  }

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

export async function createPontoColeta(data: CollectionPointWriteData): Promise<number> {
  const pool = getLegacyPool();
  if (!pool) throw new Error("Pool do banco legado indisponível.");

  const now = new Date();
  const sql = `
    INSERT INTO store
      (sprofile, snumber, pin_loja, sname, scity, sstate, saddress1, semail, comments,
       sdatesince, supdatedate, status, stax, sloyalcoef)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const params = [
    0,
    "",
    "",
    data.name,
    data.city || null,
    data.state || null,
    data.address || null,
    data.email || null,
    data.description || null,
    now,
    now,
    data.active === false ? 0 : 1,
    0,
    0
  ];

  console.info("[createPontoColeta] Executando INSERT na tabela store", { sql, params });
  const [result] = await pool.query(sql, params);
  const storeid = Number((result as { insertId?: number }).insertId);
  console.info("[createPontoColeta] INSERT concluído", { storeid });
  if (!storeid) throw new Error("O banco legado não retornou o ID do ponto criado.");
  return storeid;
}

export async function updatePontoColeta(storeid: number, data: Partial<CollectionPointWriteData>): Promise<boolean> {
  const pool = getLegacyPool();
  if (!pool) throw new Error("Pool do banco legado indisponível.");

  const sets: string[] = [];
  const params: unknown[] = [];
  if (data.name !== undefined) { sets.push("sname = ?"); params.push(data.name); }
  if (data.city !== undefined) { sets.push("scity = ?"); params.push(data.city); }
  if (data.description !== undefined) { sets.push("comments = ?"); params.push(data.description); }
  if (data.address !== undefined) { sets.push("saddress1 = ?"); params.push(data.address); }
  if (data.state !== undefined) { sets.push("sstate = ?"); params.push(data.state); }
  if (data.email !== undefined) { sets.push("semail = ?"); params.push(data.email); }
  if (data.active !== undefined) { sets.push("status = ?"); params.push(data.active ? 1 : 0); }

  if (sets.length === 0) return false;

  sets.push("supdatedate = ?");
  params.push(new Date(), storeid);
  const sql = `UPDATE store SET ${sets.join(", ")} WHERE storeid = ?`;
  console.info("[updatePontoColeta] Executando UPDATE na tabela store", { storeid, sql, params });
  const [result] = await pool.query(sql, params);
  const affectedRows = Number((result as { affectedRows?: number }).affectedRows ?? 0);
  console.info("[updatePontoColeta] UPDATE concluído", { storeid, affectedRows });
  return affectedRows > 0;
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
