import type { CorporaWithCategory, CategParceiro } from "../schema.js";
export declare function findAllLojasParceiras(filters?: {
    search?: string;
    ativa?: boolean;
    limit?: number;
    offset?: number;
}): Promise<CorporaWithCategory[]>;
export declare function findLojaParceiraById(seq: number): Promise<CorporaWithCategory | null>;
export declare function countLojasParceiras(filters?: {
    ativa?: boolean;
}): Promise<number>;
export declare function findAllCategoriasParceiro(): Promise<CategParceiro[]>;
export declare function updateLojaParceira(seq: number, data: {
    empresa?: string;
    city?: string;
    cnpj?: string | null;
    aemail?: string | null;
    address?: string | null;
    state?: string | null;
    pin_loja?: string | null;
    categoria?: number | null;
    c_storeid?: number | null;
    status?: number;
}): Promise<boolean>;
