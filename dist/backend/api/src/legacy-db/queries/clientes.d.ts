import type { QwClient } from "../schema.js";
export declare function findAllClientes(filters?: {
    search?: string;
    ativo?: boolean;
    limit?: number;
    offset?: number;
}): Promise<QwClient[]>;
export declare function findClienteById(memberid: number): Promise<QwClient | null>;
export declare function countClientes(filters?: {
    search?: string;
    ativo?: boolean;
}): Promise<number>;
