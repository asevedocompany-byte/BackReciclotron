import { getLegacyPool } from "../connection.js";
import type { CorporaWithCategory, CategParceiro } from "../schema.js";
import { randomBytes } from "node:crypto";

export type PartnerStoreWriteData = {
  name: string;
  city: string;
  description?: string;
  cnpj?: string | null;
  email?: string | null;
  address?: string | null;
  address2?: string | null;
  bairro?: string | null;
  zip?: string | null;
  state?: string | null;
  phone1?: string | null;
  phone?: string | null;
  phone31?: string | null;
  phone3?: string | null;
  respons?: string | null;
  pinLoja?: string | null;
  cStoreId?: number | null;
  categoria?: number | null;
  active?: boolean;
};

function createLegacyToken(prefix: string) {
  return `${prefix}_${randomBytes(18).toString("hex")}`;
}

export async function findAllLojasParceiras(filters?: {
  search?: string;
  ativa?: boolean;
  limit?: number;
  offset?: number;
}): Promise<CorporaWithCategory[]> {
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

  const [rows] = await pool.query(sql, params);
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

export async function createLojaParceira(data: PartnerStoreWriteData): Promise<number> {
  const pool = getLegacyPool();
  if (!pool) throw new Error("Pool do banco legado indisponível.");

  const pinLoja = data.pinLoja?.trim() || createLegacyToken("pin");
  const pinLojaToken = createLegacyToken("pin_token");
  const partnerToken = createLegacyToken("partner");
  const email = data.email?.trim() || "";
  const sql = `
    INSERT INTO corpora
      (c_storeid, categoria, pin_loja, empresa, ramo, razaosocial, cnpj, aemail, cemail,
       address, address2, bairro, city, state, zip, country, phone1, phone, phone31,
       phone3, respons, obs, status, destaque, taxa_conversao, pin_loja_token, token_partner)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const params = [
    data.cStoreId ?? 1,
    data.categoria ?? 7,
    pinLoja,
    data.name,
    "Loja Parceira",
    data.name,
    data.cnpj?.trim() || "",
    email,
    email,
    data.address?.trim() || "",
    data.address2?.trim() || "",
    data.bairro?.trim() || "",
    data.city,
    data.state?.trim() || "",
    data.zip?.trim() || "",
    "Brasil",
    data.phone1?.trim() || "",
    data.phone?.trim() || "",
    data.phone31?.trim() || "",
    data.phone3?.trim() || "",
    data.respons?.trim() || "",
    data.description?.trim() || "",
    data.active === false ? 0 : 1,
    0,
    1,
    pinLojaToken,
    partnerToken
  ];

  console.info("[createLojaParceira] Executando INSERT na tabela corpora", {
    name: data.name,
    city: data.city,
    categoria: data.categoria ?? 7,
    active: data.active !== false
  });
  const [result] = await pool.query(sql, params);
  const seq = Number((result as { insertId?: number }).insertId);
  console.info("[createLojaParceira] INSERT concluído", { seq });
  if (!seq) throw new Error("O banco legado não retornou o ID da loja criada.");
  return seq;
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
    address2?: string | null;
    bairro?: string | null;
    zip?: string | null;
    state?: string | null;
    phone1?: string | null;
    phone?: string | null;
    phone31?: string | null;
    phone3?: string | null;
    respons?: string | null;
    obs?: string | null;
    pin_loja?: string | null;
    categoria?: number | null;
    c_storeid?: number | null;
    status?: number;
  }
): Promise<boolean> {
  const startedAt = Date.now();
  console.log(`[updateLojaParceira] Iniciando UPDATE da loja seq=${seq}`, { data });
  const pool = getLegacyPool();
  if (!pool) {
    console.error(`[updateLojaParceira] Pool legado indisponível para seq=${seq}`);
    return false;
  }

  const sets: string[] = [];
  const params: unknown[] = [];

  if (data.empresa !== undefined) { sets.push("empresa = ?"); params.push(data.empresa); }
  if (data.city !== undefined) { sets.push("city = ?"); params.push(data.city); }
  if (data.cnpj !== undefined) { sets.push("cnpj = ?"); params.push(data.cnpj); }
  if (data.aemail !== undefined) { sets.push("aemail = ?"); params.push(data.aemail); }
  if (data.address !== undefined) { sets.push("address = ?"); params.push(data.address); }
  if (data.address2 !== undefined) { sets.push("address2 = ?"); params.push(data.address2); }
  if (data.bairro !== undefined) { sets.push("bairro = ?"); params.push(data.bairro); }
  if (data.zip !== undefined) { sets.push("zip = ?"); params.push(data.zip); }
  if (data.state !== undefined) { sets.push("state = ?"); params.push(data.state); }
  if (data.phone1 !== undefined) { sets.push("phone1 = ?"); params.push(data.phone1); }
  if (data.phone !== undefined) { sets.push("phone = ?"); params.push(data.phone); }
  if (data.phone31 !== undefined) { sets.push("phone31 = ?"); params.push(data.phone31); }
  if (data.phone3 !== undefined) { sets.push("phone3 = ?"); params.push(data.phone3); }
  if (data.respons !== undefined) { sets.push("respons = ?"); params.push(data.respons); }
  if (data.obs !== undefined) { sets.push("obs = ?"); params.push(data.obs); }
  if (data.pin_loja !== undefined) { sets.push("pin_loja = ?"); params.push(data.pin_loja); }
  if (data.categoria !== undefined) { sets.push("categoria = ?"); params.push(data.categoria); }
  if (data.c_storeid !== undefined) { sets.push("c_storeid = ?"); params.push(data.c_storeid); }
  if (data.status !== undefined) { sets.push("status = ?"); params.push(data.status); }

  if (sets.length === 0) {
    console.warn(`[updateLojaParceira] Nenhum campo alterável recebido para seq=${seq}`);
    return false;
  }

  const sql = `UPDATE corpora SET ${sets.join(", ")} WHERE seq = ?`;
  params.push(seq);

  console.log('[updateLojaParceira] Executando query:', sql, 'com parâmetros:', params);
  try {
    const [result] = await pool.query(sql, params);
    const affectedRows = (result as { affectedRows?: number }).affectedRows ?? 0;
    console.log(`[updateLojaParceira] UPDATE concluído para seq=${seq}`, {
      affectedRows,
      elapsedMs: Date.now() - startedAt
    });
    return affectedRows > 0;
  } catch (error) {
    console.error(`[updateLojaParceira] UPDATE falhou para seq=${seq}`, {
      sql,
      params,
      elapsedMs: Date.now() - startedAt,
      error: error instanceof Error
        ? { name: error.name, message: error.message, stack: error.stack }
        : String(error)
    });
    throw error;
  }
}
