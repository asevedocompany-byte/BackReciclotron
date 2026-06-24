export declare class PointsLedgerRepository {
    getUserBalance(memberId: number): Promise<number>;
    private mapToContract;
    findAll(): Promise<any[]>;
}
