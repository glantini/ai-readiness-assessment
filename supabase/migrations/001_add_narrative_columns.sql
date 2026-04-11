-- ============================================================
-- Migration 001: Add AI narrative columns to reports table
-- Run this in your Supabase SQL Editor
-- ============================================================

ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS ai_narrative_json        jsonb,
  ADD COLUMN IF NOT EXISTS agentforce_narrative_json jsonb,
  ADD COLUMN IF NOT EXISTS report_status            text DEFAULT 'draft'
    CHECK (report_status IN ('draft', 'approved'));
