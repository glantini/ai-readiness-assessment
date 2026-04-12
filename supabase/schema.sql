-- ============================================================
-- AI & Agentforce Readiness Assessment — Database Schema
-- Run against your Supabase project via the SQL Editor
-- ============================================================

-- Enable pgcrypto for gen_random_uuid() (already enabled on Supabase)
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── assessments ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS assessments (
  id      uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  token   uuid DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  status  text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed')),

  -- Contact info (collected from client on the public assess route)
  contact_first_name  text,
  contact_last_name   text,
  contact_title       text,
  contact_email       text,
  contact_phone       text,
  contact_linkedin    text,

  -- Company info
  company_name         text,
  company_industry     text,
  company_size         text,
  company_revenue      text,
  company_headquarters text,
  company_website      text,

  -- AI context
  ai_motivation    text,
  ai_current_usage text,
  uses_salesforce  boolean,
  salesforce_edition text,
  salesforce_clouds  text[],   -- e.g. '{SalesCloud,ServiceCloud}'

  -- AE info (internal only — never returned to public token routes)
  ae_name   text,
  ae_email  text,
  ae_region text,
  ae_notes  text,

  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Auto-update updated_at on any row change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER assessments_updated_at
  BEFORE UPDATE ON assessments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── responses ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS responses (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id uuid REFERENCES assessments(id) ON DELETE CASCADE NOT NULL,
  question_id   text NOT NULL,
  layer         text NOT NULL
    CHECK (layer IN ('snapshot', 'layer1', 'layer2')),
  -- boolean for checkbox | 1-5 integer for scale | 'yes'/'partial'/'no' for yesno
  value         jsonb NOT NULL,
  created_at    timestamptz DEFAULT now() NOT NULL,

  UNIQUE (assessment_id, question_id)
);

CREATE INDEX IF NOT EXISTS responses_assessment_id_idx
  ON responses (assessment_id);

CREATE INDEX IF NOT EXISTS responses_layer_idx
  ON responses (assessment_id, layer);

-- ─── reports ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS reports (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id uuid REFERENCES assessments(id) ON DELETE CASCADE UNIQUE NOT NULL,

  -- Scored output from /lib/scoring.ts
  layer1_scores  jsonb,
  layer2_scores  jsonb,
  product_scores jsonb,
  overall_tier   text,

  generated_at  timestamptz DEFAULT now() NOT NULL,
  pdf_url       text,   -- populated after PDF generation via /api/reports/[id]/pdf

  -- AI narrative columns — added by migration 001_add_narrative_columns.sql
  -- Run: ALTER TABLE reports ADD COLUMN IF NOT EXISTS ai_narrative_json jsonb, ...
  ai_narrative_json         jsonb,
  agentforce_narrative_json jsonb,
  report_status             text DEFAULT 'draft'
    CHECK (report_status IN ('draft', 'approved'))
);

-- ─── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses   ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports     ENABLE ROW LEVEL SECURITY;

-- Helper: check if the request comes from an @growwithimg.com authenticated user
CREATE OR REPLACE FUNCTION is_img_user()
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT (
    auth.role() = 'authenticated'
    AND auth.jwt() ->> 'email' ILIKE '%@growwithimg.com'
  );
$$;

-- ── assessments policies ─────────────────────────────────────────────────────

-- IMG team can do everything
CREATE POLICY "img_team_full_access" ON assessments
  FOR ALL
  USING (is_img_user())
  WITH CHECK (is_img_user());

-- Public (anon) can read a specific assessment by token
-- Used by /assess/[token] to load the assessment profile
CREATE POLICY "public_read_by_token" ON assessments
  FOR SELECT
  USING (
    auth.role() = 'anon'
    AND token = (current_setting('request.jwt.claims', true)::jsonb ->> 'assessment_token')::uuid
  );

-- Public (anon) can update their own assessment (status + contact/company fields)
-- The token is passed as a request header claim or via a server action check
CREATE POLICY "public_update_by_token" ON assessments
  FOR UPDATE
  USING (
    auth.role() = 'anon'
    AND token = (current_setting('request.jwt.claims', true)::jsonb ->> 'assessment_token')::uuid
  )
  WITH CHECK (
    auth.role() = 'anon'
    AND token = (current_setting('request.jwt.claims', true)::jsonb ->> 'assessment_token')::uuid
  );

-- ── responses policies ───────────────────────────────────────────────────────

-- IMG team can read all responses
CREATE POLICY "img_team_read_responses" ON responses
  FOR SELECT
  USING (is_img_user());

-- IMG team can insert/update responses (e.g. seed data or admin edits)
CREATE POLICY "img_team_write_responses" ON responses
  FOR ALL
  USING (is_img_user())
  WITH CHECK (is_img_user());

-- Public (anon) can insert responses for an assessment they know the token for
-- Token validation is enforced in the Server Action (service role bypasses RLS)
CREATE POLICY "public_insert_responses" ON responses
  FOR INSERT
  WITH CHECK (true);  -- token validation done server-side via service role

-- Public (anon) can update their own responses
CREATE POLICY "public_update_responses" ON responses
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ── reports policies ─────────────────────────────────────────────────────────

-- Only IMG team can read, write, and generate reports
CREATE POLICY "img_team_full_access_reports" ON reports
  FOR ALL
  USING (is_img_user())
  WITH CHECK (is_img_user());

-- Public can read their own report (for the results page after completion)
CREATE POLICY "public_read_own_report" ON reports
  FOR SELECT
  USING (
    auth.role() = 'anon'
    AND EXISTS (
      SELECT 1 FROM assessments a
      WHERE a.id = reports.assessment_id
        AND a.token = (current_setting('request.jwt.claims', true)::jsonb ->> 'assessment_token')::uuid
    )
  );

-- ─── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS assessments_token_idx    ON assessments (token);
CREATE INDEX IF NOT EXISTS assessments_status_idx   ON assessments (status);
CREATE INDEX IF NOT EXISTS assessments_ae_email_idx ON assessments (ae_email);
CREATE INDEX IF NOT EXISTS reports_assessment_idx   ON reports (assessment_id);
