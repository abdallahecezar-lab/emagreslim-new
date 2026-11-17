export const SQL_MIGRATION_V05 = `-- EMAGRESLIM MIGRATION v0.5
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

COMMIT;`;

export const SQL_MIGRATION_V06 = `-- EMAGRESLIM MIGRATION v0.6
-- Evolução não-destrutiva da v0.5:
-- 1. Fila de Revisão Clínica de 24h corridas (sem expiração/liberação automática)
-- 2. Fila de Entrega Exclusiva por E-mail (Idempotente, sem WhatsApp/Z-API)
-- 3. Catálogo Nutricional Curado (TACO 4ª ed. / IBGE / USDA CC0) com licenças e alergênicos
-- 4. Trava de Segurança no Banco: bloqueia liberação direta se houver agravantes

BEGIN;

ALTER TABLE paid_assessments
  DROP CONSTRAINT IF EXISTS paid_assessments_status_check;

ALTER TABLE paid_assessments
  ADD CONSTRAINT paid_assessments_status_check
  CHECK (status IN (
    'purchased',
    'in_progress',
    'awaiting_review',
    'awaiting_member_clarification',
    'completed',
    'emergency_redirect',
    'cancelled'
  ));

ALTER TABLE paid_assessments
  ADD COLUMN IF NOT EXISTS email_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS submitted_complete_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS eligibility_mode TEXT
    CHECK (eligibility_mode IN ('direct_release', 'manual_review', 'emergency_redirect')),
  ADD COLUMN IF NOT EXISTS aggravation_triggers JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS feasibility_profile JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS pan_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS reviewed_by_crn TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS clinical_review_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL UNIQUE REFERENCES paid_assessments(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  assigned_nutritionist TEXT NOT NULL DEFAULT 'Nutricionista Responsável EmagreSLIM',
  assigned_crn TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'clarification_requested', 'in_review', 'approved_released')),
  triggers JSONB NOT NULL DEFAULT '[]'::jsonb,
  sla_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sla_due_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  sla_risk_flagged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assessment_clarifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES paid_assessments(id) ON DELETE CASCADE,
  review_queue_id UUID REFERENCES clinical_review_queue(id) ON DELETE SET NULL,
  question_sent TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  member_reply TEXT,
  replied_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS email_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key TEXT NOT NULL UNIQUE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES paid_assessments(id) ON DELETE SET NULL,
  recipient_email TEXT NOT NULL,
  template_key TEXT NOT NULL CHECK (template_key IN (
    'free_mapping_summary',
    'purchase_confirmed',
    'secure_access_link',
    'assessment_received',
    'awaiting_review_24h',
    'clarification_request',
    'plan_delivered',
    'reassessment_reminder_45d'
  )),
  safe_subject TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  delivery_status TEXT NOT NULL DEFAULT 'prepared'
    CHECK (delivery_status IN ('prepared', 'sent_to_provider', 'delivered', 'bounced', 'failed')),
  provider_message_id TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION emagreslim_guard_aggravated_release()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'completed'
     AND jsonb_array_length(COALESCE(NEW.aggravation_triggers, '[]'::jsonb)) > 0
     AND (NEW.reviewed_at IS NULL OR NEW.reviewed_by_crn IS NULL)
  THEN
    RAISE EXCEPTION 'BLOQUEIO DE SEGURANÇA v0.6: Avaliação com agravantes não pode ser concluída sem revisão e CRN do nutricionista.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_aggravated_release ON paid_assessments;
CREATE TRIGGER trg_guard_aggravated_release
BEFORE UPDATE ON paid_assessments
FOR EACH ROW
EXECUTE FUNCTION emagreslim_guard_aggravated_release();

COMMIT;`;

export const ENGINE_SPEC_TS = `// engine_v0_6_spec.ts
import { z } from 'zod';

export const PaidAssessmentInputSchema = z.object({
  memberId: z.string().uuid(),
  email: z.string().email(),
  emailConfirmed: z.literal(true),
  age: z.number().int().min(10).max(110),
  sex: z.enum(['feminino', 'masculino']),
  weightKg: z.number().finite().min(35).max(300),
  heightCm: z.number().finite().min(120).max(230),
  targetWeightKg: z.number().finite().min(35).max(250),
  recentWeightChange: z.enum(['estavel', 'ganho_gradual', 'ganho_rapido', 'perda_intencional', 'inexplicada']),
  healthConditions: z.array(z.string()).min(1).refine(
    (arr) => !(arr.includes('nenhuma') && arr.length > 1),
    { message: 'Condição "nenhuma" não pode coexistir com diagnósticos ativos.' }
  ),
  pregnantOrBreastfeeding: z.boolean(),
  bariatricHistory: z.boolean(),
  fluidRestriction: z.boolean(),
  emergencySymptoms: z.boolean(),
  medications: z.string().max(1000),
  unknownMedicationDose: z.boolean(),
  allergies: z.string().max(500),
  allergySeverityUnknown: z.boolean(),
  lossOfControlFrequency: z.enum(['nunca_raramente', 'mensal', 'semanal_com_sofrimento', 'frequente_diario']),
  purgingOrCompensation: z.boolean(),
  shiftWorker: z.boolean(),
  hasFridge: z.boolean(),
  budgetPriority: z.boolean(),
  exerciseMinutesPerWeek: z.number().finite().min(0).max(2000),
  workActivityLevel: z.enum(['sentado_escritorio', 'moderado_em_pe', 'intenso_fisico'])
});`;
