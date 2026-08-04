import { AppError } from "../../shared/errors/app-error.js";
export declare class SmsError extends AppError {
}
export declare class SmsNormalizationError extends SmsError {
    constructor(message?: string, details?: unknown);
}
export declare class SmsDispatchError extends SmsError {
    constructor(message?: string, details?: unknown);
}
export declare class SmsQueueError extends SmsError {
    constructor(message?: string, details?: unknown);
}
