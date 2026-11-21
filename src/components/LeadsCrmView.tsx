import React, { useMemo, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  Mail,
  MessageCircle,
  Search,
  Users
} from 'lucide-react';
import { BARRIER_EXPLANATIONS } from '../shared/catalog';
import type { LeadRecord, LeadStage } from '../shared/types';

interface LeadsCrmViewProps {
  leads: LeadRecord[];
}

const STAGE_LABELS: Record<LeadStage, { label: string; colorClass: string }> = {
  lead_gratuito: {
    label: 'Avaliação Grátis (Lead)',
    colorClass: 'text-stone-700'
  },
  checkout_iniciado: {
    label: 'Checkout Iniciado (Pendente)',
    colorClass: 'text-amber-800'
  },
  cliente_pago: {
    label: 'Cliente Pago (R$ 67,90)',
    colorClass: 'text-[#03422A]'
  },
  cliente_com_chafit: {
    label: 'Cliente + CháFit 21D (R$ 95,80)',
    colorClass: 'text-[#03422A]'
  }
};

function sanitizeCsvCell(value: unknown): string {
  const raw = String(value ?? '').replace(/\r?\n/g, ' ').trim();
  const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}

function buildWhatsappHref(phone: string, memberName: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return null;
  const full = digits.startsWith('55') ? digits : `55${digits}`;
  const firstName = memberName.trim().split(/\s+/)[0] || 'tudo bem';
  const text = encodeURIComponent(
    `Olá, ${firstName}! Aqui é da equipe EmagreSLIM. Vi que você fez sua avaliação no nosso site — como posso te ajudar a dar o próximo passo?`
  );
  return `https://wa.me/${full}?text=${text}`;
}

function formatDateTimePt(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return iso;
  }
}

export const LeadsCrmView: React.FC<LeadsCrmViewProps> = ({ leads }) => {
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<'all' | LeadStage>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const free = leads.filter(l => l.stage === 'lead_gratuito').length;
    const checkout = leads.filter(l => l.stage === 'checkout_iniciado').length;
    const paid = leads.filter(
      l => l.stage === 'cliente_pago' || l.stage === 'cliente_com_chafit'
    ).length;
    const chafit = leads.filter(l => l.stage === 'cliente_com_chafit').length;
    return { total: leads.length, free, checkout, paid, chafit };
  }, [leads]);

  const filteredLeads = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter(lead => {
      if (stageFilter !== 'all' && lead.stage !== stageFilter) return false;
      if (!q) return true;
      return (
        lead.memberName.toLowerCase().includes(q) ||
        lead.email.toLowerCase().includes(q) ||
        lead.whatsapp.toLowerCase().includes(q) ||
        (lead.orderId || '').toLowerCase().includes(q)
      );
    });
  }, [leads, search, stageFilter]);

  const handleCopyEmail = async (id: string, email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // Fallback silencioso se clipboard estiver bloqueado
    }
  };

  const handleExportCsv = () => {
    const headers = [
      'Nome',
      'Email',
      'WhatsApp',
      'Estagio',
      'Pedido',
      'Valor_BRL',
      'Peso_Atual_kg',
      'Meta_Peso_kg',
      'Idade',
      'Principal_Dificuldade',
      'Atualizado_Em'
    ];
    const rows = filteredLeads.map(l => {
      const barrierTitle = BARRIER_EXPLANATIONS[l.primaryBarrier]?.title || l.primaryBarrier || '';
      return [
        sanitizeCsvCell(l.memberName),
        sanitizeCsvCell(l.email),
        sanitizeCsvCell(l.whatsapp),
        sanitizeCsvCell(STAGE_LABELS[l.stage]?.label || l.stage),
        sanitizeCsvCell(l.orderId || ''),
        sanitizeCsvCell(l.totalAmountBrl ?? ''),
        sanitizeCsvCell(l.weightKg || ''),
        sanitizeCsvCell(l.targetWeightKg || ''),
        sanitizeCsvCell(l.age || ''),
        sanitizeCsvCell(barrierTitle),
        sanitizeCsvCell(formatDateTimePt(l.updatedAt))
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `EmagreSLIM_Cadastros_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Cabeçalho e Resumo */}
      <section className="bg-white border border-stone-200 rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
          <div className="space-y-1">
            <h2 className="text-xl font-serif font-semibold text-stone-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#03422A]" />
              <span>Cadastros, Leads e Clientes</span>
            </h2>
            <p className="text-xs text-stone-500">
              Todas as pessoas que preencheram a avaliação gratuita ou compraram o plano ficam salvas no banco de dados com WhatsApp e e-mail para seus pontos de contato.
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredLeads.length === 0}
            className="px-4 py-2.5 rounded-lg bg-[#03422A] hover:bg-[#02311F] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>Exportar CSV (Excel)</span>
          </button>
        </div>

        {/* Contadores */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-[#F9F8F4] border border-stone-200">
            <span className="text-xs text-stone-500 block">Total de Cadastros</span>
            <p className="text-2xl font-serif font-semibold text-stone-900 tabular-nums mt-0.5">
              {counts.total}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[#F9F8F4] border border-stone-200">
            <span className="text-xs text-stone-500 block">Apenas Avaliação Grátis</span>
            <p className="text-2xl font-serif font-semibold text-stone-900 tabular-nums mt-0.5">
              {counts.free}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[#03422A]/5 border border-[#03422A]/20">
            <span className="text-xs text-[#03422A] font-medium block">Clientes Pagos</span>
            <p className="text-2xl font-serif font-semibold text-[#03422A] tabular-nums mt-0.5">
              {counts.paid}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[#03422A]/5 border border-[#03422A]/20">
            <span className="text-xs text-[#03422A] font-medium block">Com CháFit 21D</span>
            <p className="text-2xl font-serif font-semibold text-[#03422A] tabular-nums mt-0.5">
              {counts.chafit}
            </p>
          </div>
        </div>

        {/* Busca e Filtros */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nome, e-mail, WhatsApp ou pedido..."
              className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-stone-300 text-xs text-stone-900 focus:outline-none focus:border-[#03422A]"
            />
          </div>

          <div className="flex flex-wrap gap-1 p-1 bg-stone-100 rounded-lg border border-stone-200">
            {(
              [
                { id: 'all', label: 'Todos' },
                { id: 'lead_gratuito', label: 'Leads Grátis' },
                { id: 'checkout_iniciado', label: 'Checkout Pendente' },
                { id: 'cliente_pago', label: 'Pagos (R$ 67,90)' },
                { id: 'cliente_com_chafit', label: 'Com CháFit 21D' }
              ] as const
            ).map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStageFilter(tab.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  stageFilter === tab.id
                    ? 'bg-white text-stone-900 shadow-sm font-semibold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tabela */}
        {filteredLeads.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-[#F9F8F4] border border-stone-200 text-xs text-stone-500">
            Nenhum cadastro encontrado para este filtro. Assim que alguém finalizar a avaliação gratuita no site, o nome, WhatsApp e e-mail aparecerão aqui automaticamente.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500">
                  <th className="py-2.5 px-3 font-medium">Nome e Data</th>
                  <th className="py-2.5 px-3 font-medium">E-mail e WhatsApp</th>
                  <th className="py-2.5 px-3 font-medium">Objetivo e Dificuldade</th>
                  <th className="py-2.5 px-3 font-medium">Estágio no Funil</th>
                  <th className="py-2.5 px-3 font-medium text-right">Ações de Contato</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/80">
                {filteredLeads.map(lead => {
                  const stageMeta = STAGE_LABELS[lead.stage] || STAGE_LABELS.lead_gratuito;
                  const waHref = buildWhatsappHref(lead.whatsapp, lead.memberName);
                  const barrierTitle =
                    BARRIER_EXPLANATIONS[lead.primaryBarrier]?.title || lead.primaryBarrier || '—';

                  return (
                    <tr key={lead.id} className="hover:bg-stone-50/70 align-top">
                      <td className="py-3 px-3">
                        <p className="font-semibold text-stone-900">{lead.memberName}</p>
                        <p className="text-[11px] text-stone-500 tabular-nums mt-0.5">
                          {formatDateTimePt(lead.updatedAt)}
                        </p>
                      </td>

                      <td className="py-3 px-3 space-y-1">
                        <p className="text-stone-800 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span>{lead.email}</span>
                        </p>
                        <p className="text-stone-700 tabular-nums flex items-center gap-1.5">
                          <MessageCircle className="w-3.5 h-3.5 text-[#03422A] shrink-0" />
                          <span>{lead.whatsapp || 'Não informado'}</span>
                        </p>
                      </td>

                      <td className="py-3 px-3 space-y-0.5">
                        {lead.weightKg > 0 ? (
                          <p className="font-medium text-stone-800 tabular-nums">
                            {lead.weightKg} kg → {lead.targetWeightKg} kg
                            {lead.age > 0 ? ` · ${lead.age} anos` : ''}
                          </p>
                        ) : (
                          <p className="text-stone-500">—</p>
                        )}
                        <p className="text-[11px] text-stone-500 max-w-xs truncate" title={barrierTitle}>
                          {barrierTitle}
                        </p>
                      </td>

                      <td className="py-3 px-3">
                        <p className={`font-semibold ${stageMeta.colorClass}`}>
                          {stageMeta.label}
                        </p>
                        {lead.orderId && (
                          <p className="text-[11px] font-mono text-stone-500 tabular-nums mt-0.5">
                            {lead.orderId}
                          </p>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopyEmail(lead.id, lead.email)}
                            className="px-2.5 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-700 font-medium inline-flex items-center gap-1 whitespace-nowrap"
                          >
                            {copiedId === lead.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-[#03422A]" />
                                <span>Copiado</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copiar e-mail</span>
                              </>
                            )}
                          </button>

                          {waHref && (
                            <a
                              href={waHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1.5 rounded-lg bg-[#03422A] hover:bg-[#02311F] text-white font-semibold inline-flex items-center gap-1 whitespace-nowrap"
                            >
                              <span>WhatsApp</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
