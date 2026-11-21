export type Sex = 'feminino' | 'masculino';

export type JourneyType = 'new_profile' | 'reassessment';

export type RecentWeightChange =
  | 'estavel'
  | 'ganho_gradual'
  | 'ganho_rapido'
  | 'perda_intencional'
  | 'inexplicada';

export type WorkActivityLevel =
  | 'sentado_escritorio'
  | 'moderado_em_pe'
  | 'intenso_fisico';

export type HungerPeakTime =
  | 'manha'
  | 'almoco'
  | 'tarde_noite'
  | 'madrugada_pos_turno';

export type LossOfControlFrequency =
  | 'nunca_raramente'
  | 'mensal'
  | 'semanal_com_sofrimento'
  | 'frequente_diario';

export type DietaryPreference =
  | 'onivoro'
  | 'vegetariano'
  | 'vegano';

export type AssessmentStatus =
  | 'purchased'
  | 'in_progress'
  | 'awaiting_review'
  | 'awaiting_member_clarification'
  | 'completed'
  | 'emergency_redirect'
  | 'cancelled';

export interface FoodCatalogItem {
  id: string;
  name: string;
  source: string;
  sourceCode: string;
  state: string;
  householdMeasure: string;
  portionGrams: number;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number | null;
  sodium_mg: number | null;
  allergens: string[];
  costTier: 'economico' | 'moderado';
  requiresFridge: boolean;
  mealGroup:
    | 'carboidrato_base'
    | 'leguminosa'
    | 'proteina_principal'
    | 'cafe_lanche_base'
    | 'fruta'
    | 'lacteo'
    | 'hortalica';
  veganFriendly: boolean;
  vegetarianFriendly: boolean;
}

export interface AssessmentInput {
  journeyType: JourneyType;
  memberName: string;
  email: string;
  whatsapp?: string;
  emailConfirmed: boolean;
  age: number;
  sex: Sex;
  weightKg: number;
  heightCm: number;
  targetWeightKg: number;
  freePrimaryBarrier: string;
  goalDescription: string;
  deadlineEvent: string;
  recentWeightChange: RecentWeightChange;
  healthConditions: string[];
  pregnantOrBreastfeeding: boolean;
  bariatricHistory: boolean;
  fluidRestriction: boolean;
  emergencySymptoms: boolean;
  medications: string;
  unknownMedicationDose: boolean;
  allergies: string;
  allergySeverityUnknown: boolean;
  intolerances: string;
  dietaryPreference: DietaryPreference;
  wakeTime: string;
  sleepTime: string;
  shiftWorker: boolean;
  sleepQuality: string;
  exerciseType: string;
  exerciseMinutesPerWeek: number;
  workActivityLevel: WorkActivityLevel;
  waterIntakeLiters: number;
  bowelFunction: string;
  mealLocations: string[];
  hasFridge: boolean;
  hasMicrowave: boolean;
  whoCooks: string;
  cookingTimeAvailable: string;
  budgetPriority: boolean;
  preferredMealCount: 3 | 4 | 5 | 6;
  hungerPeakTime: HungerPeakTime;
  hungerCauseContext: string;
  lossOfControlFrequency: LossOfControlFrequency;
  purgingOrCompensation: boolean;
  weekendChanges: string;
  keepFoods: string;
  avoidFoods: string;
  previousAttempts: string;
  whatWouldMakeHard: string;
  firstWeekChange: string;
}

export interface AggravationTrigger {
  group: string;
  reason: string;
}

export interface FeasibilityAxis {
  axis: string;
  status: string;
  detail: string;
}

export interface PanDocument {
  primaryBarrier: string;
  secondaryBarriers: string[];
  memberEvidence: string[];
  methodInterventions: string[];
  needsClarificationCount: number;
}

export interface MealSlot {
  roleLabel: string;
  primary: FoodCatalogItem;
  swapOptions: FoodCatalogItem[];
}

export interface MealSection {
  name: string;
  suggestedWindow: string;
  items: FoodCatalogItem[];
  slots?: MealSlot[];
}

export interface SubstitutionGroup {
  group: string;
  original: string;
  equivalents: string[];
}

export interface PrescriptionResult {
  scientificReferences: string[];
  equationUsed: string;
  bmrKcal?: number;
  activityFactorUsed?: number;
  tdeeKcal?: number;
  targetKcal: number;
  macros: {
    proteinG: number;
    proteinPerKg: number;
    carbsG: number;
    fatG: number;
  };
  waterTargetMl: number;
  waterNote: string;
  meals?: MealSection[];
  substitutions?: SubstitutionGroup[];
  manualPlanText?: string;
}

export interface EngineEvaluationResult {
  engineVersion: string;
  eligibilityStatus: 'direct_release' | 'awaiting_review' | 'manual_approved_released' | 'emergency_redirect';
  requiresReview: boolean;
  emergencyRedirect: boolean;
  triggers: AggravationTrigger[];
  anthropometry: {
    bmi: number | null;
  };
  prescriptionBlocked: boolean;
  blockedMessage?: string;
  reviewedBy?: string;
  reviewedByCrn?: string;
  reviewedAt?: string;
  nutritionistClinicalNote?: string;
  feasibilityProfile: FeasibilityAxis[];
  pan: PanDocument;
  prescription: PrescriptionResult | null;
}

export interface ClarificationRecord {
  id: string;
  question: string;
  sentAt: string;
  memberReply?: string;
  repliedAt?: string;
}

export interface CheckinRecord {
  id: string;
  date: string;
  weightKg: number;
  hungerScore: number;
  adherenceNote: string;
}

export interface AssessmentRecord {
  id: string;
  orderId: string;
  assessmentNumber: number;
  memberName: string;
  email: string;
  status: AssessmentStatus;
  submittedAt: string;
  slaDueAt: string;
  input: AssessmentInput;
  engineResult: EngineEvaluationResult;
  clarifications: ClarificationRecord[];
  checkins: CheckinRecord[];
  panConfirmedByMember: boolean;
  memberPanFeedback: string;
  includeChaFit21D?: boolean;
  totalAmountBrl?: number;
}

export type EmailTemplateKey =
  | 'free_mapping_summary'
  | 'purchase_confirmed'
  | 'awaiting_review_24h'
  | 'plan_delivered'
  | 'clarification_request';

export interface EmailOutboxItem {
  id: string;
  idempotencyKey: string;
  recipientEmail: string;
  memberName: string;
  templateKey: EmailTemplateKey;
  safeSubject: string;
  deliveryStatus: 'prepared' | 'sent_to_provider' | 'delivered' | 'bounced' | 'failed';
  createdAt: string;
  auditNote: string;
}

export interface GtmAuditEvent {
  id: string;
  time: string;
  eventName: string;
  payload: string;
  audit: string;
}

export type LeadStage =
  | 'lead_gratuito'
  | 'checkout_iniciado'
  | 'cliente_pago'
  | 'cliente_com_chafit';

export interface LeadRecord {
  id: string;
  memberName: string;
  email: string;
  whatsapp: string;
  sex: Sex;
  age: number;
  weightKg: number;
  heightCm: number;
  targetWeightKg: number;
  primaryBarrier: string;
  stage: LeadStage;
  orderId?: string;
  totalAmountBrl?: number;
  createdAt: string;
  updatedAt: string;
}
