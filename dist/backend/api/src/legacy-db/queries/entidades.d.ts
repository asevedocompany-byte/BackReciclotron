import type { Entidade } from "../schema.js";
export declare function findAllEntidades(filters?: {
    search?: string;
    ativa?: boolean;
}): Promise<Entidade[]>;
export declare function findEntidadeById(en_seq: number): Promise<Entidade | null>;
