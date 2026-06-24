import type { PartnerStore } from "@reciclotron/contracts";
import type { PartnerStoreRepository as IPartnerStoreRepository } from "@reciclotron/domain";
export declare class PartnerStoreRepository implements IPartnerStoreRepository {
    private mapToContract;
    findAll(filters?: {
        search?: string;
        status?: boolean;
    }): Promise<PartnerStore[]>;
    findById(id: string): Promise<PartnerStore | null>;
    create(data: Omit<PartnerStore, "id" | "createdAt" | "updatedAt">): Promise<PartnerStore>;
    update(id: string, data: Partial<Omit<PartnerStore, "id" | "createdAt" | "updatedAt">>): Promise<PartnerStore | null>;
    delete(id: string): Promise<boolean>;
    findAllCategories(): Promise<Array<{
        id: number;
        name: string;
    }>>;
}
