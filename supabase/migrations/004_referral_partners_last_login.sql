-- ============================================================
-- Migration 004: Add last_login to referral_partners
-- Tracks the most recent successful login per partner.
-- Safe to re-run.
-- ============================================================

ALTER TABLE referral_partners
  ADD COLUMN IF NOT EXISTS last_login timestamptz;
