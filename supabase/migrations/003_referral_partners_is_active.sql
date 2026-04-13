-- ============================================================
-- Migration 003: Add is_active to referral_partners
-- Deactivated partners retain data but cannot log in.
-- Safe to re-run.
-- ============================================================

ALTER TABLE referral_partners
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS referral_partners_is_active_idx
  ON referral_partners (is_active);
