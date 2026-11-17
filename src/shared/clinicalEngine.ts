import { z } from 'zod';
import { CURATED_FOOD_CATALOG } from './catalog';
import type {
  AggravationTrigger,
  AssessmentInput,
  EngineEvaluationResult,
  FeasibilityAxis,
  FoodCatalogItem,
  MealSection,
  MealSlot,
  PanDocument,
  SubstitutionGroup
} from './types';

export const FreeMappingSchema = z.object({
  journeyType: z.enum(['new_profile', 'reassessment']),
  memberName: z.string().trim().min(2, 'Informe seu nome').max(120),
  email: z.string().trim().email('E-mail inválido').max(180),
  whatsapp: z.string().trim().min(8, 'Informe um WhatsApp válido com DDD').max(30),
  sex: z.enum(['feminino', 'masculino']),
  age: z.number().int().min(1).max(130),
  weightKg: z.number().finite().min(1).max(2000),
  heightCm: z.number().finite().min(30).max(300),
  targetWeightKg: z.number().finite().min(1).max(2000).optional(),
  freePrimaryBarrier: z.string().min(1),
  goalFocus: z.string().optional(),
  routineMode: z.string().optional(),
  pastQuitReason: z.string().optional()
});

export interface DataSanityCheckResult {
  blocked: boolean;
  reasons: string[];
  message: string;
}

export const UNUSUAL_DATA_LOCK_MESSAGE =
  'Seus dados apresentam algumas características incomuns. Revise-os ou espere que nossa equipe entre em contato para confirmar.';

export function evaluateDataSanityLock(data: {
  age?: number | null;
  heightCm?: number | null;
  weightKg?: number | null;
  targetWeightKg?: number | null;
}): DataSanityCheckResult {
  const reasons: string[] = [];

  const age = typeof data.age === 'number' && Number.isFinite(data.age) ? data.age : null;
  const height =
    typeof data.heightCm === 'number' && Number.isFinite(data.heightCm) ? data.heightCm : null;
  const weight =
    typeof data.weightKg === 'number' && Number.isFinite(data.weightKg) ? data.weightKg : null;
  const target =
    typeof data.targetWeightKg === 'number' && Number.isFinite(data.targetWeightKg)
      ? data.targetWeightKg
      : null;

  if (age !== null) {
    if (age < 16) {
      reasons.push(`Idade informada (${age} anos) abaixo do público adulto/adolescente elegível (mínimo 16 anos).`);
    } else if (age > 95) {
      reasons.push(`Idade informada (${age} anos) acima do limite padrão para avaliação automatizada (máximo 95 anos).`);
    }
  }

  if (height !== null) {
    if (height < 125) {
      reasons.push(`Altura informada (${height} cm) abaixo da faixa fisiológica padrão (mínimo 125 cm).`);
    } else if (height > 225) {
      reasons.push(`Altura informada (${height} cm) acima da faixa padrão automatizada (máximo 225 cm).`);
    }
  }

  if (weight !== null) {
    if (weight < 38) {
      reasons.push(`Peso atual informado (${weight} kg) abaixo do limite seguro para estratégia de emagrecimento (mínimo 38 kg).`);
    } else if (weight > 250) {
      reasons.push(`Peso atual informado (${weight} kg) acima da faixa operacional automatizada (máximo 250 kg).`);
    }
  }

  if (target !== null) {
    if (target < 38) {
      reasons.push(`Meta de peso informada (${target} kg) abaixo do limite fisiológico seguro (mínimo 38 kg).`);
    } else if (target > 220) {
      reasons.push(`Meta de peso informada (${target} kg) fora da faixa padrão (máximo 220 kg).`);
    }
  }

  if (height !== null && height >= 125 && height <= 225) {
    const heightM = height / 100;
    if (weight !== null && weight >= 38 && weight <= 250) {
      const bmi = weight / (heightM * heightM);
      if (bmi < 16.5) {
        reasons.push(
          `A relação entre peso (${weight} kg) e altura (${height} cm) resulta em IMC de ${bmi.toFixed(
            1
          )} kg/m², indicando baixo peso acentuado incompatível com emagrecimento.`
        );
      } else if (bmi > 55) {
        reasons.push(
          `A relação entre peso (${weight} kg) e altura (${height} cm) resulta em IMC de ${bmi.toFixed(
            1
          )} kg/m², exigindo avaliação médica/nutricional presencial direta.`
        );
      }

      if (target !== null && target >= 38 && target <= 220) {
        const targetBmi = target / (heightM * heightM);
        if (targetBmi < 17.5) {
          reasons.push(
            `A meta de ${target} kg para ${height} cm corresponde a um IMC de ${targetBmi.toFixed(
              1
            )} kg/m², abaixo do limite clínico saudável.`
          );
        }
        if (bmi < 18.5 && target < weight) {
          reasons.push(
            `Com IMC atual de ${bmi.toFixed(1)} kg/m², não é indicado programar redução de peso sem acompanhamento presencial.`
          );
        }
      }
    }
  }

  if (weight !== null && target !== null) {
    if (weight - target > 85) {
      reasons.push(
        `Diferença extrema entre peso atual (${weight} kg) e meta (${target} kg) em uma única etapa.`
      );
    } else if (target - weight > 25) {
      reasons.push(
        `A meta informada (${target} kg) está muito acima do peso atual (${weight} kg) para um programa focado em emagrecimento.`
      );
    }
  }

  return {
    blocked: reasons.length > 0,
    reasons,
    message: UNUSUAL_DATA_LOCK_MESSAGE
  };
}

export const PaidAssessmentInputSchema = z.object({
  journeyType: z.enum(['new_profile', 'reassessment']),
  memberName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(180),
  whatsapp: z.string().trim().max(30).optional().default(''),
  emailConfirmed: z.literal(true),
  age: z.number().int().min(10).max(110),
  sex: z.enum(['feminino', 'masculino']),
  weightKg: z.number().finite().min(35).max(300),
  heightCm: z.number().finite().min(120).max(230),
  targetWeightKg: z.number().finite().min(35).max(250),
  freePrimaryBarrier: z.string().default('fome_noturna_tarde'),
  goalDescription: z.string().max(1000).default(''),
  deadlineEvent: z.string().max(500).default(''),
  recentWeightChange: z.enum([
    'estavel',
    'ganho_gradual',
    'ganho_rapido',
    'perda_intencional',
    'inexplicada'
  ]),
  healthConditions: z
    .array(z.string())
    .min(1)
    .refine(arr => !(arr.includes('nenhuma') && arr.length > 1), {
      message: 'Condição "nenhuma" não pode coexistir com diagnósticos ativos.'
    }),
  pregnantOrBreastfeeding: z.boolean(),
  bariatricHistory: z.boolean(),
  fluidRestriction: z.boolean(),
  emergencySymptoms: z.boolean().default(false),
  medications: z.string().max(1000).default(''),
  unknownMedicationDose: z.boolean(),
  allergies: z.string().max(500).default(''),
  allergySeverityUnknown: z.boolean(),
  intolerances: z.string().max(500).default(''),
  dietaryPreference: z.enum(['onivoro', 'vegetariano', 'vegano']).default('onivoro'),
  wakeTime: z.string().max(20).default('06:30'),
  sleepTime: z.string().max(20).default('23:00'),
  shiftWorker: z.boolean(),
  sleepQuality: z.string().max(80).default('regular_6_7h'),
  exerciseType: z.string().max(200).default(''),
  exerciseMinutesPerWeek: z.number().finite().min(0).max(2000),
  workActivityLevel: z.enum(['sentado_escritorio', 'moderado_em_pe', 'intenso_fisico']),
  waterIntakeLiters: z.number().finite().min(0).max(15).default(1.8),
  bowelFunction: z.string().max(80).default('regular'),
  mealLocations: z.array(z.string()).default(['casa']),
  hasFridge: z.boolean(),
  hasMicrowave: z.boolean().default(true),
  whoCooks: z.string().max(80).default('eu_mesma'),
  cookingTimeAvailable: z.string().max(80).default('medio_30min'),
  budgetPriority: z.boolean(),
  preferredMealCount: z.union([z.literal(3), z.literal(4), z.literal(5), z.literal(6)]).default(4),
  hungerPeakTime: z.enum(['manha', 'almoco', 'tarde_noite', 'madrugada_pos_turno']),
  hungerCauseContext: z.string().max(1000).default(''),
  lossOfControlFrequency: z.enum([
    'nunca_raramente',
    'mensal',
    'semanal_com_sofrimento',
    'frequente_diario'
  ]),
  purgingOrCompensation: z.boolean(),
  weekendChanges: z.string().max(1000).default(''),
  keepFoods: z.string().max(1000).default(''),
  avoidFoods: z.string().max(1000).default(''),
  previousAttempts: z.string().max(1000).default(''),
  whatWouldMakeHard: z.string().max(1000).default(''),
  firstWeekChange: z.string().max(1000).default('')
});

export const CheckinInputSchema = z.object({
  weightKg: z.number().finite().min(30).max(320),
  hungerScore: z.number().int().min(0).max(10),
  adherenceNote: z.string().trim().max(500).default('')
});

export const ClarificationInputSchema = z.object({
  question: z.string().trim().min(5, 'Descreva a dúvida clínica para o membro.').max(1000)
});

export const ManualApprovalInputSchema = z.object({
  reviewedByCrn: z.string().trim().min(4, 'Informe o CRN do nutricionista responsável.').max(40),
  targetKcal: z.number().finite().min(800).max(5000),
  proteinG: z.number().finite().min(30).max(350),
  waterTargetMl: z.number().finite().min(400).max(6000),
  manualPlanText: z.string().trim().min(10, 'Descreva o plano alimentar individualizado.').max(6000),
  nutritionistClinicalNote: z.string().trim().max(2000).default('')
});

function parseDeclaredAllergens(allergiesText: string): string[] {
  const lower = allergiesText.toLowerCase();
  const matched: string[] = [];
  if (lower.includes('ovo')) matched.push('ovo');
  if (lower.includes('leite') || lower.includes('lactose') || lower.includes('latic')) {
    matched.push('leite', 'lactose');
  }
  if (lower.includes('peixe') || lower.includes('sardinha') || lower.includes('atum') || lower.includes('salmão')) {
    matched.push('peixe');
  }
  if (lower.includes('glúten') || lower.includes('gluten') || lower.includes('trigo') || lower.includes('celiac')) {
    matched.push('gluten', 'trigo', 'aveia_tracos_gluten');
  }
  if (lower.includes('amendoim')) matched.push('amendoim');
  if (lower.includes('camarão') || lower.includes('camarao') || lower.includes('crust')) {
    matched.push('crustaceo');
  }
  return matched;
}

function isFoodCompatible(
  food: FoodCatalogItem,
  declaredAllergens: string[],
  dietaryPreference: AssessmentInput['dietaryPreference'],
  requireNoFridgeForDaytime: boolean
): boolean {
  if (food.allergens.some(a => declaredAllergens.includes(a))) {
    return false;
  }
  if (dietaryPreference === 'vegano' && !food.veganFriendly) {
    return false;
  }
  if (dietaryPreference === 'vegetariano' && !food.vegetarianFriendly) {
    return false;
  }
  if (requireNoFridgeForDaytime && food.requiresFridge) {
    return false;
  }
  return true;
}

export function runEmagreSlimEngineV06(rawInput: AssessmentInput): EngineEvaluationResult {
  const weight = Number(rawInput.weightKg);
  const height = Number(rawInput.heightCm);
  const targetWeight = Number(rawInput.targetWeightKg);
  const age = Number(rawInput.age);

  const heightM = height / 100;
  const bmi =
    Number.isFinite(weight) && Number.isFinite(heightM) && heightM > 0
      ? Number((weight / (heightM * heightM)).toFixed(1))
      : null;

  const feasibilityProfile: FeasibilityAxis[] = [
    {
      axis: '1. Tempo & Rotina',
      status: rawInput.shiftWorker ? 'Turnos Alternados' : 'Janelas Regulares',
      detail: rawInput.shiftWorker
        ? 'Refeições ancoradas ao horário de acordar e pausas reais do turno (sem horários fixos rígidos).'
        : `Acorda às ${rawInput.wakeTime || '06:30'} e dorme às ${rawInput.sleepTime || '23:00'}.`
    },
    {
      axis: '2. Acesso & Conservação',
      status: !rawInput.hasFridge ? 'Sem geladeira fora de casa' : 'Refrigeração disponível',
      detail: !rawInput.hasFridge
        ? 'Refeições diurnas restritas a itens seguros fora da geladeira (banana, aveia, pão, ovo cozido do dia, sardinha em lata ou cuscuz).'
        : 'Conservação refrigerada e aquecimento viáveis para marmitas.'
    },
    {
      axis: '3. Custo & Orçamento',
      status: rawInput.budgetPriority ? 'Prioridade Econômica' : 'Orçamento Padrão',
      detail: rawInput.budgetPriority
        ? 'Seleção prioriza itens básicos econômicos da TACO (arroz, feijão, ovo, banana, sardinha, aveia) sem suplementos caros.'
        : 'Base brasileira acessível com proteínas variadas.'
    },
    {
      axis: '4. Fome & Saciedade',
      status:
        rawInput.hungerPeakTime === 'tarde_noite' || rawInput.hungerPeakTime === 'madrugada_pos_turno'
          ? 'Pico tarde / noite'
          : 'Distribuída ao longo do dia',
      detail: rawInput.hungerCauseContext.trim() || 'Precisa esclarecer contexto da fome.'
    },
    {
      axis: '5. Preparo & Habilidade',
      status:
        rawInput.cookingTimeAvailable === 'baixo_15min'
          ? 'Montagens rápidas (<= 15 min)'
          : 'Preparo viável (até 30 min)',
      detail: `Responsável pelo preparo: ${
        rawInput.whoCooks === 'eu_mesma' ? 'Próprio membro' : 'Familiar / Terceiros'
      }.`
    },
    {
      axis: '6. Preferências & Rejeições',
      status:
        rawInput.dietaryPreference === 'vegano'
          ? 'Base Vegana'
          : rawInput.dietaryPreference === 'vegetariano'
            ? 'Base Vegetariana'
            : 'Cultura alimentar preservada',
      detail: `Mantidos: ${rawInput.keepFoods || 'Precisa esclarecer'}. Excluídos: ${rawInput.avoidFoods || 'Nenhum'}.`
    },
    {
      axis: '7. Mudanças Aceitas (Semana 1)',
      status: rawInput.firstWeekChange.trim() ? 'Acordo pactuado' : 'Precisa esclarecer',
      detail: rawInput.firstWeekChange.trim() || 'Precisa esclarecer qual mudança começa nesta semana.'
    }
  ];

  const missingEvidenceMarkers = [
    !rawInput.hungerCauseContext.trim(),
    !rawInput.whatWouldMakeHard.trim(),
    !rawInput.firstWeekChange.trim()
  ].filter(Boolean).length;

  const pan: PanDocument = {
    primaryBarrier:
      !rawInput.hasFridge || rawInput.budgetPriority
        ? 'Falta de refrigeração fora de casa associada à prioridade de baixo custo'
        : rawInput.hungerPeakTime === 'tarde_noite' || rawInput.hungerPeakTime === 'madrugada_pos_turno'
          ? 'Intervalo prolongado até o fim da tarde/turno concentrando fome intensa'
          : 'Histórico de abandono após estratégias excessivamente restritivas',
    secondaryBarriers: [
      rawInput.previousAttempts.trim()
        ? `Tentativas anteriores: "${rawInput.previousAttempts.trim()}"`
        : null,
      rawInput.weekendChanges.trim() ? `Fim de semana: "${rawInput.weekendChanges.trim()}"` : null,
      !rawInput.hasFridge ? 'Sem acesso a geladeira ou micro-ondas fora de casa' : null,
      rawInput.shiftWorker ? 'Rotina em turnos alternados exigindo janelas móveis' : null
    ].filter((v): v is string => Boolean(v)),
    memberEvidence: [
      `Contexto da fome: ${rawInput.hungerCauseContext.trim() ? `"${rawInput.hungerCauseContext.trim()}"` : 'precisa esclarecer'}`,
      `O que tornaria difícil: ${rawInput.whatWouldMakeHard.trim() ? `"${rawInput.whatWouldMakeHard.trim()}"` : 'precisa esclarecer'}`,
      `Acordo Semana 1: ${rawInput.firstWeekChange.trim() ? `"${rawInput.firstWeekChange.trim()}"` : 'precisa esclarecer'}`
    ],
    methodInterventions: [
      'Preservar alimentos culturalmente reconhecíveis (como arroz e feijão) em porções definidas.',
      'Estruturar refeição intermediária cerca de 2h30 antes do pico habitual de fome.',
      !rawInput.hasFridge
        ? 'Selecionar apenas itens não perecíveis fora de casa para manter segurança sanitária.'
        : 'Aplicar preparos simples e lista de substituições equivalentes por função nutricional.',
      'Planejar flexibilidade social no fim de semana sem jejum compensatório.'
    ],
    needsClarificationCount: missingEvidenceMarkers
  };

  // Seção 6 (página 7): Emergência relatada não entra em espera de 24h — orientação imediata sem diagnóstico
  if (rawInput.emergencySymptoms) {
    return {
      engineVersion: 'emagreslim-engine-v0.6.0',
      eligibilityStatus: 'emergency_redirect',
      requiresReview: false,
      emergencyRedirect: true,
      triggers: [
        {
          group: 'Urgência clínica declarada',
          reason:
            'Sinais ou sintomas agudos relatados exigem atendimento presencial imediato (SAMU 192 / UPA / Pronto-Socorro).'
        }
      ],
      anthropometry: { bmi },
      prescriptionBlocked: true,
      blockedMessage:
        'A plataforma EmagreSLIM não funciona como serviço de urgência e não realiza diagnóstico. Busque atendimento médico presencial imediato conforme seus sintomas antes de iniciar qualquer planejamento alimentar.',
      feasibilityProfile,
      pan,
      prescription: null
    };
  }

  if (rawInput.pregnantOrBreastfeeding) {
    return {
      engineVersion: 'emagreslim-engine-v0.6.0',
      eligibilityStatus: 'emergency_redirect',
      requiresReview: false,
      emergencyRedirect: true,
      triggers: [
        {
          group: 'Critério de Elegibilidade Gestacional',
          reason:
            'Gestação ou amamentação declarada: o EmagreSLIM não realiza protocolo de emagrecimento para gestantes.'
        }
      ],
      anthropometry: { bmi },
      prescriptionBlocked: true,
      blockedMessage:
        'O EmagreSLIM não é indicado para gestantes nem realiza protocolos de déficit calórico durante a gravidez/amamentação. Procure acompanhamento nutricional presencial integrado ao seu pré-natal.',
      feasibilityProfile,
      pan,
      prescription: null
    };
  }

  const triggers: AggravationTrigger[] = [];
  const missingFields: string[] = [];

  if (!Number.isFinite(weight) || weight < 35 || weight > 300) {
    missingFields.push('Peso atual inválido ou ausente');
  }
  if (!Number.isFinite(height) || height < 120 || height > 230) {
    missingFields.push('Altura inválida ou ausente');
  }
  if (!Number.isFinite(age) || age < 10 || age > 110) {
    missingFields.push('Idade inválida ou ausente');
  }
  if (!rawInput.emailConfirmed) {
    missingFields.push('Confirmação de titularidade de e-mail pendente');
  }

  if (missingFields.length > 0) {
    triggers.push({
      group: 'Dados e limites técnicos',
      reason: `Informações obrigatórias ausentes ou inválidas: ${missingFields.join('; ')}.`
    });
  }
  if (Number.isFinite(age) && age < 18) {
    triggers.push({
      group: 'Etapa de vida e antropometria',
      reason: 'Menor de 18 anos (fora da liberação automática do protocolo).'
    });
  }
  if (Number.isFinite(age) && age > 64) {
    triggers.push({
      group: 'Etapa de vida e antropometria',
      reason: 'Idade acima de 64 anos (limite operacional do MVP para revisão individual).'
    });
  }
  if (bmi !== null && bmi >= 40) {
    triggers.push({
      group: 'Etapa de vida e antropometria',
      reason: `IMC ${bmi} kg/m² (acima do corte operacional de 40 kg/m² do MVP).`
    });
  }
  if (bmi !== null && bmi < 18.5) {
    triggers.push({
      group: 'Etapa de vida e antropometria',
      reason: `IMC ${bmi} kg/m² (baixo peso — requer avaliação clínica individual).`
    });
  }
  if (Number.isFinite(targetWeight) && Number.isFinite(heightM) && heightM > 0) {
    const targetBmi = targetWeight / (heightM * heightM);
    if (targetBmi < 18.5) {
      triggers.push({
        group: 'Etapa de vida e antropometria',
        reason: `Meta de peso (${targetWeight} kg) corresponde a IMC ${targetBmi.toFixed(1)} kg/m² (meta incompatível).`
      });
    }
  }
  if (rawInput.recentWeightChange === 'inexplicada') {
    triggers.push({
      group: 'Etapa de vida e antropometria',
      reason: 'Mudança ponderal recente inexplicada exige investigação clínica.'
    });
  }
  if (rawInput.pregnantOrBreastfeeding) {
    triggers.push({
      group: 'Etapa de vida e antropometria',
      reason: 'Gestação ou amamentação declarada.'
    });
  }
  if (rawInput.bariatricHistory) {
    triggers.push({
      group: 'Condições que modificam a prescrição',
      reason: 'Histórico de cirurgia bariátrica (demanda manejo específico de micronutrientes e volume).'
    });
  }

  const activeConditions = (rawInput.healthConditions || []).filter(c => c !== 'nenhuma');
  if (activeConditions.length > 0) {
    const labels: Record<string, string> = {
      diabetes_tipo_1: 'Diabetes Tipo 1',
      diabetes_tipo_2: 'Diabetes Tipo 2',
      doenca_renal: 'Doença Renal (KDIGO 2024)',
      doenca_hepatica: 'Doença Hepática',
      doenca_cardiaca: 'Doença Cardíaca',
      doenca_gi_ativa: 'Doença Gastrointestinal Ativa',
      cancer_tratamento: 'Câncer em Tratamento',
      hipertensao: 'Hipertensão Arterial'
    };
    const criticalConditions = activeConditions.filter(c => c !== 'hipertensao');
    if (criticalConditions.length > 0) {
      triggers.push({
        group: 'Condições que modificam a prescrição',
        reason: `Condição(ões) declarada(s): ${criticalConditions.map(c => labels[c] || c).join(', ')}.`
      });
    }
  }

  if (rawInput.fluidRestriction) {
    triggers.push({
      group: 'Medicamentos e controle metabólico',
      reason: 'Restrição hídrica informada — sistema não aplica cálculo padrão de líquidos.'
    });
  }

  const medText = (rawInput.medications || '').toLowerCase();
  if (
    medText.includes('insulina') ||
    medText.includes('glibenclamida') ||
    medText.includes('gliclazida') ||
    medText.includes('ozempic') ||
    medText.includes('semaglutida') ||
    medText.includes('tirzepatida') ||
    rawInput.unknownMedicationDose
  ) {
    triggers.push({
      group: 'Medicamentos e controle metabólico',
      reason: 'Medicamento com impacto metabólico/risco de hipoglicemia ou dose desconhecida.'
    });
  }

  if (rawInput.allergySeverityUnknown) {
    triggers.push({
      group: 'Alimentação e comportamento',
      reason: 'Insegurança sobre gravidade de alergia alimentar.'
    });
  }

  const declaredAllergens = parseDeclaredAllergens(rawInput.allergies || '');
  if (declaredAllergens.length >= 2) {
    triggers.push({
      group: 'Alimentação e comportamento',
      reason: 'Dieta com múltiplas exclusões alergênicas simultâneas requer validação do nutricionista.'
    });
  }

  if (
    rawInput.lossOfControlFrequency === 'semanal_com_sofrimento' ||
    rawInput.lossOfControlFrequency === 'frequente_diario' ||
    rawInput.purgingOrCompensation
  ) {
    triggers.push({
      group: 'Alimentação e comportamento',
      reason: 'Relato de perda de controle recorrente com sofrimento ou mecanismos compensatórios.'
    });
  }

  if (Number(rawInput.exerciseMinutesPerWeek) > 600) {
    triggers.push({
      group: 'Outras condições não cobertas',
      reason: 'Alto volume de treinamento (> 10h/semana) fora do escopo padrão.'
    });
  }

  // Cálculo Energético Documentado: Mifflin-St Jeor (1990) + DRI Energy (2023)
  let bmr: number | undefined;
  let activityFactorUsed: number | undefined;
  let tdee: number | undefined;
  let proposedKcal = 0;

  if (Number.isFinite(weight) && Number.isFinite(height) && Number.isFinite(age)) {
    const sexOffset = rawInput.sex === 'masculino' ? 5 : -161;
    bmr = Math.round(10 * weight + 6.25 * height - 5 * age + sexOffset);

    const workFactors: Record<string, number> = {
      sentado_escritorio: 1.35,
      moderado_em_pe: 1.5,
      intenso_fisico: 1.65
    };
    const baseWork = workFactors[rawInput.workActivityLevel] || 1.35;
    const exerciseAddition =
      Number(rawInput.exerciseMinutesPerWeek) >= 150
        ? 0.12
        : Number(rawInput.exerciseMinutesPerWeek) > 0
          ? 0.06
          : 0;
    activityFactorUsed = Number((baseWork + exerciseAddition).toFixed(2));
    tdee = Math.round(bmr * activityFactorUsed);
    proposedKcal = Math.round(tdee * 0.82);

    if (proposedKcal <= 800) {
      triggers.push({
        group: 'Dados e limites técnicos',
        reason: `Estimativa energética (${proposedKcal} kcal/dia) <= 800 kcal/dia (fora do gerador padrão — NICE NG246).`
      });
    } else if (proposedKcal <= 1200) {
      triggers.push({
        group: 'Dados e limites técnicos',
        reason: `Estimativa energética (${proposedKcal} kcal/dia) <= 1.200 kcal/dia (bloqueio automático — NICE NG246 / MVP).`
      });
    }
  }

  // Montagem de refeições adaptada à rotina real do membro (3, 4, 5 ou 6 refeições)
  // Cada componente gera 1 opção principal + opções de troca exclusiva ("OU"), evitando que o paciente some tudo.
  const isNoFridgeOrBudget = !rawInput.hasFridge || rawInput.budgetPriority;
  const mealCount = rawInput.preferredMealCount || 4;

  const pickFoods = (ids: string[], requireNoFridge: boolean): FoodCatalogItem[] =>
    ids
      .map(id => CURATED_FOOD_CATALOG.find(f => f.id === id))
      .filter((f): f is FoodCatalogItem => Boolean(f))
      .filter(f => isFoodCompatible(f, declaredAllergens, rawInput.dietaryPreference, requireNoFridge));

  const fallbackProtein = CURATED_FOOD_CATALOG.find(
    f =>
      f.mealGroup === 'proteina_principal' &&
      isFoodCompatible(f, declaredAllergens, rawInput.dietaryPreference, false)
  );

  const buildMealItems = (preferredIds: string[], requireNoFridge: boolean, needsProteinFallback = false) => {
    const items = pickFoods(preferredIds, requireNoFridge);
    const hasProtein = items.some(i => i.mealGroup === 'proteina_principal' || i.mealGroup === 'lacteo');
    if (needsProteinFallback && !hasProtein && fallbackProtein && (!requireNoFridge || !fallbackProtein.requiresFridge)) {
      items.push(fallbackProtein);
    }
    return items;
  };

  const roleLabelForGroup = (group: FoodCatalogItem['mealGroup']): string => {
    switch (group) {
      case 'cafe_lanche_base':
      case 'carboidrato_base':
        return 'Base de Energia (Carboidrato)';
      case 'proteina_principal':
      case 'lacteo':
        return 'Fonte de Proteína e Saciedade';
      case 'leguminosa':
        return 'Leguminosa (Fibra e Proteína Vegetal)';
      case 'fruta':
        return 'Fruta / Fibra Natural';
      case 'hortalica':
        return 'Vegetais e Volume no Prato';
      default:
        return 'Item da Refeição';
    }
  };

  const swapCandidatesFor = (item: FoodCatalogItem, requireNoFridge: boolean): FoodCatalogItem[] => {
    const compatibleSameRole = CURATED_FOOD_CATALOG.filter(f => {
      if (f.id === item.id) return false;
      if (!isFoodCompatible(f, declaredAllergens, rawInput.dietaryPreference, requireNoFridge)) return false;
      if (item.mealGroup === 'carboidrato_base') {
        return f.mealGroup === 'carboidrato_base' || f.id === 'TACO-013';
      }
      if (item.mealGroup === 'cafe_lanche_base') {
        return f.mealGroup === 'cafe_lanche_base' || f.mealGroup === 'fruta';
      }
      if (item.mealGroup === 'proteina_principal') {
        return f.mealGroup === 'proteina_principal';
      }
      if (item.mealGroup === 'leguminosa') {
        return f.id === 'TACO-014';
      }
      return false;
    });
    return compatibleSameRole.slice(0, 2);
  };

  const buildSlots = (items: FoodCatalogItem[], requireNoFridge: boolean): MealSlot[] =>
    items.map(item => ({
      roleLabel: roleLabelForGroup(item.mealGroup),
      primary: item,
      swapOptions: swapCandidatesFor(item, requireNoFridge)
    }));

  const makeMeal = (
    name: string,
    suggestedWindow: string,
    ids: string[],
    requireNoFridge: boolean,
    needsProteinFallback: boolean
  ): MealSection => {
    const items = buildMealItems(ids, requireNoFridge, needsProteinFallback);
    return {
      name,
      suggestedWindow,
      items,
      slots: buildSlots(items, requireNoFridge)
    };
  };

  const breakfastMeal = makeMeal(
    isNoFridgeOrBudget ? 'Café da Manhã (Econômico e Prático)' : 'Café da Manhã',
    rawInput.shiftWorker ? 'Até 1h após acordar' : `Por volta das ${rawInput.wakeTime || '07:00'}`,
    isNoFridgeOrBudget
      ? ['TACO-006', 'TACO-005', 'TACO-007']
      : mealCount === 3
        ? ['TACO-006', 'TACO-005', 'TACO-009', 'TACO-007']
        : ['TACO-006', 'TACO-005', 'TACO-009'],
    false,
    false
  );

  const morningSnackMeal = makeMeal(
    'Lanche Prático da Manhã',
    rawInput.shiftWorker ? '2h30 a 3h após o café' : 'Entre 09:30 e 10:30',
    ['TACO-007', 'TACO-015'],
    !rawInput.hasFridge,
    false
  );

  const lunchMeal = makeMeal(
    isNoFridgeOrBudget ? 'Almoço (Base Brasileira Econômica)' : 'Almoço (Base Brasileira)',
    rawInput.shiftWorker ? '4h a 5h após acordar' : 'Entre 12:00 e 13:30',
    isNoFridgeOrBudget
      ? ['TACO-002', 'TACO-003', 'TACO-005', 'TACO-012']
      : ['TACO-002', 'TACO-003', 'TACO-004', 'TACO-012'],
    false,
    true
  );

  const afternoonSnackMeal = makeMeal(
    !rawInput.hasFridge
      ? 'Lanche Prático da Rua (Sem Geladeira)'
      : 'Lanche Estratégico da Tarde (Proteção contra fome noturna)',
    rawInput.shiftWorker ? '2h30 antes do pico de fome do turno' : 'Entre 16:00 e 17:00',
    !rawInput.hasFridge ? ['TACO-013', 'TACO-007'] : ['TACO-007', 'TACO-008'],
    !rawInput.hasFridge,
    false
  );

  const dinnerMeal = makeMeal(
    isNoFridgeOrBudget ? 'Jantar em Casa' : 'Jantar Prático',
    rawInput.shiftWorker ? 'Até 2h antes de dormir' : 'Entre 19:30 e 21:00',
    isNoFridgeOrBudget
      ? ['TACO-002', 'TACO-010', 'TACO-012']
      : ['TACO-011', 'TACO-004', 'TACO-012'],
    false,
    true
  );

  const eveningSupperMeal = makeMeal(
    'Ceia Leve (Rotina Noturna / Dia Longo)',
    rawInput.shiftWorker ? 'Encerramento do ciclo de vigília' : 'Cerca de 1h antes de dormir',
    ['TACO-009', 'TACO-008'],
    false,
    false
  );

  let meals: MealSection[];
  if (mealCount === 3) {
    meals = [breakfastMeal, lunchMeal, dinnerMeal];
  } else if (mealCount === 5) {
    meals = [breakfastMeal, morningSnackMeal, lunchMeal, afternoonSnackMeal, dinnerMeal];
  } else if (mealCount === 6) {
    meals = [breakfastMeal, morningSnackMeal, lunchMeal, afternoonSnackMeal, dinnerMeal, eveningSupperMeal];
  } else {
    meals = [breakfastMeal, lunchMeal, afternoonSnackMeal, dinnerMeal];
  }

  const hasEmptyMeal = meals.some(m => m.items.length === 0);
  if (hasEmptyMeal) {
    triggers.push({
      group: 'Dados e limites técnicos',
      reason: 'Restrições combinadas deixaram refeição sem solução adequada no catálogo curado.'
    });
  }

  const requiresReview = triggers.length > 0;

  if (requiresReview) {
    return {
      engineVersion: 'emagreslim-engine-v0.6.0',
      eligibilityStatus: 'awaiting_review',
      requiresReview: true,
      emergencyRedirect: false,
      triggers,
      anthropometry: { bmi },
      prescriptionBlocked: true,
      blockedMessage:
        'Prescrição calórica, proteica e cardápio bloqueados automaticamente até análise clínica do nutricionista responsável EmagreSLIM (prazo máximo: 24 horas corridas).',
      feasibilityProfile,
      pan,
      prescription: null
    };
  }

  const proteinTargetG = Math.round(weight * 1.6);
  const fatTargetG = Math.round((proposedKcal * 0.27) / 9);
  const carbsTargetG = Math.round((proposedKcal - proteinTargetG * 4 - fatTargetG * 9) / 4);
  const waterTargetMl = Math.round(weight * 35);

  const compatibleCarbs = CURATED_FOOD_CATALOG.filter(
    f =>
      (f.mealGroup === 'carboidrato_base' || f.mealGroup === 'cafe_lanche_base') &&
      isFoodCompatible(f, declaredAllergens, rawInput.dietaryPreference, false)
  );
  const compatibleProteins = CURATED_FOOD_CATALOG.filter(
    f =>
      f.mealGroup === 'proteina_principal' &&
      isFoodCompatible(f, declaredAllergens, rawInput.dietaryPreference, false)
  );

  const substitutions: SubstitutionGroup[] = [
    {
      group: 'Grupo 1 — Carboidratos Base (Preservando fibra e energia)',
      original: 'Arroz tipo 1 cozido (TACO Cód. 6) — 4 colheres de sopa cheias (100g | 128 kcal | 28,1g carb)',
      equivalents: compatibleCarbs
        .filter(f => f.id !== 'TACO-002')
        .slice(0, 3)
        .map(
          f =>
            `${f.name} (${f.sourceCode}) — ${f.householdMeasure} (${f.portionGrams}g | ${f.kcal} kcal | ${f.carbs_g}g carb${
              f.requiresFridge ? '' : ' · segura fora da geladeira'
            })`
        )
    },
    {
      group: 'Grupo 2 — Proteínas Principais (Preservando aporte proteico)',
      original:
        compatibleProteins[0]
          ? `${compatibleProteins[0].name} (${compatibleProteins[0].sourceCode}) — ${compatibleProteins[0].householdMeasure} (${compatibleProteins[0].portionGrams}g | ${compatibleProteins[0].kcal} kcal | ${compatibleProteins[0].protein_g}g prot)`
          : 'Proteína principal definida na revisão',
      equivalents: compatibleProteins
        .slice(1)
        .map(
          f =>
            `${f.name} (${f.sourceCode}) — ${f.householdMeasure} (${f.portionGrams}g | ${f.kcal} kcal | ${f.protein_g}g prot${
              f.requiresFridge ? '' : ' · segura fora da geladeira'
            })`
        )
    },
    {
      group: 'Grupo 3 — Lanches Práticos & Frutas',
      original: 'Banana prata crua (TACO Cód. 176) — 1 unidade média (65g | 64 kcal | 16,9g carb)',
      equivalents: [
        ...(!declaredAllergens.includes('aveia_tracos_gluten')
          ? ['Aveia em flocos crua (TACO Cód. 14) — 2 colheres de sopa (30g | 118 kcal | 2,7g fibra)']
          : []),
        ...(!declaredAllergens.includes('amendoim')
          ? ['Amendoim torrado sem sal (TACO Cód. 512) — 1 colher de sopa rasa (20g | 118 kcal | 4,5g prot)']
          : []),
        'Cuscuz de milho cozido (TACO Cód. 24) — 4 colheres de sopa (100g | 113 kcal | não exige geladeira)'
      ]
    }
  ];

  return {
    engineVersion: 'emagreslim-engine-v0.6.0',
    eligibilityStatus: 'direct_release',
    requiresReview: false,
    emergencyRedirect: false,
    triggers: [],
    anthropometry: { bmi },
    prescriptionBlocked: false,
    feasibilityProfile,
    pan,
    prescription: {
      scientificReferences: [
        'Gasto Energético em Repouso (GER): Equação de Mifflin-St Jeor (AJCN, 1990)',
        'Fator de Atividade & Necessidade Energética: DRI Energy (National Academies, 2023)',
        'Segurança Calórica: NICE NG246 (2025/2026) — bloqueio automático <= 1.200 kcal/dia',
        'Aporte Proteico & Renal: Leidy et al. (AJCN, 2015) + KDIGO (2024)',
        'Composição & Medidas Caseiras: TACO 4ª ed. (NEPA/Unicamp) + IBGE POF 2008-2009'
      ],
      equationUsed: `Mifflin-St Jeor (GER: ${bmr} kcal) × Fator DRI (${activityFactorUsed}) = ${tdee} kcal/dia (déficit moderado de 18%)`,
      bmrKcal: bmr,
      activityFactorUsed,
      tdeeKcal: tdee,
      targetKcal: proposedKcal,
      macros: {
        proteinG: proteinTargetG,
        proteinPerKg: 1.6,
        carbsG: carbsTargetG,
        fatG: fatTargetG
      },
      waterTargetMl,
      waterNote: 'Referência prática de água e líquidos totais (35 ml/kg) para adultos sem restrição hídrica.',
      meals,
      substitutions
    }
  };
}

export interface FreeMappingAnalysis {
  bmi: number;
  targetBmi: number;
  kgToLose: number;
  bmrKcal: number;
  tdeeKcal: number;
  estimatedDietKcal: number;
  dailyDeficitKcal: number;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  estimatedWeeksMin: number;
  estimatedWeeksMax: number;
  estimatedEvaluationsMin: number;
  estimatedEvaluationsMax: number;
  idealWaterMl: number;
  idealWaterCups: number;
  currentWaterLiters: number;
  waterGapMl: number;
  exerciseRecommendationTitle: string;
  exerciseRecommendationDetail: string;
  hasClinicalFlags: boolean;
}

export function computeFreeMappingAnalysis(input: AssessmentInput): FreeMappingAnalysis {
  const weight = Math.max(30, Number(input.weightKg) || 75);
  const height = Math.max(110, Number(input.heightCm) || 168);
  const age = Math.max(10, Number(input.age) || 32);
  const targetWeight = Math.max(30, Number(input.targetWeightKg) || weight);

  const heightM = height / 100;
  const bmi = Number((weight / (heightM * heightM)).toFixed(1));
  const targetBmi = Number((targetWeight / (heightM * heightM)).toFixed(1));
  const kgToLose = Number(Math.max(0, weight - targetWeight).toFixed(1));

  const sexOffset = input.sex === 'masculino' ? 5 : -161;
  const bmrKcal = Math.round(10 * weight + 6.25 * height - 5 * age + sexOffset);

  const workFactors: Record<string, number> = {
    sentado_escritorio: 1.35,
    moderado_em_pe: 1.5,
    intenso_fisico: 1.65
  };
  const baseWork = workFactors[input.workActivityLevel] || 1.35;
  const mins = Number(input.exerciseMinutesPerWeek) || 0;
  const exerciseAddition = mins >= 150 ? 0.12 : mins > 0 ? 0.06 : 0;
  const tdeeKcal = Math.round(bmrKcal * (baseWork + exerciseAddition));

  // Faixa calórica estimada com piso de segurança (NICE NG246: nunca <= 1200 kcal na estimativa padrão)
  const rawDietKcal = Math.round(tdeeKcal * 0.82);
  const estimatedDietKcal = Math.max(1250, rawDietKcal);
  const dailyDeficitKcal = Math.max(250, tdeeKcal - estimatedDietKcal);

  // Referência interna (mantida por compatibilidade)
  const exactDays = kgToLose > 0 ? Math.round((kgToLose * 7700) / dailyDeficitKcal) : 0;
  const estimatedDaysMin = kgToLose > 0 ? Math.max(14, Math.round(exactDays * 0.9)) : 0;
  const estimatedDaysMax = kgToLose > 0 ? Math.max(estimatedDaysMin + 7, Math.round(exactDays * 1.25)) : 0;
  const estimatedWeeksMin = kgToLose > 0 ? Math.max(2, Math.round(estimatedDaysMin / 7)) : 0;
  const estimatedWeeksMax = kgToLose > 0 ? Math.max(estimatedWeeksMin + 1, Math.round(estimatedDaysMax / 7)) : 0;

  // Quantidade estimada de avaliações/reajustes alimentares no EmagreSLIM (como consultas de retorno ~1,4 a 2,2 kg por ciclo)
  const estimatedEvaluationsMin = kgToLose > 0 ? Math.max(2, Math.round(kgToLose / 2.2)) : 1;
  const estimatedEvaluationsMax =
    kgToLose > 0 ? Math.max(estimatedEvaluationsMin + 1, Math.round(kgToLose / 1.4)) : 1;

  const idealWaterMl = Math.round(weight * 35);
  const idealWaterCups = Math.round(idealWaterMl / 250);
  const currentWaterLiters = Number(input.waterIntakeLiters || 1.2);
  const waterGapMl = Math.max(0, idealWaterMl - Math.round(currentWaterLiters * 1000));

  let exerciseRecommendationTitle = 'Mantenha sua rotina ativa e proteja a massa magra';
  let exerciseRecommendationDetail =
    'Você já pratica exercício regularmente. Manter esse ritmo junto ao aporte proteico adequado preserva músculos e acelera a perda de gordura real.';

  if (mins === 0) {
    exerciseRecommendationTitle = 'Comece devagar: 20 a 30 min de caminhada, 3x na semana';
    exerciseRecommendationDetail =
      'Você relatou não praticar exercício hoje. Começar com caminhadas leves ou alongamentos 3 vezes por semana já aumenta seu gasto energético, melhora o controle da fome e acelera sua evolução entre as avaliações.';
  } else if (mins < 100) {
    exerciseRecommendationTitle = 'Evolua de 1–2 dias para 3–4 dias por semana no seu ritmo';
    exerciseRecommendationDetail =
      'Você já deu o passo mais difícil que é sair do zero. Acrescentar mais 1 ou 2 sessões curtas (30 min) na semana melhora disposição, sono e sensibilidade à insulina.';
  }

  const activeConditions = (input.healthConditions || []).filter(c => c !== 'nenhuma');
  const hasClinicalFlags = activeConditions.length > 0 || Boolean(input.bariatricHistory);

  return {
    bmi,
    targetBmi,
    kgToLose,
    bmrKcal,
    tdeeKcal,
    estimatedDietKcal,
    dailyDeficitKcal,
    estimatedDaysMin,
    estimatedDaysMax,
    estimatedWeeksMin,
    estimatedWeeksMax,
    estimatedEvaluationsMin,
    estimatedEvaluationsMax,
    idealWaterMl,
    idealWaterCups,
    currentWaterLiters,
    waterGapMl,
    exerciseRecommendationTitle,
    exerciseRecommendationDetail,
    hasClinicalFlags
  };
}

