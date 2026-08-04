export declare class PointsLedgerRepository {
    private static readonly balanceCache;
    private static readonly balancePending;
    private static readonly balanceCacheTtlMs;
    static invalidateBalanceCache(memberId?: number): void;
    getUserBalance(memberId: number): Promise<number>;
    getUsersBalances(memberIds: number[]): Promise<Map<number, number>>;
    private mapToContract;
    findAll(filters?: {
        userId?: string;
        limit?: number;
        offset?: number;
    }): Promise<any[]>;
    findLatestByUser(): Promise<any[]>;
}
