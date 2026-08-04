export declare class AppError extends Error {
    statusCode: number;
    details?: unknown | undefined;
    constructor(statusCode: number, message: string, details?: unknown | undefined);
}
