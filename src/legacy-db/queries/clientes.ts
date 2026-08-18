import { getLegacyPool } from "../connection.js";
import type { QwClient } from "../schema.js"; 

const ADMIN_FIELDS_MARKER = "\n[reciclotron-admin-fields]";

export type LegacyAdminFields = {
  whatsapp?: string | null;
  rg?: string | null;
  sex?: string | null;
  prof?: string | null;
};

export function readLegacyAdminFields(info: unknown): LegacyAdminFields {
  const text = String(info ?? "");
  const markerIndex = text.indexOf(ADMIN_FIELDS_MARKER);
  if (markerIndex === -1) return {};

  try {
    return JSON.parse(text.slice(markerIndex + ADMIN_FIELDS_MARKER.length)) as LegacyAdminFields;
  } catch {
    return {};
  }
}

function writeLegacyAdminFields(info: unknown, fields: LegacyAdminFields) {
  const text = String(info ?? "");
  const markerIndex = text.indexOf(ADMIN_FIELDS_MARKER);
  const originalInfo = (markerIndex === -1 ? text : text.slice(0, markerIndex)).trimEnd();
  const hasFields = Object.values(fields).some((value) => value !== null && value !== undefined && value !== "");
  return hasFields
    ? `${originalInfo}${ADMIN_FIELDS_MARKER}${JSON.stringify(fields)}`
    : originalInfo;
}

export async function findAllClientes(filters?: {
  search?: string;
  ativo?: boolean;
  limit?: number;
  offset?: number;
}): Promise<QwClient[]> {
  const pool = getLegacyPool();
  if (!pool) return [];

  const params: unknown[] = [];

  let sql = "SELECT * FROM qwclient WHERE 1=1";

  if (filters?.search) {
    sql += " AND (firstname LIKE ? OR lastname LIKE ? OR email LIKE ? OR cpf LIKE ?)";
    const term = `%${filters.search}%`;
    params.push(term, term, term, term);
  }

  if (filters?.ativo !== undefined) {
    sql += " AND cact = ?";
    params.push(filters.ativo ? 1 : 0);
  }

  sql += " ORDER BY datesince DESC";

  // Paginação somente quando solicitada explicitamente. A listagem principal
  // precisa retornar todos os clientes do banco legado.
  if (filters?.limit !== undefined) {
    sql += " LIMIT ? OFFSET ?";
    params.push(filters.limit, filters.offset ?? 0);
  }

  const [rows] = await pool.query(sql, params);
  return rows as QwClient[];
}

export async function findClienteById(memberid: number): Promise<QwClient | null> {
  const pool = getLegacyPool();
  if (!pool) return null;

  const [rows] = await pool.query(
    "SELECT * FROM qwclient WHERE memberid = ? LIMIT 1",
    [memberid]
  );
  const list = rows as QwClient[];
  return list[0] ?? null;
}

export async function updateCliente(memberid: number, data: {
  firstname: string;
  lastname: string;
  email: string;
  phonefull?: string | null;
  cpf?: string | null;
  address?: string | null;
  bairro?: string | null;
  city: string;
  state?: string | null;
  zip?: string | null;
  birthday?: string | null;
  whatsapp?: string | null;
  rg?: string | null;
  sex?: string | null;
  prof?: string | null;
  info?: string | null;
  cact: boolean;
}): Promise<boolean> {
  const pool = getLegacyPool();
  if (!pool) return false;

  const [result] = await pool.query(
    `UPDATE qwclient
     SET firstname = ?, lastname = ?, email = ?, phonefull = ?, cpf = ?,
         address = ?, bairro = ?, city = ?, state = ?, zip = ?, birthday = ?, info = ?, cact = ?
     WHERE memberid = ?`,
    [
      data.firstname,
      data.lastname,
      data.email,
      data.phonefull ?? '',
      data.cpf ?? '',
      data.address ?? '',
      data.bairro ?? '',
      data.city,
      data.state ?? '',
      data.zip ?? '',
      data.birthday || null,
      writeLegacyAdminFields(data.info, {
        whatsapp: data.whatsapp ?? null,
        rg: data.rg ?? null,
        sex: data.sex ?? null,
        prof: data.prof ?? null
      }),
      data.cact ? 1 : 0,
      memberid
    ]
  );

  return Number((result as { affectedRows?: number }).affectedRows ?? 0) > 0;
}

export async function countClientes(filters?: {
  search?: string;
  ativo?: boolean;
}): Promise<number> {
  const pool = getLegacyPool();
  if (!pool) return 0;

  const params: unknown[] = [];
  let sql = "SELECT COUNT(*) AS total FROM qwclient WHERE 1=1";

  if (filters?.search) {
    sql += " AND (firstname LIKE ? OR lastname LIKE ? OR email LIKE ? OR cpf LIKE ?)";
    const term = `%${filters.search}%`;
    params.push(term, term, term, term);
  }

  if (filters?.ativo !== undefined) {
    sql += " AND cact = ?";
    params.push(filters.ativo ? 1 : 0);
  }

  const [rows] = await pool.query(sql, params);
  const result = rows as Array<{ total: number }>;
  return result[0]?.total ?? 0;
}
