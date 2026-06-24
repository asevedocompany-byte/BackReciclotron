import type { CollectionPoint } from "@reciclotron/contracts";
import type { CollectionPointRepository as ICollectionPointRepository } from "@reciclotron/domain";
export declare class CollectionPointRepository implements ICollectionPointRepository {
    private mapToContract;
    findAll(filters?: {
        search?: string;
        status?: boolean;
    }): Promise<CollectionPoint[]>;
    findById(id: string): Promise<CollectionPoint | null>;
    create(data: Omit<CollectionPoint, "id" | "createdAt" | "updatedAt">): Promise<CollectionPoint>;
    update(id: string, data: Partial<Omit<CollectionPoint, "id" | "createdAt" | "updatedAt">>): Promise<CollectionPoint | null>;
    delete(id: string): Promise<boolean>;
}
