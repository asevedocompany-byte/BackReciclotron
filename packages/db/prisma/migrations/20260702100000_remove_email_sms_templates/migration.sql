-- Align historical schema with the current model and remove template tables.
ALTER TABLE "audience_segments"
ADD COLUMN IF NOT EXISTS "maximumPoints" INTEGER;

DROP TABLE IF EXISTS "email_templates";
DROP TABLE IF EXISTS "sms_templates";
