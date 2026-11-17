import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Mail,
  Search,
  Send,
  ShieldAlert
} from 'lucide-react';
import type { AssessmentRecord } from '../shared/types';

interface ClinicalQueueViewProps {
  assessments: AssessmentRecord[];
  selectedReviewId: string;
  setSelectedReviewId: (id: string) => void;
  nowTick: number;
  onSendClarification: (assessmentId: string, question: string) => Promise<void>;
  onApproveAndRelease: (
    assessmentId: string,
    payload: {
      reviewedByCrn: string;
      targetKcal: number;
      proteinG: number;
      waterTargetMl: number;
      manualPlanText: string;
      nutritionistClinicalNote: string;
    }
  ) => Promise<void>;
}

const DEFAULT_MANUAL_PLAN = `• Café da Manhã (06:30): 1 Pão francês (50g · TACO Cód. 72) + 2 Ovos cozidos (90g · TACO Cód. 475) + Café sem açúcar.
• Lanche da Manhã (09:30): 1 Banana prata (65g · TACO Cód. 176) + 2 col. sopa de Aveia (30g · TACO Cód. 14).
• Almoço (12:30): 4 col. sopa Arroz cozido (100g · TACO Cód. 6) + 1 concha Feijão carioca (86g · TACO Cód. 521) + 1 Filé de frango grelhado (100g · TACO Cód. 412) + Salada verde.
• Lanche da Tarde (16:30): 1 copo Leite desnatado (240ml · TACO Cód. 455) + 1 fruta.
• Jantar (20:00): 140g Batata inglesa cozida (TACO Cód. 95) + 100g Frango grelhado + Legumes.`;

export const ClinicalQueueView: React.FC<ClinicalQueueViewProps> = ({
  assessments,
  selectedReviewId,
  setSelectedReviewId,
  nowTick,
  onSendClarification,
  onApproveAndRelease
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [clarificationText, setClarificationText] = useState('');
  const [crn, setCrn] = useState('CRN-3 00000');
  const [manualKcal, setManualKcal] = useState(1850);
  const [manualProteinG, setManualProteinG] = useState(145);
  const [manualWaterMl, setManualWaterMl] = useState(2800);
  const [manualPlanText, setManualPlanText] = useState(DEFAULT_MANUAL_PLAN);
  const [clinicalNote, setClinicalNote] = useState('');

  const filteredAssessments = useMemo(() => {
    return assessments.filter(item => {
      if (statusFilter === 'pending') {
        const isPending = item.status === 'awaiting_review' || item.status === 'awaiting_member_clarification';
        if (!isPending) return false;
      } else if (statusFilter === 'completed' && item.status !== 'completed') {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.memberName.toLowerCase().includes(q) ||
          item.email.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [assessments, statusFilter, searchQuery]);

  const selectedAssessment = useMemo(
    () => assessments.find(a => a.id === selectedReviewId) || filteredAssessments[0] || assessments[0],
    [assessments, filteredAssessments, selectedReviewId]
  );

  const getSlaCountdown = (slaDueAtIso: string) => {
    const diffMs = new Date(slaDueAtIso).getTime() - nowTick;
    if (diffMs <= 0) {
      return { text: 'Prazo 24h excedido · Ação manual obrigatória', isRisk: true, isOverdue: true };
    }
    const totalMinutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return {
      text: `${hours}h ${String(minutes).padStart(2, '0')}m restantes`,
      isRisk: hours < 4,
      isOverdue: false
    };
  };

  const getStatusLabel = (status: AssessmentRecord['status']) => {
    switch (status) {
      case 'completed':
        return 'Liberado';
      case 'awaiting_member_clarification':
        return 'Aguardando Membro';
      case 'emergency_redirect':
        return 'Urgência Médica';
      default:
        return 'Pendente 24h';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Lista da Fila */}
        <aside className="lg:col-span-4 bg-white border border-stone-200 rounded-xl p-5 space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-serif font-semibold text-stone-900">
              Fila de Revisão Clínica (24h)
            </h2>
            <p className="text-xs text-stone-500 leading-relaxed">
              Contagem de 24 horas corridas após envio definitivo. Nenhum caso pendente expira ou libera automaticamente.
            </p>
          </div>

          {/* Filtros e busca */}
          <div className="space-y-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar por nome, e-mail ou ID..."
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-stone-300 text-xs"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-lg border border-stone-200 text-xs">
              {[
                { key: 'all', label: 'Todos' },
                { key: 'pending', label: 'Pendentes' },
                { key: 'completed', label: 'Liberados' }
              ].map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusFilter(tab.key as typeof statusFilter)}
                  className={`flex-1 py-1.5 rounded-md font-medium transition-colors ${
                    statusFilter === tab.key
                      ? 'bg-white text-stone-900 shadow-sm'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {filteredAssessments.length === 0 ? (
            <div className="p-6 text-center border border-stone-200 rounded-xl bg-[#F9F8F4] text-xs text-stone-500">
              Nenhuma avaliação encontrada para o filtro selecionado.
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredAssessments.map(item => {
                const sla = getSlaCountdown(item.slaDueAt);
                const selected = selectedAssessment?.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedReviewId(item.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-colors space-y-1.5 ${
                      selected
                        ? 'bg-[#03422A] text-white border-[#03422A]'
                        : 'bg-[#F9F8F4] hover:bg-stone-100 border-stone-200 text-stone-900'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[11px] font-mono tabular-nums">
                      <span className={selected ? 'text-emerald-200' : 'text-stone-500'}>
                        {item.id} · #{item.assessmentNumber}
                      </span>
                      <span
                        className={`font-sans font-semibold ${
                          selected
                            ? 'text-emerald-200'
                            : item.status === 'completed'
                              ? 'text-[#03422A]'
                              : item.status === 'emergency_redirect'
                                ? 'text-rose-700'
                                : 'text-amber-700'
                        }`}
                      >
                        {getStatusLabel(item.status)}
                      </span>
                    </div>

                    <p className="font-semibold text-sm">{item.memberName}</p>
                    <p className={`text-xs truncate ${selected ? 'text-emerald-100/90' : 'text-stone-500'}`}>
                      {item.email}
                    </p>

                    {(item.status === 'awaiting_review' || item.status === 'awaiting_member_clarification') && (
                      <div
                        className={`pt-2 border-t text-[11px] font-medium flex items-center gap-1.5 tabular-nums ${
                          selected
                            ? 'border-emerald-800 text-amber-200'
                            : sla.isRisk
                              ? 'border-stone-200 text-rose-700'
                              : 'border-stone-200 text-amber-800'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>{sla.text}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        {/* Área Principal do Prontuário e Decisão */}
        {selectedAssessment ? (
          <div className="lg:col-span-8 bg-white border border-stone-200 rounded-xl p-6 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-200 pb-4">
              <div className="space-y-1">
                <span className="text-xs font-mono text-stone-500 tabular-nums">
                  {selectedAssessment.id} · Pedido {selectedAssessment.orderId}
                </span>
                <h3 className="text-2xl font-serif font-semibold text-stone-900">
                  {selectedAssessment.memberName}
                </h3>
                <p className="text-xs text-stone-600 tabular-nums">
                  E-mail confirmado: <strong>{selectedAssessment.email}</strong> · {selectedAssessment.input.age} anos · {selectedAssessment.input.weightKg} kg · {selectedAssessment.input.heightCm} cm · IMC {selectedAssessment.engineResult.anthropometry.bmi ?? 'N/D'} kg/m²
                </p>
              </div>

              {selectedAssessment.status !== 'completed' && selectedAssessment.status !== 'emergency_redirect' && (
                <div className="text-right text-xs tabular-nums">
                  <span className="block font-semibold text-amber-800">
                    {getSlaCountdown(selectedAssessment.slaDueAt).text}
                  </span>
                  <span className="text-stone-500">Limite 24h corridas</span>
                </div>
              )}
            </div>

            {/* Gatilhos de Agravantes */}
            {selectedAssessment.engineResult.triggers.length > 0 && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 space-y-2 text-xs text-rose-950">
                <p className="font-semibold text-rose-900 flex items-center gap-1.5">
                  {selectedAssessment.engineResult.emergencyRedirect ? (
                    <ShieldAlert className="w-4 h-4" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                  <span>Gatilhos identificados pela triagem conservadora</span>
                </p>
                <ul className="list-disc list-inside space-y-1">
                  {selectedAssessment.engineResult.triggers.map((t, idx) => (
                    <li key={idx}>
                      <strong>{t.group}:</strong> {t.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Resumo dos dados clínicos declarados */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#F9F8F4] border border-stone-200 rounded-xl p-4 text-xs">
              <div className="space-y-1.5">
                <p><strong>Medicamentos:</strong> {selectedAssessment.input.medications || 'Nenhum'}</p>
                <p><strong>Dose desconhecida:</strong> {selectedAssessment.input.unknownMedicationDose ? 'Sim' : 'Não'}</p>
                <p><strong>Alergias:</strong> {selectedAssessment.input.allergies || 'Nenhuma'}</p>
                <p><strong>Padrão alimentar:</strong> {selectedAssessment.input.dietaryPreference}</p>
              </div>
              <div className="space-y-1.5">
                <p><strong>Geladeira fora de casa:</strong> {selectedAssessment.input.hasFridge ? 'Sim' : 'Não'}</p>
                <p><strong>Prioridade econômica:</strong> {selectedAssessment.input.budgetPriority ? 'Sim' : 'Não'}</p>
                <p><strong>Perda de controle / compensação:</strong> {selectedAssessment.input.lossOfControlFrequency} / {selectedAssessment.input.purgingOrCompensation ? 'Com compensação' : 'Sem compensação'}</p>
                <p><strong>Barreira PAN:</strong> {selectedAssessment.engineResult.pan.primaryBarrier}</p>
              </div>
            </div>

            {/* Solicitar Esclarecimento por E-mail */}
            {!selectedAssessment.engineResult.emergencyRedirect && (
              <div className="space-y-3 border-t border-stone-200 pt-5">
                <label className="block text-xs font-semibold text-stone-800">
                  Solicitar esclarecimento ao membro por e-mail (registrado no histórico)
                </label>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="text"
                    value={clarificationText}
                    onChange={e => setClarificationText(e.target.value)}
                    placeholder="Ex: Confirme a dose exata da insulina noturna ou resultado de hemoglobina glicada recente."
                    className="flex-1 px-3.5 py-2.5 rounded-lg border border-stone-300 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!clarificationText.trim()) return;
                      onSendClarification(selectedAssessment.id, clarificationText.trim());
                      setClarificationText('');
                    }}
                    className="px-4 py-2.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold flex items-center justify-center gap-2 shrink-0"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Enviar dúvida por e-mail</span>
                  </button>
                </div>

                {selectedAssessment.clarifications.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {selectedAssessment.clarifications.map(clr => (
                      <div key={clr.id} className="p-3 rounded-lg bg-[#F9F8F4] border border-stone-200 text-xs flex justify-between gap-4">
                        <span className="text-stone-700">"{clr.question}"</span>
                        <span className="text-stone-400 font-mono shrink-0 tabular-nums">{clr.sentAt}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Prescrição Clínica Manual e Liberação */}
            {!selectedAssessment.engineResult.emergencyRedirect && (
              <div className="space-y-4 border-t border-stone-200 pt-5">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif font-semibold text-base text-stone-900">
                    Definição Clínica e Liberação por E-mail
                  </h4>
                  <span className="text-xs text-stone-500">Exige CRN válido para destravar caso agravado</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">CRN Responsável *</label>
                    <input
                      type="text"
                      value={crn}
                      onChange={e => setCrn(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">Meta Calórica (kcal)</label>
                    <input
                      type="number"
                      value={manualKcal}
                      onChange={e => setManualKcal(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">Proteína (g/dia)</label>
                    <input
                      type="number"
                      value={manualProteinG}
                      onChange={e => setManualProteinG(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">Líquidos (ml/dia)</label>
                    <input
                      type="number"
                      value={manualWaterMl}
                      onChange={e => setManualWaterMl(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm tabular-nums"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Cardápio Individualizado (TACO 4ª ed. e IBGE)
                  </label>
                  <textarea
                    rows={5}
                    value={manualPlanText}
                    onChange={e => setManualPlanText(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-xs leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Observação Clínica do Nutricionista (opcional)
                  </label>
                  <input
                    type="text"
                    value={clinicalNote}
                    onChange={e => setClinicalNote(e.target.value)}
                    placeholder="Ex: Manter intervalo máximo de 4h entre refeições devido ao uso de insulina noturna."
                    className="w-full px-3.5 py-2 rounded-lg border border-stone-300 text-xs"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      onApproveAndRelease(selectedAssessment.id, {
                        reviewedByCrn: crn,
                        targetKcal: Number(manualKcal),
                        proteinG: Number(manualProteinG),
                        waterTargetMl: Number(manualWaterMl),
                        manualPlanText,
                        nutritionistClinicalNote: clinicalNote
                      })
                    }
                    className="px-5 py-2.5 rounded-lg bg-[#03422A] hover:bg-[#02311F] text-white text-xs font-semibold flex items-center gap-2"
                  >
                    {selectedAssessment.status === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>
                      {selectedAssessment.status === 'completed'
                        ? 'Atualizar plano revisado'
                        : 'Aprovar e liberar entregáveis por e-mail'}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};
