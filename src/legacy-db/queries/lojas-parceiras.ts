import { getLegacyPool } from "../connection.js";
import type { CorporaWithCategory, CategParceiro } from "../schema.js";

export async function findAllLojasParceiras(filters?: {
  search?: string;
  ativa?: boolean;
  limit?: number;
  offset?: number;
}): Promise<CorporaWithCategory[]> {
  console.log('[findAllLojasParceiras] Buscando lojas parceiras com filtros:', filters);
  const pool = getLegacyPool();
  if (!pool) return [];

  const params: unknown[] = [];

  let sql = `
    SELECT c.*, cat.catname
    FROM corpora c
    LEFT JOIN categ_parceiro cat ON c.categoria = cat.seq
    WHERE 1=1
  `;

  if (filters?.search) {
    sql += " AND (c.empresa LIKE ? OR c.city LIKE ? OR c.aemail LIKE ? OR cat.catname LIKE ?)";
    const term = `%${filters.search}%`;
    params.push(term, term, term, term);
  }

  if (filters?.ativa !== undefined) {
    sql += " AND c.status = ?";
    params.push(filters.ativa ? 1 : 0);
  }

  sql += " ORDER BY c.empresa ASC";

  if (filters?.limit !== undefined) {
    sql += " LIMIT ? OFFSET ?";
    params.push(filters.limit, filters.offset ?? 0);
  }

  console.log('[findAllLojasParceiras] Executando query:', sql.replace(/\s+/g, ' '), 'com parâmetros:', params);
  const [rows] = await pool.query(sql, params);
  console.log(`[findAllLojasParceiras] Query retornou ${Array.isArray(rows) ? rows.length : 0} registros.`);
  if (Array.isArray(rows)) {
    console.log('[findAllLojasParceiras] Primeiros 3 registros brutos do banco:\n', JSON.stringify(rows.slice(0, 3), null, 2));
  }
  return rows as CorporaWithCategory[];
}

export async function findLojaParceiraById(seq: number): Promise<CorporaWithCategory | null> {
  console.log(`[findLojaParceiraById] Buscando loja parceira com ID/seq: ${seq}`);
  const pool = getLegacyPool();
  if (!pool) return null;

  const [rows] = await pool.query(
    `
    SELECT c.*, cat.catname
    FROM corpora c
    LEFT JOIN categ_parceiro cat ON c.categoria = cat.seq
    WHERE c.seq = ? LIMIT 1
    `,
    [seq]
  );
  const list = rows as CorporaWithCategory[];
  console.log(`[findLojaParceiraById] Encontrado? ${list.length > 0}`);
  return list[0] ?? null;
}

export async function countLojasParceiras(filters?: { ativa?: boolean }): Promise<number> {
  console.log('[countLojasParceiras] Contando lojas parceiras com filtros:', filters);
  const pool = getLegacyPool();
  if (!pool) return 0;

  const params: unknown[] = [];
  let sql = "SELECT COUNT(*) AS total FROM corpora WHERE 1=1";

  if (filters?.ativa !== undefined) {
    sql += " AND status = ?";
    params.push(filters.ativa ? 1 : 0);
  }

  const [rows] = await pool.query(sql, params);
  const result = rows as Array<{ total: number }>;
  console.log('[countLojasParceiras] Total retornado:', result[0]?.total ?? 0);
  return result[0]?.total ?? 0;
}

export async function findAllCategoriasParceiro(): Promise<CategParceiro[]> {
  console.log('[findAllCategoriasParceiro] Buscando categorias de parceiros no MySQL legado');
  const pool = getLegacyPool();
  if (!pool) return [];

  const sql = "SELECT * FROM categ_parceiro WHERE status = 1 ORDER BY catname ASC";
  const [rows] = await pool.query(sql);
  return rows as CategParceiro[];
}

export async function updateLojaParceira(
  seq: number,
  data: {
    empresa?: string;
    city?: string;
    cnpj?: string | null;
    aemail?: string | null;
    address?: string | null;
    state?: string | null;
    pin_loja?: string | null;
    categoria?: number | null;
    c_storeid?: number | null;
    status?: number;
  }
): Promise<boolean> {
  console.log(`[updateLojaParceira] Atualizando loja seq: ${seq} com dados:`, data);
  const pool = getLegacyPool();
  if (!pool) return false;

  const sets: string[] = [];
  const params: unknown[] = [];

  if (data.empresa !== undefined) { sets.push("empresa = ?"); params.push(data.empresa); }
  if (data.city !== undefined) { sets.push("city = ?"); params.push(data.city); }
  if (data.cnpj !== undefined) { sets.push("cnpj = ?"); params.push(data.cnpj); }
  if (data.aemail !== undefined) { sets.push("aemail = ?"); params.push(data.aemail); }
  if (data.address !== undefined) { sets.push("address = ?"); params.push(data.address); }
  if (data.state !== undefined) { sets.push("state = ?"); params.push(data.state); }
  if (data.pin_loja !== undefined) { sets.push("pin_loja = ?"); params.push(data.pin_loja); }
  if (data.categoria !== undefined) { sets.push("categoria = ?"); params.push(data.categoria); }
  if (data.c_storeid !== undefined) { sets.push("c_storeid = ?"); params.push(data.c_storeid); }
  if (data.status !== undefined) { sets.push("status = ?"); params.push(data.status); }

  if (sets.length === 0) return false;

  const sql = `UPDATE corpora SET ${sets.join(", ")} WHERE seq = ?`;
  params.push(seq);

  console.log('[updateLojaParceira] Executando query:', sql, 'com parâmetros:', params);
  const [result] = await pool.query(sql, params);
  const affectedRows = (result as { affectedRows?: number }).affectedRows ?? 0;
  console.log(`[updateLojaParceira] Linhas afetadas: ${affectedRows}`);
  return affectedRows > 0;
}
