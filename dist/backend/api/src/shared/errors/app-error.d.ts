export declare class AppError extends Error {
    statusCode: number;
    constructor(statusCode: number, message: string);
}
