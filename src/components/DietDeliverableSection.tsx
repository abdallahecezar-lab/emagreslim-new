import React, { useState } from 'react';
import {
  ArrowRightLeft,
  CheckCircle2,
  Droplets,
  Info,
  Scale,
  Split,
  Utensils
} from 'lucide-react';
import type { AssessmentRecord, FoodCatalogItem, MealSection } from '../shared/types';
import {
  PlateSplitIllustration,
  PortionIllustration,
  WaterCupIllustration,
  inferPortionType
} from './PortionIllustration';

interface DietDeliverableSectionProps {
  evaluation: AssessmentRecord;
}

function formatHalfMeasure(householdMeasure: string, portionGrams: number): string {
  const clean = householdMeasure.replace(/\s*\([^)]*IBGE[^)]*\)/gi, '').trim();
  const halfGrams = Math.round(portionGrams / 2);

  if (clean.startsWith('4 colheres de sopa')) {
    return `2 colheres de sopa (${halfGrams}g)`;
  }
  if (clean.startsWith('2 colheres de sopa')) {
    return `1 colher de sopa (${halfGrams}g)`;
  }
  if (clean.startsWith('1 colher de sopa')) {
    return `½ colher de sopa (${halfGrams}g)`;
  }
  if (clean.startsWith('2 unidades médias')) {
    return `1 unidade média (${halfGrams}g)`;
  }
  if (clean.startsWith('1 unidade média')) {
    return `½ unidade média (${halfGrams}g)`;
  }
  if (clean.startsWith('1 filé médio')) {
    return `½ filé médio (${halfGrams}g)`;
  }
  if (clean.startsWith('1 concha')) {
    return `½ concha (${halfGrams}g)`;
  }
  if (clean.startsWith('1 lata pequena')) {
    return `½ lata pequena (${halfGrams}g)`;
  }
  if (clean.startsWith('1 copo americano')) {
    return `½ copo americano (${halfGrams} ml)`;
  }
  if (clean.startsWith('1 fatia média / 4 colheres de sopa')) {
    return `2 colheres de sopa (${halfGrams}g)`;
  }
  return `Metade da porção (${halfGrams}g)`;
}

function getMealWhyExplanation(mealName: string, evaluation: AssessmentRecord): string {
  const lower = mealName.toLowerCase();
  const { hasFridge, budgetPriority, hungerPeakTime, shiftWorker, preferredMealCount } =
    evaluation.input;

  if (lower.includes('café')) {
    return budgetPriority
      ? 'Combina carboidrato simples acessível com proteína de alto valor biológico (ovos) para iniciar o dia com saciedade sem pesar no orçamento.'
      : 'Começa o dia unindo carboidrato cotidiano e proteína para sustentar energia e evitar beliscos no meio da manhã.';
  }
  if (lower.includes('manhã')) {
    return 'Pequena pausa estratégica entre o café e o almoço para quem acorda cedo ou usa medicações que pedem intervalos menores, evitando fome exagerada às 12h.';
  }
  if (lower.includes('almoço')) {
    return 'Preserva o arroz com feijão por sua complementação de aminoácidos, fibras e identidade cultural, somados a proteína magra e hortaliças para volume gástrico.';
  }
  if (lower.includes('lanche')) {
    const timingWhy =
      hungerPeakTime === 'tarde_noite' || hungerPeakTime === 'madrugada_pos_turno'
        ? 'Posicionada cerca de 2h30 antes do seu maior pico de fome para evitar chegar à noite com fome extrema.'
        : 'Mantém intervalo confortável entre almoço e jantar com fibras e praticidade.';
    const fridgeWhy = !hasFridge
      ? ' Todos os itens selecionados são seguros fora da geladeira.'
      : '';
    return timingWhy + fridgeWhy;
  }
  if (lower.includes('ceia')) {
    return 'Opção leve para fechar o dia sem desconforto gástrico em rotinas noturnas muito longas.';
  }
  if (lower.includes('jantar')) {
    if ((preferredMealCount || 4) === 3) {
      return 'Como sua rotina comporta 3 refeições principais, o jantar fecha o aporte proteico e de fibras sem exigir lanches extras difíceis de cumprir.';
    }
    return shiftWorker
      ? 'Refeição leve e de digestão tranquila ajustada para o encerramento do seu ciclo de vigília, sem horários engessados.'
      : 'Refeição completa e rápida para fechar a meta proteica diária sem exigir preparos longos à noite.';
  }
  return 'Estrutura pensada para atingir proteína, fibras e energia dentro da sua rotina real.';
}

function getSlotsForMeal(meal: MealSection) {
  if (meal.slots && meal.slots.length > 0) {
    return meal.slots;
  }
  return meal.items.map((item, idx) => ({
    roleLabel: `Item ${idx + 1} da refeição`,
    primary: item,
    swapOptions: []
  }));
}

export const DietDeliverableSection: React.FC<DietDeliverableSectionProps> = ({
  evaluation
}) => {
  const { prescription } = evaluation.engineResult;
  // Permite ao paciente clicar para simular combinação 50% + 50% diretamente em cada bloco da refeição
  const [mixedSelection, setMixedSelection] = useState<Record<string, FoodCatalogItem | null>>({});

  if (!prescription) return null;

  const totalWaterMl = prescription.waterTargetMl;
  const hasFluidRestriction = evaluation.input.fluidRestriction;
  const mealsList = prescription.meals || [];
  const mealCount = mealsList.length || evaluation.input.preferredMealCount || 4;

  const waterPeriods = [
    {
      period: '01. Ao acordar',
      window: evaluation.input.shiftWorker ? 'Início do ciclo de vigília' : 'Entre 06:30 e 08:00',
      ml: Math.round(totalWaterMl * 0.15),
      cups: 1,
      why: 'Repõe perdas noturnas e ajuda a diferenciar sede matinal de fome.'
    },
    {
      period: '02. Período da manhã',
      window: 'Entre o café e 30 min antes do almoço',
      ml: Math.round(totalWaterMl * 0.3),
      cups: 3,
      why: 'Mantém hidratação constante no trabalho usando garrafinha visível na mesa.'
    },
    {
      period: '03. Período da tarde',
      window: 'Entre 14:00 e 18:00',
      ml: Math.round(totalWaterMl * 0.35),
      cups: 3,
      why: 'Apoia o funcionamento intestinal (junto às fibras) e reduz confusão entre sede e vontade de beliscar.'
    },
    {
      period: '04. Início da noite',
      window: 'Até 1h30 antes de dormir',
      ml: Math.max(
        250,
        totalWaterMl -
          Math.round(totalWaterMl * 0.15) -
          Math.round(totalWaterMl * 0.3) -
          Math.round(totalWaterMl * 0.35)
      ),
      cups: 2,
      why: 'Completa a meta diária sem concentrar grandes volumes perto do sono.'
    }
  ];

  return (
    <div className="space-y-8">
      {/* BLOCO 1: CABEÇALHO EDITORIAL + RESUMO DO DIA */}
      <section className="bg-white border border-stone-200 rounded-xl p-6 sm:p-8 space-y-6">
        <div className="border-b border-stone-200 pb-4 flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <span className="text-[11px] font-mono text-[#03422A] font-semibold uppercase tracking-wider">
              Guia Prático de Execução Diária
            </span>
            <h3 className="text-2xl font-serif font-semibold text-stone-900 mt-1">
              Seu Plano Alimentar ({mealCount} refeições conforme sua rotina)
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Tabela TACO 4ª ed. (NEPA/Unicamp) · Medidas Caseiras IBGE · Alimentos descritos como prontos para consumo
            </p>
          </div>
        </div>

        {/* Faixa de resumo rápido em 4 pilares */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-[#F9F8F4] border border-stone-200">
            <span className="text-[11px] text-stone-500 block">Energia do Dia</span>
            <p className="text-xl font-serif font-semibold text-stone-900 mt-0.5 tabular-nums">
              {prescription.targetKcal} kcal
            </p>
            <span className="text-[11px] text-[#03422A]">Déficit moderado sustentável</span>
          </div>
          <div className="p-4 rounded-xl bg-[#F9F8F4] border border-stone-200">
            <span className="text-[11px] text-stone-500 block">Proteína Diária</span>
            <p className="text-xl font-serif font-semibold text-[#03422A] mt-0.5 tabular-nums">
              {prescription.macros.proteinG}g ({prescription.macros.proteinPerKg} g/kg)
            </p>
            <span className="text-[11px] text-stone-500">Saciedade e massa magra</span>
          </div>
          <div className="p-4 rounded-xl bg-[#F9F8F4] border border-stone-200">
            <span className="text-[11px] text-stone-500 block">Água em 4 Períodos</span>
            <p className="text-xl font-serif font-semibold text-sky-900 mt-0.5 tabular-nums">
              {(totalWaterMl / 1000).toFixed(1)} L ({Math.round(totalWaterMl / 250)} copos)
            </p>
            <span className="text-[11px] text-stone-500">Distribuída ao longo do dia</span>
          </div>
          <div className="p-4 rounded-xl bg-[#F9F8F4] border border-stone-200">
            <span className="text-[11px] text-stone-500 block">Estrutura da Rotina</span>
            <p className="text-xl font-serif font-semibold text-stone-900 mt-0.5 tabular-nums">
              {mealCount} refeições
            </p>
            <span className="text-[11px] text-stone-500">Sem lanches forçados</span>
          </div>
        </div>

        {/* GUIA VISUAL DIDÁTICO: REGRA DOS 100% VS 50% + 50% */}
        <div className="rounded-xl bg-[#F9F8F4] border border-stone-200 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Split className="w-4 h-4 text-[#03422A] shrink-0" />
            <h4 className="text-sm font-semibold text-stone-900">
              Como montar o prato sem errar: Regra da Porção Inteira (100%) vs. Regra da Metade (½ + ½)
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white border border-stone-200 flex items-center gap-4">
              <PlateSplitIllustration mode="full" />
              <div className="space-y-1 text-xs">
                <p className="font-semibold text-[#03422A]">
                  Se você escolher 1 alimento só no grupo (100%)
                </p>
                <p className="text-stone-600 leading-relaxed">
                  Use a <strong>porção inteira</strong> indicada no cardápio. Exemplo: escolheu só arroz? Coloque <strong>4 colheres de sopa</strong>.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center gap-4">
              <PlateSplitIllustration mode="half" />
              <div className="space-y-1 text-xs">
                <p className="font-semibold text-amber-950">
                  Quer misturar 2 opções no mesmo prato? (50% + 50%)
                </p>
                <p className="text-amber-900 leading-relaxed">
                  Use <strong>metade da porção de cada</strong> para não dobrar as calorias. Exemplo: <strong>2 colheres de arroz + ½ batata cozida</strong>.
                </p>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-stone-600 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[#03422A] shrink-0" />
            <span>
              Dica interativa: dentro de cada refeição abaixo, você pode clicar em <strong>“Misturar com ½...”</strong> para o plano calcular automaticamente as metades para você.
            </span>
          </p>
        </div>
      </section>

      {/* BLOCO 2: PERÍODOS DE HIDRATAÇÃO */}
      <section className="bg-white border border-stone-200 rounded-xl p-6 sm:p-8 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-4">
          <div className="space-y-1">
            <h3 className="text-lg font-serif font-semibold text-stone-900 flex items-center gap-2">
              <Droplets className="w-4 h-4 text-sky-700" />
              <span>1. Hidratação Guiada por Período do Dia</span>
            </h3>
            <p className="text-xs text-stone-500">
              {prescription.waterNote} (1 copo americano padrão ≈ 250 ml · 1 garrafinha ≈ 500 ml)
            </p>
          </div>
          <span className="text-sm font-serif font-semibold text-sky-900 tabular-nums">
            Meta: {(totalWaterMl / 1000).toFixed(1)} L / dia
          </span>
        </div>

        {hasFluidRestriction ? (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950">
            Restrição hídrica clínica declarada: siga exclusivamente o volume de líquidos liberado na revisão individual.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {waterPeriods.map((wp, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-sky-50/50 border border-sky-200/80 flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-sky-900 block">{wp.period}</span>
                  <span className="text-[11px] text-stone-500 block">{wp.window}</span>
                </div>

                <WaterCupIllustration cupsCount={wp.cups} mlAmount={wp.ml} />

                <p className="text-[11px] text-stone-600 leading-relaxed border-t border-sky-200/60 pt-2">
                  <strong>Por quê:</strong> {wp.why}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* BLOCO 3: REFEIÇÕES SEPARADAS E INTERATIVAS */}
      <section className="space-y-5">
        <div className="space-y-1">
          <h3 className="text-xl font-serif font-semibold text-stone-900 flex items-center gap-2">
            <Utensils className="w-4 h-4 text-[#03422A]" />
            <span>2. Suas {mealCount} Refeições do Dia (Com Ilustrações e Regra da Metade)</span>
          </h3>
          <p className="text-xs text-stone-500">
            Siga os blocos de cada refeição. Se quiser variar ou misturar dois alimentos do mesmo grupo, basta clicar abaixo do item para ver a porção dividida ao meio.
          </p>
        </div>

        {prescription.manualPlanText ? (
          <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-4">
            <p className="text-xs font-semibold text-[#03422A]">
              Cardápio definido individualmente após análise clínica:
            </p>
            <pre className="whitespace-pre-wrap font-sans text-sm text-stone-800 bg-[#F9F8F4] p-5 rounded-xl border border-stone-200 leading-relaxed">
              {prescription.manualPlanText}
            </pre>
          </div>
        ) : (
          <div className="space-y-6">
            {mealsList.map((meal, idx) => {
              const mealWhy = getMealWhyExplanation(meal.name, evaluation);
              const slots = getSlotsForMeal(meal);

              // Calcula kcal e proteína atuais considerando combinações 50% + 50% selecionadas pelo usuário
              const mealTotals = slots.reduce(
                (acc, slot, slotIdx) => {
                  const slotKey = `${idx}-${slotIdx}`;
                  const mixedAlt = mixedSelection[slotKey];
                  if (mixedAlt) {
                    return {
                      kcal: acc.kcal + Math.round(slot.primary.kcal / 2 + mixedAlt.kcal / 2),
                      protein: acc.protein + (slot.primary.protein_g / 2 + mixedAlt.protein_g / 2)
                    };
                  }
                  return {
                    kcal: acc.kcal + slot.primary.kcal,
                    protein: acc.protein + slot.primary.protein_g
                  };
                },
                { kcal: 0, protein: 0 }
              );

              return (
                <article
                  key={idx}
                  className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs"
                >
                  {/* Cabeçalho da refeição */}
                  <div className="px-6 py-4 bg-[#F9F8F4] border-b border-stone-200 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-mono text-[#03422A] font-semibold">
                        Refeição 0{idx + 1} de 0{mealsList.length} · {meal.suggestedWindow}
                      </span>
                      <h4 className="text-lg font-serif font-semibold text-stone-900 mt-0.5">
                        {meal.name}
                      </h4>
                    </div>
                    <div className="text-right tabular-nums text-xs">
                      <span className="font-semibold text-stone-900 block">
                        Total da refeição: {mealTotals.kcal} kcal
                      </span>
                      <span className="text-[#03422A] font-medium">
                        {mealTotals.protein.toFixed(1)}g de proteína
                      </span>
                    </div>
                  </div>

                  {/* Por que essa refeição funciona assim */}
                  <div className="px-6 py-3 bg-emerald-50/40 border-b border-stone-200/80 text-xs text-stone-700 leading-relaxed">
                    <strong className="text-[#03422A]">Por que essa refeição foi montada assim: </strong>
                    {mealWhy}
                  </div>

                  {/* Blocos da refeição */}
                  <div className="divide-y divide-stone-200">
                    {slots.map((slot, slotIdx) => {
                      const food = slot.primary;
                      const slotKey = `${idx}-${slotIdx}`;
                      const mixedAlt = mixedSelection[slotKey] || null;
                      const visualType = inferPortionType(food.id, food.householdMeasure);

                      return (
                        <div key={food.id + slotIdx} className="px-6 py-5 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                            <span className="font-semibold text-[#03422A] flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>
                                Passo {slotIdx + 1} · {slot.roleLabel}
                              </span>
                            </span>
                            <span className="text-stone-500">
                              {mixedAlt
                                ? 'Modo combinado ativo: ½ porção de cada (50% + 50%)'
                                : '1 opção = porção inteira · 2 opções = ½ de cada'}
                            </span>
                          </div>

                          {/* Exibição em modo combinado (50% + 50%) vs modo único (100%) */}
                          {mixedAlt ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-amber-50/50 border border-amber-200 rounded-xl p-4">
                              <div className="flex items-start gap-3 bg-white p-3 rounded-lg border border-stone-200">
                                <PortionIllustration
                                  type={visualType}
                                  label={formatHalfMeasure(food.householdMeasure, food.portionGrams)}
                                />
                                <div className="space-y-0.5 text-xs">
                                  <span className="text-[10px] font-mono text-[#03422A] font-semibold block">
                                    METADE (50%) — ITEM 1
                                  </span>
                                  <p className="font-semibold text-stone-900">{food.name}</p>
                                  <p className="text-amber-950 font-semibold">
                                    Use: {formatHalfMeasure(food.householdMeasure, food.portionGrams)}
                                  </p>
                                  <span className="text-[11px] font-mono text-stone-500 tabular-nums">
                                    ~{Math.round(food.kcal / 2)} kcal · {(food.protein_g / 2).toFixed(1)}g prot
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-start gap-3 bg-white p-3 rounded-lg border border-stone-200">
                                <PortionIllustration
                                  type={inferPortionType(mixedAlt.id, mixedAlt.householdMeasure)}
                                  label={formatHalfMeasure(mixedAlt.householdMeasure, mixedAlt.portionGrams)}
                                />
                                <div className="space-y-0.5 text-xs">
                                  <span className="text-[10px] font-mono text-amber-800 font-semibold block">
                                    METADE (50%) — ITEM 2
                                  </span>
                                  <p className="font-semibold text-stone-900">{mixedAlt.name}</p>
                                  <p className="text-amber-950 font-semibold">
                                    Use: {formatHalfMeasure(mixedAlt.householdMeasure, mixedAlt.portionGrams)}
                                  </p>
                                  <span className="text-[11px] font-mono text-stone-500 tabular-nums">
                                    ~{Math.round(mixedAlt.kcal / 2)} kcal · {(mixedAlt.protein_g / 2).toFixed(1)}g prot
                                  </span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex items-start sm:items-center gap-4">
                                <PortionIllustration
                                  type={visualType}
                                  label={food.householdMeasure}
                                />
                                <div className="space-y-1">
                                  <p className="text-sm font-semibold text-stone-900">{food.name}</p>
                                  <p className="text-xs text-stone-700">
                                    Porção inteira (100%): <strong>{food.householdMeasure}</strong> ·{' '}
                                    <span className="font-mono tabular-nums">{food.portionGrams}g</span>
                                  </p>
                                  <p className="text-[11px] text-stone-500 font-mono">
                                    {food.source} · {food.sourceCode} ·{' '}
                                    {food.requiresFridge
                                      ? 'Conservar refrigerado'
                                      : 'Estável fora da geladeira'}
                                  </p>
                                </div>
                              </div>

                              <div className="sm:text-right text-xs font-mono tabular-nums shrink-0 pl-16 sm:pl-0">
                                <span className="font-semibold text-stone-900 block">{food.kcal} kcal</span>
                                <span className="text-stone-500">
                                  P {food.protein_g}g · C {food.carbs_g}g · G {food.fat_g}g · Fibra{' '}
                                  {food.fiber_g !== null ? `${food.fiber_g}g` : 'N/D'}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Seletor didático de mistura (50% + 50%) ou troca (100%) */}
                          {slot.swapOptions.length > 0 && (
                            <div className="ml-0 sm:ml-16 p-3.5 rounded-xl bg-[#F9F8F4] border border-stone-200 space-y-2.5">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-[11px] font-semibold text-stone-800 flex items-center gap-1.5">
                                  <Scale className="w-3.5 h-3.5 text-[#03422A]" />
                                  <span>
                                    Quer variar ou colocar 2 opções juntas? Clique para simular metade de cada (½ + ½):
                                  </span>
                                </span>
                                {mixedAlt && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setMixedSelection(prev => ({ ...prev, [slotKey]: null }))
                                    }
                                    className="text-[11px] font-semibold text-[#03422A] hover:underline"
                                  >
                                    Voltar para 1 opção (100%)
                                  </button>
                                )}
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {slot.swapOptions.map(alt => {
                                  const isSelectedMix = mixedAlt?.id === alt.id;
                                  return (
                                    <button
                                      key={alt.id}
                                      type="button"
                                      onClick={() =>
                                        setMixedSelection(prev => ({
                                          ...prev,
                                          [slotKey]: isSelectedMix ? null : alt
                                        }))
                                      }
                                      className={`px-3 py-2.5 rounded-lg border text-left text-xs transition-colors flex items-start justify-between gap-2 ${
                                        isSelectedMix
                                          ? 'bg-amber-50 border-amber-400 text-stone-900'
                                          : 'bg-white border-stone-200 hover:border-[#03422A]/50 text-stone-700'
                                      }`}
                                    >
                                      <div className="space-y-0.5">
                                        <span className="font-semibold text-stone-900 block">
                                          {isSelectedMix ? `Combinando ½ + ½: ${alt.name}` : alt.name}
                                        </span>
                                        <span className="text-[11px] text-stone-600 block">
                                          Se trocar só por ela (100%): <strong>{alt.householdMeasure}</strong>
                                        </span>
                                        <span className="text-[11px] text-[#03422A] block">
                                          Se juntar os dois (½ + ½):{' '}
                                          <strong>{formatHalfMeasure(alt.householdMeasure, alt.portionGrams)}</strong>
                                        </span>
                                      </div>
                                      <span className="font-mono text-[11px] text-stone-500 tabular-nums shrink-0">
                                        {alt.kcal} kcal
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* BLOCO 4: LISTA DE SUBSTITUIÇÕES GERAL LOGO ABAIXO COM REGRA DA METADE */}
      <section className="bg-white border border-stone-200 rounded-xl p-6 sm:p-8 space-y-5">
        <div className="border-b border-stone-200 pb-4 space-y-2">
          <h3 className="text-xl font-serif font-semibold text-stone-900 flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-[#03422A]" />
            <span>3. Guia Completo de Substituições Equivalentes</span>
          </h3>
          <p className="text-xs text-stone-700 leading-relaxed">
            <strong>Regra prática:</strong> se escolher <strong>1 opção</strong> da lista no lugar do item original, use a <strong>porção inteira</strong> indicada. Se quiser combinar <strong>2 opções ao mesmo tempo no prato</strong> (ex.: arroz + batata), use <strong>metade da porção de cada uma</strong>.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {(prescription.substitutions || []).map((sub, i) => (
            <div
              key={i}
              className="p-5 rounded-xl bg-[#F9F8F4] border border-stone-200 flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2.5">
                <span className="text-xs font-semibold text-[#03422A] block">{sub.group}</span>
                <div className="p-3 rounded-lg bg-white border border-stone-200 text-xs">
                  <span className="text-[10px] font-mono text-stone-400 uppercase block">
                    Porção inteira (100%)
                  </span>
                  <p className="font-semibold text-stone-900 mt-0.5">{sub.original}</p>
                </div>

                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-stone-700 block">
                    Troque por 1 (porção inteira) OU combine 2 usando ½ de cada:
                  </span>
                  <ul className="space-y-2 text-xs text-stone-700">
                    {sub.equivalents.map((eq, j) => (
                      <li key={j} className="p-2.5 rounded-lg bg-white border border-stone-200 leading-relaxed">
                        {eq}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
