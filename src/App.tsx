import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { AdminLoginView } from './components/AdminLoginView';
import { ArchitectureSpecsView } from './components/ArchitectureSpecsView';
import { ClinicalQueueView } from './components/ClinicalQueueView';
import { EmailGtmAuditView } from './components/EmailGtmAuditView';
import { MemberJourneyView, type JourneyStep } from './components/MemberJourneyView';
import { TopBar, type AppTab } from './components/TopBar';
import { PRESET_SCENARIOS } from './shared/catalog';
import { evaluateDataSanityLock } from './shared/clinicalEngine';
import type {
  AssessmentInput,
  AssessmentRecord,
  EmailOutboxItem,
  GtmAuditEvent
} from './shared/types';
import { pushDataLayerEvent } from './utils/analytics';
import emagreslimLogo from './assets/images/emagreslim-logo.png';

interface AdminServerState {
  assessments: AssessmentRecord[];
  emailOutbox: EmailOutboxItem[];
  gtmEvents: GtmAuditEvent[];
}

const ADMIN_TOKEN_KEY = 'emagreslim_admin_token';
const PENDING_DRAFT_KEY = 'emagreslim_pending_draft';
const PENDING_EVALUATION_KEY = 'emagreslim_pending_evaluation';
const PURCHASE_FIRED_PREFIX = 'emagreslim_purchase_fired_';

function markPurchaseFiredOnce(key: string): boolean {
  if (typeof window === 'undefined') return true;
  const storageKey = `${PURCHASE_FIRED_PREFIX}${key}`;
  try {
    if (sessionStorage.getItem(storageKey)) return false;
    sessionStorage.setItem(storageKey, '1');
    return true;
  } catch {
    return true;
  }
}

const BLANK_ASSESSMENT_INPUT: AssessmentInput = {
  ...PRESET_SCENARIOS.preset_a_eligible.data,
  memberName: '',
  email: '',
  whatsapp: '',
  emailConfirmed: false,
  goalDescription: '',
  deadlineEvent: '',
  recentWeightChange: 'estavel',
  healthConditions: ['nenhuma'],
  pregnantOrBreastfeeding: false,
  bariatricHistory: false,
  fluidRestriction: false,
  emergencySymptoms: false,
  medications: '',
  unknownMedicationDose: false,
  allergies: '',
  allergySeverityUnknown: false,
  intolerances: '',
  dietaryPreference: 'onivoro',
  shiftWorker: false,
  hasFridge: true,
  hasMicrowave: true,
  budgetPriority: false,
  preferredMealCount: 4,
  hungerPeakTime: 'tarde_noite',
  hungerCauseContext: '',
  lossOfControlFrequency: 'nunca_raramente',
  purgingOrCompensation: false,
  weekendChanges: '',
  keepFoods: '',
  avoidFoods: '',
  previousAttempts: '',
  whatWouldMakeHard: '',
  firstWeekChange: ''
};

export default function App() {
  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.location.pathname.startsWith('/admin') : false
  );
  const [adminToken, setAdminToken] = useState<string | null>(() =>
    typeof window !== 'undefined' ? sessionStorage.getItem(ADMIN_TOKEN_KEY) : null
  );

  const [activeTab, setActiveTab] = useState<AppTab>('lead_journey');
  const [journeyStep, setJourneyStep] = useState<JourneyStep>('home_landing');
  const [freeMappingStep, setFreeMappingStep] = useState(1);
  const [paidBlock, setPaidBlock] = useState(1);
  const [showPaidReviewSummary, setShowPaidReviewSummary] = useState(false);

  const [formData, setFormData] = useState<AssessmentInput>(BLANK_ASSESSMENT_INPUT);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [orderId, setOrderId] = useState('ORD-2026-8841');
  const [includeChaFit21D, setIncludeChaFit21D] = useState(false);
  const [paidTotalBrl, setPaidTotalBrl] = useState(67.9);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Registro exclusivo do usuário atual na jornada pública
  const [ownEvaluation, setOwnEvaluation] = useState<AssessmentRecord | null>(null);

  // Estado administrativo completo (carregado apenas com login em /admin)
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [emailOutbox, setEmailOutbox] = useState<EmailOutboxItem[]>([]);
  const [gtmEvents, setGtmEvents] = useState<GtmAuditEvent[]>([]);
  const [selectedReviewId, setSelectedReviewId] = useState<string>('ASM-2026-0142');
  const [isLoadingState, setIsLoadingState] = useState(false);
  const [freeQuizSessionKey, setFreeQuizSessionKey] = useState(1);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [nowTick, setNowTick] = useState(Date.now());

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4600);
  }, []);

  const applyAdminState = useCallback((data: AdminServerState) => {
    setAssessments(data.assessments || []);
    setEmailOutbox(data.emailOutbox || []);
    setGtmEvents(data.gtmEvents || []);
  }, []);

  const fetchAdminState = useCallback(
    async (tokenToUse?: string) => {
      const token = tokenToUse || adminToken;
      if (!token) return;
      setIsLoadingState(true);
      try {
        const res = await fetch('/api/admin/state', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.status === 401) {
          sessionStorage.removeItem(ADMIN_TOKEN_KEY);
          setAdminToken(null);
          return;
        }
        if (!res.ok) throw new Error('Falha ao carregar estado administrativo');
        const data = (await res.json()) as AdminServerState;
        applyAdminState(data);
      } catch {
        showToast('Não foi possível sincronizar o painel administrativo.', 'error');
      } finally {
        setIsLoadingState(false);
      }
    },
    [adminToken, applyAdminState, showToast]
  );

  useEffect(() => {
    if (adminToken) {
      fetchAdminState(adminToken);
    }
  }, [adminToken, fetchAdminState]);

  // Verifica retorno do Mercado Pago na URL (?mp_status=... ou ?mp_upsell_status=...)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const mpUpsellStatus = params.get('mp_upsell_status');
    const mpStatus = params.get('mp_status') || params.get('status');
    const returnedOrderId = params.get('order_id') || params.get('external_reference');
    const returnedAssessmentId = params.get('assessment_id') || '';
    const paymentId = params.get('payment_id') || params.get('collection_id') || '';

    if (!returnedOrderId) return;

    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, '', cleanUrl);

    // Retorno do Upsell Pós-Compra (CháFit 21D)
    if (mpUpsellStatus) {
      try {
        const rawEval = localStorage.getItem(PENDING_EVALUATION_KEY);
        if (rawEval) {
          const parsedEval = JSON.parse(rawEval) as AssessmentRecord;
          setOwnEvaluation(parsedEval);
          setFormData(parsedEval.input);
          setOrderId(parsedEval.orderId);
          setJourneyStep('paid_deliverables');
        }
      } catch {
        // Ignora caso localStorage esteja vazio
      }

      if (mpUpsellStatus === 'failure' || mpUpsellStatus === 'rejected') {
        showToast('Pagamento do CháFit 21D não concluído. Seu plano alimentar continua normalmente liberado.', 'error');
        return;
      }

      setIsLoadingState(true);
      fetch(
        `/api/checkout/upsell-verify?orderId=${encodeURIComponent(
          returnedOrderId
        )}&assessmentId=${encodeURIComponent(returnedAssessmentId)}&paymentId=${encodeURIComponent(
          paymentId
        )}`
      )
        .then(async res => {
          const data = await res.json();
          if (res.ok && data.approved) {
            setIncludeChaFit21D(true);
            setPaidTotalBrl(95.8);
            if (data.record) {
              setOwnEvaluation(data.record);
              setFormData(data.record.input);
              setOrderId(data.record.orderId);
            } else {
              setOwnEvaluation(prev => (prev ? { ...prev, includeChaFit21D: true, totalAmountBrl: 95.8 } : prev));
            }
            setJourneyStep('paid_deliverables');
            if (markPurchaseFiredOnce(`${returnedOrderId}:chafit`)) {
              pushDataLayerEvent('upsell_chafit_purchased', {
                transaction_id: `${returnedOrderId}:CHAFIT`,
                value: 27.9,
                currency: 'BRL'
              });
            }
            localStorage.removeItem(PENDING_EVALUATION_KEY);
            showToast('CháFit 21D liberado! Seu download em PDF já está disponível abaixo.');
          } else if (mpUpsellStatus === 'pending') {
            showToast('Pagamento do CháFit 21D pendente no Mercado Pago. Assim que compensar, o PDF será liberado.', 'error');
          } else {
            showToast('Aguardando confirmação do pagamento do CháFit 21D.', 'error');
          }
        })
        .catch(() => {
          showToast('Erro ao validar retorno do pagamento complementar.', 'error');
        })
        .finally(() => {
          setIsLoadingState(false);
        });
      return;
    }

    if (mpStatus === 'failure' || mpStatus === 'rejected') {
      showToast('Pagamento não concluído no Mercado Pago. Você pode tentar novamente.', 'error');
      return;
    }

    const restoreSavedDraft = () => {
      try {
        const raw = localStorage.getItem(PENDING_DRAFT_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as AssessmentInput;
          setFormData(parsed);
        }
      } catch {
        // Ignora caso localStorage esteja vazio
      }
    };

    restoreSavedDraft();
    setIsLoadingState(true);

    fetch(
      `/api/checkout/verify?orderId=${encodeURIComponent(returnedOrderId)}&paymentId=${encodeURIComponent(
        paymentId
      )}`
    )
      .then(async res => {
        const data = await res.json();
        if (res.ok && data.approved) {
          if (data.formData) {
            setFormData(data.formData);
          }
          const withChaFit = Boolean(data.includeChaFit21D);
          const totalVal = typeof data.totalAmountBrl === 'number' ? data.totalAmountBrl : withChaFit ? 95.8 : 67.9;
          setOrderId(data.orderId);
          setIncludeChaFit21D(withChaFit);
          setPaidTotalBrl(totalVal);
          setIsEmailVerified(Boolean(data.emailConfirmed));
          setJourneyStep('checkout_auth');
          if (markPurchaseFiredOnce(data.orderId)) {
            pushDataLayerEvent('purchase', {
              transaction_id: data.orderId,
              value: totalVal,
              currency: 'BRL',
              include_chafit_21d: withChaFit
            });
          }
          localStorage.removeItem(PENDING_DRAFT_KEY);
          showToast(
            withChaFit
              ? `Pagamento confirmado! Pedido ${data.orderId} (Plano + CháFit 21D).`
              : `Pagamento confirmado no Mercado Pago! Pedido ${data.orderId}.`
          );
        } else if (mpStatus === 'pending') {
          setOrderId(returnedOrderId);
          showToast(
            'Pagamento pendente no Mercado Pago (PIX/Boleto). Assim que compensar, sua avaliação será liberada.',
            'error'
          );
        } else {
          showToast('Ainda aguardando confirmação do pagamento pelo Mercado Pago.', 'error');
        }
      })
      .catch(() => {
        showToast('Erro ao validar retorno do pagamento.', 'error');
      })
      .finally(() => {
        setIsLoadingState(false);
      });
  }, [showToast]);

  // Suporta botão Voltar/Avançar do navegador entre / e /admin
  useEffect(() => {
    const onPopState = () => {
      setIsAdminRoute(window.location.pathname.startsWith('/admin'));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (!adminToken) return;
    const timer = setInterval(() => {
      setNowTick(Date.now());
    }, 2500);
    return () => clearInterval(timer);
  }, [adminToken]);

  const navigateTo = (path: string) => {
    if (typeof window !== 'undefined' && window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setIsAdminRoute(path.startsWith('/admin'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentEvaluation = useMemo(() => {
    if (ownEvaluation) return ownEvaluation;
    return assessments.find(a => a.id === selectedReviewId) || null;
  }, [ownEvaluation, assessments, selectedReviewId]);

  const pendingReviewsCount = useMemo(
    () =>
      assessments.filter(
        a => a.status === 'awaiting_review' || a.status === 'awaiting_member_clarification'
      ).length,
    [assessments]
  );

  const handleTrackGtm = async (eventName: string, meta: Record<string, unknown> = {}) => {
    pushDataLayerEvent(eventName, meta);
    try {
      const res = await fetch('/api/gtm-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventName, meta })
      });
      if (res.ok && adminToken) {
        const data = await res.json();
        if (data.event) {
          setGtmEvents(prev => [data.event, ...prev]);
        }
      }
    } catch {
      // Silencioso para telemetria não bloquear interação
    }
  };

  const handleLoadPreset = (presetKey: string) => {
    const preset = PRESET_SCENARIOS[presetKey];
    if (!preset) return;
    setFormData({ ...preset.data });
    setIsEmailVerified(true);
    setShowPaidReviewSummary(false);
    setPaidBlock(1);
    showToast(`Perfil carregado: ${preset.label}`);
  };

  const handleCompleteFreeMapping = async () => {
    const sanity = evaluateDataSanityLock({
      age: formData.age,
      heightCm: formData.heightCm,
      weightKg: formData.weightKg,
      targetWeightKg: formData.targetWeightKg
    });
    if (sanity.blocked) {
      showToast(sanity.message, 'error');
      return;
    }
    if (!formData.email || !formData.email.includes('@')) {
      showToast('Informe um endereço de e-mail válido para continuar.', 'error');
      return;
    }
    if (!formData.whatsapp || formData.whatsapp.replace(/\D/g, '').length < 8) {
      showToast('Informe um número de WhatsApp válido com DDD.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/free-mapping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          journeyType: formData.journeyType,
          memberName: formData.memberName,
          email: formData.email,
          whatsapp: formData.whatsapp,
          sex: formData.sex,
          age: formData.age,
          weightKg: formData.weightKg,
          heightCm: formData.heightCm,
          targetWeightKg: formData.targetWeightKg,
          freePrimaryBarrier: formData.freePrimaryBarrier
        })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Erro ao salvar mapeamento gratuito.', 'error');
        return;
      }
      pushDataLayerEvent('free_mapping_completed', {
        journey_type: formData.journeyType
      });
      setJourneyStep('free_result');
      showToast('Análise gratuita gerada! Você já pode baixar seu PDF.');
      if (adminToken) fetchAdminState(adminToken);
    } catch {
      showToast('Falha na comunicação com o servidor.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveCheckout = async (withChaFit21D: boolean) => {
    setIsSubmitting(true);
    const expectedTotal = withChaFit21D ? 95.8 : 67.9;
    pushDataLayerEvent('begin_checkout', {
      value: expectedTotal,
      currency: 'BRL',
      include_chafit_21d: withChaFit21D
    });

    try {
      localStorage.setItem(PENDING_DRAFT_KEY, JSON.stringify(formData));
    } catch {
      // Ignora caso storage privado esteja bloqueado
    }

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          memberName: formData.memberName,
          includeChaFit21D: withChaFit21D,
          formData
        })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Erro ao iniciar pagamento.', 'error');
        return;
      }

      if (data.mode === 'mercadopago' && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      const confirmedChaFit = Boolean(data.includeChaFit21D);
      const confirmedTotal =
        typeof data.totalAmountBrl === 'number' ? data.totalAmountBrl : expectedTotal;
      setOrderId(data.orderId);
      setIncludeChaFit21D(confirmedChaFit);
      setPaidTotalBrl(confirmedTotal);
      setIsEmailVerified(false);
      setFormData(prev => ({ ...prev, emailConfirmed: false }));
      setJourneyStep('checkout_auth');
      if (markPurchaseFiredOnce(data.orderId)) {
        pushDataLayerEvent('purchase', {
          transaction_id: data.orderId,
          value: confirmedTotal,
          currency: 'BRL',
          include_chafit_21d: confirmedChaFit
        });
      }
      showToast(
        confirmedChaFit
          ? `Pedido ${data.orderId} aprovado (Plano + CháFit 21D). Confirme seu e-mail para continuar.`
          : `Pedido ${data.orderId} aprovado. Confirme seu e-mail para continuar.`
      );
      if (adminToken) fetchAdminState(adminToken);
    } catch {
      showToast('Erro de conexão durante o checkout.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePurchaseChaFitUpsell = async (targetOrderId: string, assessmentId?: string) => {
    setIsSubmitting(true);
    pushDataLayerEvent('begin_upsell_chafit', {
      order_id: targetOrderId,
      value: 27.9,
      currency: 'BRL'
    });

    if (currentEvaluation) {
      try {
        localStorage.setItem(PENDING_EVALUATION_KEY, JSON.stringify(currentEvaluation));
      } catch {
        // Ignora caso storage privado esteja bloqueado
      }
    }

    try {
      const res = await fetch('/api/checkout/upsell-chafit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: targetOrderId, assessmentId })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Erro ao iniciar pagamento do CháFit 21D.', 'error');
        return;
      }

      if (data.mode === 'mercadopago' && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      setIncludeChaFit21D(true);
      setPaidTotalBrl(95.8);
      if (data.record) {
        setOwnEvaluation(data.record);
      } else {
        setOwnEvaluation(prev =>
          prev ? { ...prev, includeChaFit21D: true, totalAmountBrl: 95.8 } : prev
        );
      }
      if (markPurchaseFiredOnce(`${targetOrderId}:chafit`)) {
        pushDataLayerEvent('upsell_chafit_purchased', {
          transaction_id: `${targetOrderId}:CHAFIT`,
          value: 27.9,
          currency: 'BRL'
        });
      }
      showToast('CháFit 21D adicionado com sucesso! Você já pode baixar o PDF.');
      if (adminToken) fetchAdminState(adminToken);
    } catch {
      showToast('Erro de conexão ao adicionar o CháFit 21D.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadChaFitEbook = async (targetOrderId: string, assessmentId?: string) => {
    try {
      const res = await fetch(
        `/api/ebooks/chafit-21d/access?orderId=${encodeURIComponent(
          targetOrderId
        )}&assessmentId=${encodeURIComponent(assessmentId || '')}`
      );
      const data = await res.json();
      if (!res.ok || !data.allowed || !data.downloadUrl) {
        showToast(data.error || 'O e-book CháFit 21D ainda não está liberado para este pedido.', 'error');
        return;
      }

      const link = document.createElement('a');
      link.href = data.downloadUrl;
      link.download = data.fileName || 'EmagreSLIM_ChaFit_21D.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Download do e-book CháFit 21D iniciado.');
    } catch {
      showToast('Erro ao validar o download do e-book CháFit 21D.', 'error');
    }
  };

  const handleVerifyEmail = async () => {
    try {
      const res = await fetch('/api/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, email: formData.email })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'E-mail inválido.', 'error');
        return;
      }
      setIsEmailVerified(true);
      setFormData(prev => ({ ...prev, emailConfirmed: true }));
      showToast(`Titularidade do e-mail ${formData.email} confirmada.`);
    } catch {
      showToast('Erro ao confirmar e-mail.', 'error');
    }
  };

  const handleSubmitFullAssessment = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/assessments/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          input: { ...formData, emailConfirmed: isEmailVerified }
        })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Erro na validação clínica da avaliação.', 'error');
        return;
      }
      setOwnEvaluation(data.record);
      setJourneyStep('paid_deliverables');
      pushDataLayerEvent('paid_assessment_submitted', {
        assessment_id: data.record.id
      });

      if (data.record.engineResult.emergencyRedirect) {
        showToast('Sinal de urgência identificado: atendimento presencial imediato orientado.', 'error');
      } else if (data.record.engineResult.requiresReview) {
        setSelectedReviewId(data.record.id);
        showToast('Caso encaminhado para revisão do nutricionista EmagreSLIM (até 24h).');
      } else {
        showToast('Avaliação concluída! Seu Plano Alimentar e PDF já estão liberados.');
      }

      if (adminToken) fetchAdminState(adminToken);
    } catch {
      showToast('Falha ao enviar avaliação completa.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmPan = async (assessmentId: string, feedback: string) => {
    try {
      const res = await fetch(`/api/assessments/${assessmentId}/pan-confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback })
      });
      const data = await res.json();
      if (res.ok && data.record) {
        setOwnEvaluation(data.record);
        showToast('Confirmação do PAN registrada no prontuário.');
        if (adminToken) fetchAdminState(adminToken);
      }
    } catch {
      showToast('Erro ao confirmar leitura do PAN.', 'error');
    }
  };

  const handleLogCheckin = async (
    assessmentId: string,
    weightKg: number,
    hungerScore: number,
    adherenceNote: string
  ) => {
    try {
      const res = await fetch(`/api/assessments/${assessmentId}/checkins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weightKg, hungerScore, adherenceNote })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Dados de check-in inválidos.', 'error');
        return;
      }
      if (data.record) setOwnEvaluation(data.record);
      showToast('Check-in registrado no seu acompanhamento.');
      if (adminToken) fetchAdminState(adminToken);
    } catch {
      showToast('Erro ao salvar check-in.', 'error');
    }
  };

  const handleSendClarification = async (assessmentId: string, question: string) => {
    if (!adminToken) return;
    try {
      const res = await fetch(`/api/assessments/${assessmentId}/clarify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ question })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Não foi possível enviar dúvida.', 'error');
        return;
      }
      applyAdminState(data.state);
      if (ownEvaluation?.id === assessmentId && data.record) {
        setOwnEvaluation(data.record);
      }
      showToast('Pergunta de esclarecimento enviada por e-mail e registrada.');
    } catch {
      showToast('Erro ao enviar esclarecimento.', 'error');
    }
  };

  const handleApproveAndRelease = async (
    assessmentId: string,
    payload: {
      reviewedByCrn: string;
      targetKcal: number;
      proteinG: number;
      waterTargetMl: number;
      manualPlanText: string;
      nutritionistClinicalNote: string;
    }
  ) => {
    if (!adminToken) return;
    try {
      const res = await fetch(`/api/assessments/${assessmentId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Erro ao aprovar plano clínico.', 'error');
        return;
      }
      applyAdminState(data.state);
      if (ownEvaluation?.id === assessmentId && data.record) {
        setOwnEvaluation(data.record);
      }
      showToast('Plano aprovado com CRN e enviado por e-mail ao membro.');
    } catch {
      showToast('Erro de rede ao aprovar plano.', 'error');
    }
  };

  const handleResetDemo = async () => {
    if (!adminToken) return;
    try {
      const res = await fetch('/api/reset-demo', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const data = (await res.json()) as AdminServerState;
        applyAdminState(data);
        setJourneyStep('home_landing');
        setFreeMappingStep(1);
        setPaidBlock(1);
        setShowPaidReviewSummary(false);
        setOwnEvaluation(null);
        setSelectedReviewId('ASM-2026-0142');
        setIsEmailVerified(false);
        setActiveTab('lead_journey');
        showToast('Sessão reiniciada com os dados iniciais.');
      }
    } catch {
      showToast('Falha ao reiniciar sessão.', 'error');
    }
  };

  const isAdminAuthenticated = Boolean(adminToken);

  return (
    <div className="min-h-screen flex flex-col bg-[#F9F8F4] text-stone-900">
      <TopBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        pendingReviewsCount={pendingReviewsCount}
        emailCount={emailOutbox.length}
        isAdminAuthenticated={isAdminAuthenticated}
        onExitAdmin={() => {
          sessionStorage.removeItem(ADMIN_TOKEN_KEY);
          setAdminToken(null);
          setActiveTab('lead_journey');
          navigateTo('/');
        }}
        onLogoClick={() => {
          setActiveTab('lead_journey');
          setJourneyStep('home_landing');
          navigateTo('/');
        }}
        onStartFreeQuiz={() => {
          setActiveTab('lead_journey');
          setFreeMappingStep(1);
          setPaidBlock(1);
          setOwnEvaluation(null);
          setFormData({ ...BLANK_ASSESSMENT_INPUT });
          setFreeQuizSessionKey(k => k + 1);
          setJourneyStep('free_mapping');
          pushDataLayerEvent('free_mapping_started');
          navigateTo('/');
        }}
      />

      {toast && (
        <div
          role="status"
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border max-w-md text-xs font-medium ${
            toast.type === 'error'
              ? 'bg-rose-900 text-white border-rose-800'
              : 'bg-[#03422A] text-white border-emerald-800'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-200" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-200" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      <main className="flex-1">
        {isAdminRoute && !isAdminAuthenticated ? (
          <AdminLoginView
            onLoginSuccess={token => {
              sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
              setAdminToken(token);
              setActiveTab('nutritionist_panel');
              fetchAdminState(token);
            }}
            onBackHome={() => navigateTo('/')}
          />
        ) : isLoadingState ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-4">
            <div className="h-8 w-64 bg-stone-200 rounded animate-pulse" />
            <div className="h-48 w-full bg-white border border-stone-200 rounded-xl animate-pulse" />
          </div>
        ) : (
          <>
            {(!isAdminAuthenticated || activeTab === 'lead_journey') && (
              <MemberJourneyView
                journeyStep={journeyStep}
                setJourneyStep={setJourneyStep}
                freeMappingStep={freeMappingStep}
                setFreeMappingStep={setFreeMappingStep}
                paidBlock={paidBlock}
                setPaidBlock={setPaidBlock}
                showPaidReviewSummary={showPaidReviewSummary}
                setShowPaidReviewSummary={setShowPaidReviewSummary}
                formData={formData}
                setFormData={setFormData}
                isEmailVerified={isEmailVerified}
                setIsEmailVerified={setIsEmailVerified}
                orderId={orderId}
                includeChaFit21D={includeChaFit21D}
                paidTotalBrl={paidTotalBrl}
                currentEvaluation={currentEvaluation}
                onLoadPreset={handleLoadPreset}
                onCompleteFreeMapping={handleCompleteFreeMapping}
                onApproveCheckout={handleApproveCheckout}
                onPurchaseChaFitUpsell={handlePurchaseChaFitUpsell}
                onDownloadChaFitEbook={handleDownloadChaFitEbook}
                onVerifyEmail={handleVerifyEmail}
                onSubmitFullAssessment={handleSubmitFullAssessment}
                onConfirmPan={handleConfirmPan}
                onLogCheckin={handleLogCheckin}
                onJumpToClinicalQueue={id => {
                  setSelectedReviewId(id);
                  setActiveTab('nutritionist_panel');
                }}
                onTrackGtm={handleTrackGtm}
                onResetDemo={handleResetDemo}
                isSubmitting={isSubmitting}
                freeQuizSessionKey={freeQuizSessionKey}
                isAdminAuthenticated={isAdminAuthenticated}
                onNewFreeQuizSession={() => {
                  setPaidBlock(1);
                  setOwnEvaluation(null);
                  setIncludeChaFit21D(false);
                  setPaidTotalBrl(67.9);
                  setFormData({ ...BLANK_ASSESSMENT_INPUT });
                  setFreeQuizSessionKey(k => k + 1);
                }}
              />
            )}

            {isAdminAuthenticated && activeTab === 'nutritionist_panel' && (
              <ClinicalQueueView
                assessments={assessments}
                selectedReviewId={selectedReviewId}
                setSelectedReviewId={setSelectedReviewId}
                nowTick={nowTick}
                onSendClarification={handleSendClarification}
                onApproveAndRelease={handleApproveAndRelease}
              />
            )}

            {isAdminAuthenticated && activeTab === 'email_gtm_audit' && (
              <EmailGtmAuditView emailOutbox={emailOutbox} gtmEvents={gtmEvents} />
            )}

            {isAdminAuthenticated && activeTab === 'tech_architecture' && <ArchitectureSpecsView />}
          </>
        )}
      </main>

      <footer className="border-t border-stone-200 bg-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
          <div className="flex items-center gap-3">
            <img src={emagreslimLogo} alt="EmagreSLIM" className="h-6 w-auto object-contain" />
            <span>Nutrição Baseada em Evidências e Vida Real</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <span>Referências: Mifflin-St Jeor (1990) · DRI (2023) · NICE NG246 · TACO 4ª ed. · IBGE POF</span>
            <button
              type="button"
              onClick={() => navigateTo('/admin')}
              className="text-stone-400 hover:text-stone-700 underline underline-offset-2"
            >
              Área Clínica
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
