export declare function normalizeSmsPhone(value: string | null | undefined, defaultCountryCode?: string): string | null;
export declare function tryNormalizeSmsPhone(value: string | null | undefined, defaultCountryCode?: string): {
    phoneE164: string | null;
    normalizationError: null;
} | {
    phoneE164: null;
    normalizationError: string;
};
