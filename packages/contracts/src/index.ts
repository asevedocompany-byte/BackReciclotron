import { z } from "zod";

export const roleSchema = z.enum(["super_admin", "operator", "analyst"]);
export const statusSchema = z.enum(["active", "inactive"]);
export const campaignChannelSchema = z.enum(["email", "sms"]);
export const campaignStatusSchema = z.enum(["draft", "scheduled", "sent"]);
export const ledgerTypeSchema = z.enum(["credit", "debit"]);
export const ruleTriggerSchema = z.enum(["user_inactive", "high_points_balance", "manual_event"]);

const auditSchema = z.object({ createdAt: z.string(), updatedAt: z.string() });
const id = z.string().min(1);

export const adminUserSchema = auditSchema.extend({ id, email: z.string().email(), name: z.string().min(2), role: roleSchema, lastLoginAt: z.string().nullable().default(null) });
export const endUserSchema = auditSchema.extend({ id, email: z.string().email(), name: z.string().min(2), city: z.string().min(2), status: statusSchema, pointsBalance: z.number().int(), phone: z.string().nullable().default(null), lastMovementAt: z.string().nullable().default(null) });
export const updateEndUserSchema = z.object({
  firstname: z.string().trim().min(1).max(100),
  lastname: z.string().trim().max(100).default(''),
  email: z.string().trim().email().max(200),
  phonefull: z.string().trim().max(30).nullable().optional(),
  whatsapp: z.string().trim().max(30).nullable().optional(),
  cpf: z.string().trim().max(20).nullable().optional(),
  rg: z.string().trim().max(30).nullable().optional(),
  sex: z.string().trim().max(30).nullable().optional(),
  prof: z.string().trim().max(100).nullable().optional(),
  address: z.string().trim().max(200).nullable().optional(),
  bairro: z.string().trim().max(100).nullable().optional(),
  city: z.string().trim().max(100),
  // O legado documenta UF com 2 caracteres, mas há registros antigos com
  // nome completo do estado. Não rejeitar esses valores durante a edição.
  state: z.string().trim().max(100).nullable().optional(),
  zip: z.string().trim().max(20).nullable().optional(),
  birthday: z.preprocess((value) => {
    if (value === null || value === undefined || value === '') return null;
    const text = String(value).trim();
    const isoDate = text.match(/^(\d{4}-\d{2}-\d{2})/);
    if (isoDate) return isoDate[1];
    const brDate = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (brDate) return `${brDate[3]}-${brDate[2]}-${brDate[1]}`;
    return text;
  }, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de nascimento inválida.').nullable().optional()),
  cact: z.boolean()
});
export const collectionPointSchema = auditSchema.extend({ id, name: z.string().min(2), city: z.string().min(2), description: z.string().min(2), address: z.string().optional(), active: z.boolean().default(true) });
export const partnerStoreSchema = auditSchema.extend({ id, name: z.string().min(2), city: z.string().min(2), description: z.string().optional().default("Sem descrição"), partnershipDetails: z.string().optional(), active: z.boolean().default(true), cnpj: z.string().optional().nullable(), email: z.string().optional().nullable(), address: z.string().optional().nullable(), address2: z.string().optional().nullable(), bairro: z.string().optional().nullable(), zip: z.string().optional().nullable(), state: z.string().optional().nullable(), phone1: z.string().optional().nullable(), phone: z.string().optional().nullable(), phone31: z.string().optional().nullable(), phone3: z.string().optional().nullable(), respons: z.string().optional().nullable(), pinLoja: z.string().optional().nullable(), categoryName: z.string().optional().nullable(), categoria: z.number().optional().nullable(), cStoreId: z.number().optional().nullable(), logoUrl: z.string().optional().nullable() });
export const pointsLedgerEntrySchema = auditSchema.extend({ id, userId: id, type: ledgerTypeSchema, points: z.number().int().positive(), description: z.string().min(2), source: z.string().min(2) });
export const audienceSegmentSchema = auditSchema.extend({ id, name: z.string().min(2), description: z.string().min(2), city: z.string().optional(), status: statusSchema.optional(), minimumPoints: z.number().int().optional(), maximumPoints: z.number().int().optional() });
export const campaignSchema = auditSchema.extend({ id, name: z.string().min(2), channel: campaignChannelSchema, status: campaignStatusSchema, subject: z.string().optional(), message: z.string().min(2), attachments: z.array(z.string()).default([]), segmentId: id.nullable().default(null), estimatedCost: z.number().nonnegative().default(0), providerMessageId: z.string().nullable().default(null), sentAt: z.string().nullable().default(null) });
export const campaignRecipientSchema = z.object({
  id,
  campaignId: id,
  legacyId: z.number().int(),
  email: z.string().email(),
  phone: z.string().nullable().default(null),
  recipientName: z.string().nullable().default(null),
  status: z.enum(["sent", "failed", "pending"]),
  messageId: z.string().nullable().default(null),
  errorReason: z.string().nullable().default(null),
  sentAt: z.string()
});
export const automationRuleSchema = auditSchema.extend({ id, name: z.string().min(2), trigger: ruleTriggerSchema, channel: campaignChannelSchema, template: z.string().min(2), active: z.boolean().default(true), segmentId: id.nullable().default(null) });

export const loginSchema = z.object({ email: z.string().email(), password: z.string().min(4) });
export const createCollectionPointSchema = collectionPointSchema.omit({ id: true, createdAt: true, updatedAt: true });
export const updateCollectionPointSchema = createCollectionPointSchema.partial();
const partnerStoreWriteSchema = partnerStoreSchema.omit({ id: true, createdAt: true, updatedAt: true }).extend({
  name: z.string().trim().min(2, "Nome da empresa deve ter pelo menos 2 caracteres.").max(200),
  city: z.string().trim().min(2, "Cidade é obrigatória.").max(50),
  description: z.string().trim().min(2, "Descrição da parceria é obrigatória.").max(1000),
  active: z.boolean(),
  cnpj: z.string().regex(/^\d{14}$/, "CNPJ deve conter 14 dígitos."),
  email: z.string().trim().email("E-mail inválido.").max(100),
  address: z.string().trim().min(2, "Endereço é obrigatório.").max(100),
  address2: z.string().trim().min(1, "Complemento é obrigatório.").max(50),
  bairro: z.string().trim().min(2, "Bairro é obrigatório.").max(50),
  zip: z.string().regex(/^\d{8}$/, "CEP deve conter 8 dígitos."),
  state: z.string().regex(/^[A-Z]{2}$/, "Estado deve ser informado com 2 letras."),
  phone1: z.string().regex(/^\d{2}$/, "DDD deve conter 2 dígitos."),
  phone: z.string().regex(/^\d{8,9}$/, "Telefone principal inválido."),
  respons: z.string().trim().min(2, "Responsável é obrigatório.").max(100),
  categoria: z.number().int().positive("Selecione uma categoria."),
  phone31: z.string().regex(/^\d{2}$/, "DDD alternativo deve conter 2 dígitos.").nullable().optional(),
  phone3: z.string().regex(/^\d{8,9}$/, "Telefone alternativo inválido.").nullable().optional(),
  cStoreId: z.number().int().positive().nullable().optional(),
  pinLoja: z.string().trim().max(50).nullable().optional()
});
const validateAlternativePhone = (data: { phone31?: string | null; phone3?: string | null }, ctx: z.RefinementCtx) => {
  const hasAlternativeDdd = Boolean(data.phone31);
  const hasAlternativePhone = Boolean(data.phone3);
  if (hasAlternativeDdd !== hasAlternativePhone) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: [hasAlternativeDdd ? "phone3" : "phone31"], message: "Informe o DDD e o telefone alternativo juntos." });
  }
};
export const createPartnerStoreSchema = partnerStoreWriteSchema.superRefine(validateAlternativePhone);
export const updatePartnerStoreSchema = partnerStoreWriteSchema.partial().superRefine(validateAlternativePhone);
export const createLedgerEntrySchema = pointsLedgerEntrySchema.omit({ id: true, createdAt: true, updatedAt: true }).extend({
  createdAt: z.string().optional()
});
export const createCampaignSchema = campaignSchema.omit({ id: true, createdAt: true, updatedAt: true, status: true, providerMessageId: true, sentAt: true }).extend({ status: campaignStatusSchema.optional(), recipientIds: z.array(z.union([z.string(), z.number()])).optional() });
export const createAudienceSegmentSchema = audienceSegmentSchema.omit({ id: true, createdAt: true, updatedAt: true });
export const createAutomationRuleSchema = automationRuleSchema.omit({ id: true, createdAt: true, updatedAt: true });

export type AdminUser = z.infer<typeof adminUserSchema>;
export type EndUser = z.infer<typeof endUserSchema>;
export type UpdateEndUserInput = z.infer<typeof updateEndUserSchema>;
export type CollectionPoint = z.infer<typeof collectionPointSchema>;
export type PartnerStore = z.infer<typeof partnerStoreSchema>;
export type PointsLedgerEntry = z.infer<typeof pointsLedgerEntrySchema>;
export type Campaign = z.infer<typeof campaignSchema>;
export type CampaignRecipient = z.infer<typeof campaignRecipientSchema>;
export type AudienceSegment = z.infer<typeof audienceSegmentSchema>;
export type AutomationRule = z.infer<typeof automationRuleSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateCollectionPointInput = z.infer<typeof createCollectionPointSchema>;
export type UpdateCollectionPointInput = z.infer<typeof updateCollectionPointSchema>;
export type CreatePartnerStoreInput = z.infer<typeof createPartnerStoreSchema>;
export type UpdatePartnerStoreInput = z.infer<typeof updatePartnerStoreSchema>;
export type CreateLedgerEntryInput = z.infer<typeof createLedgerEntrySchema>;
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type CreateAudienceSegmentInput = z.infer<typeof createAudienceSegmentSchema>;
export type CreateAutomationRuleInput = z.infer<typeof createAutomationRuleSchema>;
