import { SmsNormalizationError } from "./sms-errors.js";
function extractDigits(input) {
    return input.replace(/\D+/g, "");
}
export function normalizeSmsPhone(value, defaultCountryCode = "55") {
    const raw = value?.trim() ?? "";
    if (!raw)
        return null;
    if (raw.startsWith("+")) {
        const digits = extractDigits(raw);
        if (digits.length < 8) {
            throw new SmsNormalizationError("Telefone internacional muito curto.");
        }
        return `+${digits}`;
    }
    const digits = extractDigits(raw);
    if (!digits)
        return null;
    if (digits.length === 10 || digits.length === 11) {
        return `+${defaultCountryCode}${digits}`;
    }
    if (digits.length > 11 && digits.length <= 15) {
        return `+${digits}`;
    }
    throw new SmsNormalizationError("Nao foi possivel normalizar o telefone para E.164.", {
        value: raw
    });
}
export function tryNormalizeSmsPhone(value, defaultCountryCode = "55") {
    try {
        return {
            phoneE164: normalizeSmsPhone(value, defaultCountryCode),
            normalizationError: null
        };
    }
    catch (error) {
        return {
            phoneE164: null,
            normalizationError: error instanceof Error ? error.message : String(error)
        };
    }
}
//# sourceMappingURL=sms-normalizer.js.map