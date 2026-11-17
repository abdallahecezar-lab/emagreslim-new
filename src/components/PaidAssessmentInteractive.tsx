import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Send,
  ShieldAlert
} from 'lucide-react';
import { evaluateDataSanityLock } from '../shared/clinicalEngine';
import type { AssessmentInput } from '../shared/types';

interface PaidAssessmentInteractiveProps {
  step: number;
  setStep: (step: number) => void;
  formData: AssessmentInput;
  setFormData: React.Dispatch<React.SetStateAction<AssessmentInput>>;
  orderId: string;
  onBackToCheckout: () => void;
  onSubmitFullAssessment: () => Promise<void>;
  isSubmitting: boolean;
}

const TOTAL_STEPS = 17;

const PROGRESS_BY_STEP: Record<number, number> = {
  1: 6,
  2: 12,
  3: 18,
  4: 24,
  5: 29,
  6: 35,
  7: 41,
  8: 47,
  9: 53,
  10: 59,
  11: 65,
  12: 71,
  13: 76,
  14: 82,
  15: 88,
  16: 94,
  17: 100
};

export const PaidAssessmentInteractive: React.FC<PaidAssessmentInteractiveProps> = ({
  step,
  setStep,
  formData,
  setFormData,
  orderId,
  onBackToCheckout,
  onSubmitFullAssessment,
  isSubmitting
}) => {
  const currentStep = Math.min(TOTAL_STEPS, Math.max(1, step));
  const progressPercent = PROGRESS_BY_STEP[currentStep] ?? 100;

  const [stepError, setStepError] = useState<string | null>(null);
  const [showCustomMeasuresEdit, setShowCustomMeasuresEdit] = useState(false);

  // Rastreia seleção explícita em etapas que possuem valores padrão no schema para evitar pré-seleção visual em fluxos novos
  const [weightChangeConfirmed, setWeightChangeConfirmed] = useState(false);
  const [mealCountConfirmed, setMealCountConfirmed] = useState(false);
  const [dietPrefConfirmed, setDietPrefConfirmed] = useState(false);
  const [hungerConfirmed, setHungerConfirmed] = useState(false);
  const [scheduleChoice, setScheduleChoice] = useState<string | null>(null);
  const [cookConfirmed, setCookConfirmed] = useState(false);
  const [medsConfirmed, setMedsConfirmed] = useState(Boolean(formData.medications));
  const [allergiesConfirmed, setAllergiesConfirmed] = useState(Boolean(formData.allergies));
  const [extraClinicalConfirmed, setExtraClinicalConfirmed] = useState(false);
  const [structureConfirmed, setStructureConfirmed] = useState(false);
  const [foodsConfirmed, setFoodsConfirmed] = useState(
    Boolean(formData.keepFoods || formData.avoidFoods)
  );

  const goTo = (next: number) => {
    setStepError(null);
    setStep(next);
  };

  const toggleHealthCondition = (condKey: string) => {
    setStepError(null);
    setExtraClinicalConfirmed(true);
    setFormData(prev => {
      const current = prev.healthConditions || [];
      if (condKey === 'nenhuma') return { ...prev, healthConditions: ['nenhuma'] };
      const withoutNone = current.filter(c => c !== 'nenhuma');
      const exists = withoutNone.includes(condKey);
      const updated = exists ? withoutNone.filter(c => c !== condKey) : [...withoutNone, condKey];
      return { ...prev, healthConditions: updated.length === 0 ? ['nenhuma'] : updated };
    });
  };

  const toggleMealLocation = (locKey: string) => {
    setStepError(null);
    setStructureConfirmed(true);
    setFormData(prev => {
      const current = prev.mealLocations || [];
      const exists = current.includes(locKey);
      const updated = exists ? current.filter(l => l !== locKey) : [...current, locKey];
      return { ...prev, mealLocations: updated.length === 0 ? ['casa'] : updated };
    });
  };

  return (
    <section className="max-w-2xl mx-auto space-y-5">
      {/* Barra superior idêntica à etapa gratuita — continuidade natural */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-stone-600 tabular-nums">
          <span>
            Sequência da Avaliação Completa · Pedido <strong>{orderId}</strong>
          </span>
          <span className="font-semibold text-stone-800">{progressPercent}%</span>
        </div>
        <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-[#03422A] to-[#73AF04] transition-all duration-200"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-[11px] text-stone-500">
          Seus dados do Mapeamento Inicial já estão salvos ({formData.memberName}, {formData.weightKg} kg → meta {formData.targetWeightKg} kg). Não vamos repetir perguntas.
        </p>
      </div>

      {/* Card único focado */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-10 shadow-xs space-y-6">
        {/* ETAPA 1 — Mudança recente de peso */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-[#03422A]">Evolução recente</span>
              <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-stone-900">
                Como tem sido o seu peso nos últimos meses?
              </h2>
              <p className="text-sm text-stone-600">
                Isso ajuda a entender se o metabolismo está estável ou se houve oscilação recente importante.
              </p>
            </div>

            <div className="space-y-2.5">
              {[
                { key: 'estavel' as const, label: 'Estável nos últimos meses' },
                { key: 'ganho_gradual' as const, label: 'Ganho gradual ao longo do tempo' },
                { key: 'ganho_rapido' as const, label: 'Ganho rápido em poucos meses' },
                { key: 'perda_intencional' as const, label: 'Já vinha em perda intencional' },
                {
                  key: 'inexplicada' as const,
                  label: 'Mudança importante sem explicação aparente (vai para revisão clínica)'
                }
              ].map(opt => {
                const selected = weightChangeConfirmed && formData.recentWeightChange === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      setStepError(null);
                      setWeightChangeConfirmed(true);
                      setFormData(prev => ({ ...prev, recentWeightChange: opt.key }));
                    }}
                    className={`w-full p-4 rounded-xl border text-left text-sm font-medium transition-colors ${
                      selected
                        ? 'border-[#03422A] bg-[#03422A]/5 text-[#03422A] font-semibold'
                        : 'border-stone-200 hover:bg-stone-50 text-stone-800'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {stepError && (
              <p className="text-xs text-rose-700 font-medium flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{stepError}</span>
              </p>
            )}

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={onBackToCheckout}
                className="px-5 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!weightChangeConfirmed) {
                    setStepError('Selecione uma opção sobre a evolução do seu peso.');
                    return;
                  }
                  goTo(2);
                }}
                className="px-6 py-2.5 rounded-xl bg-[#03422A] hover:bg-[#02311F] text-white text-xs font-semibold"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* ETAPA 2 — O que quer melhorar */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-[#03422A]">Foco do seu plano</span>
              <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-stone-900">
                O que você mais quer conquistar com o plano alimentar?
              </h2>
              <p className="text-sm text-stone-600">
                Escolha a opção que melhor traduz seu foco principal agora.
              </p>
            </div>

            <div className="space-y-2.5">
              {[
                'Reduzir medidas abdominais e gordura sem cortar comida do dia a dia',
                'Controlar a fome no fim da tarde/noite e evitar beliscos',
                'Ter mais energia, disposição e rotina alimentar organizada',
                'Melhorar saúde geral, exames e constância sem efeito sanfona'
              ].map(opt => {
                const selected = formData.goalDescription === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      setStepError(null);
                      setFormData(prev => ({ ...prev, goalDescription: opt }));
                    }}
                    className={`w-full p-4 rounded-xl border text-left text-sm font-medium transition-colors ${
                      selected
                        ? 'border-[#03422A] bg-[#03422A]/5 text-[#03422A] font-semibold'
                        : 'border-stone-200 hover:bg-stone-50 text-stone-800'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {stepError && (
              <p className="text-xs text-rose-700 font-medium flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{stepError}</span>
              </p>
            )}

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => goTo(1)}
                className="px-5 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!formData.goalDescription.trim()) {
                    setStepError('Escolha seu objetivo principal acima para continuar.');
                    return;
                  }
                  goTo(3);
                }}
                className="px-6 py-2.5 rounded-xl bg-[#03422A] hover:bg-[#02311F] text-white text-xs font-semibold"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* ETAPA 3 — Condições complementares & Restrição hídrica & Sinais de urgência */}
        {currentStep === 3 && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-[#03422A]">Segurança clínica complementar</span>
              <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-stone-900">
                Há alguma condição clínica adicional ou restrição médica de líquidos?
              </h2>
              <p className="text-sm text-stone-600">
                Você já respondeu as condições iniciais. Marque abaixo caso alguma destas também se aplique:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { key: 'nenhuma', label: 'Nenhuma condição adicional' },
                { key: 'diabetes_tipo_1', label: 'Diabetes Tipo 1' },
                { key: 'hipertensao', label: 'Hipertensão Arterial' },
                { key: 'doenca_gi_ativa', label: 'Doença Gastrointestinal Ativa' },
                { key: 'cancer_tratamento', label: 'Câncer em Tratamento' }
              ].map(c => {
                const active =
                  extraClinicalConfirmed && (formData.healthConditions || []).includes(c.key);
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => toggleHealthCondition(c.key)}
                    className={`p-3.5 rounded-xl border text-left text-sm font-medium transition-colors ${
                      active
                        ? 'border-[#03422A] bg-[#03422A]/5 text-[#03422A] font-semibold'
                        : 'border-stone-200 hover:bg-stone-50 text-stone-800'
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => {
                  setExtraClinicalConfirmed(true);
                  setStepError(null);
                  setFormData(prev => ({ ...prev, fluidRestriction: !prev.fluidRestriction }));
                }}
                className={`p-3.5 rounded-xl border text-left text-sm font-medium transition-colors ${
                  formData.fluidRestriction
                    ? 'border-[#03422A] bg-[#03422A]/5 text-[#03422A] font-semibold'
                    : 'border-stone-200 hover:bg-stone-50 text-stone-800'
                }`}
              >
                Tenho restrição hídrica médica
              </button>
            </div>

            <label className="flex items-start gap-3 p-4 rounded-xl border border-rose-200 bg-rose-50/70 cursor-pointer text-xs text-rose-950">
              <input
                type="checkbox"
                checked={formData.emergencySymptoms}
                onChange={e => {
                  setExtraClinicalConfirmed(true);
                  setFormData(prev => ({ ...prev, emergencySymptoms: e.target.checked }));
                }}
                className="mt-0.5"
              />
              <span>
                <strong>Estou com sinais agudos agora</strong> (dor no peito, falta de ar intensa, desmaio, hipoglicemia grave ou vômitos persistentes — orienta atendimento médico imediato).
              </span>
            </label>

            {stepError && (
              <p className="text-xs text-rose-700 font-medium flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{stepError}</span>
              </p>
            )}

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => goTo(2)}
                className="px-5 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!extraClinicalConfirmed) {
                    setStepError('Confirme clicando em "Nenhuma condição adicional" ou nas opções aplicáveis.');
                    return;
                  }
                  goTo(4);
                }}
                className="px-6 py-2.5 rounded-xl bg-[#03422A] hover:bg-[#02311F] text-white text-xs font-semibold"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* ETAPA 4 — Medicamentos e suplementos */}
        {currentStep === 4 && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-[#03422A]">Medicamentos</span>
              <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-stone-900">
                Você usa algum medicamento ou suplemento contínuo?
              </h2>
              <p className="text-sm text-stone-600">
                Toque nos itens abaixo ou escreva caso utilize algum outro.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                'Nenhum medicamento de uso contínuo',
                'Metformina',
                'Levotiroxina',
                'Anti-hipertensivo',
                'Insulina',
                'Suplemento vitamínico / proteína'
              ].map(med => {
                const isNone = med.startsWith('Nenhum');
                const active =
                  medsConfirmed &&
                  (isNone
                    ? formData.medications.includes('Nenhum')
                    : formData.medications.includes(med));
                return (
                  <button
                    key={med}
                    type="button"
                    onClick={() => {
                      setStepError(null);
                      setMedsConfirmed(true);
                      if (isNone) {
                        setFormData(prev => ({
                          ...prev,
                          medications: 'Nenhum medicamento de uso contínuo.',
                          unknownMedicationDose: false
                        }));
                      } else {
                        const base = formData.medications.includes('Nenhum') ? '' : formData.medications;
                        const exists = base.includes(med);
                        const parts = base
                          .split(',')
                          .map(s => s.trim())
                          .filter(Boolean);
                        const nextParts = exists ? parts.filter(p => p !== med) : [...parts, med];
                        setFormData(prev => ({ ...prev, medications: nextParts.join(', ') }));
                      }
                    }}
                    className={`p-3.5 rounded-xl border text-left text-sm font-medium transition-colors ${
                      active
                        ? 'border-[#03422A] bg-[#03422A]/5 text-[#03422A] font-semibold'
                        : 'border-stone-200 hover:bg-stone-50 text-stone-800'
                    }`}
                  >
                    {med}
                  </button>
                );
              })}
            </div>

            <input
              type="text"
              value={formData.medications}
              onChange={e => {
                setStepError(null);
                setMedsConfirmed(true);
                setFormData(prev => ({ ...prev, medications: e.target.value }));
              }}
              placeholder="Outro medicamento ou complemento (opcional)"
              className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm text-stone-900 focus:outline-none focus:border-[#03422A]"
            />

            <label className="flex items-center gap-2.5 text-xs text-stone-700 cursor-pointer p-3.5 rounded-xl bg-[#F9F8F4] border border-stone-200">
              <input
                type="checkbox"
                checked={formData.unknownMedicationDose}
                onChange={e => {
                  setMedsConfirmed(true);
                  setFormData(prev => ({ ...prev, unknownMedicationDose: e.target.checked }));
                }}
              />
              <span>Não sei a dose exata do medicamento (direciona para conferência clínica)</span>
            </label>

            {stepError && (
              <p className="text-xs text-rose-700 font-medium flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{stepError}</span>
              </p>
            )}

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => goTo(3)}
                className="px-5 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!medsConfirmed && !formData.medications.trim()) {
                    setStepError('Selecione "Nenhum medicamento de uso contínuo" ou informe o medicamento.');
                    return;
                  }
                  goTo(5);
                }}
                className="px-6 py-2.5 rounded-xl bg-[#03422A] hover:bg-[#02311F] text-white text-xs font-semibold"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* ETAPA 5 — Alergias alimentares */}
        {currentStep === 5 && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-[#03422A]">Segurança alimentar</span>
              <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-stone-900">
                Você possui alguma alergia ou intolerância alimentar?
              </h2>
              <p className="text-sm text-stone-600">
                Garantimos que nenhum item alergênico entre no seu cardápio ou nas substituições.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {['Nenhuma alergia', 'Leite / Lactose', 'Glúten / Trigo', 'Ovo', 'Amendoim', 'Peixe / Camarão'].map(
                alg => {
                  const isNone = alg === 'Nenhuma alergia';
                  const active =
                    allergiesConfirmed &&
                    (isNone ? formData.allergies === '' : formData.allergies.includes(alg));
                  return (
                    <button
                      key={alg}
                      type="button"
                      onClick={() => {
                        setStepError(null);
                        setAllergiesConfirmed(true);
                        if (isNone) {
                          setFormData(prev => ({ ...prev, allergies: '', allergySeverityUnknown: false }));
                        } else {
                          const parts = (formData.allergies || '')
                            .split(',')
                            .map(s => s.trim())
                            .filter(Boolean);
                          const exists = parts.includes(alg);
                          const nextParts = exists ? parts.filter(p => p !== alg) : [...parts, alg];
                          setFormData(prev => ({ ...prev, allergies: nextParts.join(', ') }));
                        }
                      }}
                      className={`p-3.5 rounded-xl border text-left text-sm font-medium transition-colors ${
                        active
                          ? 'border-[#03422A] bg-[#03422A]/5 text-[#03422A] font-semibold'
                          : 'border-stone-200 hover:bg-stone-50 text-stone-800'
                      }`}
                    >
                      {alg}
                    </button>
                  );
                }
              )}
            </div>

            <input
              type="text"
              value={formData.allergies}
              onChange={e => {
                setStepError(null);
                setAllergiesConfirmed(true);
                setFormData(prev => ({ ...prev, allergies: e.target.value }));
              }}
              placeholder="Outra alergia alimentar (opcional)"
              className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm text-stone-900 focus:outline-none focus:border-[#03422A]"
            />

            <label className="flex items-center gap-2.5 text-xs text-stone-700 cursor-pointer p-3.5 rounded-xl bg-[#F9F8F4] border border-stone-200">
              <input
                type="checkbox"
                checked={formData.allergySeverityUnknown}
                onChange={e => {
                  setAllergiesConfirmed(true);
                  setFormData(prev => ({ ...prev, allergySeverityUnknown: e.target.checked }));
                }}
              />
              <span>Não sei a gravidade da alergia</span>
            </label>

            {stepError && (
              <p className="text-xs text-rose-700 font-medium flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{stepError}</span>
              </p>
            )}

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => goTo(4)}
                className="px-5 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!allergiesConfirmed) {
                    setStepError('Selecione "Nenhuma alergia" ou marque os alimentos que causam alergia.');
                    return;
                  }
                  goTo(6);
                }}
                className="px-6 py-2.5 rounded-xl bg-[#03422A] hover:bg-[#02311F] text-white text-xs font-semibold"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* ETAPA 6 — Horários de sono e turnos */}
        {currentStep === 6 && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-[#03422A]">Relógio e turnos</span>
              <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-stone-900">
                Qual é o seu ritmo habitual de sono e trabalho?
              </h2>
              <p className="text-sm text-stone-600">
                Ajustamos as janelas das suas refeições ao seu horário real, inclusive se trabalha em turnos.
              </p>
            </div>

            <div className="space-y-2.5">
              {[
                { key: 'cedo', label: 'Acordo cedo (por volta de 05:30–06:30) e durmo até 22:30', wake: '06:00', sleep: '22:30', shift: false },
                { key: 'padrao', label: 'Horário padrão (acordo ~07:00 e durmo ~23:00)', wake: '07:00', sleep: '23:00', shift: false },
                { key: 'tarde', label: 'Acordo mais tarde (~08:30) e durmo após 00:00', wake: '08:30', sleep: '00:30', shift: false },
                { key: 'turnos', label: 'Trabalho em turnos alternados ou noturnos (sem horário fixo)', wake: 'Variável', sleep: 'Variável', shift: true }
              ].map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    setStepError(null);
                    setScheduleChoice(opt.key);
                    setFormData(prev => ({
                      ...prev,
                      wakeTime: opt.wake,
                      sleepTime: opt.sleep,
                      shiftWorker: opt.shift
                    }));
                  }}
                  className={`w-full p-4 rounded-xl border text-left text-sm font-medium transition-colors ${
                    scheduleChoice === opt.key
                      ? 'border-[#03422A] bg-[#03422A]/5 text-[#03422A] font-semibold'
                      : 'border-stone-200 hover:bg-stone-50 text-stone-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {stepError && (
              <p className="text-xs text-rose-700 font-medium flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{stepError}</span>
              </p>
            )}

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => goTo(5)}
                className="px-5 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!scheduleChoice) {
                    setStepError('Selecione seu ritmo de sono/trabalho para continuarmos.');
                    return;
                  }
                  goTo(7);
                }}
                className="px-6 py-2.5 rounded-xl bg-[#03422A] hover:bg-[#02311F] text-white text-xs font-semibold"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* ETAPA 7 — Estrutura (Geladeira, Micro-ondas, Locais) */}
        {currentStep === 7 && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-[#03422A]">Estrutura na prática</span>
              <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-stone-900">
                Onde você faz suas refeições e qual estrutura tem fora de casa?
              </h2>
              <p className="text-sm text-stone-600">
                Se não tiver geladeira fora de casa, escolhemos opções seguras que não estragam na bolsa.
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold text-stone-700">Onde você costuma comer:</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { key: 'casa', label: 'Em casa' },
                  { key: 'marmita_trabalho', label: 'Marmita no trabalho' },
                  { key: 'restaurante_kg', label: 'Restaurante / Rua' }
                ].map(loc => {
                  const active = structureConfirmed && (formData.mealLocations || []).includes(loc.key);
                  return (
                    <button
                      key={loc.key}
                      type="button"
                      onClick={() => toggleMealLocation(loc.key)}
                      className={`p-3.5 rounded-xl border text-left text-sm font-medium transition-colors ${
                        active
                          ? 'border-[#03422A] bg-[#03422A]/5 text-[#03422A] font-semibold'
                          : 'border-stone-200 hover:bg-stone-50 text-stone-800'
                      }`}
                    >
                      {loc.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2.5 pt-1">
              <p className="text-xs font-semibold text-stone-700">Conservação fora de casa:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setStructureConfirmed(true);
                    setStepError(null);
                    setFormData(prev => ({ ...prev, hasFridge: true }));
                  }}
                  className={`p-3.5 rounded-xl border text-left text-sm font-medium transition-colors ${
                    structureConfirmed && formData.hasFridge
                      ? 'border-[#03422A] bg-[#03422A]/5 text-[#03422A] font-semibold'
                      : 'border-stone-200 hover:bg-stone-50 text-stone-800'
                  }`}
                >
                  Tenho geladeira disponível no dia
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStructureConfirmed(true);
                    setStepError(null);
                    setFormData(prev => ({ ...prev, hasFridge: false }));
                  }}
                  className={`p-3.5 rounded-xl border text-left text-sm font-medium transition-colors ${
                    structureConfirmed && !formData.hasFridge
                      ? 'border-[#03422A] bg-[#03422A]/5 text-[#03422A] font-semibold'
                      : 'border-stone-200 hover:bg-stone-50 text-stone-800'
                  }`}
                >
                  Não tenho geladeira fora de casa
                </button>
              </div>
            </div>

            {stepError && (
              <p className="text-xs text-rose-700 font-medium flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{stepError}</span>
              </p>
            )}

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => goTo(6)}
                className="px-5 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!structureConfirmed) {
                    setStepError('Informe onde você costuma comer e se possui geladeira disponível.');
                    return;
                  }
                  goTo(8);
                }}
                className="px-6 py-2.5 rounded-xl bg-[#03422A] hover:bg-[#02311F] text-white text-xs font-semibold"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* ETAPA 8 — Padrão alimentar & Orçamento */}
        {currentStep === 8 && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-[#03422A]">Estilo e orçamento</span>
              <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-stone-900">
                Qual padrão alimentar você segue e como equilibrar custos?
              </h2>
            </div>

            <div className="space-y-2.5">
              {[
                { key: 'onivoro' as const, label: 'Onívoro (carnes, frango, peixe, ovos, lácteos)' },
                { key: 'vegetariano' as const, label: 'Vegetariano (sem carnes/peixes, com ovos ou lácteos)' },
                { key: 'vegano' as const, label: 'Vegano (100% base vegetal)' }
              ].map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    setStepError(null);
                    setDietPrefConfirmed(true);
                    setFormData(prev => ({ ...prev, dietaryPreference: opt.key }));
                  }}
                  className={`w-full p-4 rounded-xl border text-left text-sm font-medium transition-colors ${
                    dietPrefConfirmed && formData.dietaryPreference === opt.key
                      ? 'border-[#03422A] bg-[#03422A]/5 text-[#03422A] font-semibold'
                      : 'border-stone-200 hover:bg-stone-50 text-stone-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <label className="flex items-start gap-2.5 text-xs font-medium text-stone-800 bg-[#F9F8F4] p-4 rounded-xl border border-stone-200 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.budgetPriority}
                onChange={e => {
                  setDietPrefConfirmed(true);
                  setFormData(prev => ({ ...prev, budgetPriority: e.target.checked }));
                }}
                className="mt-0.5"
              />
              <span>
                <strong>Priorizar opções econômicas e acessíveis</strong> (alimentos simples de mercado, sem ingredientes caros ou suplementos)
              </span>
            </label>

            {stepError && (
              <p className="text-xs text-rose-700 font-medium flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{stepError}</span>
              </p>
            )}

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => goTo(7)}
                className="px-5 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!dietPrefConfirmed) {
                    setStepError('Selecione seu padrão alimentar para continuarmos.');
                    return;
                  }
                  goTo(9);
                }}
                className="px-6 py-2.5 rounded-xl bg-[#03422A] hover:bg-[#02311F] text-white text-xs font-semibold"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* ETAPA 9 — Quantas refeições por dia */}
        {currentStep === 9 && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-[#03422A]">Sua rotina na mesa</span>
              <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-stone-900">
                Quantas refeições por dia realmente cabem na sua rotina?
              </h2>
              <p className="text-sm text-stone-600">
                O cardápio será dividido exatamente nesse número de refeições, sem forçar lanches que você não faz.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { count: 3 as const, title: '3 refeições por dia', desc: 'Café da manhã, Almoço e Jantar' },
                { count: 4 as const, title: '4 refeições por dia', desc: 'Inclui Lanche da Tarde anti-fome' },
                { count: 5 as const, title: '5 refeições por dia', desc: 'Inclui Lanche da Manhã e da Tarde' },
                { count: 6 as const, title: '6 refeições por dia', desc: 'Dia longo — inclui Ceia leve' }
              ].map(opt => {
                const active = mealCountConfirmed && formData.preferredMealCount === opt.count;
                return (
                  <button
                    key={opt.count}
                    type="button"
                    onClick={() => {
                      setStepError(null);
                      setMealCountConfirmed(true);
                      setFormData(prev => ({ ...prev, preferredMealCount: opt.count }));
                    }}
                    className={`p-4 rounded-xl border text-left transition-colors ${
                      active
                        ? 'border-[#03422A] bg-[#03422A]/5 text-[#03422A]'
                        : 'border-stone-200 hover:bg-stone-50 text-stone-800'
                    }`}
                  >
                    <span className="text-sm font-semibold block">{opt.title}</span>
                    <span className="text-xs text-stone-500 block mt-0.5">{opt.desc}</span>
                  </button>
                );
              })}
            </div>

            {stepError && (
              <p className="text-xs text-rose-700 font-medium flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{stepError}</span>
              </p>
            )}

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => goTo(8)}
                className="px-5 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!mealCountConfirmed) {
                    setStepError('Escolha quantas refeições por dia funcionam melhor para você.');
                    return;
                  }
                  goTo(10);
                }}
                className="px-6 py-2.5 rounded-xl bg-[#03422A] hover:bg-[#02311F] text-white text-xs font-semibold"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* ETAPA 10 — Quem cozinha e tempo disponível */}
        {currentStep === 10 && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-[#03422A]">Preparo</span>
              <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-stone-900">
                Quem prepara suas refeições e quanto tempo você tem?
              </h2>
            </div>

            <div className="space-y-2.5">
              <p className="text-xs font-semibold text-stone-700">Responsável pelo preparo:</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { key: 'eu_mesma', label: 'Eu mesmo(a) preparo' },
                  { key: 'conjuge', label: 'Familiar / Cônjuge' },
                  { key: 'marmita_comprada', label: 'Compro pronto / marmita' }
                ].map(opt => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      setStepError(null);
                      setCookConfirmed(true);
                      setFormData(prev => ({ ...prev, whoCooks: opt.key }));
                    }}
                    className={`p-3.5 rounded-xl border text-left text-xs sm:text-sm font-medium transition-colors ${
                      cookConfirmed && formData.whoCooks === opt.key
                        ? 'border-[#03422A] bg-[#03422A]/5 text-[#03422A] font-semibold'
                        : 'border-stone-200 hover:bg-stone-50 text-stone-800'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5">
              <p className="text-xs font-semibold text-stone-700">Tempo disponível para cozinhar:</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { key: 'baixo_15min', label: 'Até 15 min (rápido)' },
                  { key: 'medio_30min', label: 'Até 30 min' },
                  { key: 'amplo', label: 'Mais de 30 min' }
                ].map(opt => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      setStepError(null);
                      setCookConfirmed(true);
                      setFormData(prev => ({ ...prev, cookingTimeAvailable: opt.key }));
                    }}
                    className={`p-3.5 rounded-xl border text-left text-xs sm:text-sm font-medium transition-colors ${
                      cookConfirmed && formData.cookingTimeAvailable === opt.key
                        ? 'border-[#03422A] bg-[#03422A]/5 text-[#03422A] font-semibold'
                        : 'border-stone-200 hover:bg-stone-50 text-stone-800'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {stepError && (
              <p className="text-xs text-rose-700 font-medium flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{stepError}</span>
              </p>
            )}

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => goTo(9)}
                className="px-5 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!cookConfirmed) {
                    setStepError('Selecione quem cozinha e o tempo disponível para o preparo.');
                    return;
                  }
                  goTo(11);
                }}
                className="px-6 py-2.5 rounded-xl bg-[#03422A] hover:bg-[#02311F] text-white text-xs font-semibold"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* ETAPA 11 — Alimentos preferidos e recusados */}
        {currentStep === 11 && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-[#03422A]">Cultura alimentar</span>
              <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-stone-900">
                Quais alimentos você quer manter e o que prefere deixar de fora?
              </h2>
            </div>

            <div className="space-y-2.5">
              <p className="text-xs font-semibold text-stone-700">Gostaria de manter:</p>
              <div className="flex flex-wrap gap-2">
                {['Arroz e feijão', 'Pão francês', 'Ovos', 'Frango', 'Banana / frutas', 'Cuscuz'].map(item => {
                  const selected = formData.keepFoods.toLowerCase().includes(item.toLowerCase());
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        setStepError(null);
                        setFoodsConfirmed(true);
                        const parts = (formData.keepFoods || '')
                          .split(',')
                          .map(s => s.trim())
                          .filter(Boolean);
                        const exists = parts.some(p => p.toLowerCase() === item.toLowerCase());
                        const next = exists
                          ? parts.filter(p => p.toLowerCase() !== item.toLowerCase())
                          : [...parts, item];
                        setFormData(prev => ({ ...prev, keepFoods: next.join(', ') }));
                      }}
                      className={`px-3.5 py-2 rounded-xl border text-xs font-medium transition-colors ${
                        selected
                          ? 'border-[#03422A] bg-[#03422A]/10 text-[#03422A] font-semibold'
                          : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                      }`}
                    >
                      {selected ? `✓ ${item}` : `+ ${item}`}
                    </button>
                  );
                })}
              </div>
              <input
                type="text"
                value={formData.keepFoods}
                onChange={e => {
                  setFoodsConfirmed(true);
                  setFormData(prev => ({ ...prev, keepFoods: e.target.value }));
                }}
                placeholder="Outros alimentos que você gosta (opcional)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs text-stone-900"
              />
            </div>

            <div className="space-y-2.5 pt-1">
              <p className="text-xs font-semibold text-stone-700">Não como / prefiro evitar:</p>
              <div className="flex flex-wrap gap-2">
                {['Como de tudo (nenhum)', 'Fígado / miúdos', 'Peixes / sardinha', 'Jiló / berinjela', 'Leite e derivados'].map(
                  item => {
                    const isNone = item.startsWith('Como de tudo');
                    const selected = isNone
                      ? formData.avoidFoods === 'Nenhum'
                      : formData.avoidFoods.toLowerCase().includes(item.toLowerCase());
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          setStepError(null);
                          setFoodsConfirmed(true);
                          if (isNone) {
                            setFormData(prev => ({ ...prev, avoidFoods: 'Nenhum' }));
                          } else {
                            const base = formData.avoidFoods === 'Nenhum' ? '' : formData.avoidFoods || '';
                            const parts = base
                              .split(',')
                              .map(s => s.trim())
                              .filter(Boolean);
                            const exists = parts.some(p => p.toLowerCase() === item.toLowerCase());
                            const next = exists
                              ? parts.filter(p => p.toLowerCase() !== item.toLowerCase())
                              : [...parts, item];
                            setFormData(prev => ({ ...prev, avoidFoods: next.join(', ') }));
                          }
                        }}
                        className={`px-3.5 py-2 rounded-xl border text-xs font-medium transition-colors ${
                          selected
                            ? 'border-[#03422A] bg-[#03422A]/10 text-[#03422A] font-semibold'
                            : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                        }`}
                      >
                        {item}
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {stepError && (
              <p className="text-xs text-rose-700 font-medium flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{stepError}</span>
              </p>
            )}

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => goTo(10)}
                className="px-5 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!foodsConfirmed && !formData.keepFoods.trim() && !formData.avoidFoods.trim()) {
                    setStepError('Selecione ao menos um alimento que gosta ou marque "Como de tudo".');
                    return;
                  }
                  goTo(12);
                }}
                className="px-6 py-2.5 rounded-xl bg-[#03422A] hover:bg-[#02311F] text-white text-xs font-semibold"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* ETAPA 12 — Horário de maior fome e comportamento */}
        {currentStep === 12 && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-[#03422A]">Fome e comportamento</span>
              <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-stone-900">
                Em qual horário sua fome aperta mais e há episódios de perda de controle?
              </h2>
            </div>

            <div className="space-y-2.5">
              <p className="text-xs font-semibold text-stone-700">Horário de maior fome:</p>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { key: 'manha' as const, label: 'Manhã' },
                  { key: 'almoco' as const, label: 'Perto do almoço' },
                  { key: 'tarde_noite' as const, label: 'Fim da tarde / Noite' },
                  { key: 'madrugada_pos_turno' as const, label: 'Madrugada / Pós-turno' }
                ].map(opt => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      setStepError(null);
                      setHungerConfirmed(true);
                      setFormData(prev => ({ ...prev, hungerPeakTime: opt.key }));
                    }}
                    className={`p-3.5 rounded-xl border text-left text-xs sm:text-sm font-medium transition-colors ${
                      hungerConfirmed && formData.hungerPeakTime === opt.key
                        ? 'border-[#03422A] bg-[#03422A]/5 text-[#03422A] font-semibold'
                        : 'border-stone-200 hover:bg-stone-50 text-stone-800'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5">
              <p className="text-xs font-semibold text-stone-700">Episódios de perda de controle ao comer:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { key: 'nunca_raramente' as const, label: 'Nunca ou raramente' },
                  { key: 'mensal' as const, label: 'Ocasionalmente (1–2x/mês)' },
                  { key: 'semanal_com_sofrimento' as const, label: 'Semanalmente com sofrimento' },
                  { key: 'frequente_diario' as const, label: 'Frequente / várias vezes na semana' }
                ].map(opt => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      setStepError(null);
                      setHungerConfirmed(true);
                      setFormData(prev => ({ ...prev, lossOfControlFrequency: opt.key }));
                    }}
                    className={`p-3.5 rounded-xl border text-left text-xs sm:text-sm font-medium transition-colors ${
                      hungerConfirmed && formData.lossOfControlFrequency === opt.key
                        ? 'border-[#03422A] bg-[#03422A]/5 text-[#03422A] font-semibold'
                        : 'border-stone-200 hover:bg-stone-50 text-stone-800'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2.5 text-xs font-medium text-rose-950 bg-rose-50/70 p-3.5 rounded-xl border border-rose-200 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.purgingOrCompensation}
                onChange={e => {
                  setHungerConfirmed(true);
                  setFormData(prev => ({ ...prev, purgingOrCompensation: e.target.checked }));
                }}
              />
              <span>Faço compensações após comer (jejum punitivo longo, laxantes ou vômito)</span>
            </label>

            {stepError && (
              <p className="text-xs text-rose-700 font-medium flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{stepError}</span>
              </p>
            )}

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => goTo(11)}
                className="px-5 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!hungerConfirmed) {
                    setStepError('Selecione o horário de maior fome e sua resposta sobre controle alimentar.');
                    return;
                  }
                  goTo(13);
                }}
                className="px-6 py-2.5 rounded-xl bg-[#03422A] hover:bg-[#02311F] text-white text-xs font-semibold"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* ETAPA 13 — Contexto da fome */}
        {currentStep === 13 && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-[#03422A]">Contexto da fome</span>
              <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-stone-900">
                O que costuma acontecer antes da sua maior fome?
              </h2>
            </div>

            <div className="space-y-2.5">
              {[
                'Passo muitas horas sem comer no trabalho e chego em casa com muita fome.',
                'Cansaço ou estresse no fim do dia me fazem buscar comida rápida.',
                'Refeições anteriores leves demais (pouca proteína/fibra) não sustentam.',
                'Horários de sono ou turnos irregulares desorganizam minha saciedade.'
              ].map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    setStepError(null);
                    setFormData(prev => ({ ...prev, hungerCauseContext: opt }));
                  }}
                  className={`w-full p-4 rounded-xl border text-left text-sm font-medium transition-colors ${
                    formData.hungerCauseContext === opt
                      ? 'border-[#03422A] bg-[#03422A]/5 text-[#03422A] font-semibold'
                      : 'border-stone-200 hover:bg-stone-50 text-stone-800'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>

            {stepError && (
              <p className="text-xs text-rose-700 font-medium flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{stepError}</span>
              </p>
            )}

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => goTo(12)}
                className="px-5 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!formData.hungerCauseContext.trim()) {
                    setStepError('Escolha a opção que melhor descreve o contexto da sua fome.');
                    return;
                  }
                  goTo(14);
                }}
                className="px-6 py-2.5 rounded-xl bg-[#03422A] hover:bg-[#02311F] text-white text-xs font-semibold"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* ETAPA 14 — PAN: O que fez abandonar dietas anteriores */}
        {currentStep === 14 && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-[#03422A]">Plano de Ação (PAN · 1 de 3)</span>
              <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-stone-900">
                O que mais fez você abandonar dietas anteriores?
              </h2>
            </div>

            <div className="space-y-2.5">
              {[
                'Cortaram alimentos que gosto (arroz, feijão, pão) e senti fraqueza.',
                'Fome forte no fim da tarde ou à noite por intervalos longos sem comer.',
                'Receitas caras, demoradas ou itens que estragavam sem geladeira.',
                'Exageros no fim de semana seguidos de desistência na segunda-feira.'
              ].map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    setStepError(null);
                    setFormData(prev => ({ ...prev, previousAttempts: opt }));
                  }}
                  className={`w-full p-4 rounded-xl border text-left text-sm font-medium transition-colors ${
                    formData.previousAttempts === opt
                      ? 'border-[#03422A] bg-[#03422A]/5 text-[#03422A] font-semibold'
                      : 'border-stone-200 hover:bg-stone-50 text-stone-800'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>

            {stepError && (
              <p className="text-xs text-rose-700 font-medium flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{stepError}</span>
              </p>
            )}

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => goTo(13)}
                className="px-5 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!formData.previousAttempts.trim()) {
                    setStepError('Selecione uma das opções para evitar repetirmos erros de dietas antigas.');
                    return;
                  }
                  goTo(15);
                }}
                className="px-6 py-2.5 rounded-xl bg-[#03422A] hover:bg-[#02311F] text-white text-xs font-semibold"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* ETAPA 15 — PAN: O que tornaria o plano difícil */}
        {currentStep === 15 && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-[#03422A]">Plano de Ação (PAN · 2 de 3)</span>
              <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-stone-900">
                O que tornaria este plano difícil na sua rotina?
              </h2>
            </div>

            <div className="space-y-2.5">
              {[
                'Ter que comer de 3 em 3 horas ou preparar pratos complicados no trabalho.',
                'Ingredientes caros, suplementos ou itens fora da minha realidade.',
                'Proibição rígida em almoços de família ou fins de semana.',
                'Depender de geladeira ou micro-ondas quando passo o dia na rua.'
              ].map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    setStepError(null);
                    setFormData(prev => ({ ...prev, whatWouldMakeHard: opt }));
                  }}
                  className={`w-full p-4 rounded-xl border text-left text-sm font-medium transition-colors ${
                    formData.whatWouldMakeHard === opt
                      ? 'border-[#03422A] bg-[#03422A]/5 text-[#03422A] font-semibold'
                      : 'border-stone-200 hover:bg-stone-50 text-stone-800'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>

            {stepError && (
              <p className="text-xs text-rose-700 font-medium flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{stepError}</span>
              </p>
            )}

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => goTo(14)}
                className="px-5 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!formData.whatWouldMakeHard.trim()) {
                    setStepError('Escolha o ponto que mais atrapalharia sua adesão.');
                    return;
                  }
                  goTo(16);
                }}
                className="px-6 py-2.5 rounded-xl bg-[#03422A] hover:bg-[#02311F] text-white text-xs font-semibold"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* ETAPA 16 — PAN: Mudança realista da Semana 1 */}
        {currentStep === 16 && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-[#03422A]">Plano de Ação (PAN · 3 de 3)</span>
              <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-stone-900">
                Qual mudança realista você consegue começar já nesta semana?
              </h2>
            </div>

            <div className="space-y-2.5">
              {[
                'Organizar um lanche prático 2h30 antes do meu pico de fome.',
                'Garantir proteína + fibra no almoço e jantar sem cortar arroz e feijão.',
                'Cumprir os 4 períodos de água ao longo do dia.',
                'Usar as medidas caseiras e a regra da metade (½ + ½) sem exageros.'
              ].map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    setStepError(null);
                    setFormData(prev => ({ ...prev, firstWeekChange: opt }));
                  }}
                  className={`w-full p-4 rounded-xl border text-left text-sm font-medium transition-colors ${
                    formData.firstWeekChange === opt
                      ? 'border-[#03422A] bg-[#03422A]/5 text-[#03422A] font-semibold'
                      : 'border-stone-200 hover:bg-stone-50 text-stone-800'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>

            {stepError && (
              <p className="text-xs text-rose-700 font-medium flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{stepError}</span>
              </p>
            )}

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => goTo(15)}
                className="px-5 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!formData.firstWeekChange.trim()) {
                    setStepError('Escolha seu compromisso prático para a Semana 1.');
                    return;
                  }
                  goTo(17);
                }}
                className="px-6 py-2.5 rounded-xl bg-[#03422A] hover:bg-[#02311F] text-white text-xs font-semibold"
              >
                Revisar e finalizar
              </button>
            </div>
          </div>
        )}

        {/* ETAPA 17 — 100% REVISÃO FINAL & ENVIO DEFINITIVO */}
        {currentStep === 17 && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-[#03422A]">Tudo pronto · 100%</span>
              <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-stone-900">
                Revisão final antes de gerar seu Plano Alimentar
              </h2>
              <p className="text-sm text-stone-600">
                Confira o resumo combinado do seu Mapeamento Inicial + respostas finais abaixo.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#F9F8F4] border border-stone-200 text-xs space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <strong className="text-stone-900">Dados do Mapeamento Inicial</strong>
                <button
                  type="button"
                  onClick={() => setShowCustomMeasuresEdit(!showCustomMeasuresEdit)}
                  className="text-[#03422A] font-semibold hover:underline"
                >
                  {showCustomMeasuresEdit ? 'Fechar edição' : 'Ajustar medidas'}
                </button>
              </div>
              <p className="text-stone-700 tabular-nums">
                {formData.memberName} ({formData.email}) · {formData.age} anos · {formData.heightCm} cm · Atual:{' '}
                <strong>{formData.weightKg} kg</strong> → Meta: <strong>{formData.targetWeightKg} kg</strong>
              </p>

              {showCustomMeasuresEdit && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-stone-200">
                  <label className="space-y-1">
                    <span className="text-[11px] text-stone-600 block">Idade</span>
                    <input
                      type="number"
                      value={formData.age}
                      onChange={e => setFormData(prev => ({ ...prev, age: Number(e.target.value) || 30 }))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs bg-white tabular-nums"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[11px] text-stone-600 block">Altura (cm)</span>
                    <input
                      type="number"
                      value={formData.heightCm}
                      onChange={e => setFormData(prev => ({ ...prev, heightCm: Number(e.target.value) || 168 }))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs bg-white tabular-nums"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[11px] text-stone-600 block">Peso atual (kg)</span>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.weightKg}
                      onChange={e => setFormData(prev => ({ ...prev, weightKg: Number(e.target.value) || 75 }))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs bg-white tabular-nums"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[11px] text-stone-600 block">Meta (kg)</span>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.targetWeightKg}
                      onChange={e => setFormData(prev => ({ ...prev, targetWeightKg: Number(e.target.value) || 68 }))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs bg-white tabular-nums"
                    />
                  </label>
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl bg-[#F9F8F4] border border-stone-200 text-xs space-y-1.5 text-stone-700">
              <p>
                <strong>Cardápio:</strong> {formData.preferredMealCount} refeições/dia · Padrão{' '}
                {formData.dietaryPreference} · Econômico: {formData.budgetPriority ? 'Sim' : 'Não'}
              </p>
              <p>
                <strong>Estrutura:</strong> Geladeira fora de casa: {formData.hasFridge ? 'Sim' : 'Não'} · Turnos:{' '}
                {formData.shiftWorker ? 'Sim' : 'Não'}
              </p>
              <p>
                <strong>Alergias:</strong> {formData.allergies || 'Nenhuma'} ·{' '}
                <strong>Condições:</strong> {(formData.healthConditions || []).join(', ')}
              </p>
              <p>
                <strong>Compromisso Semana 1:</strong> {formData.firstWeekChange}
              </p>
            </div>

            {formData.emergencySymptoms && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Você marcou sinais clínicos agudos — ao confirmar, o sistema exibirá orientação prioritária de pronto atendimento médico.
                </span>
              </div>
            )}

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-start gap-2 leading-relaxed">
              <Clock className="w-4 h-4 shrink-0 mt-0.5 text-amber-800" />
              <span>
                Se houver alguma condição clínica ou pendência técnica, o caso entra automaticamente na fila do nutricionista EmagreSLIM com prazo máximo de <strong>24 horas corridas</strong>. Caso contrário, seu Plano Alimentar e PDF são liberados na hora.
              </span>
            </div>

            {stepError && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1.5">
                <p className="font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{stepError}</span>
                </p>
              </div>
            )}

            <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => goTo(16)}
                className="px-5 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50 flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Voltar</span>
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  const sanity = evaluateDataSanityLock({
                    age: formData.age,
                    heightCm: formData.heightCm,
                    weightKg: formData.weightKg,
                    targetWeightKg: formData.targetWeightKg
                  });
                  if (sanity.blocked) {
                    setStepError(`${sanity.message} (${sanity.reasons.join(' ')})`);
                    return;
                  }
                  setStepError(null);
                  onSubmitFullAssessment();
                }}
                className="px-6 py-3 rounded-xl bg-[#03422A] hover:bg-[#02311F] text-white text-xs font-semibold uppercase tracking-wide flex items-center gap-2 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <span>Gerando Plano...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>GERAR MEU PLANO ALIMENTAR & PDF</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
