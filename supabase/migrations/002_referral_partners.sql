-- ============================================================
-- Migration 002: Referral partners table + FK on assessments
-- Safe to re-run if a prior attempt partially succeeded.
-- ============================================================

-- ─── referral_partners table ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS referral_partners (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name            text NOT NULL,
  email           text NOT NULL,
  company         text,
  city            text,
  sf_team_region  text
    CHECK (sf_team_region IN ('SMB', 'Mid-Market', 'Enterprise', 'Strategic')),
  notes           text,
  created_at      timestamptz DEFAULT now() NOT NULL,
  updated_at      timestamptz DEFAULT now() NOT NULL
);

DROP TRIGGER IF EXISTS referral_partners_updated_at ON referral_partners;
CREATE TRIGGER referral_partners_updated_at
  BEFORE UPDATE ON referral_partners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS referral_partners_email_idx ON referral_partners (email);
CREATE INDEX IF NOT EXISTS referral_partners_name_idx  ON referral_partners (name);

-- ─── assessments: add FK, drop ae_* columns ──────────────────────────────────
-- NOTE: this must happen BEFORE the RLS policy below, which references
--       assessments.referral_partner_id.

ALTER TABLE assessments
  ADD COLUMN IF NOT EXISTS referral_partner_id uuid
    REFERENCES referral_partners(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS assessments_referral_partner_id_idx
  ON assessments (referral_partner_id);

DROP INDEX IF EXISTS assessments_ae_email_idx;

ALTER TABLE assessments
  DROP COLUMN IF EXISTS ae_name,
  DROP COLUMN IF EXISTS ae_email,
  DROP COLUMN IF EXISTS ae_region,
  DROP COLUMN IF EXISTS ae_notes;

-- ─── Row Level Security on referral_partners ────────────────────────────────

ALTER TABLE referral_partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "img_team_full_access_referral_partners" ON referral_partners;
CREATE POLICY "img_team_full_access_referral_partners" ON referral_partners
  FOR ALL
  USING (is_img_user())
  WITH CHECK (is_img_user());

DROP POLICY IF EXISTS "public_read_linked_referral_partner" ON referral_partners;
CREATE POLICY "public_read_linked_referral_partner" ON referral_partners
  FOR SELECT
  USING (
    auth.role() = 'anon'
    AND EXISTS (
      SELECT 1 FROM assessments a
      WHERE a.referral_partner_id = referral_partners.id
        AND a.token = (current_setting('request.jwt.claims', true)::jsonb ->> 'assessment_token')::uuid
    )
  );
