-- ============================================================
-- Migration 005: Add current_section to assessments
-- Tracks which step the client is on (powers resume + progress display).
-- Safe to re-run.
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assessments' AND column_name = 'current_section'
  ) THEN
    ALTER TABLE assessments
      ADD COLUMN current_section text NOT NULL DEFAULT 'intake'
        CHECK (current_section IN ('intake', 'layer1', 'layer2', 'complete'));
  END IF;
END
$$;

-- Back-fill existing rows based on status so admin list progress looks sane
-- for assessments created before this migration.
UPDATE assessments
   SET current_section = 'complete'
 WHERE status = 'completed'
   AND current_section = 'intake';
