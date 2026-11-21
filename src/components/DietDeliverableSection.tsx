import React, { useMemo, useState } from 'react';
import {
  ArrowRightLeft,
  CheckCircle2,
  Droplets,
  Info,
  Leaf,
  Plus,
  Sparkles,
  Utensils
} from 'lucide-react';
import {
  buildCompleteSubstitutionCatalog,
  buildRichMealSheets,
  type FoodBandTone
} from '../shared/mealBuilder';
import type { AssessmentRecord } from '../shared/types';
import { PlateSplitIllustration, WaterCupIllustration } from './PortionIllustration';

interface DietDeliverableSectionProps {
  evaluation: AssessmentRecord;
}

const BAND_STYLES: Record<
  FoodBandTone,
  { headerBg: string; headerText: string; bodyBg: string; border: string }
> = {
  forest: {
    headerBg: 'bg-[#03422A]',
    headerText: 'text-white',
    bodyBg: 'bg-[#ECFDF5]/80',
    border: 'border-[#03422A]/25'
  },
  green: {
    headerBg: 'bg-[#65A30D]',
    headerText: 'text-white',
    bodyBg: 'bg-[#F7FEE7]',
    border: 'border-[#73AF04]/35'
  },
  red: {
    headerBg: 'bg-[#B91C1C]',
    headerText: 'text-white',
    bodyBg: 'bg-[#FEF2F2]/80',
    border: 'border-red-200'
  },
  blue: {
    headerBg: 'bg-[#0369A1]',
    headerText: 'text-white',
    bodyBg: 'bg-[#F0F9FF]',
    border: 'border-sky-200'
  },
  slate: {
    headerBg: 'bg-stone-700',
    headerText: 'text-white',
    bodyBg: 'bg-stone-100/80',
    border: 'border-stone-300'
  }
};

export const DietDeliverableSection: React.FC<DietDeliverableSectionProps> = ({
  evaluation
}) => {
  const { prescription } = evaluation.engineResult;
  const [selectedMealId, setSelectedMealId] = useState<string>('all');

  const mealSheets = useMemo(() => buildRichMealSheets(evaluation), [evaluation]);
  const substitutionCatalog = useMemo(
    () => buildCompleteSubstitutionCatalog(evaluation),
    [evaluation]
  );

  if (!prescription) return null;

  const totalWaterMl = prescription.waterTargetMl;
  const hasFluidRestriction = evaluation.input.fluidRestriction;
  const mealCount = mealSheets.length || evaluation.input.preferredMealCount || 4;

  const visibleSheets =
    selectedMealId === 'all'
      ? mealSheets
      : mealSheets.filter(sheet => sheet.id === selectedMealId);

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
      why: 'Apoia o intestino (junto às fibras de folhas e frutas) e reduz beliscos.'
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
      {/* BLOCO 1: RESUMO EXECUTIVO + FILOSOFIA DE ALTO VOLUME E VARIEDADE */}
      <section className="bg-white border border-stone-200 rounded-xl p-6 sm:p-8 space-y-6">
        <div className="border-b border-stone-200 pb-4 flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <span className="text-[11px] font-mono text-[#03422A] font-semibold uppercase tracking-wider">
              Método EmagreSLIM · Monte Sua Refeição por Classes
            </span>
            <h3 className="text-2xl font-serif font-semibold text-stone-900 mt-1">
              Seu Plano Alimentar Completo ({mealCount} refeições sem monotonia)
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Foco em alto volume de folhas verdes, verduras, frutas variadas ao longo do dia e liberdade total para montar combinações dentro dos seus gramas.
            </p>
          </div>
        </div>

        {/* 4 pilares numéricos */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-[#F9F8F4] border border-stone-200">
            <span className="text-[11px] text-stone-500 block">Energia do Dia</span>
            <p className="text-xl font-serif font-semibold text-stone-900 mt-0.5 tabular-nums">
              {prescription.targetKcal} kcal
            </p>
            <span className="text-[11px] text-[#03422A]">Déficit inteligente sustentável</span>
          </div>
          <div className="p-4 rounded-xl bg-[#F9F8F4] border border-stone-200">
            <span className="text-[11px] text-stone-500 block">Proteína Protetora</span>
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
            <span className="text-[11px] text-stone-500 block">Volume de Vegetais</span>
            <p className="text-xl font-serif font-semibold text-[#03422A] mt-0.5">
              Folhas Livres
            </p>
            <span className="text-[11px] text-stone-500">+ 400g+/dia de legumes e frutas</span>
          </div>
        </div>

        {/* Como usar o sistema de Classes & Mix */}
        <div className="rounded-xl bg-[#F9F8F4] border border-stone-200 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Leaf className="w-4 h-4 text-[#03422A] shrink-0" />
            <h4 className="text-sm font-semibold text-stone-900">
              Como funciona o cardápio por Classes (Zero Monotonia todos os dias)
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white border border-stone-200 flex items-center gap-4">
              <PlateSplitIllustration mode="full" />
              <div className="space-y-1 text-xs">
                <p className="font-semibold text-[#03422A]">
                  1 opção ou Mix dentro da mesma Classe
                </p>
                <p className="text-stone-600 leading-relaxed">
                  Você pode escolher <strong>1 alimento só</strong> ou <strong>misturar 2 ou 3 opções da mesma faixa colorida</strong> — basta que a soma final respeite o peso total em gramas indicado na fórmula da refeição.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center gap-4">
              <PlateSplitIllustration mode="half" />
              <div className="space-y-1 text-xs">
                <p className="font-semibold text-amber-950">
                  Volume real de Folhas, Verduras e Frutas diferentes
                </p>
                <p className="text-amber-900 leading-relaxed">
                  <strong>Folhas verdes são livres</strong> (comece sempre por elas no almoço e jantar). Alterne frutas diferentes entre manhã e tarde e varie 2 a 3 cores de legumes por dia.
                </p>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-stone-600 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[#03422A] shrink-0" />
            <span>
              Dica: cada refeição abaixo está organizada como uma <strong>ficha completa de montagem</strong> (e no PDF baixado cada refeição ganha sua própria página limpa para imprimir ou consultar no celular).
            </span>
          </p>
        </div>
      </section>

      {/* BLOCO 2: HIDRATAÇÃO GUIADA */}
      <section className="bg-white border border-stone-200 rounded-xl p-6 sm:p-8 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-4">
          <div className="space-y-1">
            <h3 className="text-lg font-serif font-semibold text-stone-900 flex items-center gap-2">
              <Droplets className="w-4 h-4 text-sky-700" />
              <span>1. Hidratação Guiada em 4 Períodos</span>
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

      {/* BLOCO 3: FICHAS DE REFEIÇÃO NO FORMATO POR CLASSES */}
      <section className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-xl font-serif font-semibold text-stone-900 flex items-center gap-2">
              <Utensils className="w-4 h-4 text-[#03422A]" />
              <span>2. Fichas de Montagem — Suas {mealCount} Refeições do Dia</span>
            </h3>
            <p className="text-xs text-stone-500">
              Siga a fórmula de cada ficha somando as classes de alimentos e use as tabelas de substitutos com gramas exatas para nunca enjoar.
            </p>
          </div>

          {!prescription.manualPlanText && mealSheets.length > 1 && (
            <div className="flex flex-wrap gap-1.5 p-1 bg-stone-100 rounded-lg border border-stone-200">
              <button
                type="button"
                onClick={() => setSelectedMealId('all')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                  selectedMealId === 'all'
                    ? 'bg-[#03422A] text-white'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Todas ({mealSheets.length})
              </button>
              {mealSheets.map(sheet => (
                <button
                  key={sheet.id}
                  type="button"
                  onClick={() => setSelectedMealId(sheet.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                    selectedMealId === sheet.id
                      ? 'bg-white text-[#03422A] shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {sheet.title.split('(')[0].trim()}
                </button>
              ))}
            </div>
          )}
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
          <div className="space-y-8">
            {visibleSheets.map(sheet => (
              <article
                key={sheet.id}
                className="bg-white border border-stone-300 rounded-xl overflow-hidden shadow-xs"
              >
                {/* Cabeçalho da Ficha da Refeição */}
                <div className="bg-[#03422A] text-white px-6 py-4 border-b-2 border-[#73AF04] flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-mono text-[#BEF264] uppercase tracking-wider block">
                      {sheet.orderLabel} · {sheet.suggestedWindow}
                    </span>
                    <h4 className="text-xl font-serif font-semibold mt-0.5">{sheet.title}</h4>
                  </div>
                  <div className="text-left sm:text-right text-xs font-mono tabular-nums bg-white/10 px-3.5 py-2 rounded-lg">
                    <span className="font-semibold text-white block">
                      ~{sheet.estimatedKcal} kcal
                    </span>
                    <span className="text-[#BEF264]">
                      ~{sheet.estimatedProteinG}g de proteína
                    </span>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  {/* FÓRMULA DA REFEIÇÃO (IGUAL AO QUADRO DO TOPO DO PDF DE REFERÊNCIA) */}
                  <div className="rounded-xl border border-stone-200 bg-[#F9F8F4] overflow-hidden">
                    <div className="px-4 py-2.5 bg-stone-100 border-b border-stone-200 flex items-center justify-between text-[11px] font-semibold text-stone-700 uppercase tracking-wider">
                      <span>Fórmula da Refeição — Monte somando os grupos</span>
                      <span>Quantidade</span>
                    </div>
                    <div className="divide-y divide-stone-200/80">
                      {sheet.formula.map((step, idx) => (
                        <div key={idx}>
                          <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-start gap-2.5 min-w-0">
                              <span className="w-5 h-5 rounded-md bg-[#03422A] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <div className="min-w-0">
                                <p className="text-xs sm:text-sm font-semibold text-stone-900">
                                  {step.label}
                                </p>
                                <p className="text-[11px] text-stone-500 mt-0.5">
                                  Medida prática: {step.measureHint}
                                </p>
                              </div>
                            </div>
                            <div className="sm:text-right shrink-0 pl-7 sm:pl-0">
                              <span className="inline-block px-3 py-1 rounded-md bg-white border border-stone-300 text-sm font-bold text-[#03422A] tabular-nums">
                                {step.gramsLabel}
                              </span>
                            </div>
                          </div>
                          {idx < sheet.formula.length - 1 && (
                            <div className="flex justify-center -my-2 relative z-10 pointer-events-none">
                              <span className="w-5 h-5 rounded-full bg-white border border-stone-300 text-[#03422A] flex items-center justify-center">
                                <Plus className="w-3 h-3" />
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* EXPLICAÇÃO PRÁTICA */}
                  <div className="px-4 py-3.5 rounded-xl bg-emerald-50/60 border border-[#03422A]/20 text-xs sm:text-sm text-stone-800 leading-relaxed">
                    <strong className="text-[#03422A]">Como montar na prática: </strong>
                    {sheet.howToBuild}
                  </div>

                  {/* FAIXAS COLORIDAS POR CLASSE DE ALIMENTO */}
                  <div className="space-y-3">
                    {sheet.bands.map((band, bIdx) => {
                      const st = BAND_STYLES[band.tone];
                      return (
                        <div
                          key={bIdx}
                          className={`rounded-xl border ${st.border} ${st.bodyBg} overflow-hidden`}
                        >
                          <div
                            className={`px-4 py-2 ${st.headerBg} ${st.headerText} text-xs font-semibold tracking-wide`}
                          >
                            {band.title}
                          </div>
                          <p className="px-4 py-3 text-xs sm:text-sm text-stone-800 leading-relaxed">
                            {band.itemsText}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* TABELAS DE SUBSTITUTOS + QUADRO AMARELO DE OBSERVAÇÕES PRÁTICAS */}
                  <div className="space-y-4 pt-1">
                    {sheet.substituteTables.map((table, tIdx) => (
                      <div
                        key={tIdx}
                        className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch"
                      >
                        {/* Tabela de Substitutos */}
                        <div className="lg:col-span-7 rounded-xl border border-stone-200 overflow-hidden bg-white">
                          <div className="px-4 py-2.5 bg-stone-100 border-b border-stone-200 flex items-center justify-between text-xs font-semibold text-stone-800">
                            <span>{table.title}</span>
                            <span className="text-stone-500 font-mono">Quantidade</span>
                          </div>
                          <div className="divide-y divide-stone-200">
                            {table.rows.map((row, rIdx) => (
                              <div
                                key={rIdx}
                                className="px-4 py-2.5 flex items-center justify-between gap-3 text-xs"
                              >
                                <div className="min-w-0">
                                  <span className="font-semibold text-stone-900 block">
                                    {row.name}
                                  </span>
                                  {row.measureHint && (
                                    <span className="text-[11px] text-stone-500">
                                      {row.measureHint}
                                    </span>
                                  )}
                                </div>
                                <span className="font-mono font-bold text-[#03422A] tabular-nums shrink-0">
                                  {row.grams}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Quadro Amarelo de Observações (igual ao PDF de referência!) */}
                        <div className="lg:col-span-5 rounded-xl border border-amber-300 bg-amber-50 p-4 flex flex-col justify-center space-y-2.5">
                          <p className="text-xs font-bold text-amber-950 uppercase tracking-wide flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                            <span>Observações Práticas</span>
                          </p>
                          <ul className="space-y-2 text-xs text-amber-950 leading-relaxed">
                            {table.notes.map((note, nIdx) => (
                              <li key={nIdx} className="flex items-start gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                                <span>{note}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* BLOCO 4: LISTA COMPLETA DE SUBSTITUIÇÕES EM 6 GRUPOS */}
      <section className="bg-white border border-stone-200 rounded-xl p-6 sm:p-8 space-y-5">
        <div className="border-b border-stone-200 pb-4 space-y-2">
          <h3 className="text-xl font-serif font-semibold text-stone-900 flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-[#03422A]" />
            <span>3. Guia Completo de Substituições por Grupo (Liberdade Total no Dia a Dia)</span>
          </h3>
          <p className="text-xs text-stone-700 leading-relaxed">
            Use esta tabela de consulta rápida nas compras do mercado e no preparo diário. Dentro da mesma classe, você pode trocar um alimento por outro ou fazer mix somando a grama total da refeição.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {substitutionCatalog.map((group, idx) => {
            const st = BAND_STYLES[group.tone];
            return (
              <div
                key={idx}
                className={`rounded-xl border ${st.border} bg-white overflow-hidden flex flex-col`}
              >
                <div className={`px-4 py-2.5 ${st.headerBg} ${st.headerText}`}>
                  <h4 className="text-xs sm:text-sm font-semibold">{group.title}</h4>
                </div>
                <div className="p-4 space-y-3 flex-1">
                  <p className="text-[11px] text-stone-600 leading-relaxed">{group.subtitle}</p>
                  <ul className="space-y-1.5 text-xs text-stone-800">
                    {group.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2 leading-relaxed">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#03422A] shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
