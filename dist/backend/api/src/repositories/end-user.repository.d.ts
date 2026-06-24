import type { EndUser } from "@reciclotron/contracts";
import type { EndUserRepository as IEndUserRepository } from "@reciclotron/domain";
export declare class EndUserRepository implements IEndUserRepository {
    private mapToContract;
    findAll(): Promise<EndUser[]>;
    findById(id: string): Promise<EndUser | null>;
    findByIds(ids: number[]): Promise<EndUser[]>;
    update(user: EndUser): Promise<EndUser>;
}
