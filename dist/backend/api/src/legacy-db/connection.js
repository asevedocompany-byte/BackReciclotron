import mysql from "mysql2/promise";
import { z } from "zod";
// ── Validação das env vars do banco legado ────────────────────────────────────
const legacyEnvSchema = z.object({
    LEGACY_DB_HOST: z.string().min(1),
    LEGACY_DB_PORT: z.coerce.number().default(3306),
    LEGACY_DB_NAME: z.string().min(1),
    LEGACY_DB_USER: z.string().min(1),
    LEGACY_DB_PASSWORD: z.string()
});
// ── Pool singleton ────────────────────────────────────────────────────────────
let pool = null;
/**
 * Cria (ou retorna) o pool de conexões com o banco MySQL legado do cliente.
 * Lê automaticamente as variáveis de ambiente LEGACY_DB_*.
 * Retorna null se as variáveis não estiverem configuradas.
 */
export function createLegacyPool() {
    if (pool)
        return pool;
    const parsed = legacyEnvSchema.safeParse(process.env);
    if (!parsed.success) {
        console.warn("[legacy-db] Variáveis LEGACY_DB_* ausentes ou inválidas — banco legado desativado.");
        return null;
    }
    const { LEGACY_DB_HOST, LEGACY_DB_PORT, LEGACY_DB_NAME, LEGACY_DB_USER, LEGACY_DB_PASSWORD } = parsed.data;
    pool = mysql.createPool({
        host: LEGACY_DB_HOST,
        port: LEGACY_DB_PORT,
        database: LEGACY_DB_NAME,
        user: LEGACY_DB_USER,
        password: LEGACY_DB_PASSWORD,
        waitForConnections: true,
        connectionLimit: 1, // Limite estrito de 1 conexão para evitar bloqueio por concorrência no KingHost
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
        timezone: "+00:00"
    });
    console.info(`[legacy-db] Pool MySQL inicializado → ${LEGACY_DB_HOST}/${LEGACY_DB_NAME}`);
    return pool;
}
/** Retorna o pool existente (null se não inicializado) */
export function getLegacyPool() {
    return pool;
}
/** Encerra o pool de conexões (chamar no shutdown da API) */
export async function closeLegacyPool() {
    if (pool) {
        await pool.end();
        pool = null;
        console.info("[legacy-db] Pool MySQL encerrado.");
    }
}
//# sourceMappingURL=connection.js.map