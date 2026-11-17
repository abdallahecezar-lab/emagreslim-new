import React, { useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Download,
  Droplets,
  FileText,
  Flame,
  Mail,
  MessageCircle,
  ShieldAlert,
  ShieldCheck,
  Utensils
} from 'lucide-react';
import { BARRIER_EXPLANATIONS } from '../shared/catalog';
import {
  computeFreeMappingAnalysis,
  evaluateDataSanityLock,
  UNUSUAL_DATA_LOCK_MESSAGE
} from '../shared/clinicalEngine';
import type { AssessmentInput } from '../shared/types';
import { exportFreeMappingPdf } from '../utils/pdfExport';
import { WaterCupIllustration } from './PortionIllustration';

interface FreeAssessmentInteractiveProps {
  freeMappingStep: number;
  setFreeMappingStep: (step: number) => void;
  formData: AssessmentInput;
  setFormData: React.Dispatch<React.SetStateAction<AssessmentInput>>;
  onCompleteFreeMapping: () => Promise<void>;
  onBackToLanding: () => void;
  isSubmitting: boolean;
}

const PROGRESS_BY_STEP: Record<number, number> = {
  1: 7,
  2: 14,
  3: 21,
  4: 29,
  5: 36,
  6: 43,
  7: 50,
  8: 57,
  9: 64,
  10: 71,
  11: 78,
  12: 86,
  13: 93,
  14: 100
};

const DIFFICULTY_OPTIONS = [
  {
    label: 'Sinto muita fome',
    barrier: 'fome_noturna_tarde'
  },
  {
    label: 'Como demais ou sinto muita fome à noite',
    barrier: 'fome_noturna_tarde'
  },
  {
    label: 'As dietas ficam restritivas demais',
    barrier: 'restricao_abandono'
  },
  {
    label: 'Minha rotina atrapalha',
    barrier: 'custo_estrutura_preparo'
  },
  {
    label: 'Não consigo me organizar',
    barrier: 'custo_estrutura_preparo'
  },
  {
    label: 'Tenho muita vontade de doces',
    barrier: 'fome_noturna_tarde'
  },
  {
    label: 'Como mais quando estou ansioso(a) ou emotivo(a)',
    barrier: 'restricao_abandono'
  },
  {
    label: 'Desanimo quando não vejo resultado rápido',
    barrier: 'restricao_abandono'
  }
];

const WATER_OPTIONS = [
  { label: 'Menos de 500 mL', liters: 0.4 },
  { label: '500 mL–1 L', liters: 0.75 },
  { label: '1–1,5 L', liters: 1.25 },
  { label: '1,5–2 L', liters: 1.75 },
  { label: '2–3 L', liters: 2.5 },
  { label: 'Mais de 3 L', liters: 3.2 },
  { label: 'Não sei', liters: 1.2 }
];

const SAFETY_OPTIONS = [
  { key: 'nenhuma', label: 'Nenhuma dessas condições' },
  { key: 'doenca_renal', label: 'Doença renal' },
  { key: 'doenca_hepatica', label: 'Doença hepática importante' },
  { key: 'transtorno_alimentar', label: 'Transtorno alimentar atual ou histórico relevante' },
  { key: 'bariatrica', label: 'Cirurgia bariátrica' },
  { key: 'diabetes_tipo_2', label: 'Diabetes com tratamento complexo' },
  { key: 'doenca_cardiaca', label: 'Doença cardíaca importante' },
  { key: 'gravida', label: 'Estou grávida' }
];

function computeAgeFromBirthDate(birthDateStr: string): number | null {
  if (!birthDateStr) return null;
  const parsed = new Date(birthDateStr + 'T00:00:00');
  if (Number.isNaN(parsed.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - parsed.getFullYear();
  const m = today.getMonth() - parsed.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < parsed.getDate())) {
    age--;
  }
  return age >= 0 && age <= 130 ? age : null;
}

function parseDecimalInput(raw: string): number | null {
  const normalized = raw.trim().replace(',', '.');
  if (!normalized) return null;
  const num = Number(normalized);
  return Number.isFinite(num) ? num : null;
}

function formatWhatsappMask(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export const FreeAssessmentInteractive: React.FC<FreeAssessmentInteractiveProps> = ({
  freeMappingStep,
  setFreeMappingStep,
  formData,
  setFormData,
  onCompleteFreeMapping,
  onBackToLanding,
  isSubmitting
}) => {
  const step = Math.min(14, Math.max(1, freeMappingStep));
  const progressPercent = PROGRESS_BY_STEP[step] ?? 100;

  // Tudo começa em branco / sem pré-seleção para que o participante responda do zero
  const [journeyChoice, setJourneyChoice] = useState<'new_profile' | 'reassessment' | null>(null);
  const [nameStr, setNameStr] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [calculatedAge, setCalculatedAge] = useState<number | null>(null);
  const [sexChoice, setSexChoice] = useState<'feminino' | 'masculino' | null>(null);
  const [heightStr, setHeightStr] = useState('');
  const [weightStr, setWeightStr] = useState('');
  const [targetWeightStr, setTargetWeightStr] = useState('');
  const [routineChoice, setRoutineChoice] = useState<string | null>(null);
  const [exerciseChoice, setExerciseChoice] = useState<string | null>(null);
  const [attemptsChoice, setAttemptsChoice] = useState<string | null>(null);
  const [difficultyChoice, setDifficultyChoice] = useState<string | null>(null);
  const [waterChoice, setWaterChoice] = useState<string | null>(null);
  const [safetyChoices, setSafetyChoices] = useState<string[]>([]);
  const [whatsappStr, setWhatsappStr] = useState('');
  const [emailStr, setEmailStr] = useState('');

  const [stepError, setStepError] = useState<string | null>(null);
  const [showPregnancyIneligible, setShowPregnancyIneligible] = useState(false);
  const [unusualDataState, setUnusualDataState] = useState<{
    returnStep: number;
    reasons: string[];
  } | null>(null);
  const [contactConfirmWhatsapp, setContactConfirmWhatsapp] = useState('');
  const [contactConfirmSending, setContactConfirmSending] = useState(false);
  const [contactConfirmDone, setContactConfirmDone] = useState(false);
  const [contactConfirmError, setContactConfirmError] = useState<string | null>(null);

  const goToStep = (nextStep: number) => {
    setStepError(null);
    setFreeMappingStep(nextStep);
  };

  const toggleSafetyChoice = (key: string) => {
    setStepError(null);
    setSafetyChoices(prev => {
      if (key === 'nenhuma') return ['nenhuma'];
      const withoutNone = prev.filter(k => k !== 'nenhuma');
      const exists = withoutNone.includes(key);
      return exists ? withoutNone.filter(k => k !== key) : [...withoutNone, key];
    });
  };

  const applySafetyAndContinue = () => {
    if (safetyChoices.length === 0) {
      setStepError('Selecione ao menos uma opção (ou "Nenhuma dessas condições") para continuar.');
      return;
    }

    const isPregnant = safetyChoices.includes('gravida');
    const isBariatric = safetyChoices.includes('bariatrica');
    const hasEatingHistory = safetyChoices.includes('transtorno_alimentar');
    const mappedConditions = safetyChoices.filter(
      k => !['nenhuma', 'gravida', 'bariatrica', 'transtorno_alimentar'].includes(k)
    );

    setFormData(prev => ({
      ...prev,
      pregnantOrBreastfeeding: isPregnant,
      bariatricHistory: isBariatric,
      lossOfControlFrequency: hasEatingHistory ? 'semanal_com_sofrimento' : 'nunca_raramente',
      healthConditions: mappedConditions.length > 0 ? mappedConditions : ['nenhuma']
    }));

    if (isPregnant) {
      setStepError(null);
      setShowPregnancyIneligible(true);
      return;
    }

    setShowPregnancyIneligible(false);
    goToStep(14);
  };

  const handleStep14Submit = async () => {
    const whatsappDigits = whatsappStr.replace(/\D/g, '');
    if (whatsappDigits.length < 10) {
      setStepError('Informe seu WhatsApp com DDD (ex.: (11) 99999-9999).');
      return;
    }
    const cleanEmail = emailStr.trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setStepError('Informe um endereço de e-mail válido para receber seu Mapeamento.');
      return;
    }

    const sanity = evaluateDataSanityLock({
      age: formData.age,
      heightCm: formData.heightCm,
      weightKg: formData.weightKg,
      targetWeightKg: formData.targetWeightKg
    });
    if (sanity.blocked) {
      setContactConfirmDone(false);
      setContactConfirmError(null);
      setContactConfirmWhatsapp(whatsappStr);
      setUnusualDataState({ returnStep: 7, reasons: sanity.reasons });
      return;
    }

    setStepError(null);
    await onCompleteFreeMapping();
  };

  const handleRequestTeamVerification = async () => {
    const phoneToUse = (contactConfirmWhatsapp || whatsappStr).trim();
    const fallbackName = nameStr.trim() || formData.memberName || 'Visitante';
    if (phoneToUse.replace(/\D/g, '').length < 10) {
      setContactConfirmError('Informe um WhatsApp com DDD válido para nossa equipe confirmar com você.');
      return;
    }
    setContactConfirmError(null);
    setContactConfirmSending(true);
    try {
      const res = await fetch('/api/unusual-data-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberName: fallbackName,
          whatsapp: phoneToUse,
          reasons: unusualDataState?.reasons || []
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setContactConfirmError(data.error || 'Não foi possível registrar seu contato.');
        return;
      }
      setContactConfirmDone(true);
    } catch {
      setContactConfirmError('Erro de conexão ao registrar pedido de confirmação.');
    } finally {
      setContactConfirmSending(false);
    }
  };

  if (unusualDataState) {
    return (
      <section className="max-w-2xl mx-auto bg-white border border-stone-200 rounded-2xl p-8 sm:p-10 space-y-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-amber-800 text-xs font-semibold">
            <ShieldAlert className="w-4 h-4" />
            <span>Trava de Segurança · Verificação de Dados</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-stone-900">
            Seus dados apresentam algumas características incomuns
          </h2>
          <p className="text-sm text-stone-700 leading-relaxed">
            {UNUSUAL_DATA_LOCK_MESSAGE}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2 text-xs text-amber-950">
          <p className="font-semibold">O que identificamos para conferência:</p>
          <ul className="list-disc pl-5 space-y-1 leading-relaxed">
            {unusualDataState.reasons.map((reason, idx) => (
              <li key={idx}>{reason}</li>
            ))}
          </ul>
        </div>

        <div className="p-4 rounded-xl bg-[#F9F8F4] border border-stone-200 text-xs text-stone-700 leading-relaxed">
          Por segurança clínica, <strong>nenhuma estimativa gratuita, cálculo calórico ou PDF foi gerado</strong> com esses valores. Caso tenha ocorrido algum erro de digitação, você pode voltar e corrigir agora mesmo.
        </div>

        <div className="p-4 rounded-xl border border-stone-200 space-y-3">
          <p className="text-xs font-semibold text-stone-900">
            Se esses dados estiverem realmente corretos, deixe seu WhatsApp para nossa equipe confirmar:
          </p>
          {contactConfirmDone ? (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                Contato registrado! Nossa equipe técnica entrará em contato pelo WhatsApp informado para confirmar suas medidas com segurança.
              </span>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="tel"
                inputMode="tel"
                value={contactConfirmWhatsapp}
                onChange={e => {
                  setContactConfirmError(null);
                  setContactConfirmWhatsapp(formatWhatsappMask(e.target.value));
                }}
                placeholder="(11) 99999-9999"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs tabular-nums text-stone-900 focus:outline-none focus:border-[#03422A]"
              />
              <button
                type="button"
                disabled={contactConfirmSending}
                onClick={handleRequestTeamVerification}
                className="px-4 py-2.5 rounded-xl border border-[#03422A] text-[#03422A] hover:bg-[#03422A]/5 text-xs font-semibold disabled:opacity-60"
              >
                {contactConfirmSending ? 'Enviando...' : 'Solicitar confirmação da equipe'}
              </button>
            </div>
          )}
          {contactConfirmError && (
            <p className="text-xs text-rose-700 font-medium">{contactConfirmError}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-200">
          <button
            type="button"
            onClick={() => {
              const target = unusualDataState.returnStep;
              setUnusualDataState(null);
              goToStep(target);
            }}
            className="px-5 py-2.5 rounded-xl bg-[#03422A] hover:bg-[#02311F] text-white text-xs font-semibold"
          >
            Revisar e corrigir dados
          </button>
          <button
            type="button"
            onClick={() => {
              setUnusualDataState(null);
              onBackToLanding();
            }}
            className="px-4 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-50"
          >
            Voltar à página inicial
          </button>
        </div>
      </section>
    );
  }

  if (showPregnancyIneligible) {
    return (
      <section className="max-w-2xl mx-auto bg-white border border-stone-200 rounded-xl p-8 sm:p-10 space-y-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-rose-800 text-xs font-semibold">
            <ShieldAlert className="w-4 h-4" />
            <span>Critério de Segurança Gestacional</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-stone-900">
            O EmagreSLIM não é indicado para você neste momento
          </h2>
          <p className="text-sm text-stone-700 leading-relaxed">
            Como você informou estar <strong>grávida</strong>, precisamos ser transparentes: o método EmagreSLIM é estruturado para estratégias de emagrecimento e déficit calórico, o que <strong>não é adequado durante a gestação</strong>.
          </p>
          <p className="text-sm text-stone-600 leading-relaxed">
            Nessa fase, as necessidades nutricionais são específicas para o desenvolvimento saudável do bebê e da gestante e devem ser conduzidas exclusivamente em consulta presencial junto ao seu pré-natal e obstetra.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 leading-relaxed">
          Não avançaremos com oferta paga nem geração de plano de emagrecimento para gestantes. Se marcou esta opção por engano, você pode voltar e corrigir sua resposta abaixo.
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-200">
          <button
            type="button"
            onClick={() => {
              setShowPregnancyIneligible(false);
              goToStep(13);
            }}
            className="px-4 py-2.5 rounded-lg border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-50"
          >
            Corrigir resposta anterior
          </button>
          <button
            type="button"
            onClick={onBackToLanding}
            className="px-5 py-2.5 rounded-lg bg-[#03422A] text-white text-xs font-semibold hover:bg-[#02311F]"
          >
            Voltar à página inicial
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-2xl mx-auto space-y-5">
      {/* Barra superior limpa */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-stone-600 tabular-nums">
          <span>Construindo seu Perfil Nutricional</span>
          <span className="font-semibold text-stone-800">{progressPercent}%</span>
        </div>
        <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-[#03422A] to-[#73AF04] transition-all duration-200"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Card central focado — 1 pergunta por etapa, zero pré-seleção */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-10 shadow-xs space-y-6">
        {/* ETAPA 1 — 7% */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-[#03422A]">Antes de começar</span>
              <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-stone-900">
                É sua primeira vez no EmagreSLIM?
              </h2>
              <p className="text-sm text-stone-600">
                Queremos criar um novo Perfil Nutricional ou continuar sua jornada.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { key: 'new_profile' as const, label: 'Sim, é minha primeira vez' },
                { key: 'reassessment' as const, label: 'Não, já tenho um Perfil Nutricional' }
              ].map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    setStepError(null);
                    setJourneyChoice(opt.key);
                    setFormData(prev => ({ ...prev, journeyType: opt.key }));
                  }}
                  className={`w-full p-4 rounded-xl border text-left text-sm font-medium transition-colors ${
                    journeyChoice === opt.key
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
                onClick={onBackToLanding}
                className="px-5 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!journeyChoice) {
                    setStepError('Escolha uma das opções acima para continuar.');
                    return;
                  }
                  goToStep(2);
                }}
                className="px-6 py-2.5 rounded-xl bg-[#03422A] hover:bg-[#02311F] text-white text-xs font-semibold"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* ETAPA 2 — 14% */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-[#03422A]">Conhecendo você</span>
              <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-stone-900">
                Como podemos chamar você?
              </h2>
              <p className="text-sm text-stone-600">
                Usaremos seu nome para personalizar seu Mapeamento.
              </p>
            </div>

            <input
              type="text"
              value={nameStr}
              onChange={e => {
                const val = e.target.value;
                setStepError(null);
                setNameStr(val);
                setFormData(prev => ({ ...prev, memberName: val.trim() }));
              }}
              placeholder="Digite seu primeiro nome"
              className="w-full px-4 py-3.5 rounded-xl border border-stone-200 text-sm text-stone-900 focus:outline-none focus:border-[#03422A]"
            />

            {stepError && (
              <p className="text-xs text-rose-700 font-medium flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{stepError}</span>
              </p>
            )}

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => goToStep(1)}
                className="px-5 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (nameStr.trim().length < 2) {
                    setStepError('Digite seu nome (mínimo 2 letras) para personalizar sua análise.');
                    return;
                  }
                  setFormData(prev => ({ ...prev, memberName: nameStr.trim() }));
                  goToStep(3);
                }}
                className="px-6 py-2.5 rounded-xl bg-[#03422A] hover:bg-[#02311F] text-white text-xs font-semibold"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* ETAPA 3 — 21% */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-[#03422A]">Conhecendo você</span>
              <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-stone-900">
                Qual é sua data de nascimento?
              </h2>
              <p className="text-sm text-stone-600">
                A idade é uma das informações utilizadas para estimarmos suas necessidades energéticas.
              </p>
            </div>

            <div className="space-y-2">
              <input
                type="date"
                value={birthDate}
                onChange={e => {
                  const val = e.target.value;
                  setStepError(null);
                  setBirthDate(val);
                  const computed = computeAgeFromBirthDate(val);
                  setCalculatedAge(computed);
                  if (computed !== null) {
                    setFormData(prev => ({ ...prev, age: computed }));
                  }
                }}
                className="w-full px-4 py-3.5 rounded-xl border border-stone-200 text-sm text-stone-900 tabular-nums focus:outline-none focus:border-[#03422A]"
              />
              {calculatedAge !== null && (
                <p className="text-xs text-stone-500 tabular-nums">
                  Idade calculada: <strong>{calculatedAge} anos</strong>
                </p>
              )}
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
                onClick={() => goToStep(2)}
                className="px-5 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => {
                  const computed = computeAgeFromBirthDate(birthDate);
                  if (computed === null) {
                    setStepError('Informe uma data de nascimento válida.');
                    return;
                  }
                  setFormData(prev => ({ ...prev, age: computed }));
                  const sanity = evaluateDataSanityLock({ age: computed });
                  if (sanity.blocked) {
                    setContactConfirmDone(false);
                    setContactConfirmError(null);
                    setContactConfirmWhatsapp(whatsappStr);
                    setUnusualDataState({ returnStep: 3, reasons: sanity.reasons });
                    return;
                  }
                  goToStep(4);
                }}
                className="px-6 py-2.5 rounded-xl bg-[#03422A] hover:bg-[#02311F] text-white text-xs font-semibold"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* ETAPA 4 — 29% */}
        {step === 4 && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-[#03422A]">Conhecendo você</span>
              <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-stone-900">
                Qual é seu sexo biológico?
              </h2>
              <p className="text-sm text-stone-600">
                Essa informação participa das equações utilizadas para estimar suas necessidades energéticas.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { key: 'feminino' as const, label: 'Feminino' },
                { key: 'masculino' as const, label: 'Masculino' }
              ].map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    setStepError(null);
                    setSexChoice(opt.key);
                    setFormData(prev => ({ ...prev, sex: opt.key }));
                  }}
                  className={`w-full p-4 rounded-xl border text-left text-sm font-medium transition-colors ${
                    sexChoice === opt.key
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
                onClick={() => goToStep(3)}
                className="px-5 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!sexChoice) {
                    setStepError('Selecione uma opção para calcular corretamente seu gasto calórico.');
                    return;
                  }
                  goToStep(5);
                }}
                className="px-6 py-2.5 rounded-xl bg-[#03422A] hover:bg-[#02311F] text-white text-xs font-semibold"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* ETAPA 5 — 36% (Sem bug de zero à frente) */}
        {step === 5 && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-[#03422A]">Seu ponto de partida</span>
              <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-stone-900">
                Qual é sua altura?
              </h2>
              <p className="text-sm text-stone-600">Informe sua altura em centímetros.</p>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                inputMode="numeric"
                value={heightStr}
                onChange={e => {
                  const cleaned = e.target.value.replace(/[^\d]/g, '').slice(0, 4);
                  setStepError(null);
                  setHeightStr(cleaned);
                  const parsed = parseDecimalInput(cleaned);
                  if (parsed !== null && parsed > 0) {
                    setFormData(prev => ({ ...prev, heightCm: parsed }));
                  }
                }}
                placeholder="Ex.: 170"
                className="w-full px-4 py-3.5 rounded-xl border border-stone-200 text-sm tabular-nums text-stone-900 focus:outline-none focus:border-[#03422A]"
              />
              <p className="text-xs text-stone-500">
                Se você mede 1,70 m, digite <strong>170</strong>.
              </p>
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
                onClick={() => goToStep(4)}
                className="px-5 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => {
                  const parsed = parseDecimalInput(heightStr);
                  if (parsed === null || parsed <= 0) {
                    setStepError('Digite sua altura em centímetros (ex.: 168).');
                    return;
                  }
                  setFormData(prev => ({ ...prev, heightCm: parsed }));
                  const sanity = evaluateDataSanityLock({
                    age: formData.age,
                    heightCm: parsed
                  });
                  if (sanity.blocked) {
                    setContactConfirmDone(false);
                    setContactConfirmError(null);
                    setContactConfirmWhatsapp(whatsappStr);
                    setUnusualDataState({ returnStep: 5, reasons: sanity.reasons });
                    return;
                  }
                  goToStep(6);
                }}
                className="px-6 py-2.5 rounded-xl bg-[#03422A] hover:bg-[#02311F] text-white text-xs font-semibold"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* ETAPA 6 — 43% (Texto decimal pt-BR sem zero automático) */}
        {step === 6 && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-[#03422A]">Seu ponto de partida</span>
              <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-stone-900">
                Qual foi seu último peso medido?
              </h2>
              <p className="text-sm text-stone-600">Use um peso recente sempre que possível (em kg).</p>
            </div>

            <input
              type="text"
              inputMode="decimal"
              value={weightStr}
              onChange={e => {
                const cleaned = e.target.value.replace(/[^\d.,]/g, '').slice(0, 7);
                setStepError(null);
                setWeightStr(cleaned);
                const parsed = parseDecimalInput(cleaned);
                if (parsed !== null && parsed > 0) {
                  setFormData(prev => ({ ...prev, weightKg: parsed }));
                }
              }}
              placeholder="Ex.: 90,5"
              className="w-full px-4 py-3.5 rounded-xl border border-stone-200 text-sm tabular-nums text-stone-900 focus:outline-none focus:border-[#03422A]"
            />

            {stepError && (
              <p className="text-xs text-rose-700 font-medium flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{stepError}</span>
              </p>
            )}

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => goToStep(5)}
                className="px-5 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => {
                  const parsed = parseDecimalInput(weightStr);
                  if (parsed === null || parsed <= 0) {
                    setStepError('Digite seu peso atual em kg (ex.: 90,5).');
                    return;
                  }
                  setFormData(prev => ({ ...prev, weightKg: parsed }));
                  const sanity = evaluateDataSanityLock({
                    age: formData.age,
                    heightCm: formData.heightCm,
                    weightKg: parsed
                  });
                  if (sanity.blocked) {
                    setContactConfirmDone(false);
                    setContactConfirmError(null);
                    setContactConfirmWhatsapp(whatsappStr);
                    setUnusualDataState({ returnStep: 6, reasons: sanity.reasons });
                    return;
                  }
                  goToStep(7);
                }}
                className="px-6 py-2.5 rounded-xl bg-[#03422A] hover:bg-[#02311F] text-white text-xs font-semibold"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* ETAPA 7 — 50% */}
        {step === 7 && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-[#03422A]">Seu objetivo</span>
              <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-stone-900">
                Qual peso você gostaria de alcançar?
              </h2>
              <p className="text-sm text-stone-600">
                Vamos considerar esse valor como sua meta final para estimar um prazo realista — nunca como promessa imediata.
              </p>
            </div>

            <input
              type="text"
              inputMode="decimal"
              value={targetWeightStr}
              onChange={e => {
                const cleaned = e.target.value.replace(/[^\d.,]/g, '').slice(0, 7);
                setStepError(null);
                setTargetWeightStr(cleaned);
                const parsed = parseDecimalInput(cleaned);
                if (parsed !== null && parsed > 0) {
                  setFormData(prev => ({ ...prev, targetWeightKg: parsed }));
                }
              }}
              placeholder="Ex.: 78"
              className="w-full px-4 py-3.5 rounded-xl border border-stone-200 text-sm tabular-nums text-stone-900 focus:outline-none focus:border-[#03422A]"
            />

            {stepError && (
              <p className="text-xs text-rose-700 font-medium flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{stepError}</span>
              </p>
            )}

            <div className="p-4 rounded-xl bg-[#03422A]/5 border border-[#03422A]/20 text-xs space-y-1">
              <p className="font-semibold text-[#03422A]">Mais um passo concluído.</p>
              <p className="text-stone-600 leading-relaxed">
                Já entendemos seu objetivo e seu ponto de partida. Agora vamos conhecer sua rotina para tornar sua estratégia mais realista.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => goToStep(6)}
                className="px-5 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => {
                  const parsed = parseDecimalInput(targetWeightStr);
                  if (parsed === null || parsed <= 0) {
                    setStepError('Digite sua meta de peso em kg (ex.: 78).');
                    return;
                  }
                  setFormData(prev => ({ ...prev, targetWeightKg: parsed }));
                  const sanity = evaluateDataSanityLock({
                    age: formData.age,
                    heightCm: formData.heightCm,
                    weightKg: formData.weightKg,
                    targetWeightKg: parsed
                  });
                  if (sanity.blocked) {
                    setContactConfirmDone(false);
                    setContactConfirmError(null);
                    setContactConfirmWhatsapp(whatsappStr);
                    setUnusualDataState({ returnStep: 7, reasons: sanity.reasons });
                    return;
                  }
                  goToStep(8);
                }}
                className="px-6 py-2.5 rounded-xl bg-[#03422A] hover:bg-[#02311F] text-white text-xs font-semibold"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* ETAPA 8 — 57% */}
        {step === 8 && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-[#03422A]">Sua rotina</span>
              <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-stone-900">
                Como é a maior parte do seu dia?
              </h2>
              <p className="text-sm text-stone-600">
                Não precisamos saber sua profissão. Queremos entender quanto você realmente se movimenta.
              </p>
            </div>

            <div className="space-y-2.5">
              {[
                {
                  key: 'sentado',
                  label: 'Passo a maior parte do tempo sentado(a)',
                  work: 'sentado_escritorio' as const
                },
                {
                  key: 'em_pe_leve',
                  label: 'Fico em pé e caminho algumas vezes durante o dia',
                  work: 'moderado_em_pe' as const
                },
                {
                  key: 'caminho_bastante',
                  label: 'Caminho bastante durante o dia',
                  work: 'moderado_em_pe' as const
                },
                {
                  key: 'intenso',
                  label: 'Meu trabalho exige esforço físico frequente',
                  work: 'intenso_fisico' as const
                }
              ].map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    setStepError(null);
                    setRoutineChoice(opt.key);
                    setFormData(prev => ({ ...prev, workActivityLevel: opt.work }));
                  }}
                  className={`w-full p-4 rounded-xl border text-left text-sm font-medium transition-colors ${
                    routineChoice === opt.key
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
                onClick={() => goToStep(7)}
                className="px-5 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!routineChoice) {
                    setStepError('Selecione como é a maior parte do seu dia.');
                    return;
                  }
                  goToStep(9);
                }}
                className="px-6 py-2.5 rounded-xl bg-[#03422A] hover:bg-[#02311F] text-white text-xs font-semibold"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* ETAPA 9 — 64% */}
        {step === 9 && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-[#03422A]">Movimento</span>
              <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-stone-900">
                Quantos dias por semana você pratica exercício por pelo menos 30 minutos?
              </h2>
            </div>

            <div className="space-y-2.5">
              {[
                { key: '0', label: 'Não pratico', mins: 0 },
                { key: '1-2', label: '1–2 dias', mins: 45 },
                { key: '3-4', label: '3–4 dias', mins: 105 },
                { key: '5+', label: '5 ou mais dias', mins: 180 }
              ].map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    setStepError(null);
                    setExerciseChoice(opt.key);
                    setFormData(prev => ({ ...prev, exerciseMinutesPerWeek: opt.mins }));
                  }}
                  className={`w-full p-4 rounded-xl border text-left text-sm font-medium transition-colors ${
                    exerciseChoice === opt.key
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
                onClick={() => goToStep(8)}
                className="px-5 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!exerciseChoice) {
                    setStepError('Selecione sua frequência atual de exercício.');
                    return;
                  }
                  goToStep(10);
                }}
                className="px-6 py-2.5 rounded-xl bg-[#03422A] hover:bg-[#02311F] text-white text-xs font-semibold"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* ETAPA 10 — 71% */}
        {step === 10 && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-[#03422A]">Sua história</span>
              <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-stone-900">
                Quantas vezes você já tentou emagrecer anteriormente?
              </h2>
              <p className="text-sm text-stone-600">
                Suas tentativas anteriores nos ajudam a evitar repetir estratégias que não funcionaram para você.
              </p>
            </div>

            <div className="space-y-2.5">
              {['Nunca tentei de verdade', '1–2 vezes', '3–5 vezes', 'Já perdi as contas'].map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    setStepError(null);
                    setAttemptsChoice(opt);
                  }}
                  className={`w-full p-4 rounded-xl border text-left text-sm font-medium transition-colors ${
                    attemptsChoice === opt
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
                onClick={() => goToStep(9)}
                className="px-5 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!attemptsChoice) {
                    setStepError('Selecione uma das opções acima para continuar.');
                    return;
                  }
                  goToStep(11);
                }}
                className="px-6 py-2.5 rounded-xl bg-[#03422A] hover:bg-[#02311F] text-white text-xs font-semibold"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* ETAPA 11 — 78% */}
        {step === 11 && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-[#03422A]">O que mais pesa na prática</span>
              <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-stone-900">
                Qual é hoje sua maior dificuldade para emagrecer?
              </h2>
              <p className="text-sm text-stone-600">
                Essa resposta nos ajuda a pensar em uma estratégia que você tenha mais chance de conseguir seguir.
              </p>
            </div>

            <div className="space-y-2.5">
              {DIFFICULTY_OPTIONS.map(opt => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => {
                    setStepError(null);
                    setDifficultyChoice(opt.label);
                    setFormData(prev => ({
                      ...prev,
                      freePrimaryBarrier: opt.barrier
                    }));
                  }}
                  className={`w-full p-3.5 rounded-xl border text-left text-sm font-medium transition-colors ${
                    difficultyChoice === opt.label
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
                onClick={() => goToStep(10)}
                className="px-5 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!difficultyChoice) {
                    setStepError('Escolha o ponto que mais dificulta seu emagrecimento hoje.');
                    return;
                  }
                  goToStep(12);
                }}
                className="px-6 py-2.5 rounded-xl bg-[#03422A] hover:bg-[#02311F] text-white text-xs font-semibold"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* ETAPA 12 — 86% */}
        {step === 12 && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-[#03422A]">Hidratação</span>
              <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-stone-900">
                Aproximadamente quanta água você bebe por dia?
              </h2>
            </div>

            <div className="space-y-2.5">
              {WATER_OPTIONS.map(opt => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => {
                    setStepError(null);
                    setWaterChoice(opt.label);
                    setFormData(prev => ({ ...prev, waterIntakeLiters: opt.liters }));
                  }}
                  className={`w-full p-3.5 rounded-xl border text-left text-sm font-medium transition-colors ${
                    waterChoice === opt.label
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
                onClick={() => goToStep(11)}
                className="px-5 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!waterChoice) {
                    setStepError('Selecione quanto de água você costuma beber por dia.');
                    return;
                  }
                  goToStep(13);
                }}
                className="px-6 py-2.5 rounded-xl bg-[#03422A] hover:bg-[#02311F] text-white text-xs font-semibold"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* ETAPA 13 — 93% (SEGURANÇA + REGRA EXPLÍCITA DE GESTAÇÃO) */}
        {step === 13 && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-[#03422A]">Segurança</span>
              <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-stone-900">
                Existe alguma condição que precisamos considerar?
              </h2>
              <p className="text-sm text-stone-600">
                Se houver, seu Mapeamento continua, mas algumas recomendações podem precisar de uma análise mais cuidadosa.
              </p>
            </div>

            <div className="space-y-2.5">
              {SAFETY_OPTIONS.map(opt => {
                const selected = safetyChoices.includes(opt.key);
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => toggleSafetyChoice(opt.key)}
                    className={`w-full p-3.5 rounded-xl border text-left text-sm font-medium transition-colors ${
                      selected
                        ? opt.key === 'gravida'
                          ? 'border-rose-400 bg-rose-50 text-rose-900 font-semibold'
                          : 'border-[#03422A] bg-[#03422A]/5 text-[#03422A] font-semibold'
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
                onClick={() => goToStep(12)}
                className="px-5 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={applySafetyAndContinue}
                className="px-6 py-2.5 rounded-xl bg-[#03422A] hover:bg-[#02311F] text-white text-xs font-semibold"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* ETAPA 14 — 100% (WHATSAPP + E-MAIL) */}
        {step === 14 && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-[#03422A]">Seu Mapeamento está quase pronto</span>
              <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-stone-900">
                Para onde devemos enviar seu Mapeamento?
              </h2>
              <p className="text-sm text-stone-600">
                Informe seu WhatsApp com DDD e seu melhor e-mail para liberar sua análise completa gratuita e o download em PDF.
              </p>
            </div>

            <div className="space-y-4">
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5 text-[#03422A]" />
                  <span>WhatsApp com DDD</span>
                </span>
                <input
                  type="tel"
                  inputMode="tel"
                  value={whatsappStr}
                  onChange={e => {
                    const formatted = formatWhatsappMask(e.target.value);
                    setStepError(null);
                    setWhatsappStr(formatted);
                    setFormData(prev => ({ ...prev, whatsapp: formatted }));
                  }}
                  placeholder="(11) 99999-9999"
                  className="w-full px-4 py-3.5 rounded-xl border border-stone-200 text-sm tabular-nums text-stone-900 focus:outline-none focus:border-[#03422A]"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#03422A]" />
                  <span>Seu melhor e-mail</span>
                </span>
                <input
                  type="email"
                  value={emailStr}
                  onChange={e => {
                    const val = e.target.value;
                    setStepError(null);
                    setEmailStr(val);
                    setFormData(prev => ({ ...prev, email: val.trim() }));
                  }}
                  placeholder="voce@exemplo.com"
                  className="w-full px-4 py-3.5 rounded-xl border border-stone-200 text-sm text-stone-900 focus:outline-none focus:border-[#03422A]"
                />
              </label>
            </div>

            {stepError && (
              <p className="text-xs text-rose-700 font-medium flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{stepError}</span>
              </p>
            )}

            <div className="p-4 rounded-xl bg-[#03422A]/5 border border-[#03422A]/20 text-xs space-y-1">
              <p className="font-semibold text-[#03422A]">Tudo pronto para calcular sua estimativa.</p>
              <p className="text-stone-600 leading-relaxed">
                Vamos cruzar idade, altura, peso, meta, nível de atividade e hidratação para gerar sua análise gratuita com PDF para baixar.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => goToStep(13)}
                className="px-5 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleStep14Submit}
                className="px-6 py-3 rounded-xl bg-[#03422A] hover:bg-[#02311F] text-white text-xs font-semibold uppercase tracking-wide flex items-center gap-2 disabled:opacity-60"
              >
                <FileText className="w-4 h-4" />
                <span>{isSubmitting ? 'Gerando análise...' : 'VER MINHA ANÁLISE GRATUITA'}</span>
              </button>
            </div>

            <p className="text-[11px] text-stone-500 leading-relaxed">
              Seus dados são usados exclusivamente para personalizar seu Mapeamento Nutricional e enviar uma cópia do seu resultado.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

interface FreeResultOfferSectionProps {
  formData: AssessmentInput;
  onApproveCheckout: () => Promise<void>;
  isSubmitting: boolean;
}

export const FreeResultOfferSection: React.FC<FreeResultOfferSectionProps> = ({
  formData,
  onApproveCheckout,
  isSubmitting
}) => {
  const barrier = BARRIER_EXPLANATIONS[formData.freePrimaryBarrier] || BARRIER_EXPLANATIONS.fome_noturna_tarde;
  const analysis = computeFreeMappingAnalysis(formData);

  const w1 = Math.round(analysis.idealWaterMl * 0.15);
  const w2 = Math.round(analysis.idealWaterMl * 0.3);
  const w3 = Math.round(analysis.idealWaterMl * 0.35);
  const w4 = Math.max(250, analysis.idealWaterMl - w1 - w2 - w3);

  const waterPeriods = [
    { label: 'Ao acordar', ml: w1, cups: Math.max(1, Math.round(w1 / 250)) },
    { label: 'Manhã', ml: w2, cups: Math.max(1, Math.round(w2 / 250)) },
    { label: 'Tarde', ml: w3, cups: Math.max(1, Math.round(w3 / 250)) },
    { label: 'Início da noite', ml: w4, cups: Math.max(1, Math.round(w4 / 250)) }
  ];

  const practicalTips: string[] = [
    formData.freePrimaryBarrier === 'fome_noturna_tarde'
      ? 'Antecipe um lanche estruturado cerca de 2h30 antes do seu horário de maior fome (ex.: fruta + aveia ou proteína prática).'
      : 'Preserve alimentos que fazem parte da sua cultura (arroz, feijão, pão, ovo) em porções equilibradas em vez de cortes extremos.',
    formData.exerciseMinutesPerWeek === 0
      ? 'Inclua 20 a 30 minutos de caminhada leve em 3 dias desta semana para acelerar a resposta metabólica sem desgaste.'
      : 'Mantenha seus dias de treino e combine proteína em todas as refeições principais para perder gordura preservando massa magra.',
    analysis.waterGapMl > 0
      ? `Aumente gradualmente +${analysis.waterGapMl} ml/dia dividindo a água nos 4 períodos acima — isso reduz falsos sinais de fome.`
      : 'Continue fracionando seus copos de água nos 4 períodos do dia para manter saciedade e intestino regular.'
  ];

  const handleDownloadFreePdf = () => {
    exportFreeMappingPdf(formData, analysis, barrier.title, barrier.text);
  };

  return (
    <section className="space-y-8">
      {/* BLOCO 1 — VALOR REAL ANTES DE VENDER */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-10 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-stone-200 pb-6">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-[#03422A]">
              Mapeamento Inicial Gratuito · Análise Completa das Suas Respostas
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-stone-900">
              {formData.memberName}, aqui está o retrato do seu ponto de partida e caminho até os {formData.targetWeightKg} kg
            </h2>
            <p className="text-xs text-stone-500">
              Cópia vinculada a <strong className="text-stone-800">{formData.email}</strong>
              {formData.whatsapp ? (
                <>
                  {' '}
                  · WhatsApp <strong className="text-stone-800">{formData.whatsapp}</strong>
                </>
              ) : null}
            </p>
          </div>

          <button
            type="button"
            onClick={handleDownloadFreePdf}
            className="px-5 py-3 rounded-xl bg-[#03422A] hover:bg-[#02311F] text-white text-xs font-semibold flex items-center justify-center gap-2 shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Baixar Análise Gratuita (PDF)</span>
          </button>
        </div>

        {/* 1. ESTIMATIVA DE DIETA + QUANTIDADE DE AVALIAÇÕES (CONSULTAS DE AJUSTE) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-stone-900">
            <Flame className="w-4 h-4 text-[#03422A]" />
            <h3>1. Estimativa de Dieta Segura e Ciclo de Avaliações Até Sua Meta</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[#F9F8F4] border border-stone-200 space-y-1">
              <span className="text-[11px] font-medium text-stone-500">Seu Ponto de Partida</span>
              <p className="text-xl font-serif font-semibold text-stone-900 tabular-nums">
                {formData.weightKg} kg → {formData.targetWeightKg} kg
              </p>
              <p className="text-xs text-stone-600 tabular-nums">
                IMC {analysis.bmi} → {analysis.targetBmi} kg/m²
                {analysis.kgToLose > 0 ? ` (-${analysis.kgToLose} kg)` : ''}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#F9F8F4] border border-stone-200 space-y-1">
              <span className="text-[11px] font-medium text-stone-500">Gasto Energético Estimado</span>
              <p className="text-xl font-serif font-semibold text-stone-900 tabular-nums">
                ~{analysis.tdeeKcal} kcal/dia
              </p>
              <p className="text-xs text-stone-600 tabular-nums">
                Basal (Mifflin): ~{analysis.bmrKcal} kcal/dia
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#03422A]/5 border border-[#03422A]/25 space-y-1">
              <span className="text-[11px] font-semibold text-[#03422A]">Dieta Estimada Para Reduzir</span>
              <p className="text-xl font-serif font-semibold text-[#03422A] tabular-nums">
                ~{analysis.estimatedDietKcal} kcal/dia
              </p>
              <p className="text-xs text-stone-700 tabular-nums">
                Déficit moderado (~{analysis.dailyDeficitKcal} kcal/dia, sem cortes extremos)
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#03422A]/5 border border-[#03422A]/25 space-y-1">
              <span className="text-[11px] font-semibold text-[#03422A] flex items-center gap-1">
                <CalendarClock className="w-3.5 h-3.5" />
                <span>Avaliações Até a Meta</span>
              </span>
              {analysis.kgToLose > 0 ? (
                <>
                  <p className="text-xl font-serif font-semibold text-[#03422A] tabular-nums">
                    {analysis.estimatedEvaluationsMin} a {analysis.estimatedEvaluationsMax} avaliações
                  </p>
                  <p className="text-xs text-stone-700 leading-snug">
                    Ciclos de ajuste alimentar no EmagreSLIM (como consultas para recalibrar porções e evitar estagnação)
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xl font-serif font-semibold text-[#03422A]">1 avaliação</p>
                  <p className="text-xs text-stone-700">Ajuste de manutenção e preservação de massa magra.</p>
                </>
              )}
            </div>
          </div>

          {analysis.hasClinicalFlags && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 leading-relaxed">
              <strong>Atenção clínica aplicada às suas respostas:</strong> como você informou condição de saúde ou histórico bariátrico, essa faixa calórica é apenas uma estimativa educativa — no plano completo ela passa por revisão obrigatória de um nutricionista em até 24h.
            </div>
          )}
        </div>

        {/* 2. HIDRATAÇÃO + 3. ATIVIDADE FÍSICA */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Água */}
          <div className="p-6 rounded-xl bg-[#F9F8F4] border border-stone-200 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-sky-900 flex items-center gap-1.5">
                  <Droplets className="w-4 h-4 text-sky-700" />
                  <span>2. Recomendação Personalizada de Água</span>
                </span>
                <h4 className="text-lg font-serif font-semibold text-stone-900 tabular-nums">
                  Meta ideal para seu peso: {(analysis.idealWaterMl / 1000).toFixed(1)} L/dia ({analysis.idealWaterCups} copos de 250 ml)
                </h4>
              </div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed tabular-nums">
              Você relatou beber aproximadamente <strong>{analysis.currentWaterLiters} L/dia</strong>.{' '}
              {analysis.waterGapMl > 0
                ? `Para alcançar seus 35 ml/kg (${analysis.idealWaterMl} ml), vale acrescentar cerca de +${analysis.waterGapMl} ml ao longo do dia.`
                : 'Seu consumo atual já está muito próximo do ideal para o seu peso!'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {waterPeriods.map(p => (
                <div key={p.label} className="p-3 rounded-lg bg-white border border-stone-200 space-y-1.5">
                  <span className="text-xs font-semibold text-stone-800 block">{p.label}</span>
                  <WaterCupIllustration cupsCount={p.cups} mlAmount={p.ml} />
                </div>
              ))}
            </div>
          </div>

          {/* Atividade Física + Barreira */}
          <div className="space-y-4">
            <div className="p-6 rounded-xl bg-[#F9F8F4] border border-stone-200 space-y-2.5">
              <span className="text-xs font-semibold text-[#03422A] flex items-center gap-1.5">
                <Activity className="w-4 h-4" />
                <span>3. Estímulo ao Movimento Para o Seu Nível Atual</span>
              </span>
              <h4 className="text-lg font-serif font-semibold text-stone-900">
                {analysis.exerciseRecommendationTitle}
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                {analysis.exerciseRecommendationDetail}
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#F9F8F4] border border-stone-200 space-y-2">
              <span className="text-xs font-semibold text-[#03422A]">
                4. Principal Barreira Identificada na Sua Rotina
              </span>
              <h4 className="text-lg font-serif font-semibold text-stone-900">{barrier.title}</h4>
              <p className="text-xs text-stone-600 leading-relaxed">{barrier.text}</p>
            </div>
          </div>
        </div>

        {/* 3 PASSOS PRÁTICOS + BOTÃO PDF */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-stone-900">
            3 ajustes práticos para você começar ainda esta semana (sem precisar comprar nada agora):
          </h4>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-stone-700">
            {practicalTips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2.5 p-4 rounded-xl bg-[#F9F8F4] border border-stone-200">
                <CheckCircle2 className="w-4 h-4 text-[#03422A] shrink-0 mt-0.5" />
                <span className="leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-stone-200">
          <p className="text-xs text-stone-500 leading-relaxed max-w-2xl">
            <strong>Nota clínica:</strong> esta análise gratuita organiza sua estimativa metabólica, ciclos de ajuste alimentar, hidratação e barreira de adesão. Ela não substitui consulta presencial nem constitui prescrição médica.
          </p>
          <button
            type="button"
            onClick={handleDownloadFreePdf}
            className="px-5 py-2.5 rounded-xl border border-[#03422A] text-[#03422A] hover:bg-[#03422A]/5 text-xs font-semibold flex items-center justify-center gap-2 shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Salvar Mapeamento em PDF</span>
          </button>
        </div>
      </div>

      {/* BLOCO 2 — PRÓXIMO PASSO (OFERTA CONSULTIVA APÓS ENTREGAR VALOR) */}
      <div className="bg-[#03422A] text-white rounded-2xl p-6 sm:p-10 space-y-6">
        <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-3 border-b border-emerald-800 pb-4">
          <div className="space-y-1">
            <span className="text-xs font-medium text-emerald-200">
              Próximo Passo Opcional · Avaliação Completa EmagreSLIM
            </span>
            <h3 className="text-2xl font-serif font-semibold leading-snug">
              Quer receber a dieta completa de ~{analysis.estimatedDietKcal} kcal/dia já montada com suas refeições, porções ilustradas e substituições?
            </h3>
          </div>
          <span className="text-3xl font-serif font-semibold tabular-nums shrink-0">R$ 67,90</span>
        </div>

        <p className="text-sm text-emerald-100/90 leading-relaxed max-w-3xl">
          Tudo o que você já respondeu no Mapeamento Inicial continua salvo (sem repetir perguntas). Na sequência, você responde apenas os ajustes finais no mesmo formato etapa por etapa e libera na tela e em PDF:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs sm:text-sm">
          <div className="p-4 rounded-xl bg-white/10 border border-emerald-700/60 flex items-start gap-3">
            <FileText className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">1. Relatório Científico + PAN</p>
              <p className="text-xs text-emerald-100/80 mt-1">
                Memorial completo (Mifflin-St Jeor + DRI 2023) e acordo prático da Semana 1 em 7 eixos.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/10 border border-emerald-700/60 flex items-start gap-3">
            <Utensils className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">2. Cardápio na Sua Rotina (3 a 6 refeições)</p>
              <p className="text-xs text-emerald-100/80 mt-1">
                Alimentos TACO/IBGE com ilustrações de porções, Regra da Metade (½ + ½) e lista de substituições.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/10 border border-emerald-700/60 flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">3. Triagem Clínica & PDF Completo</p>
              <p className="text-xs text-emerald-100/80 mt-1">
                Se houver condição clínica ou bariátrica, vai automaticamente para validação do nutricionista em até 24h.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <p className="text-[11px] text-emerald-200/85">
            Pagamento único · Garantia de segurança clínica · Download imediato em PDF após conclusão.
          </p>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onApproveCheckout}
            className="px-7 py-3.5 rounded-xl bg-white text-[#03422A] hover:bg-emerald-50 text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60 shrink-0"
          >
            <CreditCard className="w-4 h-4" />
            <span>
              {isSubmitting ? 'Processando...' : 'Destravar Plano Alimentar Completo (R$ 67,90)'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
