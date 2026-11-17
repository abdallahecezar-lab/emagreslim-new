import React, { useState } from 'react';
import { Activity, Eye, Mail, X } from 'lucide-react';
import { EMAIL_TEMPLATES } from '../shared/catalog';
import type { EmailOutboxItem, EmailTemplateKey, GtmAuditEvent } from '../shared/types';

interface EmailGtmAuditViewProps {
  emailOutbox: EmailOutboxItem[];
  gtmEvents: GtmAuditEvent[];
}

export const EmailGtmAuditView: React.FC<EmailGtmAuditViewProps> = ({
  emailOutbox,
  gtmEvents
}) => {
  const [previewTemplateKey, setPreviewTemplateKey] = useState<EmailTemplateKey | null>(null);

  const previewTemplate = previewTemplateKey ? EMAIL_TEMPLATES[previewTemplateKey] : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Fila Idempotente de E-mails */}
      <section className="bg-white border border-stone-200 rounded-xl p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-200 pb-4">
          <div className="space-y-1">
            <h2 className="text-lg font-serif font-semibold text-stone-900 flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#03422A]" />
              <span>Fila Persistente e Idempotente de E-mails</span>
            </h2>
            <p className="text-xs text-stone-500">
              Estados separados (preparado, enviado ao provedor, entregue). Assuntos sanitizados sem dados clínicos. WhatsApp e Z-API removidos.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(EMAIL_TEMPLATES) as EmailTemplateKey[]).map(key => (
              <button
                key={key}
                type="button"
                onClick={() => setPreviewTemplateKey(previewTemplateKey === key ? null : key)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  previewTemplateKey === key
                    ? 'bg-[#03422A] text-white border-[#03422A]'
                    : 'bg-[#F9F8F4] hover:bg-stone-100 border-stone-200 text-stone-700'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{key}</span>
              </button>
            ))}
          </div>
        </div>

        {previewTemplate && previewTemplateKey && (
          <div className="bg-[#F9F8F4] border border-stone-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#03422A]">
                Modelo oficial · {previewTemplateKey}
              </span>
              <button
                type="button"
                onClick={() => setPreviewTemplateKey(null)}
                className="text-stone-500 hover:text-stone-900 flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Fechar</span>
              </button>
            </div>
            <p className="text-xs font-semibold text-stone-900">
              Assunto: {previewTemplate.subject}
            </p>
            <pre className="whitespace-pre-wrap font-sans text-xs text-stone-700 bg-white p-4 rounded-lg border border-stone-200 leading-relaxed">
              {previewTemplate.body}
            </pre>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-stone-200 text-stone-500">
                <th className="py-2.5 px-3 font-medium">Chave Idempotente</th>
                <th className="py-2.5 px-3 font-medium">Destinatário Confirmado</th>
                <th className="py-2.5 px-3 font-medium">Assunto Sanitizado</th>
                <th className="py-2.5 px-3 font-medium">Horário</th>
                <th className="py-2.5 px-3 font-medium text-right">Status de Entrega</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200/80">
              {emailOutbox.map(item => (
                <tr key={item.id} className="hover:bg-stone-50/70">
                  <td className="py-3 px-3 font-mono text-stone-700">{item.idempotencyKey}</td>
                  <td className="py-3 px-3 font-medium text-stone-900">{item.recipientEmail}</td>
                  <td className="py-3 px-3 text-stone-700">{item.safeSubject}</td>
                  <td className="py-3 px-3 font-mono text-stone-500 tabular-nums">{item.createdAt}</td>
                  <td className="py-3 px-3 text-right font-semibold tabular-nums">
                    <span
                      className={
                        item.deliveryStatus === 'delivered'
                          ? 'text-[#03422A]'
                          : item.deliveryStatus === 'failed' || item.deliveryStatus === 'bounced'
                            ? 'text-rose-700'
                            : 'text-amber-700'
                      }
                    >
                      {item.deliveryStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Auditoria de Tracking / GTM */}
      <section className="bg-white border border-stone-200 rounded-xl p-6 space-y-4">
        <div className="border-b border-stone-200 pb-3 space-y-1">
          <h3 className="text-lg font-serif font-semibold text-stone-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#03422A]" />
            <span>Auditoria de Eventos GTM e Privacidade</span>
          </h3>
          <p className="text-xs text-stone-500">
            Garante que nenhum status clínico, diagnóstico ou chamada Z-API seja enviado para ferramentas de analytics do navegador.
          </p>
        </div>

        <div className="divide-y divide-stone-200 border border-stone-200 rounded-xl overflow-hidden text-xs">
          {gtmEvents.map(ev => (
            <div
              key={ev.id}
              className="p-3.5 bg-[#F9F8F4] flex flex-col md:flex-row md:items-center justify-between gap-2"
            >
              <div className="font-mono break-all">
                <span className="text-stone-400 mr-2 tabular-nums">[{ev.time}]</span>
                <strong className="text-[#03422A] mr-2">{ev.eventName}</strong>
                <span className="text-stone-600">{ev.payload}</span>
              </div>
              <span className="text-xs font-medium text-[#03422A] shrink-0">
                {ev.audit}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
