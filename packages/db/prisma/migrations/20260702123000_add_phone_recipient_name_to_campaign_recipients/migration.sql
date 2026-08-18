-- Add contact metadata for campaign recipients so SMS history can display phone and name.
ALTER TABLE "campaign_recipients"
ADD COLUMN IF NOT EXISTS "phone" TEXT,
ADD COLUMN IF NOT EXISTS "recipientName" TEXT;
