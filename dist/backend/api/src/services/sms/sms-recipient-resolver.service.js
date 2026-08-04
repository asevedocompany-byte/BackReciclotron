import { EndUserService } from "../end-user.service.js";
import { tryNormalizeSmsPhone } from "./sms-normalizer.js";
export class SmsRecipientResolverService {
    app;
    static cache = new Map();
    static cacheTtlMs = 5 * 60 * 1000;
    constructor(app) {
        this.app = app;
    }
    async resolveByIds(recipientIds) {
        console.info("[SmsRecipientResolver] resolveByIds called", {
            recipientIdsCount: recipientIds.length,
            recipientIdsSample: recipientIds.slice(0, 10)
        });
        const numericIds = Array.from(new Set(recipientIds
            .map((id) => Number(String(id).trim()))
            .filter((id) => Number.isInteger(id) && id > 0)));
        console.info("[SmsRecipientResolver] normalized ids", {
            numericIdsCount: numericIds.length,
            numericIdsSample: numericIds.slice(0, 10)
        });
        if (numericIds.length === 0) {
            console.info("[SmsRecipientResolver] no valid ids after normalization");
            return [];
        }
        const usersById = new Map();
        const now = Date.now();
        const cachedUsers = [];
        const missingIds = [];
        for (const legacyId of numericIds) {
            const cached = SmsRecipientResolverService.cache.get(String(legacyId));
            if (cached && cached.expiresAt > now) {
                console.info("[SmsRecipientResolver] cache hit", { legacyId });
                cachedUsers.push(cached.value);
                continue;
            }
            console.info("[SmsRecipientResolver] cache miss", { legacyId });
            missingIds.push(legacyId);
        }
        for (const user of cachedUsers) {
            usersById.set(Number(user.id), user);
        }
        if (missingIds.length > 0) {
            console.info("[SmsRecipientResolver] loading users from cached list", {
                missingIdsCount: missingIds.length,
                missingIdsSample: missingIds.slice(0, 10)
            });
            const listService = new EndUserService(this.app);
            const list = await listService.list();
            console.info("[SmsRecipientResolver] cached list loaded", { totalUsers: list.length });
            for (const user of list) {
                const legacyId = Number(user.id);
                if (missingIds.includes(legacyId)) {
                    console.info("[SmsRecipientResolver] user resolved from cached list", {
                        legacyId,
                        hasPhone: Boolean(user.phone)
                    });
                    usersById.set(legacyId, user);
                    SmsRecipientResolverService.cache.set(String(legacyId), {
                        value: user,
                        expiresAt: Date.now() + SmsRecipientResolverService.cacheTtlMs
                    });
                }
            }
        }
        const stillMissingIds = numericIds.filter((legacyId) => !usersById.has(legacyId));
        if (stillMissingIds.length > 0 && this.app.container.legacyEndUsers) {
            console.info("[SmsRecipientResolver] falling back to legacy repository", {
                stillMissingIdsCount: stillMissingIds.length,
                stillMissingIdsSample: stillMissingIds.slice(0, 10)
            });
            const fallbackUsers = await this.app.container.legacyEndUsers.findByIds(stillMissingIds);
            console.info("[SmsRecipientResolver] legacy repository returned", {
                fallbackUsersCount: fallbackUsers.length
            });
            for (const user of fallbackUsers) {
                const legacyId = Number(user.id);
                console.info("[SmsRecipientResolver] user resolved from legacy repository", {
                    legacyId,
                    hasPhone: Boolean(user.phone)
                });
                usersById.set(legacyId, user);
                SmsRecipientResolverService.cache.set(String(legacyId), {
                    value: user,
                    expiresAt: Date.now() + SmsRecipientResolverService.cacheTtlMs
                });
            }
        }
        return numericIds
            .map((legacyId) => {
            const user = usersById.get(legacyId);
            if (!user) {
                console.info("[SmsRecipientResolver] user not found", { legacyId });
                return null;
            }
            const { phoneE164, normalizationError } = tryNormalizeSmsPhone(user.phone);
            console.info("[SmsRecipientResolver] phone normalized", {
                legacyId,
                phoneRaw: user.phone ?? null,
                phoneE164,
                normalizationError
            });
            return {
                legacyId,
                phoneRaw: user.phone ?? null,
                phoneE164,
                email: user.email,
                recipientName: user.name ?? null,
                user,
                isValid: Boolean(phoneE164),
                normalizationError
            };
        })
            .filter((item) => item !== null);
    }
}
//# sourceMappingURL=sms-recipient-resolver.service.js.map