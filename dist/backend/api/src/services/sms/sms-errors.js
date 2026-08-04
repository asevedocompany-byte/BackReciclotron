import { AppError } from "../../shared/errors/app-error.js";
export class SmsError extends AppError {
}
export class SmsNormalizationError extends SmsError {
    constructor(message = "Telefone invalido para envio de SMS.", details) {
        super(400, message, details);
    }
}
export class SmsDispatchError extends SmsError {
    constructor(message = "Falha ao enviar SMS.", details) {
        super(502, message, details);
    }
}
export class SmsQueueError extends SmsError {
    constructor(message = "Falha na fila de SMS.", details) {
        super(500, message, details);
    }
}
//# sourceMappingURL=sms-errors.js.map