import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Mail,
  Clock,
  AlertTriangle,
  CheckCircle2,
  UserCheck,
  FileText,
  Database,
  Code2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Lock,
  Send,
  Utensils,
  HeartPulse,
  Compass,
  Copy,
  Check,
  Eye,
  ArrowRightLeft,
  History,
  Info,
  Edit3,
  Activity,
  ShoppingBag,
  CreditCard,
  BarChart3,
  BookOpen,
  Calendar,
  ExternalLink
} from 'lucide-react';

/**
 * ============================================================================
 * EMAGRESLIM v0.6 — CATÁLOGO DE ALIMENTOS CURADO (TACO 4ª ED. / IBGE POF)
 * ============================================================================
 * Precedência oficial (Seção 7):
 * - TACO 4ª edição revisada e ampliada (NEPA/Unicamp, 2011)
 * - IBGE POF 2008-2009: Tabela de Medidas Referidas para Alimentos Consumidos no Brasil
 * - Dado ausente permanece null (nunca 0 silencioso).
 */
const CURATED_FOOD_CATALOG = [
  {
    id: 'TACO-001',
    name: 'Arroz, integral, cozido',
    source: 'TACO 4ª ed. (NEPA/Unicamp)',
    sourceCode: 'Cód. 4',
    state: 'cozido',
    householdMeasure: '4 colheres de sopa cheias (IBGE)',
    portionGrams: 100,
    kcal: 124,
    protein_g: 2.6,
    carbs_g: 25.8,
    fat_g: 1.0,
    fiber_g: 2.7,
    sodium_mg: 1,
    allergens: [],
    costTier: 'economico',
    requiresFridge: true,
    mealGroup: 'carboidrato_base'
  },
  {
    id: 'TACO-002',
    name: 'Arroz, tipo 1, cozido',
    source: 'TACO 4ª ed. (NEPA/Unicamp)',
    sourceCode: 'Cód. 6',
    state: 'cozido',
    householdMeasure: '4 colheres de sopa cheias (IBGE)',
    portionGrams: 100,
    kcal: 128,
    protein_g: 2.5,
    carbs_g: 28.1,
    fat_g: 0.2,
    fiber_g: 1.6,
    sodium_mg: 1,
    allergens: [],
    costTier: 'economico',
    requiresFridge: true,
    mealGroup: 'carboidrato_base'
  },
  {
    id: 'TACO-003',
    name: 'Feijão, carioca, cozido (50% grão / 50% caldo)',
    source: 'TACO 4ª ed. (NEPA/Unicamp)',
    sourceCode: 'Cód. 521',
    state: 'cozido',
    householdMeasure: '1 concha média rasa (IBGE)',
    portionGrams: 86,
    kcal: 66,
    protein_g: 4.1,
    carbs_g: 11.7,
    fat_g: 0.4,
    fiber_g: 7.3,
    sodium_mg: 2,
    allergens: [],
    costTier: 'economico',
    requiresFridge: true,
    mealGroup: 'leguminosa'
  },
  {
    id: 'TACO-004',
    name: 'Frango, peito, sem pele, grelhado',
    source: 'TACO 4ª ed. (NEPA/Unicamp)',
    sourceCode: 'Cód. 412',
    state: 'grelhado',
    householdMeasure: '1 filé médio (IBGE)',
    portionGrams: 100,
    kcal: 159,
    protein_g: 32.0,
    carbs_g: 0.0,
    fat_g: 2.5,
    fiber_g: 0.0,
    sodium_mg: 50,
    allergens: [],
    costTier: 'moderado',
    requiresFridge: true,
    mealGroup: 'proteina_principal'
  },
  {
    id: 'TACO-005',
    name: 'Ovo, de galinha, inteiro, cozido (10 min)',
    source: 'TACO 4ª ed. (NEPA/Unicamp)',
    sourceCode: 'Cód. 475',
    state: 'cozido',
    householdMeasure: '2 unidades médias (IBGE)',
    portionGrams: 90,
    kcal: 131,
    protein_g: 12.0,
    carbs_g: 0.5,
    fat_g: 8.6,
    fiber_g: 0.0,
    sodium_mg: 131,
    allergens: ['ovo'],
    costTier: 'economico',
    requiresFridge: false,
    mealGroup: 'proteina_principal'
  },
  {
    id: 'TACO-006',
    name: 'Pão, trigo, francês',
    source: 'TACO 4ª ed. (NEPA/Unicamp)',
    sourceCode: 'Cód. 72',
    state: 'pronto',
    householdMeasure: '1 unidade média (50g - IBGE)',
    portionGrams: 50,
    kcal: 150,
    protein_g: 4.0,
    carbs_g: 29.3,
    fat_g: 1.6,
    fiber_g: 1.2,
    sodium_mg: 324,
    allergens: ['gluten', 'trigo'],
    costTier: 'economico',
    requiresFridge: false,
    mealGroup: 'cafe_lanche_base'
  },
  {
    id: 'TACO-007',
    name: 'Banana, prata, crua',
    source: 'TACO 4ª ed. (NEPA/Unicamp)',
    sourceCode: 'Cód. 176',
    state: 'crua',
    householdMeasure: '1 unidade média (65g - IBGE)',
    portionGrams: 65,
    kcal: 64,
    protein_g: 0.8,
    carbs_g: 16.9,
    fat_g: 0.1,
    fiber_g: 1.3,
    sodium_mg: 0,
    allergens: [],
    costTier: 'economico',
    requiresFridge: false,
    mealGroup: 'fruta'
  },
  {
    id: 'TACO-008',
    name: 'Aveia, flocos, crua',
    source: 'TACO 4ª ed. (NEPA/Unicamp)',
    sourceCode: 'Cód. 14',
    state: 'crua',
    householdMeasure: '2 colheres de sopa (30g - IBGE)',
    portionGrams: 30,
    kcal: 118,
    protein_g: 4.2,
    carbs_g: 20.0,
    fat_g: 2.6,
    fiber_g: 2.7,
    sodium_mg: 2,
    allergens: ['aveia_tracos_gluten'],
    costTier: 'economico',
    requiresFridge: false,
    mealGroup: 'cafe_lanche_base'
  },
  {
    id: 'TACO-009',
    name: 'Leite, de vaca, desnatado, UHT',
    source: 'TACO 4ª ed. (NEPA/Unicamp)',
    sourceCode: 'Cód. 455',
    state: 'pronto',
    householdMeasure: '1 copo americano duplo (240ml)',
    portionGrams: 240,
    kcal: 79,
    protein_g: 7.9,
    carbs_g: 11.5,
    fat_g: 0.2,
    fiber_g: 0.0,
    sodium_mg: 127,
    allergens: ['leite', 'lactose'],
    costTier: 'economico',
    requiresFridge: true,
    mealGroup: 'lacteo'
  },
  {
    id: 'TACO-010',
    name: 'Sardinha, conserva em óleo (drenada)',
    source: 'TACO 4ª ed. (NEPA/Unicamp)',
    sourceCode: 'Cód. 351',
    state: 'pronto_conserva',
    householdMeasure: '1 lata pequena drenada (84g)',
    portionGrams: 84,
    kcal: 162,
    protein_g: 20.6,
    carbs_g: 0.0,
    fat_g: 8.8,
    fiber_g: 0.0,
    sodium_mg: 390,
    allergens: ['peixe'],
    costTier: 'economico',
    requiresFridge: false,
    mealGroup: 'proteina_principal'
  },
  {
    id: 'TACO-011',
    name: 'Batata, inglesa, cozida',
    source: 'TACO 4ª ed. (NEPA/Unicamp)',
    sourceCode: 'Cód. 95',
    state: 'cozida',
    householdMeasure: '1 unidade média picada (140g)',
    portionGrams: 140,
    kcal: 73,
    protein_g: 1.7,
    carbs_g: 16.7,
    fat_g: 0.1,
    fiber_g: 1.8,
    sodium_mg: 3,
    allergens: [],
    costTier: 'economico',
    requiresFridge: true,
    mealGroup: 'carboidrato_base'
  },
  {
    id: 'TACO-012',
    name: 'Alface, crespa, crua + Tomate, salada, cru',
    source: 'TACO 4ª ed. (NEPA/Unicamp)',
    sourceCode: 'Cód. 84 + 165',
    state: 'crua',
    householdMeasure: '1 prato de sobremesa cheio (IBGE)',
    portionGrams: 120,
    kcal: 18,
    protein_g: 1.3,
    carbs_g: 3.5,
    fat_g: 0.2,
    fiber_g: 1.8,
    sodium_mg: 6,
    allergens: [],
    costTier: 'economico',
    requiresFridge: true,
    mealGroup: 'hortalica'
  },
  {
    id: 'TACO-013',
    name: 'Cuscuz de milho, cozido com sal',
    source: 'TACO 4ª ed. (NEPA/Unicamp)',
    sourceCode: 'Cód. 24',
    state: 'cozido',
    householdMeasure: '1 fatia média / 4 colheres de sopa (100g)',
    portionGrams: 100,
    kcal: 113,
    protein_g: 2.2,
    carbs_g: 25.3,
    fat_g: 0.7,
    fiber_g: 2.1,
    sodium_mg: 245,
    allergens: [],
    costTier: 'economico',
    requiresFridge: false,
    mealGroup: 'cafe_lanche_base'
  }
];

/**
 * ============================================================================
 * TEMPLATES OFICIAIS DE E-MAIL v0.6 (Seção 9 — Exclusivo por E-mail)
 * ============================================================================
 */
const EMAIL_TEMPLATES = {
  free_mapping_summary: {
    subject: 'EmagreSLIM — Sua leitura inicial do Mapeamento Nutricional',
    body: `Olá, {{memberName}}!

Aqui está o resumo da sua leitura inicial realizada no Mapeamento Gratuito EmagreSLIM.
Lembramos que esta leitura organiza sua principal barreira de adesão e ponto de partida — ela não constitui diagnóstico clínico nem prescrição de dieta.

Quando quiser transformar essas informações em um plano alimentar individualizado (com Relatório + PAN, Cardápio na base TACO/IBGE e Lista de Substituições), você pode acessar sua Avaliação Completa pelo link seguro deste e-mail.

Qualquer dúvida, basta responder diretamente a este e-mail.

Atenciosamente,
Luis Henrique Ale Cezar — Nutricionista | Método EmagreSLIM`
  },
  purchase_confirmed: {
    subject: 'EmagreSLIM — Confirmação da sua Avaliação Completa #{{assessmentNumber}}',
    body: `Olá, {{memberName}}!

Confirmamos o pagamento da sua Avaliação Completa EmagreSLIM (Pedido #{{orderId}} • R$ 67,90).
Para proteger seus dados de saúde, o acesso à avaliação é exclusivo pelo seu e-mail confirmado ({{email}}).

Atenciosamente,
Luis Henrique Ale Cezar — Nutricionista | Método EmagreSLIM`
  },
  awaiting_review_24h: {
    subject: 'EmagreSLIM — Recebemos sua avaliação (Análise do Nutricionista em até 24h)',
    body: `Olá, {{memberName}}!

Recebemos sua avaliação. Algumas informações precisam da análise do nosso nutricionista antes da definição do plano.
A previsão de liberação é de até 24 horas corridas após o envio completo da avaliação. Você receberá os materiais (Relatório Nutricional + PAN, Plano Alimentar e Lista de Substituições) por e-mail.

Atenciosamente,
Luis Henrique Ale Cezar — Nutricionista | Método EmagreSLIM`
  },
  plan_delivered: {
    subject: 'EmagreSLIM — Seu plano alimentar e materiais estão prontos',
    body: `Olá, {{memberName}}!

Seu plano alimentar está pronto. Ele foi elaborado com base nas respostas da sua Avaliação Completa e no método EmagreSLIM.

Entregáveis anexados / disponíveis no seu acesso protegido:
1. Relatório Nutricional & PAN (Plano de Ação Nutricional)
2. Plano Alimentar Individualizado (TACO 4ª ed. / IBGE)
3. Lista de Substituições Equivalentes

Suas dúvidas são respondidas pelo nosso nutricionista: basta responder a este e-mail.

Atenciosamente,
Luis Henrique Ale Cezar — Nutricionista | Método EmagreSLIM`
  },
  clarification_request: {
    subject: 'EmagreSLIM — Precisamos confirmar uma informação da sua avaliação',
    body: `Olá, {{memberName}}!

Estou analisando a sua Avaliação Completa #{{assessmentNumber}} e, para elaborar um plano seguro e viável para a sua rotina, preciso esclarecer o seguinte ponto:

"{{clarificationQuestion}}"

Por favor, responda diretamente a este e-mail com essa informação para darmos sequência à liberação do seu plano.

Atenciosamente,
Luis Henrique Ale Cezar — Nutricionista | Método EmagreSLIM`
  }
};

/**
 * ============================================================================
 * 4 CENÁRIOS COMPLETOS PARA TESTE CLÍNICO INSTANTÂNEO (Seção 10)
 * ============================================================================
 */
const PRESET_SCENARIOS = {
  preset_a_eligible: {
    label: 'Preset A: Caso Elegível Padrão (Liberação Direta)',
    shortTag: 'Elegível • Direto',
    data: {
      journeyType: 'new_profile',
      memberName: 'Mariana Souza',
      email: 'mariana.souza@exemplo.com.br',
      emailConfirmed: true,
      age: 34,
      sex: 'feminino',
      weightKg: 76.5,
      heightCm: 164,
      targetWeightKg: 68.0,
      freePrimaryBarrier: 'fome_noturna_tarde',
      goalDescription: 'Reduzir medidas abdominais, melhorar disposição à tarde e manter rotina alimentar sustentável sem cortar comida de verdade.',
      deadlineEvent: 'Sem evento rígido; busca constância nos próximos 4 meses.',
      recentWeightChange: 'estavel',
      healthConditions: ['nenhuma'],
      pregnantOrBreastfeeding: false,
      bariatricHistory: false,
      fluidRestriction: false,
      medications: 'Nenhum medicamento de uso contínuo.',
      unknownMedicationDose: false,
      allergies: '',
      allergySeverityUnknown: false,
      intolerances: 'Nenhuma relatada.',
      wakeTime: '06:30',
      sleepTime: '23:00',
      shiftWorker: false,
      sleepQuality: 'regular_6_7h',
      exerciseType: 'Caminhada rápida + musculação leve',
      exerciseMinutesPerWeek: 150,
      workActivityLevel: 'sentado_escritorio',
      waterIntakeLiters: 1.8,
      bowelFunction: 'regular',
      mealLocations: ['casa', 'marmita_trabalho'],
      hasFridge: true,
      hasMicrowave: true,
      whoCooks: 'eu_mesma',
      cookingTimeAvailable: 'medio_30min',
      budgetPriority: false,
      hungerPeakTime: 'tarde_noite',
      hungerCauseContext: 'Almoço às 12h e fico até 19h30 sem comer nada; chego em casa com muita fome.',
      lossOfControlFrequency: 'nunca_raramente',
      purgingOrCompensation: false,
      weekendChanges: 'Almoço em família no domingo e 1 lanche fora no sábado à noite.',
      keepFoods: 'Arroz, feijão, frango, ovo, pão francês no café da manhã e banana.',
      avoidFoods: 'Fígado e jiló.',
      previousAttempts: 'Tentei cortar totalmente carboidrato (low carb) por 2 vezes; abandonei porque sentia fraqueza e não conseguia manter na rotina de trabalho.',
      whatWouldMakeHard: 'Receitas muito elaboradas com ingredientes caros ou ter que comer de 3 em 3 horas no trabalho.',
      firstWeekChange: 'Organizar um lanche da tarde prático no trabalho e ajustar porções do jantar.'
    }
  },
  preset_b_diabetes: {
    label: 'Preset B: Agravante Diabetes + Insulina (Fila 24h)',
    shortTag: 'Agravante • 24h',
    data: {
      journeyType: 'new_profile',
      memberName: 'Carlos Eduardo Mendes',
      email: 'carlos.mendes@exemplo.com.br',
      emailConfirmed: true,
      age: 54,
      sex: 'masculino',
      weightKg: 98.0,
      heightCm: 175,
      targetWeightKg: 85.0,
      freePrimaryBarrier: 'condicao_clinica_medos',
      goalDescription: 'Emagrecer com segurança e melhorar controle glicêmico.',
      deadlineEvent: 'Retorno médico em 60 dias.',
      recentWeightChange: 'inexplicada',
      healthConditions: ['diabetes_tipo_2', 'hipertensao'],
      pregnantOrBreastfeeding: false,
      bariatricHistory: false,
      fluidRestriction: false,
      medications: 'Metformina 850mg + Insulina NPH noturna (não sei a dose exata da unidade atual)',
      unknownMedicationDose: true,
      allergies: 'Camarão (urticária moderada)',
      allergySeverityUnknown: false,
      intolerances: '',
      wakeTime: '06:00',
      sleepTime: '22:30',
      shiftWorker: false,
      sleepQuality: 'sono_fragmentado',
      exerciseType: 'Caminhada leve 2x na semana',
      exerciseMinutesPerWeek: 60,
      workActivityLevel: 'moderado_em_pe',
      waterIntakeLiters: 2.0,
      bowelFunction: 'regular',
      mealLocations: ['casa', 'restaurante_kg'],
      hasFridge: true,
      hasMicrowave: true,
      whoCooks: 'conjuge',
      cookingTimeAvailable: 'medio_30min',
      budgetPriority: false,
      hungerPeakTime: 'tarde_noite',
      hungerCauseContext: 'Fome antes de dormir.',
      lossOfControlFrequency: 'nunca_raramente',
      purgingOrCompensation: false,
      weekendChanges: 'Churrasco em família aos domingos.',
      keepFoods: 'Arroz, feijão, carnes grelhadas, salada, café sem açúcar.',
      avoidFoods: 'Doces concentrados.',
      previousAttempts: 'Dietas muito restritivas que causaram tontura e hipoglicemia.',
      whatWouldMakeHard: 'Ficar muitas horas em jejum por causa da medicação.',
      firstWeekChange: 'Regularizar horários do café da manhã e lanche da tarde.'
    }
  },
  preset_c_behavioral: {
    label: 'Preset C: Agravante Perda de Controle / Compensação (Fila 24h)',
    shortTag: 'Agravante • Comport.',
    data: {
      journeyType: 'reassessment',
      memberName: 'Juliana Ferreira',
      email: 'juliana.ferreira@exemplo.com.br',
      emailConfirmed: true,
      age: 29,
      sex: 'feminino',
      weightKg: 89.0,
      heightCm: 160,
      targetWeightKg: 70.0,
      freePrimaryBarrier: 'restricao_abandono',
      goalDescription: 'Parar de descontar o cansaço na comida à noite e recuperar relação tranquila com a alimentação.',
      deadlineEvent: 'Nenhum prazo fixo.',
      recentWeightChange: 'ganho_rapido',
      healthConditions: ['nenhuma'],
      pregnantOrBreastfeeding: false,
      bariatricHistory: false,
      fluidRestriction: false,
      medications: 'Nenhum',
      unknownMedicationDose: false,
      allergies: '',
      allergySeverityUnknown: false,
      intolerances: '',
      wakeTime: '06:30',
      sleepTime: '23:30',
      shiftWorker: false,
      sleepQuality: 'ruim_menos_5h',
      exerciseType: 'Nenhum no momento',
      exerciseMinutesPerWeek: 0,
      workActivityLevel: 'sentado_escritorio',
      waterIntakeLiters: 1.2,
      bowelFunction: 'constipacao',
      mealLocations: ['casa'],
      hasFridge: true,
      hasMicrowave: true,
      whoCooks: 'eu_mesma',
      cookingTimeAvailable: 'baixo_15min',
      budgetPriority: false,
      hungerPeakTime: 'tarde_noite',
      hungerCauseContext: 'Após dias estressantes como rápido em grande quantidade até passar mal e depois tento compensar ficando sem comer.',
      lossOfControlFrequency: 'semanal_com_sofrimento',
      purgingOrCompensation: true,
      weekendChanges: 'Alternância entre restrição e excessos.',
      keepFoods: 'Arroz, feijão, frutas, pão, ovo.',
      avoidFoods: 'Dietas proibitivas.',
      previousAttempts: 'Jejum intermitente longo e cortes radicais de calorias.',
      whatWouldMakeHard: 'Qualquer restrição rígida ou proibição de alimentos.',
      firstWeekChange: 'Manter refeições regulares sem pular café ou almoço.'
    }
  },
  preset_d_no_fridge_budget: {
    label: 'Preset D: Sem Geladeira & Orçamento Baixo (Elegível Adaptado)',
    shortTag: 'Elegível • Adaptado',
    data: {
      journeyType: 'new_profile',
      memberName: 'Rafael Oliveira',
      email: 'rafael.oliveira@exemplo.com.br',
      emailConfirmed: true,
      age: 38,
      sex: 'masculino',
      weightKg: 86.0,
      heightCm: 176,
      targetWeightKg: 78.0,
      freePrimaryBarrier: 'custo_estrutura_preparo',
      goalDescription: 'Perder 8 kg trabalhando na rua sem gastar com produtos caros ou suplementos.',
      deadlineEvent: 'Nenhum evento específico.',
      recentWeightChange: 'estavel',
      healthConditions: ['nenhuma'],
      pregnantOrBreastfeeding: false,
      bariatricHistory: false,
      fluidRestriction: false,
      medications: 'Nenhum',
      unknownMedicationDose: false,
      allergies: '',
      allergySeverityUnknown: false,
      intolerances: '',
      wakeTime: '05:30',
      sleepTime: '22:30',
      shiftWorker: false,
      sleepQuality: 'regular_6_7h',
      exerciseType: 'Caminhada',
      exerciseMinutesPerWeek: 90,
      workActivityLevel: 'moderado_em_pe',
      waterIntakeLiters: 2.2,
      bowelFunction: 'regular',
      mealLocations: ['marmita_trabalho', 'casa'],
      hasFridge: false,
      hasMicrowave: false,
      whoCooks: 'eu_mesma',
      cookingTimeAvailable: 'baixo_15min',
      budgetPriority: true,
      hungerPeakTime: 'tarde_noite',
      hungerCauseContext: 'Passo o dia na rua sem geladeira e acabo comendo salgado na padaria.',
      lossOfControlFrequency: 'nunca_raramente',
      purgingOrCompensation: false,
      weekendChanges: 'Almoço em casa com a família.',
      keepFoods: 'Arroz, feijão, ovo, banana, pão francês, sardinha, cuscuz.',
      avoidFoods: 'Itens caros, whey ou produtos diet.',
      previousAttempts: 'Tentei seguir cardápios da internet que pediam salmão, castanhas e marmitas refrigeradas que estragavam na mochila.',
      whatWouldMakeHard: 'Alimentos que precisem de geladeira durante o dia ou ingredientes caros.',
      firstWeekChange: 'Levar lanches não perecíveis (banana, aveia, pão, ovo cozido do dia/sardinha) na mochila.'
    }
  }
};

/**
 * ============================================================================
 * MOTOR CLÍNICO EMAGRESLIM v0.6 — CÁLCULOS OFICIAIS & TRIAGEM CONSERVADORA
 * ============================================================================
 * Fontes aplicadas:
 * - GER: Mifflin-St Jeor (AJCN, 1990;51:241-247)
 * - Necessidade Energética: DRI Energy (National Academies, 2023)
 * - Trava de Segurança: NICE NG246 (2025/2026) -> <= 1.200 kcal bloqueia liberação
 *   automática; <= 800 kcal fica fora do gerador padrão.
 * - Proteína & Rim: Leidy et al. (2015) + KDIGO (2024) -> bloqueio renal rígido.
 */
function runEmagreSlimEngineV06(rawInput) {
  const weight = Number(rawInput.weightKg);
  const height = Number(rawInput.heightCm);
  const targetWeight = Number(rawInput.targetWeightKg);
  const age = Number(rawInput.age);

  const triggers = [];
  const missingFields = [];

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

  const heightM = height / 100;
  const bmi =
    Number.isFinite(weight) && Number.isFinite(heightM) && heightM > 0
      ? Number((weight / (heightM * heightM)).toFixed(1))
      : null;

  // Triagem Conservadora de Agravantes (Seção 6 v0.6)
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
    const labels = {
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
  let bmr = null;
  let activityFactorUsed = null;
  let tdee = null;
  let proposedKcal = null;

  if (Number.isFinite(weight) && Number.isFinite(height) && Number.isFinite(age)) {
    const sexOffset = rawInput.sex === 'masculino' ? 5 : -161;
    bmr = Math.round(10 * weight + 6.25 * height - 5 * age + sexOffset);

    const workFactors = {
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

    // Déficit moderado e documentado de 18% (não agravado por exercício)
    proposedKcal = Math.round(tdee * 0.82);

    // Trava NICE NG246 (2025/2026) & MVP Seção 6
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

  const requiresReview = triggers.length > 0;

  // Perfil de Viabilidade Explícito (7 Eixos — Substitui nota global / IAP)
  const feasibilityProfile = [
    {
      axis: '1. Tempo & Rotina',
      status: rawInput.shiftWorker ? 'Atenção: Turnos Alternados' : 'Compatível com janelas reais',
      detail: rawInput.shiftWorker
        ? 'Refeições ancoradas ao horário de acordar e intervalos reais do turno (sem horários rígidos).'
        : `Acorda às ${rawInput.wakeTime || '06:30'} e dorme às ${rawInput.sleepTime || '23:00'}.`
    },
    {
      axis: '2. Acesso & Conservação',
      status: !rawInput.hasFridge ? 'Sem geladeira fora de casa' : 'Cadeia de frio disponível',
      detail: !rawInput.hasFridge
        ? 'Cardápio diurno adaptado com alimentos seguros fora da geladeira (banana, aveia, pão, ovo cozido do dia, sardinha em lata).'
        : 'Conservação refrigerada e aquecimento viáveis para marmitas.'
    },
    {
      axis: '3. Custo & Orçamento',
      status: rawInput.budgetPriority ? 'Prioridade Econômica Ativa' : 'Orçamento Padrão',
      detail: rawInput.budgetPriority
        ? 'Seleção restrita a itens básicos econômicos da TACO (arroz, feijão, ovo, banana, sardinha, aveia) sem suplementos.'
        : 'Base brasileira acessível com proteínas variadas.'
    },
    {
      axis: '4. Fome & Saciedade',
      status:
        rawInput.hungerPeakTime === 'tarde_noite' || rawInput.hungerPeakTime === 'madrugada_pos_turno'
          ? 'Pico identificado à tarde/noite'
          : 'Distribuída ao longo do dia',
      detail: rawInput.hungerCauseContext || 'Distribuição ajustada para evitar longos intervalos sem comer.'
    },
    {
      axis: '5. Preparo & Habilidade',
      status: rawInput.cookingTimeAvailable === 'baixo_15min' ? 'Montagens rápidas (<= 15 min)' : 'Preparo viável (até 30 min)',
      detail: `Quem cozinha: ${rawInput.whoCooks === 'eu_mesma' ? 'O próprio membro' : 'Familiar/Terceiros'}.`
    },
    {
      axis: '6. Preferências & Rejeições',
      status: 'Cultura alimentar preservada',
      detail: `Mantidos: ${rawInput.keepFoods || 'Arroz, feijão, proteínas habituais'}. Excluídos: ${rawInput.avoidFoods || 'Nenhum'}.`
    },
    {
      axis: '7. Mudanças Aceitas (Semana 1)',
      status: 'Acordo realista pactuado',
      detail: rawInput.firstWeekChange || 'Implementação gradual sem ruptura brusca.'
    }
  ];

  // PAN — Plano de Ação Nutricional fundamentado nas respostas
  const pan = {
    primaryBarrier:
      !rawInput.hasFridge || rawInput.budgetPriority
        ? 'Falta de refrigeração fora de casa associada à necessidade de baixo custo'
        : rawInput.hungerPeakTime === 'tarde_noite'
          ? 'Intervalo prolongado à tarde gerando fome intensa à noite'
          : 'Histórico de abandono por dietas excessivamente restritivas',
    secondaryBarriers: [
      rawInput.previousAttempts ? `Tentativas anteriores: "${rawInput.previousAttempts}"` : null,
      rawInput.weekendChanges ? `Fim de semana: "${rawInput.weekendChanges}"` : null,
      !rawInput.hasFridge ? 'Sem acesso a geladeira/micro-ondas durante o trabalho' : null
    ].filter(Boolean),
    memberEvidence: [
      `Contexto da fome: "${rawInput.hungerCauseContext || 'Não detalhado'}"`,
      `O que tornaria difícil: "${rawInput.whatWouldMakeHard || 'Não detalhado'}"`,
      `Acordo Semana 1: "${rawInput.firstWeekChange || 'Não detalhado'}"`
    ],
    methodInterventions: [
      'Preservar arroz, feijão e alimentos habituais em porções definidas (evitando low carb imposta).',
      'Estruturar lanche intermediário 2h30 antes do pico habitual de fome.',
      !rawInput.hasFridge
        ? 'Usar exclusivamente itens não perecíveis nas refeições fora de casa (sem risco sanitário).'
        : 'Usar preparos práticos e substituições equivalentes por grupo nutricional.',
      'Combinar flexibilidade planejada no fim de semana sem jejum compensatório.'
    ]
  };

  // BLOQUEIO DE SEGURANÇA (Seção 8): Nenhum número calórico/macro é liberado em caso de agravantes
  if (requiresReview) {
    return {
      engineVersion: 'emagreslim-engine-v0.6.0',
      eligibilityStatus: 'awaiting_review',
      requiresReview: true,
      triggers,
      anthropometry: { bmi },
      prescriptionBlocked: true,
      blockedMessage:
        'Prescrição calórica, proteica e cardápio bloqueados automaticamente até análise clínica do Nutricionista Luis Henrique Ale Cezar (prazo máximo: 24 horas corridas).',
      feasibilityProfile,
      pan,
      prescription: null
    };
  }

  // Cálculo de Macronutrientes e Hidratação (Adultos elegíveis sem doença renal/restrição hídrica)
  const proteinTargetG = Math.round(weight * 1.6); // 1.6 g/kg (Leidy et al., 2015 — sem doença renal)
  const fatTargetG = Math.round((proposedKcal * 0.27) / 9);
  const carbsTargetG = Math.round((proposedKcal - proteinTargetG * 4 - fatTargetG * 9) / 4);
  const waterTargetMl = Math.round(weight * 35);

  // Adaptação real do cardápio conforme estrutura física (com ou sem geladeira / orçamento)
  const isNoFridgeOrBudget = !rawInput.hasFridge || rawInput.budgetPriority;

  const meals = isNoFridgeOrBudget
    ? [
        {
          name: 'Café da Manhã (Econômico & Rápido)',
          suggestedWindow: 'Antes de sair de casa',
          items: [
            CURATED_FOOD_CATALOG.find(f => f.id === 'TACO-006'),
            CURATED_FOOD_CATALOG.find(f => f.id === 'TACO-005'),
            CURATED_FOOD_CATALOG.find(f => f.id === 'TACO-007')
          ].filter(Boolean)
        },
        {
          name: 'Almoço (Base Brasileira Econômica)',
          suggestedWindow: 'Entre 12:00 e 13:30',
          items: [
            CURATED_FOOD_CATALOG.find(f => f.id === 'TACO-002'),
            CURATED_FOOD_CATALOG.find(f => f.id === 'TACO-003'),
            CURATED_FOOD_CATALOG.find(f => f.id === 'TACO-005'),
            CURATED_FOOD_CATALOG.find(f => f.id === 'TACO-012')
          ].filter(Boolean)
        },
        {
          name: 'Lanche da Rua / Mochila (100% Sem Geladeira)',
          suggestedWindow: 'Entre 16:00 e 17:00',
          items: [
            CURATED_FOOD_CATALOG.find(f => f.id === 'TACO-007'),
            CURATED_FOOD_CATALOG.find(f => f.id === 'TACO-008'),
            CURATED_FOOD_CATALOG.find(f => f.id === 'TACO-013')
          ].filter(Boolean)
        },
        {
          name: 'Jantar em Casa (Proteína Econômica)',
          suggestedWindow: 'Entre 19:30 e 21:00',
          items: [
            CURATED_FOOD_CATALOG.find(f => f.id === 'TACO-002'),
            CURATED_FOOD_CATALOG.find(f => f.id === 'TACO-010'),
            CURATED_FOOD_CATALOG.find(f => f.id === 'TACO-012')
          ].filter(Boolean)
        }
      ]
    : [
        {
          name: 'Café da Manhã',
          suggestedWindow: 'Até 1h após acordar',
          items: [
            CURATED_FOOD_CATALOG.find(f => f.id === 'TACO-006'),
            CURATED_FOOD_CATALOG.find(f => f.id === 'TACO-005'),
            CURATED_FOOD_CATALOG.find(f => f.id === 'TACO-009')
          ].filter(Boolean)
        },
        {
          name: 'Almoço (Base Brasileira)',
          suggestedWindow: 'Entre 12:00 e 13:30',
          items: [
            CURATED_FOOD_CATALOG.find(f => f.id === 'TACO-002'),
            CURATED_FOOD_CATALOG.find(f => f.id === 'TACO-003'),
            CURATED_FOOD_CATALOG.find(f => f.id === 'TACO-004'),
            CURATED_FOOD_CATALOG.find(f => f.id === 'TACO-012')
          ].filter(Boolean)
        },
        {
          name: 'Lanche Estratégico da Tarde (Proteção contra fome noturna)',
          suggestedWindow: 'Entre 16:00 e 17:00',
          items: [
            CURATED_FOOD_CATALOG.find(f => f.id === 'TACO-007'),
            CURATED_FOOD_CATALOG.find(f => f.id === 'TACO-008')
          ].filter(Boolean)
        },
        {
          name: 'Jantar Prático',
          suggestedWindow: 'Entre 19:30 e 21:00',
          items: [
            CURATED_FOOD_CATALOG.find(f => f.id === 'TACO-011'),
            CURATED_FOOD_CATALOG.find(f => f.id === 'TACO-004'),
            CURATED_FOOD_CATALOG.find(f => f.id === 'TACO-012')
          ].filter(Boolean)
        }
      ];

  const substitutions = [
    {
      group: 'Grupo 1 — Carboidratos Base (Preservando fibra e energia)',
      original: 'Arroz tipo 1 cozido (TACO Cód. 6) — 4 colheres de sopa cheias (100g | 128 kcal | 28,1g carb)',
      equivalents: [
        'Arroz integral cozido (TACO Cód. 4) — 4 colheres de sopa cheias (100g | 124 kcal | 25,8g carb | 2,7g fibra)',
        'Batata inglesa cozida (TACO Cód. 95) — 1,5 unidade média picada (210g | 110 kcal | 25,0g carb | 2,7g fibra)',
        'Cuscuz de milho cozido (TACO Cód. 24) — 4 colheres de sopa (110g | 124 kcal | 27,8g carb — não exige geladeira)'
      ]
    },
    {
      group: 'Grupo 2 — Proteínas Principais (Preservando aporte proteico)',
      original: 'Peito de frango grelhado (TACO Cód. 412) — 1 filé médio (100g | 159 kcal | 32,0g prot)',
      equivalents: [
        'Ovos de galinha cozidos (TACO Cód. 475) — 3 unidades médias (135g | 196 kcal | 18,0g prot — opção econômica)',
        'Sardinha em conserva drenada (TACO Cód. 351) — 1,5 lata pequena (126g | 243 kcal | 30,9g prot — segura fora da geladeira)'
      ]
    },
    {
      group: 'Grupo 3 — Café da Manhã & Lanches Rápidos',
      original: 'Pão trigo francês (TACO Cód. 72) — 1 unidade média (50g | 150 kcal | 29,3g carb)',
      equivalents: [
        'Aveia em flocos crua (TACO Cód. 14, 30g) + 1 Banana prata (TACO Cód. 176, 65g) — (182 kcal | 36,9g carb | 4,0g fibra)'
      ]
    }
  ];

  return {
    engineVersion: 'emagreslim-engine-v0.6.0',
    eligibilityStatus: 'direct_release',
    requiresReview: false,
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
      waterNote: 'Referência prática de água/líquidos totais (35 ml/kg) para adultos sem restrição hídrica.',
      meals,
      substitutions
    }
  };
}

/**
 * ============================================================================
 * SQL MIGRATION v0.6 COMPLETO PARA PRODUÇÃO (Evolução da v0.5)
 * ============================================================================
 */
const SQL_MIGRATION_V06 = `-- EMAGRESLIM MIGRATION v0.6
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
    'cancelled'
  ));

ALTER TABLE paid_assessments
  ADD COLUMN IF NOT EXISTS email_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS submitted_complete_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS eligibility_mode TEXT
    CHECK (eligibility_mode IN ('direct_release', 'manual_review')),
  ADD COLUMN IF NOT EXISTS aggravation_triggers JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS feasibility_profile JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS pan_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS reviewed_by_crn TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS clinical_review_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL UNIQUE REFERENCES paid_assessments(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  assigned_nutritionist TEXT NOT NULL DEFAULT 'Luis Henrique Ale Cezar',
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

/**
 * ============================================================================
 * MOTOR TYPESCRIPT & ZOD v0.6 (Validação no Servidor — Seção 8)
 * ============================================================================
 */
const ENGINE_SPEC_TS = `// engine_v0_6_spec.ts
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
});

export function evaluateAssessmentV06(rawPayload: unknown) {
  const parsed = PaidAssessmentInputSchema.safeParse(rawPayload);
  if (!parsed.success) {
    return {
      status: 'awaiting_review' as const,
      requiresReview: true,
      triggers: parsed.error.issues.map(i => i.message),
      prescription: null
    };
  }
  const input = parsed.data;
  const triggers: string[] = [];
  const bmi = input.weightKg / Math.pow(input.heightCm / 100, 2);

  if (input.age < 18 || input.age > 64) triggers.push('Idade fora do corte automático (18-64 anos)');
  if (bmi < 18.5 || bmi >= 40) triggers.push(\`IMC \${bmi.toFixed(1)} fora do escopo automático\`);
  if (input.recentWeightChange === 'inexplicada') triggers.push('Mudança de peso inexplicada');
  if (input.pregnantOrBreastfeeding || input.bariatricHistory || input.fluidRestriction) triggers.push('Condição clínica modificadora');
  if (input.unknownMedicationDose || input.allergySeverityUnknown) triggers.push('Pendência de dose/alergia');
  if (input.purgingOrCompensation || ['semanal_com_sofrimento', 'frequente_diario'].includes(input.lossOfControlFrequency)) {
    triggers.push('Perda de controle / compensação');
  }

  // Mifflin-St Jeor (1990) + DRI Energy (2023)
  const bmr = 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age + (input.sex === 'masculino' ? 5 : -161);
  const mult = input.workActivityLevel === 'sentado_escritorio' ? 1.35 : input.workActivityLevel === 'moderado_em_pe' ? 1.5 : 1.65;
  const targetKcal = Math.round(bmr * mult * 0.82);
  if (targetKcal <= 1200) triggers.push(\`Meta \${targetKcal} kcal <= 1200 kcal (NICE NG246)\`);

  if (triggers.length > 0) {
    return { status: 'awaiting_review' as const, requiresReview: true, triggers, prescription: null };
  }
  return {
    status: 'direct_release' as const,
    requiresReview: false,
    triggers: [],
    prescription: { targetKcal, proteinG: Math.round(input.weightKg * 1.6), waterMl: Math.round(input.weightKg * 35) }
  };
}`;

/**
 * ============================================================================
 * COMPONENTE PRINCIPAL — EMAGRESLIM v0.6 END-TO-END TESTER
 * ============================================================================
 */
export default function App() {
  // Navegação principal entre os 4 módulos do sistema
  const [activeTab, setActiveTab] = useState('lead_journey');

  // Etapas da Jornada Ponta a Ponta do Lead (Tab 1):
  // 1: 'home_landing' -> 2: 'free_mapping' -> 3: 'free_result' -> 4: 'checkout_auth' -> 5: 'paid_6_blocks' -> 6: 'paid_deliverables'
  const [journeyStep, setJourneyStep] = useState('home_landing');
  const [freeMappingStep, setFreeMappingStep] = useState(1); // 1 (7%), 2 (38%), 3 (72%), 4 (100% e-mail)
  const [paidBlock, setPaidBlock] = useState(1);
  const [showPaidReviewSummary, setShowPaidReviewSummary] = useState(false);

  // Dados do lead/membro atual
  const [formData, setFormData] = useState(PRESET_SCENARIOS.preset_a_eligible.data);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [orderId, setOrderId] = useState('ORD-2026-8841');
  const [toastMessage, setToastMessage] = useState(null);

  // Resultado da avaliação paga atual e entregável selecionado
  const [currentEvaluation, setCurrentEvaluation] = useState(null);
  const [activeDeliverableTab, setActiveDeliverableTab] = useState('report_pan'); // 'report_pan' | 'meal_plan' | 'substitutions'
  const [memberPanFeedback, setMemberPanFeedback] = useState('');
  const [panConfirmedByMember, setPanConfirmedByMember] = useState(false);
  const [checkinWeight, setCheckinWeight] = useState('');
  const [checkinHunger, setCheckinHunger] = useState(4);
  const [checkinsList, setCheckinsList] = useState([]);

  // Log sanitizado de Analytics / GTM (comprova ausência de status clínico e ausência de WhatsApp/Z-API)
  const [gtmEvents, setGtmEvents] = useState([
    {
      id: 'GTM-001',
      time: 'Sessão iniciada',
      eventName: 'page_view_home',
      payload: '{ path: "/", whatsapp_collector: false, clinical_status: "OMITTED" }',
      audit: 'OK — Nenhum dado sensível exposto'
    }
  ]);

  // Fila de avaliações no sistema (integrada em tempo real com Painel Clínico do Luis)
  const [assessments, setAssessments] = useState(() => {
    const initialCarlos = runEmagreSlimEngineV06(PRESET_SCENARIOS.preset_b_diabetes.data);
    const now = Date.now();
    return [
      {
        id: 'ASM-2026-0142',
        assessmentNumber: 1,
        memberName: PRESET_SCENARIOS.preset_b_diabetes.data.memberName,
        email: PRESET_SCENARIOS.preset_b_diabetes.data.email,
        status: 'awaiting_review',
        submittedAt: new Date(now - 21 * 3600 * 1000).toISOString(),
        slaDueAt: new Date(now + 3 * 3600 * 1000).toISOString(),
        input: PRESET_SCENARIOS.preset_b_diabetes.data,
        engineResult: initialCarlos,
        clarifications: [],
        nutritionistNotes: ''
      }
    ];
  });

  // Fila idempotente de e-mails
  const [emailOutbox, setEmailOutbox] = useState([
    {
      id: 'EML-9001',
      idempotencyKey: 'ASM-2026-0142:awaiting_review_24h',
      recipientEmail: 'carlos.mendes@exemplo.com.br',
      memberName: 'Carlos Eduardo Mendes',
      templateKey: 'awaiting_review_24h',
      safeSubject: 'EmagreSLIM — Recebemos sua avaliação (Análise do Nutricionista em até 24h)',
      deliveryStatus: 'delivered',
      createdAt: 'Hoje, 07:20',
      auditNote: 'Sem WhatsApp/Z-API • Zero dados clínicos no assunto'
    }
  ]);

  // Estados do Painel Clínico do Luis
  const [selectedReviewId, setSelectedReviewId] = useState('ASM-2026-0142');
  const [clarificationText, setClarificationText] = useState('');
  const [manualKcal, setManualKcal] = useState(1850);
  const [manualProteinG, setManualProteinG] = useState(145);
  const [manualWaterMl, setManualWaterMl] = useState(2800);
  const [manualPlanText, setManualPlanText] = useState(
    '• Café da Manhã (06:30): 1 Pão francês (50g - TACO Cód. 72) + 2 Ovos cozidos (90g - TACO Cód. 475) + Café sem açúcar.\n• Lanche da Manhã (09:30): 1 Banana prata (65g - TACO Cód. 176) + 2 col. sopa de Aveia (30g - TACO Cód. 14).\n• Almoço (12:30): 4 col. sopa Arroz cozido (100g - TACO Cód. 6) + 1 concha Feijão carioca (86g - TACO Cód. 521) + 1 Filé de frango grelhado (100g - TACO Cód. 412) + Salada verde.\n• Lanche da Tarde (16:30): 1 copo Leite desnatado (240ml - TACO Cód. 455) + 1 fruta.\n• Jantar (20:00): 140g Batata inglesa cozida (TACO Cód. 95) + 100g Frango grelhado + Legumes.'
  );
  const [nutritionistClinicalNote, setNutritionistClinicalNote] = useState('');
  const [previewEmailModal, setPreviewEmailModal] = useState(null);
  const [copiedCodeBlock, setCopiedCodeBlock] = useState(null);
  const [nowTick, setNowTick] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNowTick(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4200);
  };

  const trackSanitizedGtmEvent = (eventName, safeMeta = {}) => {
    setGtmEvents(prev => [
      {
        id: `GTM-${String(prev.length + 1).padStart(3, '0')}`,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        eventName,
        payload: JSON.stringify({
          ...safeMeta,
          clinical_status: 'STRIPPED_BY_V06_PATCH',
          zapi_whatsapp_call: false
        }),
        audit: 'OK — Conformidade LGPD/v0.6 validada'
      },
      ...prev
    ]);
  };

  const enqueueEmail = ({ idempotencyKey, recipientEmail, memberName, templateKey }) => {
    setEmailOutbox(prev => {
      if (prev.some(e => e.idempotencyKey === idempotencyKey)) return prev;
      const tpl = EMAIL_TEMPLATES[templateKey];
      const newEmail = {
        id: `EML-${Math.floor(1000 + Math.random() * 9000)}`,
        idempotencyKey,
        recipientEmail,
        memberName,
        templateKey,
        safeSubject: tpl.subject.replace('{{assessmentNumber}}', '1'),
        deliveryStatus: 'prepared',
        createdAt: 'Agora mesmo',
        auditNote: 'Sem WhatsApp/Z-API • Zero dados clínicos no assunto'
      };
      setTimeout(() => {
        setEmailOutbox(curr =>
          curr.map(item => (item.id === newEmail.id ? { ...item, deliveryStatus: 'sent_to_provider' } : item))
        );
      }, 800);
      setTimeout(() => {
        setEmailOutbox(curr =>
          curr.map(item => (item.id === newEmail.id ? { ...item, deliveryStatus: 'delivered' } : item))
        );
      }, 2000);
      return [newEmail, ...prev];
    });
  };

  const handleLoadPreset = (presetKey) => {
    const preset = PRESET_SCENARIOS[presetKey];
    setFormData({ ...preset.data });
    setIsEmailVerified(true);
    setShowPaidReviewSummary(false);
    setPaidBlock(1);
    showToast(`Cenário carregado: ${preset.label}`);
  };

  const toggleHealthCondition = (condKey) => {
    setFormData(prev => {
      const current = prev.healthConditions || [];
      if (condKey === 'nenhuma') return { ...prev, healthConditions: ['nenhuma'] };
      const withoutNone = current.filter(c => c !== 'nenhuma');
      const exists = withoutNone.includes(condKey);
      const updated = exists ? withoutNone.filter(c => c !== condKey) : [...withoutNone, condKey];
      return { ...prev, healthConditions: updated.length === 0 ? ['nenhuma'] : updated };
    });
  };

  // Conclusão do Mapeamento Gratuito (/mapeamento)
  const handleCompleteFreeMapping = () => {
    if (!formData.email || !formData.email.includes('@')) {
      showToast('Informe um endereço de e-mail válido para receber sua leitura gratuita.');
      return;
    }
    trackSanitizedGtmEvent('free_mapping_completed', {
      journey_type: formData.journeyType,
      contact_channel: 'email_only'
    });
    enqueueEmail({
      idempotencyKey: `free_map:${formData.email}:${Date.now()}`,
      recipientEmail: formData.email,
      memberName: formData.memberName || 'Visitante',
      templateKey: 'free_mapping_summary'
    });
    setJourneyStep('free_result');
    showToast('Mapeamento gratuito concluído! Evento sanitizado enviado ao GTM e resumo enviado por e-mail.');
  };

  // Aprovação do Checkout R$ 67,90 -> Cria Avaliação Paga #1
  const handleApproveCheckout = () => {
    const newOrder = `ORD-2026-${Math.floor(1000 + Math.random() * 8999)}`;
    setOrderId(newOrder);
    setIsEmailVerified(false); // Exige confirmação explícita de titularidade de e-mail
    trackSanitizedGtmEvent('paid_assessment_purchased', {
      order_id: newOrder,
      amount_brl: 67.9
    });
    enqueueEmail({
      idempotencyKey: `purchase:${newOrder}`,
      recipientEmail: formData.email,
      memberName: formData.memberName,
      templateKey: 'purchase_confirmed'
    });
    setJourneyStep('checkout_auth');
    showToast(`Pagamento R$ 67,90 aprovado (${newOrder})! Confirme a titularidade do e-mail para desbloquear os 6 blocos.`);
  };

  // Envio definitivo da Avaliação Completa (6 Blocos)
  const handleSubmitFullAssessment = () => {
    const evaluation = runEmagreSlimEngineV06({
      ...formData,
      emailConfirmed: isEmailVerified
    });

    const newId = `ASM-2026-0${Math.floor(144 + Math.random() * 800)}`;
    const now = new Date();
    const due = new Date(now.getTime() + 24 * 3600 * 1000);

    const record = {
      id: newId,
      assessmentNumber: 1,
      memberName: formData.memberName,
      email: formData.email,
      status: evaluation.requiresReview ? 'awaiting_review' : 'completed',
      submittedAt: now.toISOString(),
      slaDueAt: due.toISOString(),
      input: { ...formData },
      engineResult: evaluation,
      clarifications: [],
      nutritionistNotes: ''
    };

    setAssessments(prev => [record, ...prev]);
    setCurrentEvaluation(record);
    setJourneyStep('paid_deliverables');
    setActiveDeliverableTab('report_pan');

    trackSanitizedGtmEvent('paid_assessment_submitted', {
      assessment_id: newId
    });

    if (evaluation.requiresReview) {
      setSelectedReviewId(newId);
      enqueueEmail({
        idempotencyKey: `${newId}:awaiting_review_24h`,
        recipientEmail: formData.email,
        memberName: formData.memberName,
        templateKey: 'awaiting_review_24h'
      });
      showToast('Agravante detectado! Prescrição automática bloqueada e caso enviado para fila de 24h do Luis.');
    } else {
      enqueueEmail({
        idempotencyKey: `${newId}:plan_delivered`,
        recipientEmail: formData.email,
        memberName: formData.memberName,
        templateKey: 'plan_delivered'
      });
      showToast('Caso elegível sem agravantes! Os 3 entregáveis foram liberados e enviados por e-mail.');
    }
  };

  // Ações do Nutricionista Luis no Painel Clínico
  const handleSendClarification = (assessment) => {
    if (!clarificationText.trim()) return;
    const question = clarificationText.trim();
    setAssessments(prev =>
      prev.map(a =>
        a.id === assessment.id
          ? {
              ...a,
              status: 'awaiting_member_clarification',
              clarifications: [
                ...a.clarifications,
                {
                  id: Date.now(),
                  question,
                  sentAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                }
              ]
            }
          : a
      )
    );
    enqueueEmail({
      idempotencyKey: `${assessment.id}:clarification:${Date.now()}`,
      recipientEmail: assessment.email,
      memberName: assessment.memberName,
      templateKey: 'clarification_request'
    });
    setClarificationText('');
    showToast(`Pergunta de esclarecimento enviada para ${assessment.email} e registrada no histórico.`);
  };

  const handleApproveAndReleaseByNutritionist = (assessment) => {
    const updatedEngine = {
      ...assessment.engineResult,
      eligibilityStatus: 'manual_approved_released',
      requiresReview: false,
      prescriptionBlocked: false,
      reviewedBy: 'Luis Henrique Ale Cezar — Nutricionista',
      reviewedAt: new Date().toLocaleString('pt-BR'),
      nutritionistClinicalNote,
      prescription: {
        scientificReferences: [
          'Avaliação Clínica Individualizada — Nutricionista Luis Henrique Ale Cezar',
          'Composição & Medidas Caseiras: TACO 4ª ed. (NEPA/Unicamp) + IBGE POF 2008-2009'
        ],
        equationUsed: 'Prescrição Clínica Individualizada (Revisão Nutricionista Luis)',
        targetKcal: Number(manualKcal),
        macros: {
          proteinG: Number(manualProteinG),
          proteinPerKg: Number((Number(manualProteinG) / Number(assessment.input.weightKg || 75)).toFixed(1)),
          carbsG: Math.max(0, Math.round((Number(manualKcal) - Number(manualProteinG) * 4 - Number(manualKcal) * 0.27) / 4)),
          fatG: Math.round((Number(manualKcal) * 0.27) / 9)
        },
        waterTargetMl: Number(manualWaterMl),
        waterNote: 'Volume hídrico validado individualmente após análise clínica.',
        manualPlanText
      }
    };

    setAssessments(prev =>
      prev.map(a => (a.id === assessment.id ? { ...a, status: 'completed', engineResult: updatedEngine } : a))
    );
    if (currentEvaluation && currentEvaluation.id === assessment.id) {
      setCurrentEvaluation(prev => ({ ...prev, status: 'completed', engineResult: updatedEngine }));
    }
    enqueueEmail({
      idempotencyKey: `${assessment.id}:plan_delivered_manual`,
      recipientEmail: assessment.email,
      memberName: assessment.memberName,
      templateKey: 'plan_delivered'
    });
    showToast(`Plano aprovado pelo Luis e liberado para ${assessment.email}!`);
  };

  const getSlaCountdown = (slaDueAtIso) => {
    const diffMs = new Date(slaDueAtIso).getTime() - nowTick;
    if (diffMs <= 0) {
      return { text: 'Prazo 24h excedido — Aguardando ação manual (NUNCA auto-libera)', isRisk: true };
    }
    const totalMinutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return { text: `${hours}h ${minutes}m restantes (24h corridas)`, isRisk: hours < 4 };
  };

  const selectedReviewAssessment = useMemo(
    () => assessments.find(a => a.id === selectedReviewId) || assessments[0],
    [assessments, selectedReviewId]
  );

  const pendingReviewsCount = useMemo(
    () => assessments.filter(a => a.status === 'awaiting_review' || a.status === 'awaiting_member_clarification').length,
    [assessments]
  );

  const freeProgressPercent = freeMappingStep === 1 ? 7 : freeMappingStep === 2 ? 38 : freeMappingStep === 3 ? 72 : 100;

  const barrierExplanation = {
    fome_noturna_tarde: {
      title: 'Pico de fome no fim da tarde e à noite',
      text: 'Longos intervalos sem alimentação adequada durante o dia costumam concentrar a fome à noite. O foco não é força de vontade isolada, mas redistribuir energia, proteína e fibra nos horários críticos.'
    },
    restricao_abandono: {
      title: 'Abandono após tentativas muito restritivas',
      text: 'Cortes radicais ou proibição de alimentos culturais (como arroz e feijão) geram fadiga de decisão e abandono. A base do método é ajustar porções mantendo alimentos reconhecíveis.'
    },
    custo_estrutura_preparo: {
      title: 'Tempo, custo ou falta de estrutura fora de casa',
      text: 'Prescrever alimentos que exigem geladeira ou ingredientes caros inviabiliza a execução. O plano precisa nascer adaptado à sua estrutura real de compras e conservação.'
    },
    condicao_clinica_medos: {
      title: 'Cuidados clínicos, medicamentos ou receio de errar',
      text: 'Quando há condições de saúde ou medicamentos em uso, a segurança vem antes de qualquer cálculo automático — por isso casos assim passam pela revisão do nutricionista em até 24h.'
    }
  };

  const handleCopyCode = (key, text) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeBlock(key);
    setTimeout(() => setCopiedCodeBlock(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-stone-900 font-sans">
      {/* NOTIFICAÇÃO FLUTUANTE */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 bg-[#155E42] text-white px-4 py-3 rounded-xl shadow-xl border border-emerald-700 max-w-md">
          <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
          <p className="text-sm font-medium">{toastMessage}</p>
        </div>
      )}

      {/* BARRA SUPERIOR DE MODO DE TESTE & INSPEÇÃO DO FUNIL (v0.6) */}
      <header className="bg-[#123D2B] text-white border-b border-emerald-900 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1E7A56] flex items-center justify-center border border-emerald-400/30">
                <HeartPulse className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-serif font-bold tracking-tight">EmagreSLIM</span>
                  <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                    Simulador Ponta a Ponta v0.6
                  </span>
                </div>
                <p className="text-xs text-emerald-200/80">
                  Luis Henrique Ale Cezar • Mapeamento Gratuito → Avaliação Completa (R$ 67,90) → Revisão 24h & E-mail Único
                </p>
              </div>
            </div>

            {/* ABAS PRINCIPAIS DO SISTEMA */}
            <nav className="flex flex-wrap gap-1.5 bg-[#0D2E20] p-1.5 rounded-xl border border-emerald-800/80">
              <button
                onClick={() => setActiveTab('lead_journey')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
                  activeTab === 'lead_journey'
                    ? 'bg-[#1E7A56] text-white shadow-sm'
                    : 'text-emerald-200/80 hover:text-white hover:bg-emerald-900/60'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>1. Jornada Ponta a Ponta</span>
              </button>

              <button
                onClick={() => setActiveTab('nutritionist_panel')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
                  activeTab === 'nutritionist_panel'
                    ? 'bg-[#1E7A56] text-white shadow-sm'
                    : 'text-emerald-200/80 hover:text-white hover:bg-emerald-900/60'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>2. Painel Luis (Fila 24h)</span>
                {pendingReviewsCount > 0 && (
                  <span className="px-1.5 py-0.5 text-xs font-bold rounded-full bg-amber-400 text-stone-950">
                    {pendingReviewsCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('email_gtm_audit')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
                  activeTab === 'email_gtm_audit'
                    ? 'bg-[#1E7A56] text-white shadow-sm'
                    : 'text-emerald-200/80 hover:text-white hover:bg-emerald-900/60'
                }`}
              >
                <Mail className="w-4 h-4" />
                <span>3. E-mails & Auditoria GTM</span>
                <span className="px-1.5 py-0.5 text-xs rounded-full bg-emerald-950 text-emerald-200">
                  {emailOutbox.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('tech_architecture')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
                  activeTab === 'tech_architecture'
                    ? 'bg-[#1E7A56] text-white shadow-sm'
                    : 'text-emerald-200/80 hover:text-white hover:bg-emerald-900/60'
                }`}
              >
                <Database className="w-4 h-4" />
                <span>4. SQL & Motor v0.6</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* =================================================================== */}
      {/* ABA 1: JORNADA COMPLETA DO LEAD (PONTA A PONTA)                     */}
      {/* =================================================================== */}
      {activeTab === 'lead_journey' && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* CONTROLE DE TELETRANSPORTE DO TESTADOR (Para Luis saltar ou carregar presets) */}
          <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#155E42]">
                <Sparkles className="w-4 h-4" />
                <span>Mapa do Funil em Tempo Real (Clique em qualquer etapa para inspecionar)</span>
              </div>
              <span className="text-xs text-stone-500">
                WhatsApp/Z-API: <strong className="text-rose-700">Removido</strong> • Canal Único: <strong className="text-[#155E42]">E-mail Confirmado</strong>
              </span>
            </div>

            {/* Stepper Horizontal das 6 Etapas Reais */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {[
                { id: 'home_landing', num: '1', label: 'Home (/)' },
                { id: 'free_mapping', num: '2', label: 'Mapeamento Grátis' },
                { id: 'free_result', num: '3', label: 'Leitura + Oferta' },
                { id: 'checkout_auth', num: '4', label: 'Checkout & E-mail' },
                { id: 'paid_6_blocks', num: '5', label: '6 Blocos Clínicos' },
                { id: 'paid_deliverables', num: '6', label: '3 Entregáveis / 24h' }
              ].map(st => {
                const active = journeyStep === st.id;
                return (
                  <button
                    key={st.id}
                    onClick={() => {
                      if (st.id === 'paid_deliverables' && !currentEvaluation) {
                        showToast('Envie os 6 Blocos na Etapa 5 para gerar os entregáveis.');
                        return;
                      }
                      setJourneyStep(st.id);
                    }}
                    className={`px-3 py-2 rounded-xl border text-left transition ${
                      active
                        ? 'bg-[#155E42] text-white border-[#155E42] shadow-sm'
                        : 'bg-[#FAF9F6] hover:bg-stone-100 border-stone-200 text-stone-700'
                    }`}
                  >
                    <span className={`text-[10px] font-bold uppercase block ${active ? 'text-emerald-200' : 'text-stone-400'}`}>
                      Passo {st.num}
                    </span>
                    <span className="text-xs font-bold truncate block">{st.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Presets de Teste Rápido */}
            <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-stone-600 mr-1">Preencher Cenário de Teste:</span>
              {Object.entries(PRESET_SCENARIOS).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => handleLoadPreset(key)}
                  className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-emerald-50 hover:border-emerald-400 border border-stone-200 text-xs font-medium text-stone-800 transition"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* --------------------------------------------------------------- */}
          {/* PASSO 1: HOME / LANDING PAGE (emagreslim.com.br)                */}
          {/* --------------------------------------------------------------- */}
          {journeyStep === 'home_landing' && (
            <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm">
              <div className="p-8 sm:p-12 lg:p-16 bg-gradient-to-br from-[#FAF9F6] via-white to-emerald-50/40">
                <div className="max-w-3xl space-y-6">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100/80 text-[#155E42]">
                    Método EmagreSLIM • Nutrição Baseada em Evidências e Vida Real
                  </span>
                  <h1 className="text-3xl sm:text-5xl font-serif font-bold text-stone-900 leading-tight">
                    Seu próximo passo para emagrecer começa com você
                  </h1>
                  <p className="text-base sm:text-lg text-stone-600 leading-relaxed">
                    Antes de qualquer plano alimentar, entendemos sua rotina, sua fome real, seu orçamento e o que já fez você abandonar tentativas anteriores. Comece pelo Mapeamento Nutricional gratuito.
                  </p>
                  <div className="flex flex-wrap items-center gap-4 pt-2">
                    <button
                      onClick={() => {
                        setFreeMappingStep(1);
                        setJourneyStep('free_mapping');
                        trackSanitizedGtmEvent('cta_start_free_mapping', { source: 'home_hero' });
                      }}
                      className="px-7 py-4 rounded-2xl bg-[#155E42] hover:bg-[#104933] text-white font-bold text-base shadow-md flex items-center gap-2 transition"
                    >
                      <span>Quero fazer meu mapeamento gratuito</span>
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <span className="text-xs text-stone-500">
                      Leva menos de 2 minutos • Sem WhatsApp • Sem promessa milagrosa
                    </span>
                  </div>
                </div>

                {/* Os 3 Passos do Funil Explicados na Home */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-12 pt-10 border-t border-stone-200/80">
                  <div className="p-5 rounded-2xl bg-white border border-stone-200 space-y-2">
                    <span className="w-7 h-7 rounded-full bg-emerald-100 text-[#155E42] font-bold text-xs flex items-center justify-center">
                      1
                    </span>
                    <h3 className="font-bold text-stone-900">Mapeamento Nutricional Gratuito</h3>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      Identificamos seu momento atual e a barreira que mais atrapalha sua adesão hoje. Não gera dieta automática gratuita nem substitui consulta.
                    </p>
                  </div>
                  <div className="p-5 rounded-2xl bg-white border border-stone-200 space-y-2">
                    <span className="w-7 h-7 rounded-full bg-emerald-100 text-[#155E42] font-bold text-xs flex items-center justify-center">
                      2
                    </span>
                    <h3 className="font-bold text-stone-900">Leitura Inicial do Seu Perfil</h3>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      Você recebe uma leitura clara sobre sua principal barreira e orientações práticas iniciais diretamente no seu e-mail.
                    </p>
                  </div>
                  <div className="p-5 rounded-2xl bg-white border border-stone-200 space-y-2">
                    <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center">
                      3
                    </span>
                    <h3 className="font-bold text-stone-900">Avaliação Completa (Etapa Paga • R$ 67,90)</h3>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      Opcional: aprofundamento em 6 blocos para entrega do Relatório + PAN, Plano Alimentar (TACO/IBGE) e Lista de Substituições por e-mail.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --------------------------------------------------------------- */}
          {/* PASSO 2: MAPEAMENTO GRATUITO (/mapeamento — inicia em 7%)       */}
          {/* --------------------------------------------------------------- */}
          {journeyStep === 'free_mapping' && (
            <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
              {/* Barra de progresso idêntica ao /mapeamento (7% -> 100%) */}
              <div className="p-6 border-b border-stone-100 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-stone-500">
                  <span>Mapeamento Nutricional Gratuito (/mapeamento)</span>
                  <span className="text-[#155E42] font-bold">{freeProgressPercent}% concluído</span>
                </div>
                <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#155E42] transition-all duration-300"
                    style={{ width: `${freeProgressPercent}%` }}
                  />
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-6">
                {freeMappingStep === 1 && (
                  <div className="space-y-4">
                    <h2 className="text-2xl font-serif font-bold text-stone-900">
                      É sua primeira vez no EmagreSLIM?
                    </h2>
                    <p className="text-sm text-stone-600">
                      Queremos criar um novo Perfil Nutricional ou continuar sua jornada de reavaliação.
                    </p>

                    <div className="grid grid-cols-1 gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, journeyType: 'new_profile' });
                          setFreeMappingStep(2);
                        }}
                        className={`p-4 rounded-2xl border-2 text-left transition ${
                          formData.journeyType === 'new_profile'
                            ? 'border-[#155E42] bg-emerald-50/50'
                            : 'border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <p className="font-bold text-stone-900">É minha primeira vez (Criar novo Perfil Nutricional)</p>
                        <p className="text-xs text-stone-500 mt-0.5">
                          Vamos mapear sua rotina atual, preferências e principal obstáculo de adesão.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, journeyType: 'reassessment' });
                          setFreeMappingStep(2);
                        }}
                        className={`p-4 rounded-2xl border-2 text-left transition ${
                          formData.journeyType === 'reassessment'
                            ? 'border-[#155E42] bg-emerald-50/50'
                            : 'border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <p className="font-bold text-stone-900">Já fiz antes / Quero continuar minha jornada</p>
                        <p className="text-xs text-stone-500 mt-0.5">
                          Preserva seu histórico de avaliações anteriores e atualiza seu momento atual.
                        </p>
                      </button>
                    </div>
                  </div>
                )}

                {freeMappingStep === 2 && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-serif font-bold text-stone-900">
                      Dados básicos para contextualizar seu momento
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">Sexo Biológico</label>
                        <select
                          value={formData.sex}
                          onChange={e => setFormData({ ...formData, sex: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                        >
                          <option value="feminino">Feminino</option>
                          <option value="masculino">Masculino</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">Idade (anos)</label>
                        <input
                          type="number"
                          value={formData.age}
                          onChange={e => setFormData({ ...formData, age: Number(e.target.value) })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">Peso Atual (kg)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.weightKg}
                          onChange={e => setFormData({ ...formData, weightKg: Number(e.target.value) })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">Altura (cm)</label>
                        <input
                          type="number"
                          value={formData.heightCm}
                          onChange={e => setFormData({ ...formData, heightCm: Number(e.target.value) })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between pt-3">
                      <button
                        onClick={() => setFreeMappingStep(1)}
                        className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-semibold text-stone-700"
                      >
                        Voltar
                      </button>
                      <button
                        onClick={() => setFreeMappingStep(3)}
                        className="px-5 py-2.5 rounded-xl bg-[#155E42] text-white text-xs font-bold"
                      >
                        Continuar
                      </button>
                    </div>
                  </div>
                )}

                {freeMappingStep === 3 && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-serif font-bold text-stone-900">
                      Qual barreira mais impede sua adesão hoje?
                    </h2>
                    <p className="text-xs text-stone-500">
                      No método EmagreSLIM, não culpamos sua força de vontade — identificamos o obstáculo real para adaptar o plano.
                    </p>

                    <div className="space-y-2.5">
                      {[
                        {
                          key: 'fome_noturna_tarde',
                          title: 'Fome intensa no fim da tarde ou à noite',
                          desc: 'Passo horas sem comer bem e chego à noite com muita fome.'
                        },
                        {
                          key: 'restricao_abandono',
                          title: 'Abandono após dietas muito restritivas',
                          desc: 'Cortar alimentos que gosto (como arroz e feijão) me faz desistir.'
                        },
                        {
                          key: 'custo_estrutura_preparo',
                          title: 'Falta de tempo, orçamento curto ou sem geladeira fora de casa',
                          desc: 'Preciso de opções simples, econômicas e que funcionem na minha rotina.'
                        },
                        {
                          key: 'condicao_clinica_medos',
                          title: 'Condição de saúde, medicamentos ou receio de errar',
                          desc: 'Preciso de segurança clínica e orientação profissional cuidadosa.'
                        }
                      ].map(b => (
                        <button
                          key={b.key}
                          type="button"
                          onClick={() => setFormData({ ...formData, freePrimaryBarrier: b.key })}
                          className={`w-full p-3.5 rounded-xl border text-left transition ${
                            formData.freePrimaryBarrier === b.key
                              ? 'border-[#155E42] bg-emerald-50/70'
                              : 'border-stone-200 hover:bg-stone-50'
                          }`}
                        >
                          <p className="text-sm font-bold text-stone-900">{b.title}</p>
                          <p className="text-xs text-stone-500 mt-0.5">{b.desc}</p>
                        </button>
                      ))}
                    </div>

                    <div className="flex justify-between pt-3">
                      <button
                        onClick={() => setFreeMappingStep(2)}
                        className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-semibold text-stone-700"
                      >
                        Voltar
                      </button>
                      <button
                        onClick={() => setFreeMappingStep(4)}
                        className="px-5 py-2.5 rounded-xl bg-[#155E42] text-white text-xs font-bold"
                      >
                        Continuar
                      </button>
                    </div>
                  </div>
                )}

                {freeMappingStep === 4 && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-serif font-bold text-stone-900">
                      Onde devemos enviar sua leitura inicial?
                    </h2>
                    <p className="text-xs text-stone-600">
                      Conforme nossa política de privacidade v0.6, toda comunicação e entrega ocorre <strong>exclusivamente por e-mail</strong> (não solicitamos WhatsApp).
                    </p>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">Seu Nome</label>
                        <input
                          type="text"
                          value={formData.memberName}
                          onChange={e => setFormData({ ...formData, memberName: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">Seu Melhor E-mail *</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={e => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between pt-3">
                      <button
                        onClick={() => setFreeMappingStep(3)}
                        className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-semibold text-stone-700"
                      >
                        Voltar
                      </button>
                      <button
                        onClick={handleCompleteFreeMapping}
                        className="px-6 py-3 rounded-xl bg-[#155E42] hover:bg-[#104933] text-white text-xs font-bold shadow-sm flex items-center gap-2"
                      >
                        <span>Ver Minha Leitura Inicial Gratuita</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* --------------------------------------------------------------- */}
          {/* PASSO 3: RESULTADO GRATUITO + DIRECIONAMENTO PARA PAGA (R$67,90)*/}
          {/* --------------------------------------------------------------- */}
          {journeyStep === 'free_result' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Leitura Gratuita (Sem diagnóstico / Sem dieta falsa gratuita) */}
              <div className="lg:col-span-6 bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm space-y-5">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-[#155E42]">
                  Leitura Inicial Gratuita • Enviada para {formData.email}
                </span>
                <h2 className="text-2xl font-serif font-bold text-stone-900">
                  Olá, {formData.memberName}! Aqui está o ponto central do seu mapeamento
                </h2>

                <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-stone-200 space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#155E42]">
                    Principal Barreira Identificada
                  </span>
                  <h3 className="text-base font-bold text-stone-900">
                    {(barrierExplanation[formData.freePrimaryBarrier] || barrierExplanation.fome_noturna_tarde).title}
                  </h3>
                  <p className="text-sm text-stone-600 leading-relaxed">
                    {(barrierExplanation[formData.freePrimaryBarrier] || barrierExplanation.fome_noturna_tarde).text}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950">
                  <strong>Transparência Clínica (v0.6):</strong> Esta leitura inicial não constitui diagnóstico clínico nem prescrição de dieta. Para calcular metas e montar seu plano alimentar com segurança, avançamos para a Avaliação Completa em 6 blocos.
                </div>
              </div>

              {/* Oferta da Avaliação Completa (R$ 67,90) com os 3 Entregáveis */}
              <div className="lg:col-span-6 bg-[#123D2B] text-white rounded-3xl p-6 sm:p-8 shadow-md space-y-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                      Próximo Passo Opcional • Avaliação Completa
                    </span>
                    <span className="text-2xl font-bold text-white">R$ 67,90</span>
                  </div>

                  <h3 className="text-2xl font-serif font-bold">
                    Transforme seu mapeamento em um plano alimentar executável na sua rotina
                  </h3>

                  <p className="text-sm text-emerald-100/90">
                    Você responde aos 6 blocos clínicos e recebe <strong>exclusivamente por e-mail</strong> os 3 entregáveis completos do método EmagreSLIM:
                  </p>

                  <ul className="space-y-2.5 text-xs sm:text-sm">
                    <li className="flex items-start gap-2.5 bg-white/10 p-3 rounded-xl">
                      <FileText className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                      <span>
                        <strong>1. Relatório Nutricional + PAN:</strong> Perfil de Viabilidade em 7 eixos, memorial de cálculo (Mifflin-St Jeor + DRI 2023) e acordo para a Semana 1.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5 bg-white/10 p-3 rounded-xl">
                      <Utensils className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                      <span>
                        <strong>2. Plano Alimentar Individualizado:</strong> Refeições adaptadas ao seu turno, orçamento e geladeira/preparo (base TACO 4ª ed. & IBGE).
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5 bg-white/10 p-3 rounded-xl">
                      <ArrowRightLeft className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                      <span>
                        <strong>3. Lista de Substituições Equivalentes + Suporte por E-mail:</strong> Trocas funcionais calculadas e dúvidas respondidas pelo Nutricionista Luis.
                      </span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={handleApproveCheckout}
                  className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition"
                >
                  <CreditCard className="w-5 h-5" />
                  <span>Simular Aprovação do Pagamento (R$ 67,90) → Iniciar Avaliação</span>
                </button>
              </div>
            </div>
          )}

          {/* --------------------------------------------------------------- */}
          {/* PASSO 4: CHECKOUT APROVADO & CONFIRMAÇÃO DE TITULARIDADE E-MAIL */}
          {/* --------------------------------------------------------------- */}
          {journeyStep === 'checkout_auth' && (
            <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-[#155E42]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Pagamento Confirmado • Pedido {orderId} (R$ 67,90)
                  </span>
                  <h2 className="text-xl font-serif font-bold text-stone-900 mt-2">
                    Confirmação de Titularidade & Acesso Seguro
                  </h2>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-950 space-y-1">
                <p className="font-bold">Regra de Segurança v0.6 (Seção 8 e 9):</p>
                <p>
                  Dados de saúde não são acessados por URL pública ou <code>memberId</code> solto. Confirme abaixo o endereço de e-mail titular da compra antes de abrir o questionário clínico.
                </p>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-bold text-stone-700">
                  Endereço de E-mail Titular para Entrega dos 3 Entregáveis:
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => {
                      setFormData({ ...formData, email: e.target.value });
                      setIsEmailVerified(false);
                    }}
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsEmailVerified(true);
                      showToast(`Titularidade do e-mail ${formData.email} confirmada!`);
                    }}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
                      isEmailVerified
                        ? 'bg-emerald-100 text-[#155E42] border border-emerald-300'
                        : 'bg-stone-900 text-white hover:bg-stone-800'
                    }`}
                  >
                    {isEmailVerified ? <CheckCircle2 className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                    <span>{isEmailVerified ? 'E-mail Confirmado ✓' : 'Confirmar E-mail Agora'}</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => {
                    if (!isEmailVerified) {
                      showToast('Clique em "Confirmar E-mail Agora" para validar a titularidade antes de prosseguir.');
                      return;
                    }
                    setJourneyStep('paid_6_blocks');
                  }}
                  className="px-6 py-3 rounded-xl bg-[#155E42] hover:bg-[#104933] text-white text-sm font-bold flex items-center gap-2"
                >
                  <span>Abrir Questionário Clínico (6 Blocos)</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* --------------------------------------------------------------- */}
          {/* PASSO 5: OS 6 BLOCOS CLÍNICOS + RESUMO EDITÁVEL                 */}
          {/* --------------------------------------------------------------- */}
          {journeyStep === 'paid_6_blocks' && (
            <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="bg-[#123D2B] text-white px-6 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-emerald-300 font-bold">
                      Avaliação Completa #1 • Rascunho Persistido • Titular: {formData.memberName}
                    </span>
                    <h2 className="text-lg font-serif font-bold">
                      {showPaidReviewSummary
                        ? 'Revisão Final Antes do Envio Definitivo'
                        : `Bloco ${paidBlock} de 6 — Cada Pergunta Muda uma Decisão`}
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowPaidReviewSummary(!showPaidReviewSummary)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-900 hover:bg-emerald-800 text-xs font-semibold border border-emerald-700"
                  >
                    {showPaidReviewSummary ? 'Voltar aos Blocos' : 'Ir para Revisão Final'}
                  </button>
                </div>

                <div className="grid grid-cols-6 gap-1.5">
                  {[
                    '1. Objetivo & Peso',
                    '2. Saúde & Alergias',
                    '3. Rotina & Estrutura',
                    '4. Custo & Preferências',
                    '5. Fome & Comport.',
                    '6. Acordo Semana 1'
                  ].map((label, idx) => {
                    const num = idx + 1;
                    return (
                      <button
                        key={num}
                        onClick={() => {
                          setShowPaidReviewSummary(false);
                          setPaidBlock(num);
                        }}
                        className={`py-2 px-2 rounded-lg text-xs font-semibold truncate transition ${
                          !showPaidReviewSummary && paidBlock === num
                            ? 'bg-emerald-500 text-stone-950 font-bold'
                            : 'bg-emerald-950/70 text-emerald-200 hover:bg-emerald-900'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-6 space-y-5">
                {!showPaidReviewSummary && paidBlock === 1 && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-stone-900">Bloco 1 — Objetivo, Antropometria e Mudança Recente de Peso</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">Idade *</label>
                        <input
                          type="number"
                          value={formData.age}
                          onChange={e => setFormData({ ...formData, age: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">Sexo Biológico *</label>
                        <select
                          value={formData.sex}
                          onChange={e => setFormData({ ...formData, sex: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
                        >
                          <option value="feminino">Feminino</option>
                          <option value="masculino">Masculino</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">Peso Atual (kg) *</label>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.weightKg}
                          onChange={e => setFormData({ ...formData, weightKg: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">Altura (cm) *</label>
                        <input
                          type="number"
                          value={formData.heightCm}
                          onChange={e => setFormData({ ...formData, heightCm: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">Meta de Peso (kg) *</label>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.targetWeightKg}
                          onChange={e => setFormData({ ...formData, targetWeightKg: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">Mudança Recente de Peso *</label>
                        <select
                          value={formData.recentWeightChange}
                          onChange={e => setFormData({ ...formData, recentWeightChange: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
                        >
                          <option value="estavel">Estável nos últimos meses</option>
                          <option value="ganho_gradual">Ganho gradual</option>
                          <option value="ganho_rapido">Ganho rápido</option>
                          <option value="perda_intencional">Perda intencional</option>
                          <option value="inexplicada">Mudança importante INEXPLICADA (gera revisão 24h)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">O que você quer melhorar?</label>
                      <input
                        type="text"
                        value={formData.goalDescription}
                        onChange={e => setFormData({ ...formData, goalDescription: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
                      />
                    </div>
                  </div>
                )}

                {!showPaidReviewSummary && paidBlock === 2 && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-stone-900">Bloco 2 — Condições de Saúde, Medicamentos e Alergias</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { key: 'nenhuma', label: 'Nenhuma condição' },
                        { key: 'diabetes_tipo_2', label: 'Diabetes Tipo 2' },
                        { key: 'diabetes_tipo_1', label: 'Diabetes Tipo 1' },
                        { key: 'hipertensao', label: 'Hipertensão Arterial' },
                        { key: 'doenca_renal', label: 'Doença Renal (KDIGO)' },
                        { key: 'doenca_hepatica', label: 'Doença Hepática' },
                        { key: 'doenca_cardiaca', label: 'Doença Cardíaca' },
                        { key: 'doenca_gi_ativa', label: 'Doença GI Ativa' },
                        { key: 'cancer_tratamento', label: 'Câncer em Tratamento' }
                      ].map(c => {
                        const sel = (formData.healthConditions || []).includes(c.key);
                        return (
                          <button
                            key={c.key}
                            type="button"
                            onClick={() => toggleHealthCondition(c.key)}
                            className={`p-2.5 rounded-xl border text-left text-xs font-medium ${
                              sel
                                ? 'bg-emerald-50 border-[#155E42] text-[#155E42] font-bold'
                                : 'bg-white border-stone-200 text-stone-700'
                            }`}
                          >
                            {c.label}
                          </button>
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#FAF9F6] p-3.5 rounded-xl border border-stone-200 text-xs">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.pregnantOrBreastfeeding}
                          onChange={e => setFormData({ ...formData, pregnantOrBreastfeeding: e.target.checked })}
                        />
                        Gestação ou amamentação
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.bariatricHistory}
                          onChange={e => setFormData({ ...formData, bariatricHistory: e.target.checked })}
                        />
                        Cirurgia bariátrica
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.fluidRestriction}
                          onChange={e => setFormData({ ...formData, fluidRestriction: e.target.checked })}
                        />
                        Restrição hídrica médica
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">Medicamentos / Suplementos</label>
                        <input
                          type="text"
                          value={formData.medications}
                          onChange={e => setFormData({ ...formData, medications: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
                        />
                        <label className="flex items-center gap-2 text-xs text-stone-600 mt-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.unknownMedicationDose}
                            onChange={e => setFormData({ ...formData, unknownMedicationDose: e.target.checked })}
                          />
                          Não sei a dose exata
                        </label>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">Alergias Alimentares</label>
                        <input
                          type="text"
                          value={formData.allergies}
                          onChange={e => setFormData({ ...formData, allergies: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
                        />
                        <label className="flex items-center gap-2 text-xs text-stone-600 mt-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.allergySeverityUnknown}
                            onChange={e => setFormData({ ...formData, allergySeverityUnknown: e.target.checked })}
                          />
                          Não sei a gravidade da alergia
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {!showPaidReviewSummary && paidBlock === 3 && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-stone-900">Bloco 3 — Rotina, Turnos, Atividade Física e Estrutura de Conservação</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">Atividade do Trabalho</label>
                        <select
                          value={formData.workActivityLevel}
                          onChange={e => setFormData({ ...formData, workActivityLevel: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
                        >
                          <option value="sentado_escritorio">Sentado / Escritório</option>
                          <option value="moderado_em_pe">Em pé / Caminhadas leves</option>
                          <option value="intenso_fisico">Esforço físico intenso</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">Exercício (minutos/semana)</label>
                        <input
                          type="number"
                          value={formData.exerciseMinutesPerWeek}
                          onChange={e => setFormData({ ...formData, exerciseMinutesPerWeek: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
                        />
                      </div>
                      <div className="flex flex-col justify-center gap-2 bg-[#FAF9F6] p-3 rounded-xl border border-stone-200 text-xs">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.hasFridge}
                            onChange={e => setFormData({ ...formData, hasFridge: e.target.checked })}
                          />
                          Tenho geladeira no trabalho/dia
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.shiftWorker}
                            onChange={e => setFormData({ ...formData, shiftWorker: e.target.checked })}
                          />
                          Trabalho em turnos alternados
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {!showPaidReviewSummary && paidBlock === 4 && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-stone-900">Bloco 4 — Orçamento, Preparo e Preferências Culturais</h3>
                    <label className="flex items-center gap-2 text-xs font-bold text-stone-800 bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.budgetPriority}
                        onChange={e => setFormData({ ...formData, budgetPriority: e.target.checked })}
                      />
                      Priorizar opções econômicas e acessíveis (ajusta compras sem penalizar viabilidade)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">Alimentos que GOSTARIA de manter</label>
                        <input
                          type="text"
                          value={formData.keepFoods}
                          onChange={e => setFormData({ ...formData, keepFoods: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">Alimentos que NÃO come</label>
                        <input
                          type="text"
                          value={formData.avoidFoods}
                          onChange={e => setFormData({ ...formData, avoidFoods: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {!showPaidReviewSummary && paidBlock === 5 && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-stone-900">Bloco 5 — Fome, Saciedade e Comportamento Alimentar</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">Horário de maior fome</label>
                        <select
                          value={formData.hungerPeakTime}
                          onChange={e => setFormData({ ...formData, hungerPeakTime: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
                        >
                          <option value="manha">Manhã</option>
                          <option value="almoco">Almoço</option>
                          <option value="tarde_noite">Fim da tarde / Noite</option>
                          <option value="madrugada_pos_turno">Madrugada / Pós-turno</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">Episódios de perda de controle</label>
                        <select
                          value={formData.lossOfControlFrequency}
                          onChange={e => setFormData({ ...formData, lossOfControlFrequency: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
                        >
                          <option value="nunca_raramente">Nunca ou raramente</option>
                          <option value="mensal">Ocasionalmente (1-2x/mês)</option>
                          <option value="semanal_com_sofrimento">Semanalmente com sofrimento</option>
                          <option value="frequente_diario">Frequente / várias vezes na semana</option>
                        </select>
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-xs font-medium text-rose-900 bg-rose-50 p-3 rounded-xl border border-rose-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.purgingOrCompensation}
                        onChange={e => setFormData({ ...formData, purgingOrCompensation: e.target.checked })}
                      />
                      Faço compensações após comer (jejum punitivo longo, laxantes ou vômito)
                    </label>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">Contexto da fome</label>
                      <input
                        type="text"
                        value={formData.hungerCauseContext}
                        onChange={e => setFormData({ ...formData, hungerCauseContext: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
                      />
                    </div>
                  </div>
                )}

                {!showPaidReviewSummary && paidBlock === 6 && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-stone-900">Bloco 6 — Tentativas Anteriores e Acordo Realista da Semana 1</h3>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">O que fez abandonar dietas anteriores?</label>
                      <input
                        type="text"
                        value={formData.previousAttempts}
                        onChange={e => setFormData({ ...formData, previousAttempts: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">O que tornaria esse plano difícil?</label>
                        <input
                          type="text"
                          value={formData.whatWouldMakeHard}
                          onChange={e => setFormData({ ...formData, whatWouldMakeHard: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">Qual mudança realista começa nesta semana?</label>
                        <input
                          type="text"
                          value={formData.firstWeekChange}
                          onChange={e => setFormData({ ...formData, firstWeekChange: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {showPaidReviewSummary && (
                  <div className="space-y-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-950">
                      <strong>Início do Prazo de 24h:</strong> Caso seu perfil apresente algum agravante que exija revisão do Nutricionista Luis, a contagem de 24 horas corridas começa exatamente no clique abaixo.
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#FAF9F6] p-4 rounded-2xl border border-stone-200">
                      <p><strong>Titular:</strong> {formData.memberName} ({formData.email})</p>
                      <p><strong>Antropometria:</strong> {formData.age}a • {formData.weightKg}kg • {formData.heightCm}cm</p>
                      <p><strong>Saúde:</strong> {(formData.healthConditions || []).join(', ')}</p>
                      <p><strong>Estrutura:</strong> Geladeira: {formData.hasFridge ? 'Sim' : 'Não'} • Econômico: {formData.budgetPriority ? 'Sim' : 'Não'}</p>
                    </div>
                  </div>
                )}

                {/* Botões de Navegação do Questionário */}
                <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                  <button
                    onClick={() => {
                      if (showPaidReviewSummary) setShowPaidReviewSummary(false);
                      else if (paidBlock > 1) setPaidBlock(paidBlock - 1);
                      else setJourneyStep('checkout_auth');
                    }}
                    className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-semibold text-stone-700"
                  >
                    Anterior
                  </button>

                  {!showPaidReviewSummary && paidBlock < 6 ? (
                    <button
                      onClick={() => setPaidBlock(paidBlock + 1)}
                      className="px-5 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-bold"
                    >
                      Próximo Bloco →
                    </button>
                  ) : !showPaidReviewSummary && paidBlock === 6 ? (
                    <button
                      onClick={() => setShowPaidReviewSummary(true)}
                      className="px-5 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-bold"
                    >
                      Revisar Antes de Enviar →
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmitFullAssessment}
                      className="px-6 py-3 rounded-xl bg-[#155E42] hover:bg-[#104933] text-white text-xs font-bold shadow-md flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>Enviar Avaliação Completa & Gerar Entregáveis</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* --------------------------------------------------------------- */}
          {/* PASSO 6: OS 3 ENTREGÁVEIS OFICIAIS OU TELA DE REVISÃO 24H       */}
          {/* --------------------------------------------------------------- */}
          {journeyStep === 'paid_deliverables' && currentEvaluation && (
            <div className="space-y-6">
              {/* STATUS SUPERIOR: REVISÃO 24H OU ENTREGÁVEIS LIBERADOS */}
              {currentEvaluation.engineResult.requiresReview ? (
                <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-200 text-amber-950 uppercase">
                        Aguardando Análise do Nutricionista • Prazo Máximo: 24h Corridas
                      </span>
                      <h2 className="text-2xl font-serif font-bold text-stone-900">
                        Recebemos sua avaliação, {currentEvaluation.memberName}
                      </h2>
                      <p className="text-sm text-stone-700">
                        Algumas informações precisam da análise do nosso nutricionista (<strong>Luis Henrique Ale Cezar</strong>) antes da definição do plano. A previsão de liberação é de até <strong>24 horas corridas</strong> após o envio completo. Você receberá os 3 entregáveis em <strong>{currentEvaluation.email}</strong>.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedReviewId(currentEvaluation.id);
                        setActiveTab('nutritionist_panel');
                      }}
                      className="px-5 py-3 rounded-2xl bg-[#123D2B] hover:bg-[#155E42] text-white text-xs font-bold shrink-0 flex items-center gap-2 shadow-sm"
                    >
                      <span>Simular Revisão do Luis (Aba 2)</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="bg-white rounded-2xl p-4 border border-amber-200 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-rose-700">
                      <Lock className="w-4 h-4" />
                      <span>BLOQUEIO DE SEGURANÇA v0.6 ATIVO:</span>
                    </div>
                    <p className="text-xs text-stone-600">{currentEvaluation.engineResult.blockedMessage}</p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {currentEvaluation.engineResult.triggers.map((t, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-950 text-xs font-medium">
                          {t.group}: {t.reason}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-200 text-[#155E42] uppercase">
                      {currentEvaluation.engineResult.reviewedBy
                        ? `Revisado e Liberado por ${currentEvaluation.engineResult.reviewedBy}`
                        : 'Caso Elegível Sem Agravantes • 3 Entregáveis Liberados'}
                    </span>
                    <h2 className="text-2xl font-serif font-bold text-stone-900 mt-1.5">
                      Seu plano alimentar e materiais estão prontos!
                    </h2>
                    <p className="text-sm text-stone-700 mt-0.5">
                      Cópia oficial enviada para <strong>{currentEvaluation.email}</strong>. Dúvidas? Basta responder ao e-mail de entrega.
                    </p>
                  </div>
                </div>
              )}

              {/* ABAS DOS 3 ENTREGÁVEIS OFICIAIS (assessment_files) */}
              {!currentEvaluation.engineResult.prescriptionBlocked && currentEvaluation.engineResult.prescription && (
                <div className="space-y-5">
                  <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl border border-stone-200 shadow-sm">
                    <button
                      onClick={() => setActiveDeliverableTab('report_pan')}
                      className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition ${
                        activeDeliverableTab === 'report_pan'
                          ? 'bg-[#155E42] text-white'
                          : 'text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      <span>Entregável 1: Relatório + PAN</span>
                    </button>
                    <button
                      onClick={() => setActiveDeliverableTab('meal_plan')}
                      className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition ${
                        activeDeliverableTab === 'meal_plan'
                          ? 'bg-[#155E42] text-white'
                          : 'text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      <Utensils className="w-4 h-4" />
                      <span>Entregável 2: Plano Alimentar</span>
                    </button>
                    <button
                      onClick={() => setActiveDeliverableTab('substitutions')}
                      className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition ${
                        activeDeliverableTab === 'substitutions'
                          ? 'bg-[#155E42] text-white'
                          : 'text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      <ArrowRightLeft className="w-4 h-4" />
                      <span>Entregável 3: Substituições</span>
                    </button>
                  </div>

                  {/* ENTREGÁVEL 1: RELATÓRIO NUTRICIONAL, MEMORIAL CIENTÍFICO, VIABILIDADE & PAN */}
                  {activeDeliverableTab === 'report_pan' && (
                    <div className="space-y-6">
                      {/* Memorial de Cálculo Transparente */}
                      <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-4">
                        <h3 className="font-serif font-bold text-lg text-stone-900 flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-[#155E42]" />
                          Memorial de Cálculo & Referências Científicas Oficiais
                        </h3>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-stone-200">
                            <span className="text-xs text-stone-500">Meta Energética</span>
                            <p className="text-2xl font-bold text-stone-900 mt-1">
                              {currentEvaluation.engineResult.prescription.targetKcal} <span className="text-xs font-normal">kcal</span>
                            </p>
                          </div>
                          <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-stone-200">
                            <span className="text-xs text-stone-500">Proteína Diária</span>
                            <p className="text-2xl font-bold text-[#155E42] mt-1">
                              {currentEvaluation.engineResult.prescription.macros.proteinG}g
                            </p>
                            <span className="text-[11px] text-stone-400">
                              ({currentEvaluation.engineResult.prescription.macros.proteinPerKg} g/kg)
                            </span>
                          </div>
                          <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-stone-200">
                            <span className="text-xs text-stone-500">Carboidrato / Gordura</span>
                            <p className="text-lg font-bold text-stone-900 mt-1">
                              {currentEvaluation.engineResult.prescription.macros.carbsG}g C • {currentEvaluation.engineResult.prescription.macros.fatG}g G
                            </p>
                          </div>
                          <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-stone-200">
                            <span className="text-xs text-stone-500">Líquidos Totais</span>
                            <p className="text-2xl font-bold text-sky-800 mt-1">
                              {(currentEvaluation.engineResult.prescription.waterTargetMl / 1000).toFixed(1)} L
                            </p>
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs space-y-2">
                          <p className="font-bold text-stone-800">
                            Equação utilizada: {currentEvaluation.engineResult.prescription.equationUsed}
                          </p>
                          <ul className="list-disc list-inside text-stone-600 space-y-1">
                            {currentEvaluation.engineResult.prescription.scientificReferences.map((ref, idx) => (
                              <li key={idx}>{ref}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Perfil de Viabilidade em 7 Eixos */}
                      <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-4">
                        <h3 className="font-serif font-bold text-lg text-stone-900 flex items-center gap-2">
                          <Compass className="w-5 h-5 text-[#155E42]" />
                          Perfil de Viabilidade Explícito (7 Eixos Reais)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {currentEvaluation.engineResult.feasibilityProfile.map((axis, idx) => (
                            <div key={idx} className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-stone-200 space-y-1">
                              <span className="text-[11px] font-bold uppercase text-[#155E42]">{axis.axis}</span>
                              <p className="text-sm font-bold text-stone-900">{axis.status}</p>
                              <p className="text-xs text-stone-600">{axis.detail}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* PAN + Confirmação do Membro */}
                      <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-4">
                        <h3 className="font-serif font-bold text-lg text-stone-900">
                          PAN — Plano de Ação Nutricional & Confirmação do Membro
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                            <span className="font-bold uppercase text-[#155E42]">Barreira Principal</span>
                            <p className="text-sm font-bold text-stone-900">{currentEvaluation.engineResult.pan.primaryBarrier}</p>
                            <ul className="list-disc list-inside text-stone-600 space-y-1">
                              {currentEvaluation.engineResult.pan.memberEvidence.map((ev, i) => (
                                <li key={i}>{ev}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-stone-200 space-y-2">
                            <span className="font-bold uppercase text-stone-700">Intervenções Pactuadas</span>
                            <ul className="list-disc list-inside text-stone-700 space-y-1">
                              {currentEvaluation.engineResult.pan.methodInterventions.map((inv, i) => (
                                <li key={i}>{inv}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 pt-2">
                          <input
                            type="text"
                            value={memberPanFeedback}
                            onChange={e => setMemberPanFeedback(e.target.value)}
                            placeholder="Confirme se essa leitura faz sentido ou registre um ajuste..."
                            className="flex-1 px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs"
                          />
                          <button
                            onClick={() => {
                              setPanConfirmedByMember(true);
                              showToast('Confirmação do PAN salva no prontuário!');
                            }}
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 ${
                              panConfirmedByMember ? 'bg-[#155E42] text-white' : 'bg-stone-900 text-white'
                            }`}
                          >
                            {panConfirmedByMember ? 'Leitura Confirmada ✓' : 'Confirmar Leitura do PAN'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ENTREGÁVEL 2: PLANO ALIMENTAR INDIVIDUALIZADO */}
                  {activeDeliverableTab === 'meal_plan' && (
                    <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-5">
                      <div className="border-b border-stone-100 pb-3">
                        <h3 className="font-serif font-bold text-lg text-stone-900">
                          Plano Alimentar Individualizado (TACO 4ª ed. & Medidas Caseiras IBGE)
                        </h3>
                        <p className="text-xs text-stone-500">
                          Alimentos já descritos como consumidos (cozidos/grelhados/prontos), respeitando orçamento e cadeia de frio.
                        </p>
                      </div>

                      {currentEvaluation.engineResult.prescription.manualPlanText ? (
                        <pre className="whitespace-pre-wrap font-sans text-sm text-stone-700 bg-[#FAF9F6] p-5 rounded-2xl border border-stone-200 leading-relaxed">
                          {currentEvaluation.engineResult.prescription.manualPlanText}
                        </pre>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {currentEvaluation.engineResult.prescription.meals.map((meal, idx) => (
                            <div key={idx} className="p-4 rounded-2xl bg-[#FAF9F6] border border-stone-200 space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="font-bold text-stone-900 text-sm">{meal.name}</h4>
                                <span className="text-xs font-semibold text-[#155E42] bg-emerald-100 px-2.5 py-0.5 rounded-full">
                                  {meal.suggestedWindow}
                                </span>
                              </div>
                              <ul className="space-y-2">
                                {meal.items.map(food => (
                                  <li key={food.id} className="bg-white p-3 rounded-xl border border-stone-200 text-xs">
                                    <div className="flex justify-between font-bold text-stone-900">
                                      <span>{food.name}</span>
                                      <span>{food.kcal} kcal</span>
                                    </div>
                                    <p className="text-stone-700 mt-0.5">
                                      Medida: <strong>{food.householdMeasure}</strong> ({food.portionGrams}g)
                                    </p>
                                    <div className="text-[10px] text-stone-400 mt-1 flex justify-between">
                                      <span>{food.source} • {food.sourceCode}</span>
                                      <span>P: {food.protein_g}g | C: {food.carbs_g}g | Fibra: {food.fiber_g}g</span>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ENTREGÁVEL 3: LISTA DE SUBSTITUIÇÕES + CICLO DE REAVALIAÇÃO 45 DIAS */}
                  {activeDeliverableTab === 'substitutions' && (
                    <div className="space-y-6">
                      <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-4">
                        <h3 className="font-serif font-bold text-lg text-stone-900">
                          Lista de Substituições Equivalentes (Por Função Nutricional)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {(currentEvaluation.engineResult.prescription.substitutions || []).map((sub, i) => (
                            <div key={i} className="p-4 rounded-2xl bg-[#FAF9F6] border border-stone-200 text-xs space-y-2">
                              <span className="font-bold text-[#155E42] block">{sub.group}</span>
                              <p className="font-semibold text-stone-800">Base: {sub.original}</p>
                              <ul className="list-disc list-inside text-stone-600 space-y-1">
                                {sub.equivalents.map((eq, j) => (
                                  <li key={j}>{eq}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Ciclo de Check-in e Reavaliação em 45 Dias (assessment_checkins) */}
                      <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-stone-900 flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-[#155E42]" />
                              Acompanhamento de Execução & Ciclo de Reavaliação (+45 dias)
                            </h4>
                            <p className="text-xs text-stone-500">
                              Registre retorno sobre fome e execução (tabela <code>assessment_checkins</code>). Dúvidas imediatas são respondidas por e-mail.
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-end gap-3 bg-[#FAF9F6] p-4 rounded-2xl border border-stone-200 text-xs">
                          <div>
                            <label className="block font-semibold text-stone-700 mb-1">Peso Atual (kg)</label>
                            <input
                              type="number"
                              step="0.1"
                              value={checkinWeight}
                              onChange={e => setCheckinWeight(e.target.value)}
                              placeholder={String(formData.weightKg)}
                              className="px-3 py-2 rounded-xl border border-stone-300 bg-white w-28"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-stone-700 mb-1">Nível de Fome (0 a 10)</label>
                            <input
                              type="number"
                              min="0"
                              max="10"
                              value={checkinHunger}
                              onChange={e => setCheckinHunger(Number(e.target.value))}
                              className="px-3 py-2 rounded-xl border border-stone-300 bg-white w-24"
                            />
                          </div>
                          <button
                            onClick={() => {
                              setCheckinsList(prev => [
                                {
                                  date: new Date().toLocaleDateString('pt-BR'),
                                  weight: checkinWeight || formData.weightKg,
                                  hunger: checkinHunger
                                },
                                ...prev
                              ]);
                              showToast('Check-in registrado no histórico do membro!');
                            }}
                            className="px-4 py-2 rounded-xl bg-[#155E42] text-white font-bold"
                          >
                            Registrar Check-in
                          </button>
                        </div>

                        {checkinsList.length > 0 && (
                          <div className="text-xs text-stone-600 space-y-1">
                            {checkinsList.map((ck, i) => (
                              <div key={i} className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 flex justify-between">
                                <span>Data: <strong>{ck.date}</strong></span>
                                <span>Peso: <strong>{ck.weight} kg</strong></span>
                                <span>Fome percebida: <strong>{ck.hunger}/10</strong></span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* ABA 2: PAINEL CLÍNICO DO NUTRICIONISTA LUIS (FILA 24H)              */}
      {/* =================================================================== */}
      {activeTab === 'nutritionist_panel' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 bg-white rounded-3xl border border-stone-200 p-5 shadow-sm space-y-4">
              <div>
                <h2 className="font-serif font-bold text-lg text-stone-900">Fila de Revisão (SLA 24h)</h2>
                <p className="text-xs text-stone-500">
                  24 horas corridas após envio completo. Nenhum caso pendente expira ou libera automaticamente.
                </p>
              </div>

              <div className="space-y-2.5">
                {assessments.map(item => {
                  const sla = getSlaCountdown(item.slaDueAt);
                  const sel = selectedReviewAssessment?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedReviewId(item.id)}
                      className={`w-full text-left p-4 rounded-2xl border transition ${
                        sel ? 'bg-[#123D2B] text-white border-[#123D2B]' : 'bg-[#FAF9F6] hover:bg-white border-stone-200'
                      }`}
                    >
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="font-mono opacity-80">{item.id}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold uppercase ${
                            item.status === 'completed'
                              ? 'bg-emerald-400/20 text-emerald-300'
                              : 'bg-amber-400 text-stone-950'
                          }`}
                        >
                          {item.status === 'completed' ? 'Liberado' : 'Pendente 24h'}
                        </span>
                      </div>
                      <p className="font-bold text-sm mt-1">{item.memberName}</p>
                      <p className={`text-xs ${sel ? 'text-emerald-200' : 'text-stone-500'}`}>{item.email}</p>
                      {item.status !== 'completed' && (
                        <div className={`mt-2 pt-2 border-t text-[11px] font-semibold flex items-center gap-1.5 ${sel ? 'border-emerald-800 text-amber-300' : 'border-stone-200 text-amber-700'}`}>
                          <Clock className="w-3.5 h-3.5" />
                          <span>{sla.text}</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedReviewAssessment && (
              <div className="lg:col-span-8 bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-4">
                  <div>
                    <h3 className="text-xl font-serif font-bold text-stone-900">{selectedReviewAssessment.memberName}</h3>
                    <p className="text-xs text-stone-500">
                      E-mail confirmado: <strong>{selectedReviewAssessment.email}</strong> • IMC: {selectedReviewAssessment.engineResult.anthropometry.bmi} kg/m²
                    </p>
                  </div>
                  {selectedReviewAssessment.status !== 'completed' && (
                    <span className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-950 text-xs font-bold">
                      {getSlaCountdown(selectedReviewAssessment.slaDueAt).text}
                    </span>
                  )}
                </div>

                {selectedReviewAssessment.engineResult.triggers.length > 0 && (
                  <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-1.5 text-xs text-rose-950">
                    <p className="font-bold text-rose-800 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      Gatilhos de Agravantes Detectados:
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      {selectedReviewAssessment.engineResult.triggers.map((t, idx) => (
                        <li key={idx}>
                          <strong>[{t.group}]</strong> {t.reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Solicitar esclarecimento por e-mail */}
                <div className="space-y-2 border-t border-stone-100 pt-4">
                  <label className="block text-xs font-bold text-stone-800">
                    Solicitar Esclarecimento ao Membro por E-mail (registrado no histórico):
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={clarificationText}
                      onChange={e => setClarificationText(e.target.value)}
                      placeholder="Ex: Poderia confirmar a dose atual da medicação ou exames recentes?"
                      className="flex-1 px-3.5 py-2 rounded-xl border border-stone-300 text-xs"
                    />
                    <button
                      onClick={() => handleSendClarification(selectedReviewAssessment)}
                      className="px-4 py-2 rounded-xl bg-sky-800 text-white text-xs font-bold shrink-0"
                    >
                      Enviar Pergunta por E-mail
                    </button>
                  </div>
                </div>

                {/* Prescrição clínica manual do Luis */}
                <div className="space-y-4 border-t border-stone-100 pt-4">
                  <h4 className="font-bold text-sm text-stone-900">Definição Clínica do Nutricionista & Liberação por E-mail</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">Meta Calórica (kcal)</label>
                      <input
                        type="number"
                        value={manualKcal}
                        onChange={e => setManualKcal(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">Proteína (g/dia)</label>
                      <input
                        type="number"
                        value={manualProteinG}
                        onChange={e => setManualProteinG(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">Líquidos (ml/dia)</label>
                      <input
                        type="number"
                        value={manualWaterMl}
                        onChange={e => setManualWaterMl(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Cardápio Individualizado (TACO / IBGE)</label>
                    <textarea
                      rows={4}
                      value={manualPlanText}
                      onChange={e => setManualPlanText(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => handleApproveAndReleaseByNutritionist(selectedReviewAssessment)}
                      className="px-6 py-3 rounded-xl bg-[#155E42] hover:bg-[#104933] text-white text-xs font-bold flex items-center gap-2 shadow-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Aprovar & Liberar Entregáveis por E-mail</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* ABA 3: FILA DE E-MAILS & AUDITORIA GTM / TRACKING                   */}
      {/* =================================================================== */}
      {activeTab === 'email_gtm_audit' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Fila Idempotente de E-mails */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-4">
              <div>
                <h2 className="font-serif font-bold text-lg text-stone-900">
                  Fila Persistente & Idempotente de E-mails (WhatsApp/Z-API Removidos)
                </h2>
                <p className="text-xs text-stone-500">
                  Assuntos sanitizados sem diagnósticos ou respostas clínicas; remetente autenticado do Nutricionista Luis.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(EMAIL_TEMPLATES).map(([key, tpl]) => (
                  <button
                    key={key}
                    onClick={() => setPreviewEmailModal({ key, ...tpl })}
                    className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-xs font-semibold text-stone-700"
                  >
                    Template: {key}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 uppercase">
                    <th className="py-2.5 px-3">Chave Idempotente</th>
                    <th className="py-2.5 px-3">Destinatário Confirmado</th>
                    <th className="py-2.5 px-3">Assunto Sanitizado</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {emailOutbox.map(m => (
                    <tr key={m.id}>
                      <td className="py-2.5 px-3 font-mono text-stone-700">{m.idempotencyKey}</td>
                      <td className="py-2.5 px-3 font-semibold text-stone-900">{m.recipientEmail}</td>
                      <td className="py-2.5 px-3 text-stone-700">{m.safeSubject}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-[#155E42]">
                          {m.deliveryStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {previewEmailModal && (
              <div className="bg-[#123D2B] text-white rounded-2xl p-5 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-emerald-300">Preview Oficial — {previewEmailModal.key}</span>
                  <button onClick={() => setPreviewEmailModal(null)}>Fechar ✕</button>
                </div>
                <p className="text-xs font-semibold">Assunto: {previewEmailModal.subject}</p>
                <pre className="whitespace-pre-wrap font-sans text-xs bg-emerald-950/80 p-4 rounded-xl border border-emerald-800">
                  {previewEmailModal.body}
                </pre>
              </div>
            )}
          </div>

          {/* Auditoria de Eventos GTM / Analytics (Seção 8) */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-4">
            <div className="border-b border-stone-100 pb-3">
              <h3 className="font-serif font-bold text-lg text-stone-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#155E42]" />
                Auditoria de Tracking / GTM (Zero Vazamento Clínico no Navegador)
              </h3>
              <p className="text-xs text-stone-500">
                Comprova que nenhum status clínico, diagnóstico ou chamada Z-API é disparado para analytics.
              </p>
            </div>
            <div className="space-y-2 text-xs font-mono">
              {gtmEvents.map(ev => (
                <div key={ev.id} className="p-3 rounded-xl bg-[#FAF9F6] border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-stone-400 mr-2">[{ev.time}]</span>
                    <strong className="text-[#155E42]">{ev.eventName}</strong>
                    <span className="text-stone-600 ml-2">{ev.payload}</span>
                  </div>
                  <span className="text-[11px] font-sans font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full shrink-0">
                    {ev.audit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* ABA 4: SQL MIGRATION v0.6 + MOTOR TYPESCRIPT/ZOD                    */}
      {/* =================================================================== */}
      {activeTab === 'tech_architecture' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-stone-900 text-stone-100 rounded-3xl border border-stone-800 overflow-hidden">
            <div className="px-5 py-4 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
              <span className="text-sm font-bold flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                migration_v0_6_full.sql
              </span>
              <button
                onClick={() => handleCopyCode('sql', SQL_MIGRATION_V06)}
                className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs font-semibold text-emerald-300 flex items-center gap-1.5"
              >
                {copiedCodeBlock === 'sql' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCodeBlock === 'sql' ? 'Copiado!' : 'Copiar SQL'}</span>
              </button>
            </div>
            <pre className="p-5 text-xs font-mono overflow-x-auto max-h-[540px] text-stone-300 leading-relaxed">
              {SQL_MIGRATION_V06}
            </pre>
          </div>

          <div className="bg-stone-900 text-stone-100 rounded-3xl border border-stone-800 overflow-hidden">
            <div className="px-5 py-4 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
              <span className="text-sm font-bold flex items-center gap-2">
                <Code2 className="w-4 h-4 text-sky-400" />
                engine_v0_6_spec.ts
              </span>
              <button
                onClick={() => handleCopyCode('ts', ENGINE_SPEC_TS)}
                className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs font-semibold text-sky-300 flex items-center gap-1.5"
              >
                {copiedCodeBlock === 'ts' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCodeBlock === 'ts' ? 'Copiado!' : 'Copiar TypeScript'}</span>
              </button>
            </div>
            <pre className="p-5 text-xs font-mono overflow-x-auto max-h-[540px] text-stone-300 leading-relaxed">
              {ENGINE_SPEC_TS}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}