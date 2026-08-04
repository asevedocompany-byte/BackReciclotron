import { getLegacyPool } from "../connection.js";
export async function findAllClientes(filters) {
    const pool = getLegacyPool();
    if (!pool)
        return [];
    const params = [];
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
    console.log('[findAllClientes] Executando query:', sql.replace(/\s+/g, ' '), 'com parâmetros:', params);
    const [rows] = await pool.query(sql, params);
    console.log(`[findAllClientes] Query retornou ${Array.isArray(rows) ? rows.length : 0} registros.`);
    if (Array.isArray(rows)) {
        console.log('[findAllClientes] Primeiros 3 registros brutos do banco:\n', JSON.stringify(rows.slice(0, 3), null, 2));
    }
    return rows;
}
export async function findClienteById(memberid) {
    console.log(`[findClienteById] Buscando cliente com ID/memberid: ${memberid}`);
    const pool = getLegacyPool();
    if (!pool)
        return null;
    const [rows] = await pool.query("SELECT * FROM qwclient WHERE memberid = ? LIMIT 1", [memberid]);
    const list = rows;
    console.log(`[findClienteById] Encontrado? ${list.length > 0}`);
    if (list.length > 0) {
        console.log('[findClienteById] Registro bruto do banco:\n', JSON.stringify(list[0], null, 2));
    }
    return list[0] ?? null;
}
export async function countClientes(filters) {
    const pool = getLegacyPool();
    if (!pool)
        return 0;
    const params = [];
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
    const result = rows;
    return result[0]?.total ?? 0;
}
//# sourceMappingURL=clientes.js.map