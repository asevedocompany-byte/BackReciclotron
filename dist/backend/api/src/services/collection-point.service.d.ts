import type { FastifyInstance } from "fastify";
import type { CreateCollectionPointInput, UpdateCollectionPointInput } from "@reciclotron/contracts";
export declare class CollectionPointService {
    private app;
    private repository;
    constructor(app: FastifyInstance);
    list(filters?: {
        search?: string;
        status?: boolean;
    }): Promise<{
        active: boolean;
        createdAt: string;
        updatedAt: string;
        id: string;
        name: string;
        city: string;
        description: string;
        address?: string | undefined;
    }[]>;
    findById(id: string): Promise<{
        active: boolean;
        createdAt: string;
        updatedAt: string;
        id: string;
        name: string;
        city: string;
        description: string;
        address?: string | undefined;
    } | null>;
    create(input: CreateCollectionPointInput): Promise<{
        active: boolean;
        createdAt: string;
        updatedAt: string;
        id: string;
        name: string;
        city: string;
        description: string;
        address?: string | undefined;
    }>;
    update(id: string, input: UpdateCollectionPointInput): Promise<{
        active: boolean;
        createdAt: string;
        updatedAt: string;
        id: string;
        name: string;
        city: string;
        description: string;
        address?: string | undefined;
    } | null>;
    delete(id: string): Promise<boolean>;
}
