import { findAllClientes, findClienteById } from "../legacy-db/queries/clientes.js";
import { getLegacyPool } from "../legacy-db/connection.js";
function safeIsoDate(val) {
    if (!val)
        return new Date().toISOString();
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
export class EndUserRepository {
    async mapToContract(item) {
        if (String(item.memberid) === "3041") {
            console.log("RAW CLIENT 3041:", JSON.stringify(item, null, 2));
        }
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
            createdAt: safeIsoDate(item.datesince),
            updatedAt: safeIsoDate(item.datesince)
        };
    }
    async findAll() {
        const startedAt = Date.now();
        console.info("[EndUserRepository] findAll called");
        try {
            console.info("[EndUserRepository] findAll querying legacy clientes");
            const items = await findAllClientes();
            console.info("[EndUserRepository] findAll legacy query completed", {
                rowsCount: items.length,
                elapsedMs: Date.now() - startedAt
            });
            const mapStartedAt = Date.now();
            const mapped = await Promise.all(items.map((item) => this.mapToContract(item)));
            console.info("[EndUserRepository] findAll mapping completed", {
                count: mapped.length,
                elapsedMs: Date.now() - mapStartedAt,
                totalElapsedMs: Date.now() - startedAt
            });
            return mapped;
        }
        catch (err) {
            console.error("[EndUserRepository] findAll failed", {
                error: err instanceof Error ? { name: err.name, message: err.message } : String(err),
                elapsedMs: Date.now() - startedAt
            });
            throw err;
        }
    }
    async findById(id) {
        const startedAt = Date.now();
        console.info("[EndUserRepository] findById called", { id });
        const seq = Number(id);
        if (isNaN(seq)) {
            return null;
        }
        try {
            console.info("[EndUserRepository] findById querying legacy cliente", { id, seq });
            const item = await findClienteById(seq);
            if (!item)
                return null;
            console.info("[EndUserRepository] findById found record", {
                id,
                elapsedMs: Date.now() - startedAt
            });
            return this.mapToContract(item);
        }
        catch (err) {
            console.error("[EndUserRepository] findById failed", {
                id,
                error: err instanceof Error ? { name: err.name, message: err.message } : String(err),
                elapsedMs: Date.now() - startedAt
            });
            throw err;
        }
    }
    async findByIds(ids) {
        const startedAt = Date.now();
        console.info("[EndUserRepository] findByIds called", { idsCount: ids.length, idsSample: ids.slice(0, 10) });
        if (ids.length === 0)
            return [];
        const pool = getLegacyPool();
        if (!pool)
            return [];
        const placeholders = ids.map(() => "?").join(",");
        console.info("[EndUserRepository] findByIds querying legacy database", {
            placeholdersCount: ids.length
        });
        const [rows] = await pool.query(`SELECT * FROM qwclient WHERE memberid IN (${placeholders})`, ids);
        console.info("[EndUserRepository] findByIds completed", {
            rowsCount: rows.length,
            elapsedMs: Date.now() - startedAt
        });
        return Promise.all(rows.map((item) => this.mapToContract(item)));
    }
    async update(user) {
        throw new Error("Operações de escrita (atualização) não são permitidas no banco de dados legado (somente leitura).");
    }
}
//# sourceMappingURL=end-user.repository.js.map