import React, { useState } from 'react';
import {
  ArrowRightLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Compass,
  Download,
  FileText,
  Lock,
  Mail,
  Send,
  ShieldAlert,
  Utensils
} from 'lucide-react';
import { PRESET_SCENARIOS } from '../shared/catalog';
import type { AssessmentInput, AssessmentRecord } from '../shared/types';
import { exportAssessmentPlanPdf } from '../utils/pdfExport';
import { DietDeliverableSection } from './DietDeliverableSection';
import { FreeAssessmentInteractive, FreeResultOfferSection } from './FreeAssessmentInteractive';
import { LandingPageSection } from './LandingPageSection';
import { PaidAssessmentInteractive } from './PaidAssessmentInteractive';

export type JourneyStep =
  | 'home_landing'
  | 'free_mapping'
  | 'free_result'
  | 'checkout_auth'
  | 'paid_6_blocks'
  | 'paid_deliverables';

interface MemberJourneyViewProps {
  journeyStep: JourneyStep;
  setJourneyStep: (step: JourneyStep) => void;
  freeMappingStep: number;
  setFreeMappingStep: (step: number) => void;
  paidBlock: number;
  setPaidBlock: (block: number) => void;
  showPaidReviewSummary: boolean;
  setShowPaidReviewSummary: (show: boolean) => void;
  formData: AssessmentInput;
  setFormData: React.Dispatch<React.SetStateAction<AssessmentInput>>;
  isEmailVerified: boolean;
  setIsEmailVerified: (verified: boolean) => void;
  orderId: string;
  currentEvaluation: AssessmentRecord | null;
  onLoadPreset: (presetKey: string) => void;
  onCompleteFreeMapping: () => Promise<void>;
  onApproveCheckout: () => Promise<void>;
  onVerifyEmail: () => Promise<void>;
  onSubmitFullAssessment: () => Promise<void>;
  onConfirmPan: (assessmentId: string, feedback: string) => Promise<void>;
  onLogCheckin: (assessmentId: string, weightKg: number, hungerScore: number, note: string) => Promise<void>;
  onJumpToClinicalQueue: (assessmentId: string) => void;
  onTrackGtm: (eventName: string, meta?: Record<string, unknown>) => void;
  onResetDemo?: () => void;
  isSubmitting: boolean;
  freeQuizSessionKey?: number;
  onNewFreeQuizSession?: () => void;
  isAdminAuthenticated?: boolean;
}

export const MemberJourneyView: React.FC<MemberJourneyViewProps> = ({
  journeyStep,
  setJourneyStep,
  freeMappingStep,
  setFreeMappingStep,
  paidBlock,
  setPaidBlock,
  showPaidReviewSummary,
  setShowPaidReviewSummary,
  formData,
  setFormData,
  isEmailVerified,
  setIsEmailVerified,
  orderId,
  currentEvaluation,
  onLoadPreset,
  onCompleteFreeMapping,
  onApproveCheckout,
  onVerifyEmail,
  onSubmitFullAssessment,
  onConfirmPan,
  onLogCheckin,
  onJumpToClinicalQueue,
  onTrackGtm,
  onResetDemo,
  isSubmitting,
  freeQuizSessionKey = 1,
  onNewFreeQuizSession,
  isAdminAuthenticated = false
}) => {
  const [activeDeliverableTab, setActiveDeliverableTab] = useState<'report_pan' | 'meal_plan' | 'substitutions'>('report_pan');
  const [memberPanFeedback, setMemberPanFeedback] = useState('');
  const [checkinWeight, setCheckinWeight] = useState('');
  const [checkinHunger, setCheckinHunger] = useState(4);
  const [checkinNote, setCheckinNote] = useState('');
  const [showSimulatorBar, setShowSimulatorBar] = useState(false);

  const handleStartFreeAssessment = (preselectedBarrier?: string) => {
    onNewFreeQuizSession?.();
    if (preselectedBarrier) {
      setFormData(prev => ({ ...prev, freePrimaryBarrier: preselectedBarrier }));
      onTrackGtm('cta_start_free_mapping', { source: 'hero_barrier_card', barrier: preselectedBarrier });
    } else {
      onTrackGtm('cta_start_free_mapping', { source: 'landing_cta' });
    }
    setFreeMappingStep(1);
    setJourneyStep('free_mapping');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Navegação contextual discreta quando o usuário já entrou no funil */}
      {journeyStep !== 'home_landing' && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-stone-500 border-b border-stone-200 pb-3">
          <button
            type="button"
            onClick={() => setJourneyStep('home_landing')}
            className="font-medium text-stone-700 hover:text-[#03422A] flex items-center gap-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Voltar para a página inicial</span>
          </button>
          <span className="tabular-nums">
            Etapa atual:{' '}
            <strong className="text-stone-800">
              {journeyStep === 'free_mapping'
                ? 'Avaliação Gratuita'
                : journeyStep === 'free_result'
                  ? 'Leitura Inicial e Próximo Passo'
                  : journeyStep === 'checkout_auth'
                    ? 'Confirmação de E-mail'
                    : journeyStep === 'paid_6_blocks'
                      ? 'Avaliação Completa'
                      : 'Entregáveis Oficiais'}
            </strong>
          </span>
        </div>
      )}

      {/* ETAPA 01: LANDING PAGE DE CONVERSÃO */}
      {journeyStep === 'home_landing' && (
        <LandingPageSection onStartFreeAssessment={handleStartFreeAssessment} />
      )}

      {/* ETAPA 02: AVALIAÇÃO INICIAL GRATUITA INTERATIVA */}
      {journeyStep === 'free_mapping' && (
        <FreeAssessmentInteractive
          key={freeQuizSessionKey}
          freeMappingStep={freeMappingStep}
          setFreeMappingStep={setFreeMappingStep}
          formData={formData}
          setFormData={setFormData}
          onCompleteFreeMapping={onCompleteFreeMapping}
          onBackToLanding={() => setJourneyStep('home_landing')}
          isSubmitting={isSubmitting}
        />
      )}

      {/* ETAPA 03: LEITURA GRATUITA PERSONALIZADA + PONTE PARA AVALIAÇÃO COMPLETA */}
      {journeyStep === 'free_result' && (
        <FreeResultOfferSection
          formData={formData}
          onApproveCheckout={onApproveCheckout}
          isSubmitting={isSubmitting}
        />
      )}

      {/* ETAPA 04: CHECKOUT & CONFIRMAÇÃO DE TITULARIDADE DE E-MAIL */}
      {journeyStep === 'checkout_auth' && (
        <section className="max-w-2xl mx-auto bg-white border border-stone-200 rounded-xl p-6 sm:p-8 space-y-6">
          <div className="border-b border-stone-200 pb-4 space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#03422A] tabular-nums">
              <CheckCircle2 className="w-4 h-4" />
              <span>Pagamento confirmado · Pedido {orderId} · R$ 67,90</span>
            </div>
            <h2 className="text-2xl font-serif font-semibold text-stone-900">
              Confirmação de titularidade de e-mail
            </h2>
          </div>

          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 leading-relaxed">
            <strong>Proteção de dados clínicos:</strong> O acesso ao questionário e a entrega dos materiais dependem da confirmação explícita do e-mail titular da compra. Corrigir o e-mail exige nova confirmação.
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-stone-700">
              E-mail titular confirmado para entrega
            </label>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="email"
                value={formData.email}
                onChange={e => {
                  setFormData({ ...formData, email: e.target.value, emailConfirmed: false });
                  setIsEmailVerified(false);
                }}
                className="flex-1 px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm"
              />
              <button
                type="button"
                onClick={onVerifyEmail}
                className={`px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 ${
                  isEmailVerified
                    ? 'bg-[#03422A]/10 text-[#03422A] border border-[#03422A]/30'
                    : 'bg-stone-900 hover:bg-stone-800 text-white'
                }`}
              >
                {isEmailVerified ? <CheckCircle2 className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                <span>{isEmailVerified ? 'E-mail confirmado' : 'Confirmar titularidade'}</span>
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              disabled={!isEmailVerified}
              onClick={() => {
                setPaidBlock(1);
                setJourneyStep('paid_6_blocks');
              }}
              className="px-5 py-2.5 rounded-lg bg-[#03422A] hover:bg-[#02311F] text-white text-xs font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Continuar avaliação completa</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}

      {/* ETAPA 05: SEQUÊNCIA CONTÍNUA DE PERGUNTAS (MESMO DESIGN DO MAPEAMENTO INICIAL, SEM REPETIR PERGUNTAS) */}
      {journeyStep === 'paid_6_blocks' && (
        <PaidAssessmentInteractive
          key={freeQuizSessionKey}
          step={paidBlock}
          setStep={setPaidBlock}
          formData={formData}
          setFormData={setFormData}
          orderId={orderId}
          onBackToCheckout={() => setJourneyStep('checkout_auth')}
          onSubmitFullAssessment={onSubmitFullAssessment}
          isSubmitting={isSubmitting}
        />
      )}

      {/* ETAPA 06: ENTREGÁVEIS / FILA 24H / URGÊNCIA */}
      {journeyStep === 'paid_deliverables' && currentEvaluation && (
        <section className="space-y-6">
          {currentEvaluation.engineResult.emergencyRedirect && (
            <div className="bg-rose-50 border border-rose-300 rounded-xl p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-2 text-rose-800 font-semibold text-sm">
                <ShieldAlert className="w-5 h-5" />
                <span>
                  {currentEvaluation.input.pregnantOrBreastfeeding
                    ? 'Protocolo Não Indicado (Gestação / Amamentação)'
                    : 'Orientação de Atendimento Médico Imediato'}
                </span>
              </div>
              <h2 className="text-2xl font-serif font-semibold text-stone-900">
                {currentEvaluation.input.pregnantOrBreastfeeding
                  ? `${currentEvaluation.memberName}, o EmagreSLIM não é indicado para este momento`
                  : `${currentEvaluation.memberName}, busque avaliação médica presencial agora`}
              </h2>
              <p className="text-sm text-stone-700 leading-relaxed max-w-3xl">
                {currentEvaluation.engineResult.blockedMessage}
              </p>
              {!currentEvaluation.input.pregnantOrBreastfeeding && (
                <div className="p-4 rounded-lg bg-white border border-rose-200 text-xs text-stone-700">
                  Em casos de dor torácica, falta de ar intensa, desmaio ou mal-estar agudo, acione o SAMU (192) ou procure a UPA / Pronto-Socorro mais próximo. Esta avaliação não entrou em fila de 24 horas para dieta.
                </div>
              )}
            </div>
          )}

          {!currentEvaluation.engineResult.emergencyRedirect && currentEvaluation.engineResult.requiresReview && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-6 sm:p-8 space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-900">
                    <Clock className="w-4 h-4" />
                    <span>Aguardando análise do nutricionista · Prazo máximo de 24 horas corridas</span>
                  </div>
                  <h2 className="text-2xl font-serif font-semibold text-stone-900">
                    Recebemos sua avaliação, {currentEvaluation.memberName}
                  </h2>
                  <p className="text-sm text-stone-700 leading-relaxed max-w-2xl">
                    Algumas informações precisam da análise da equipe clínica EmagreSLIM antes da definição do plano. Você receberá os materiais em <strong>{currentEvaluation.email}</strong> em até 24 horas corridas.
                  </p>
                </div>
                {isAdminAuthenticated && (
                  <button
                    type="button"
                    onClick={() => onJumpToClinicalQueue(currentEvaluation.id)}
                    className="px-5 py-3 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shrink-0 flex items-center gap-2"
                  >
                    <span>Abrir caso no Painel Clínico</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="bg-white rounded-xl p-5 border border-amber-200 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-rose-800">
                  <Lock className="w-4 h-4" />
                  <span>Bloqueio de Segurança Clínico Ativo</span>
                </div>
                <p className="text-xs text-stone-600">{currentEvaluation.engineResult.blockedMessage}</p>
                <ul className="space-y-1 text-xs text-stone-700 list-disc list-inside pt-1">
                  {currentEvaluation.engineResult.triggers.map((t, idx) => (
                    <li key={idx}>
                      <strong>{t.group}:</strong> {t.reason}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {!currentEvaluation.engineResult.prescriptionBlocked && currentEvaluation.engineResult.prescription && (
            <div className="space-y-6">
              <div className="bg-white border border-stone-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#03422A]">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {currentEvaluation.engineResult.reviewedBy
                        ? `Revisado e liberado por ${currentEvaluation.engineResult.reviewedBy} (${currentEvaluation.engineResult.reviewedByCrn})`
                        : 'Caso elegível sem agravantes · Liberação direta'}
                    </span>
                  </div>
                  <h2 className="text-2xl font-serif font-semibold text-stone-900">
                    Seu plano alimentar e materiais estão prontos
                  </h2>
                  <p className="text-xs text-stone-600">
                    Cópia enviada para <strong>{currentEvaluation.email}</strong> · Suas dúvidas são respondidas pelo nutricionista respondendo diretamente ao e-mail.
                  </p>
                </div>
                <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => exportAssessmentPlanPdf(currentEvaluation)}
                    className="px-4 py-2.5 rounded-lg bg-[#03422A] hover:bg-[#02311F] text-white text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap"
                  >
                    <Download className="w-4 h-4" />
                    <span>Baixar Plano Completo (PDF)</span>
                  </button>
                  <span className="text-[11px] font-mono text-stone-500 tabular-nums">
                    {currentEvaluation.id} · Avaliação #{currentEvaluation.assessmentNumber}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 bg-stone-100 p-1.5 rounded-xl border border-stone-200">
                <button
                  type="button"
                  onClick={() => setActiveDeliverableTab('report_pan')}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${
                    activeDeliverableTab === 'report_pan'
                      ? 'bg-white text-stone-900 shadow-sm'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>1. Relatório e PAN</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDeliverableTab('meal_plan')}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${
                    activeDeliverableTab === 'meal_plan'
                      ? 'bg-white text-stone-900 shadow-sm'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Utensils className="w-4 h-4" />
                  <span>2. Dieta, Água e Substituições</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDeliverableTab('substitutions')}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${
                    activeDeliverableTab === 'substitutions'
                      ? 'bg-white text-stone-900 shadow-sm'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>3. Substituições e Check-in</span>
                </button>
              </div>

              {activeDeliverableTab === 'report_pan' && (
                <div className="space-y-6">
                  <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-5">
                    <h3 className="text-lg font-serif font-semibold text-stone-900 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[#03422A]" />
                      <span>Memorial de Cálculo e Referências Científicas</span>
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="p-4 rounded-xl bg-[#F9F8F4] border border-stone-200">
                        <span className="text-xs text-stone-500">Meta Energética</span>
                        <p className="text-2xl font-serif font-semibold text-stone-900 mt-1 tabular-nums">
                          {currentEvaluation.engineResult.prescription.targetKcal} <span className="text-xs font-sans font-normal">kcal</span>
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-[#F9F8F4] border border-stone-200">
                        <span className="text-xs text-stone-500">Proteína Diária</span>
                        <p className="text-2xl font-serif font-semibold text-[#03422A] mt-1 tabular-nums">
                          {currentEvaluation.engineResult.prescription.macros.proteinG}g
                        </p>
                        <span className="text-[11px] text-stone-500 tabular-nums">
                          {currentEvaluation.engineResult.prescription.macros.proteinPerKg} g/kg
                        </span>
                      </div>
                      <div className="p-4 rounded-xl bg-[#F9F8F4] border border-stone-200">
                        <span className="text-xs text-stone-500">Carboidrato / Gordura</span>
                        <p className="text-lg font-serif font-semibold text-stone-900 mt-1 tabular-nums">
                          {currentEvaluation.engineResult.prescription.macros.carbsG}g C · {currentEvaluation.engineResult.prescription.macros.fatG}g G
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-[#F9F8F4] border border-stone-200">
                        <span className="text-xs text-stone-500">Líquidos Totais</span>
                        <p className="text-2xl font-serif font-semibold text-stone-900 mt-1 tabular-nums">
                          {(currentEvaluation.engineResult.prescription.waterTargetMl / 1000).toFixed(1)} L
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 text-xs text-stone-600 space-y-2 border-t border-stone-200/80">
                      <p className="font-semibold text-stone-800">
                        {currentEvaluation.engineResult.prescription.equationUsed}
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        {currentEvaluation.engineResult.prescription.scientificReferences.map((ref, idx) => (
                          <li key={idx}>{ref}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-4">
                    <h3 className="text-lg font-serif font-semibold text-stone-900 flex items-center gap-2">
                      <Compass className="w-4 h-4 text-[#03422A]" />
                      <span>Perfil de Viabilidade em 7 Eixos</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {currentEvaluation.engineResult.feasibilityProfile.map((axis, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-[#F9F8F4] border border-stone-200 space-y-1">
                          <span className="text-xs font-semibold text-[#03422A]">{axis.axis}</span>
                          <p className="text-sm font-semibold text-stone-900">{axis.status}</p>
                          <p className="text-xs text-stone-600 leading-relaxed">{axis.detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-4">
                    <h3 className="text-lg font-serif font-semibold text-stone-900">
                      PAN — Plano de Ação Nutricional
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="p-4 rounded-xl bg-[#F9F8F4] border border-stone-200 space-y-2">
                        <span className="font-semibold text-[#03422A] block">Barreira Principal e Evidências</span>
                        <p className="text-sm font-semibold text-stone-900">
                          {currentEvaluation.engineResult.pan.primaryBarrier}
                        </p>
                        <ul className="list-disc list-inside text-stone-600 space-y-1">
                          {currentEvaluation.engineResult.pan.memberEvidence.map((ev, i) => (
                            <li key={i}>{ev}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-4 rounded-xl bg-[#F9F8F4] border border-stone-200 space-y-2">
                        <span className="font-semibold text-stone-800 block">Intervenções Pactuadas</span>
                        <ul className="list-disc list-inside text-stone-700 space-y-1">
                          {currentEvaluation.engineResult.pan.methodInterventions.map((inv, i) => (
                            <li key={i}>{inv}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                      <input
                        type="text"
                        value={memberPanFeedback}
                        onChange={e => setMemberPanFeedback(e.target.value)}
                        placeholder="Confirme se essa leitura faz sentido ou registre um ajuste..."
                        className="flex-1 px-3.5 py-2.5 rounded-lg border border-stone-300 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => onConfirmPan(currentEvaluation.id, memberPanFeedback)}
                        className={`px-4 py-2.5 rounded-lg text-xs font-semibold shrink-0 ${
                          currentEvaluation.panConfirmedByMember
                            ? 'bg-[#03422A] text-white'
                            : 'bg-stone-900 hover:bg-stone-800 text-white'
                        }`}
                      >
                        {currentEvaluation.panConfirmedByMember
                          ? 'Leitura do PAN confirmada'
                          : 'Confirmar leitura do PAN'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeDeliverableTab === 'meal_plan' && (
                <DietDeliverableSection evaluation={currentEvaluation} />
              )}

              {activeDeliverableTab === 'substitutions' && (
                <div className="space-y-6">
                  <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-4">
                    <h3 className="text-lg font-serif font-semibold text-stone-900">
                      Lista de Substituições Equivalentes
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {(currentEvaluation.engineResult.prescription.substitutions || []).map((sub, i) => (
                        <div key={i} className="p-4 rounded-xl bg-[#F9F8F4] border border-stone-200 text-xs space-y-2">
                          <span className="font-semibold text-[#03422A] block">{sub.group}</span>
                          <p className="font-medium text-stone-800">{sub.original}</p>
                          <ul className="list-disc list-inside text-stone-600 space-y-1">
                            {sub.equivalents.map((eq, j) => (
                              <li key={j}>{eq}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-4">
                    <div>
                      <h4 className="font-serif font-semibold text-stone-900 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#03422A]" />
                        <span>Retorno de Execução e Ciclo de Reavaliação (+45 dias)</span>
                      </h4>
                      <p className="text-xs text-stone-500 mt-0.5">
                        Registre retorno sobre peso, fome percebida e execução. A sugestão comercial de reavaliação aos 45 dias não substitui suporte para intercorrências por e-mail.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-end gap-3 bg-[#F9F8F4] p-4 rounded-xl border border-stone-200 text-xs">
                      <div>
                        <label className="block font-medium text-stone-700 mb-1">Peso Atual (kg)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={checkinWeight}
                          onChange={e => setCheckinWeight(e.target.value)}
                          placeholder={String(formData.weightKg)}
                          className="px-3 py-2 rounded-lg border border-stone-300 bg-white w-28 tabular-nums"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-stone-700 mb-1">Fome (0 a 10)</label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={checkinHunger}
                          onChange={e => setCheckinHunger(Number(e.target.value))}
                          className="px-3 py-2 rounded-lg border border-stone-300 bg-white w-24 tabular-nums"
                        />
                      </div>
                      <div className="flex-1 min-w-[200px]">
                        <label className="block font-medium text-stone-700 mb-1">Observação prática</label>
                        <input
                          type="text"
                          value={checkinNote}
                          onChange={e => setCheckinNote(e.target.value)}
                          placeholder="Ex: Lanche da tarde segurou bem a fome à noite"
                          className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onLogCheckin(
                            currentEvaluation.id,
                            Number(checkinWeight || formData.weightKg),
                            checkinHunger,
                            checkinNote
                          );
                          setCheckinNote('');
                        }}
                        className="px-4 py-2 rounded-lg bg-[#03422A] text-white font-semibold"
                      >
                        Registrar check-in
                      </button>
                    </div>

                    {currentEvaluation.checkins.length > 0 && (
                      <div className="divide-y divide-stone-200 border border-stone-200 rounded-xl overflow-hidden text-xs">
                        {currentEvaluation.checkins.map(ck => (
                          <div key={ck.id} className="px-4 py-2.5 bg-white flex flex-wrap justify-between gap-2 tabular-nums">
                            <span>Data: <strong>{ck.date}</strong></span>
                            <span>Peso: <strong>{ck.weightKg} kg</strong></span>
                            <span>Fome: <strong>{ck.hungerScore}/10</strong></span>
                            {ck.adherenceNote && <span className="text-stone-600">{ck.adherenceNote}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Barra Discreta de Simulador visível apenas quando logado no /admin */}
      {isAdminAuthenticated && (
        <section className="border border-stone-200 bg-white rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowSimulatorBar(!showSimulatorBar)}
            className="w-full px-5 py-3 flex items-center justify-between text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors"
          >
            <span>Controles de Simulação e Cenários Clínicos (Etapas 01–06 e Presets A–D)</span>
            {showSimulatorBar ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showSimulatorBar && (
            <div className="p-5 border-t border-stone-200 space-y-4 bg-[#F9F8F4]">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {[
                  { id: 'home_landing', num: '01', label: 'Página Inicial' },
                  { id: 'free_mapping', num: '02', label: 'Avaliação Grátis' },
                  { id: 'free_result', num: '03', label: 'Leitura e Oferta' },
                  { id: 'checkout_auth', num: '04', label: 'Checkout e E-mail' },
                  { id: 'paid_6_blocks', num: '05', label: 'Sequência Final' },
                  { id: 'paid_deliverables', num: '06', label: 'Entregáveis / 24h' }
                ].map(st => {
                  const active = journeyStep === st.id;
                  const disabled = st.id === 'paid_deliverables' && !currentEvaluation;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => setJourneyStep(st.id as JourneyStep)}
                      className={`px-3 py-2 rounded-lg border text-left transition-colors ${
                        active
                          ? 'bg-[#03422A] text-white border-[#03422A]'
                          : disabled
                            ? 'bg-stone-100 border-stone-200 text-stone-400 cursor-not-allowed'
                            : 'bg-white hover:bg-stone-100 border-stone-200 text-stone-800'
                      }`}
                    >
                      <span className={`text-[10px] font-mono block tabular-nums ${active ? 'text-emerald-200' : 'text-stone-400'}`}>
                        Etapa {st.num}
                      </span>
                      <span className="text-xs font-semibold truncate block">{st.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs font-medium text-stone-600 mr-1">Carregar perfil:</span>
                {Object.entries(PRESET_SCENARIOS).map(([key, preset]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onLoadPreset(key)}
                    className="px-3 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 text-xs font-medium text-stone-800 transition-colors whitespace-nowrap shrink-0"
                  >
                    {preset.label}
                  </button>
                ))}
                {onResetDemo && (
                  <button
                    type="button"
                    onClick={onResetDemo}
                    className="ml-auto px-3 py-1.5 rounded-lg border border-stone-300 bg-stone-900 text-white text-xs font-medium hover:bg-stone-800 transition-colors whitespace-nowrap shrink-0"
                  >
                    Reiniciar sessão demo
                  </button>
                )}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
};
