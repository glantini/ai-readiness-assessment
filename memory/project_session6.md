---
name: Session 6 — Layer 2 & Complete pages
description: Layer 2 Agentforce form and completion screen added in Session 6
type: project
---

Session 6 added:
- `/app/assess/[token]/layer2/` — Agentforce readiness multi-section form (server + client + actions)
- `/app/assess/[token]/complete/` — Completion thank-you screen that sets status to 'completed'

**Why:** Continuation of the public assessment flow. Layer 2 is Salesforce/Agentforce-specific and only shown when `uses_salesforce = true`.

**How to apply:** Session 7 is the scoring/report generation step. The `complete/page.tsx` already updates status to 'completed' idempotently. Reports table is ready for score population.

Key implementation notes:
- Layer 2 uses `YesNoValue = 'yes' | 'partial' | 'no'` stored as jsonb strings in `responses.value`
- Active sections determined by `salesforce_clouds` array on assessment record
- CorePrereqs (20q) and DataCloud (8q) always shown; SalesCloud/ServiceCloud/MarketingCloud gated by cloud selection
- Save and resume: pre-populates from existing layer='layer2' responses, resumes at first incomplete section
- `completed_at` column does not exist in schema — `updated_at` serves as the implicit completion timestamp
