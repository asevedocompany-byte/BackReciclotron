import type { EndUser, UpdateEndUserInput } from "@reciclotron/contracts";
import type { EndUserRepository as IEndUserRepository } from "@reciclotron/domain";
import { findAllClientes, findClienteById, readLegacyAdminFields, updateCliente } from "../legacy-db/queries/clientes.js";
import { getLegacyPool } from "../legacy-db/connection.js";
import type { QwClient } from "../legacy-db/schema.js";

function safeIsoDate(val: unknown): string {
  if (!val) return new Date().toISOString();
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? new Date().toISOString() : val.toISOString();
  }
  const str = String(val).trim();
  if (!str || str.startsWith("0000-00-00")) {
    return new Date().toISOString();
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

export class EndUserRepository implements IEndUserRepository {
  private async mapToContract(item: QwClient): Promise<EndUser> {
    const adminFields = readLegacyAdminFields(item.info);
    return {
      ...item,
      id: String(item.memberid),
      email: item.email || "",
      name: `${item.firstname || ""} ${item.lastname || ""}`.trim() || "Sem Nome",
      city: item.city || "Sem Cidade",
      state: item.state || "Sem Estado",
      status: item.cact === 1 ? "active" : "inactive",
      pointsBalance: 0,
      phone: item.phonefull || item.phone1 || null,
      info: item.info || '',
      whatsapp: adminFields.whatsapp ?? null,
      rg: adminFields.rg ?? null,
      sex: adminFields.sex ?? null,
      prof: adminFields.prof ?? null,
      createdAt: safeIsoDate(item.datesince),
      updatedAt: safeIsoDate(item.datesince)
    } as any;
  }

  async findAll(): Promise<EndUser[]> {
    const startedAt = Date.now();
    try {
      const items = await findAllClientes();
      const mapStartedAt = Date.now();
      const mapped = await Promise.all(items.map((item) => this.mapToContract(item)));
      return mapped;
    } catch (err) {
      console.error("[EndUserRepository] findAll failed", {
        error: err instanceof Error ? { name: err.name, message: err.message } : String(err),
        elapsedMs: Date.now() - startedAt
      });
      throw err;
    }
  }

  async findById(id: string): Promise<EndUser | null> {
    const startedAt = Date.now();
    const seq = Number(id);
    if (isNaN(seq)) {
      return null;
    }
    try {
      const item = await findClienteById(seq);
      if (!item) return null;
      return this.mapToContract(item);
    } catch (err) {
      console.error("[EndUserRepository] findById failed", {
        id,
        error: err instanceof Error ? { name: err.name, message: err.message } : String(err),
        elapsedMs: Date.now() - startedAt
      });
      throw err;
    }
  }

  async findByIds(ids: number[]): Promise<EndUser[]> {
    const startedAt = Date.now();
    console.info("[EndUserRepository] findByIds called", { idsCount: ids.length, idsSample: ids.slice(0, 10) });
    if (ids.length === 0) return [];
    const pool = getLegacyPool();
    if (!pool) return [];
    const placeholders = ids.map(() => "?").join(",");
    console.info("[EndUserRepository] findByIds querying legacy database", {
      placeholdersCount: ids.length
    });
    const [rows] = await pool.query(
      `SELECT * FROM qwclient WHERE memberid IN (${placeholders})`,
      ids
    );
    console.info("[EndUserRepository] findByIds completed", {
      rowsCount: (rows as QwClient[]).length,
      elapsedMs: Date.now() - startedAt
    });
    return Promise.all((rows as QwClient[]).map((item) => this.mapToContract(item)));
  }

  async update(user: EndUser & UpdateEndUserInput): Promise<EndUser> {
    const memberid = Number(user.id);
    if (!Number.isInteger(memberid)) return user;

    await updateCliente(memberid, user);
    const updated = await this.findById(String(memberid));
    if (!updated) throw new Error(`Usuário ${memberid} não foi encontrado após a atualização.`);
    return updated;
  }

}
