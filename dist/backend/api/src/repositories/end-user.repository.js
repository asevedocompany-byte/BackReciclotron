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
        console.info("[EndUserRepository] findAll called");
        try {
            const items = await findAllClientes();
            const mapped = await Promise.all(items.map((item) => this.mapToContract(item)));
            console.info("[EndUserRepository] findAll completed", { count: mapped.length });
            return mapped;
        }
        catch (err) {
            throw err;
        }
    }
    async findById(id) {
        console.info("[EndUserRepository] findById called", { id });
        const seq = Number(id);
        if (isNaN(seq)) {
            return null;
        }
        try {
            const item = await findClienteById(seq);
            if (!item)
                return null;
            console.info("[EndUserRepository] findById found record", { id });
            return this.mapToContract(item);
        }
        catch (err) {
            throw err;
        }
    }
    async findByIds(ids) {
        console.info("[EndUserRepository] findByIds called", { idsCount: ids.length });
        if (ids.length === 0)
            return [];
        const pool = getLegacyPool();
        if (!pool)
            return [];
        const placeholders = ids.map(() => "?").join(",");
        const [rows] = await pool.query(`SELECT * FROM qwclient WHERE memberid IN (${placeholders})`, ids);
        console.info("[EndUserRepository] findByIds completed", { rowsCount: rows.length });
        return Promise.all(rows.map((item) => this.mapToContract(item)));
    }
    async update(user) {
        throw new Error("Operações de escrita (atualização) não são permitidas no banco de dados legado (somente leitura).");
    }
}
//# sourceMappingURL=end-user.repository.js.map