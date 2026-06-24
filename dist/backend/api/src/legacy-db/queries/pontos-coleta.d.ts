import type { Store } from "../schema.js";
export declare function findAllPontosColeta(filters?: {
    search?: string;
    ativa?: boolean;
    limit?: number;
    offset?: number;
}): Promise<Store[]>;
export declare function findPontoColetaById(storeid: number): Promise<Store | null>;
export declare function countPontosColeta(filters?: {
    ativa?: boolean;
}): Promise<number>;
