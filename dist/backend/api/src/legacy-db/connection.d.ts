import mysql from "mysql2/promise";
/**
 * Cria (ou retorna) o pool de conexões com o banco MySQL legado do cliente.
 * Lê automaticamente as variáveis de ambiente LEGACY_DB_*.
 * Retorna null se as variáveis não estiverem configuradas.
 */
export declare function createLegacyPool(): mysql.Pool | null;
/** Retorna o pool existente (null se não inicializado) */
export declare function getLegacyPool(): mysql.Pool | null;
/** Encerra o pool de conexões (chamar no shutdown da API) */
export declare function closeLegacyPool(): Promise<void>;
