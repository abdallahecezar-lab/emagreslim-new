-- EMAGRESLIM MIGRATION v0.5
-- Paid Assessments / Historical Diet Versions / Reassessment Cycle
-- Non-destructive migration: preserves orders and member_entitlements.

BEGIN;

CREATE TABLE IF NOT EXISTS paid_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  order_id UUID UNIQUE REFERENCES orders(id) ON DELETE SET NULL,
  mapping_session_id UUID REFERENCES mapping_sessions(id) ON DELETE SET NULL,
  assessment_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'purchased'
    CHECK (status IN ('purchased','in_progress','awaiting_review','completed','cancelled')),
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  recommended_reassessment_at TIMESTAMPTZ,
  weight_kg NUMERIC(6,2),
  height_cm NUMERIC(6,2),
  target_weight_kg NUMERIC(6,2),
  input_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  calculation_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  report_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  plan_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  engine_version TEXT,
  plan_version TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_paid_assessment_member_number UNIQUE(member_id, assessment_number)
);

CREATE INDEX IF NOT EXISTS idx_paid_assessments_member
  ON paid_assessments(member_id, assessment_number DESC);

CREATE INDEX IF NOT EXISTS idx_paid_assessments_status
  ON paid_assessments(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_paid_assessments_reassessment
  ON paid_assessments(recommended_reassessment_at)
  WHERE recommended_reassessment_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS assessment_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES paid_assessments(id) ON DELETE CASCADE,
  file_type TEXT NOT NULL
    CHECK (file_type IN ('nutrition_report','meal_plan','substitution_list','other')),
  version_number INTEGER NOT NULL DEFAULT 1,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  file_size_bytes BIGINT,
  sha256 TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_assessment_file_version
    UNIQUE(assessment_id, file_type, version_number)
);

CREATE INDEX IF NOT EXISTS idx_assessment_files_assessment
  ON assessment_files(assessment_id, file_type, version_number DESC);

CREATE TABLE IF NOT EXISTS assessment_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES paid_assessments(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  weight_kg NUMERIC(6,2),
  adherence_score INTEGER
    CHECK (adherence_score IS NULL OR adherence_score BETWEEN 0 AND 100),
  hunger_score INTEGER
    CHECK (hunger_score IS NULL OR hunger_score BETWEEN 0 AND 10),
  routine_changed BOOLEAN NOT NULL DEFAULT FALSE,
  exercise_changed BOOLEAN NOT NULL DEFAULT FALSE,
  medication_changed BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assessment_checkins_assessment
  ON assessment_checkins(assessment_id, checked_at DESC);

CREATE INDEX IF NOT EXISTS idx_assessment_checkins_member
  ON assessment_checkins(member_id, checked_at DESC);

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS paid_assessment_id UUID
  REFERENCES paid_assessments(id)
  ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_paid_assessment
  ON orders(paid_assessment_id)
  WHERE paid_assessment_id IS NOT NULL;

CREATE OR REPLACE FUNCTION emagreslim_assign_assessment_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.assessment_number IS NULL OR NEW.assessment_number <= 0 THEN
    PERFORM pg_advisory_xact_lock(hashtext(NEW.member_id::text));

    SELECT COALESCE(MAX(pa.assessment_number), 0) + 1
      INTO NEW.assessment_number
    FROM paid_assessments pa
    WHERE pa.member_id = NEW.member_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_paid_assessment_number ON paid_assessments;

CREATE TRIGGER trg_paid_assessment_number
BEFORE INSERT ON paid_assessments
FOR EACH ROW
EXECUTE FUNCTION emagreslim_assign_assessment_number();

CREATE OR REPLACE FUNCTION emagreslim_set_reassessment_date()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.completed_at IS NOT NULL
     AND (
       OLD.completed_at IS DISTINCT FROM NEW.completed_at
       OR NEW.recommended_reassessment_at IS NULL
     )
  THEN
    NEW.recommended_reassessment_at :=
      NEW.completed_at + INTERVAL '45 days';
  END IF;

  IF NEW.completed_at IS NOT NULL
     AND NEW.status <> 'cancelled'
  THEN
    NEW.status := 'completed';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_paid_assessment_reassessment ON paid_assessments;

CREATE TRIGGER trg_paid_assessment_reassessment
BEFORE UPDATE ON paid_assessments
FOR EACH ROW
EXECUTE FUNCTION emagreslim_set_reassessment_date();

DROP TRIGGER IF EXISTS trg_paid_assessments_updated_at ON paid_assessments;

CREATE TRIGGER trg_paid_assessments_updated_at
BEFORE UPDATE ON paid_assessments
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE VIEW member_assessment_history AS
SELECT
  pa.id AS assessment_id,
  pa.member_id,
  pa.assessment_number,
  pa.status,
  pa.purchased_at,
  pa.started_at,
  pa.completed_at,
  pa.recommended_reassessment_at,
  pa.weight_kg,
  pa.height_cm,
  pa.target_weight_kg,
  pa.engine_version,
  pa.plan_version,
  o.id AS order_id,
  o.provider,
  o.provider_payment_id,
  o.amount_cents,
  o.currency,
  o.status AS payment_status,
  o.approved_at AS payment_approved_at,
  (
    SELECT COUNT(*)
    FROM assessment_files af
    WHERE af.assessment_id = pa.id
      AND af.active = TRUE
  ) AS available_files,
  (
    SELECT MAX(ac.checked_at)
    FROM assessment_checkins ac
    WHERE ac.assessment_id = pa.id
  ) AS last_checkin_at
FROM paid_assessments pa
LEFT JOIN orders o
  ON o.id = pa.order_id;

COMMIT;

-- Commercial model after v0.5:
-- Free Mapping
--   -> Paid Assessment #1 (R$67.90)
--   -> Full assessment + individualized meal plan
--   -> Report and diet remain accessible
--   -> ~45 days: suggest a new paid assessment
--   -> Paid Assessment #2 (R$67.90)
--   -> New report + Meal Plan v2
-- Previous assessments remain preserved.
