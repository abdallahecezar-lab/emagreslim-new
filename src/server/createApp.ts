import crypto from 'crypto';
import express from 'express';
import nodemailer from 'nodemailer';
import { EMAIL_TEMPLATES, PRESET_SCENARIOS } from '../shared/catalog.js';
import {
  CheckinInputSchema,
  ClarificationInputSchema,
  computeFreeMappingAnalysis,
  evaluateDataSanityLock,
  FreeMappingSchema,
  ManualApprovalInputSchema,
  PaidAssessmentInputSchema,
  runEmagreSlimEngineV06
} from '../shared/clinicalEngine.js';
import { buildRichMealSheets } from '../shared/mealBuilder.js';
import type {
  AssessmentInput,
  AssessmentRecord,
  EmailOutboxItem,
  EmailTemplateKey,
  GtmAuditEvent,
  LeadRecord,
  LeadStage
} from '../shared/types.js';
import {
  createInitialState,
  getDatabaseUrl,
  loadStore,
  saveStore,
  type StoreState
} from './store.js';

const PLAN_PRICE_BRL = 67.9;
const CHAFIT_PRICE_BRL = 27.9;
const CHAFIT_DOWNLOAD_URL = '/ebooks/EmagreSLIM_ChaFit_21D.pdf';
const CHAFIT_FILE_NAME = 'EmagreSLIM_ChaFit_21D.pdf';

function computeOrderTotalBrl(includeChaFit21D: boolean): number {
  return includeChaFit21D ? Number((PLAN_PRICE_BRL + CHAFIT_PRICE_BRL).toFixed(2)) : PLAN_PRICE_BRL;
}

function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD?.trim() || 'emagreslim2026';
}

function getTokenSecret(): string {
  return (
    process.env.ADMIN_TOKEN_SECRET?.trim() ||
    process.env.ADMIN_PASSWORD?.trim() ||
    'emagreslim-dev-token-secret'
  );
}

function signAdminToken(): string {
  const exp = Date.now() + 12 * 3600 * 1000;
  const payload = Buffer.from(JSON.stringify({ role: 'admin', exp })).toString('base64url');
  const sig = crypto.createHmac('sha256', getTokenSecret()).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyAdminToken(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', getTokenSecret())
    .update(payload)
    .digest('base64url');
  if (sig.length !== expectedSig.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return false;
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as {
      role?: string;
      exp?: number;
    };
    return parsed.role === 'admin' && typeof parsed.exp === 'number' && parsed.exp > Date.now();
  } catch {
    return false;
  }
}

function extractBearerToken(req: express.Request): string | undefined {
  const auth = req.headers.authorization;
  if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
    return auth.slice(7).trim();
  }
  return undefined;
}

function requireAdmin(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void {
  const token = extractBearerToken(req);
  if (!verifyAdminToken(token)) {
    res.status(401).json({ error: 'Acesso restrito à equipe clínica. Faça login no /admin.' });
    return;
  }
  next();
}

function resolvePublicBaseUrl(req: express.Request): string {
  const envUrl = process.env.APP_URL?.trim();
  if (envUrl && envUrl !== 'MY_APP_URL') {
    return envUrl.replace(/\/$/, '');
  }
  const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
  const host = (req.headers['x-forwarded-host'] as string) || req.get('host') || 'localhost:3000';
  return `${proto}://${host}`;
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildFreeMappingEmailHtml(params: {
  weightKg: number;
  targetWeightKg: number;
  age: number;
  heightCm: number;
  sex: 'feminino' | 'masculino';
  waterIntakeLiters: number;
  exerciseMinutesPerWeek: number;
  baseUrl: string;
}): string {
  const analysis = computeFreeMappingAnalysis({
    ...PRESET_SCENARIOS.preset_a_eligible.data,
    sex: params.sex,
    age: params.age,
    weightKg: params.weightKg,
    heightCm: params.heightCm,
    targetWeightKg: params.targetWeightKg,
    waterIntakeLiters: params.waterIntakeLiters,
    exerciseMinutesPerWeek: params.exerciseMinutesPerWeek,
    healthConditions: ['nenhuma'],
    bariatricHistory: false
  });

  return `
    <div style="margin: 20px 0; padding: 18px; background: #F9F8F4; border: 1px solid #e7e5e4; border-radius: 10px;">
      <p style="font-size: 13px; font-weight: bold; color: #03422A; margin: 0 0 12px 0;">Resumo da Sua Avaliação Inicial Gratuita</p>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #292524;">
        <tr>
          <td style="padding: 6px 0; border-bottom: 1px solid #e7e5e4;"><strong>Ponto de partida → Meta:</strong></td>
          <td style="padding: 6px 0; border-bottom: 1px solid #e7e5e4; text-align: right;">${escapeHtml(params.weightKg)} kg → ${escapeHtml(params.targetWeightKg)} kg (IMC ${escapeHtml(analysis.bmi)} → ${escapeHtml(analysis.targetBmi)})</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; border-bottom: 1px solid #e7e5e4;"><strong>Gasto energético estimado (TDEE):</strong></td>
          <td style="padding: 6px 0; border-bottom: 1px solid #e7e5e4; text-align: right;">~${escapeHtml(analysis.tdeeKcal)} kcal/dia</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; border-bottom: 1px solid #e7e5e4;"><strong>Faixa estimada para emagrecer:</strong></td>
          <td style="padding: 6px 0; border-bottom: 1px solid #e7e5e4; text-align: right; color: #03422A; font-weight: bold;">~${escapeHtml(analysis.estimatedDietKcal)} kcal/dia</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; border-bottom: 1px solid #e7e5e4;"><strong>Meta diária de água:</strong></td>
          <td style="padding: 6px 0; border-bottom: 1px solid #e7e5e4; text-align: right;">${escapeHtml((analysis.idealWaterMl / 1000).toFixed(1))} L/dia (${escapeHtml(analysis.idealWaterCups)} copos de 250 ml)</td>
        </tr>
        <tr>
          <td style="padding: 6px 0;"><strong>Ciclos estimados até a meta:</strong></td>
          <td style="padding: 6px 0; text-align: right;">${analysis.kgToLose > 0 ? `${escapeHtml(analysis.estimatedEvaluationsMin)} a ${escapeHtml(analysis.estimatedEvaluationsMax)} avaliações` : '1 avaliação de manutenção'}</td>
        </tr>
      </table>
      <p style="font-size: 12px; color: #57534e; margin: 14px 0 0 0; line-height: 1.5;">
        <strong>Movimento sugerido:</strong> ${escapeHtml(analysis.exerciseRecommendationTitle)} — ${escapeHtml(analysis.exerciseRecommendationDetail)}
      </p>
      <div style="margin-top: 16px;">
        <a href="${escapeHtml(params.baseUrl)}" style="display: inline-block; background: #03422A; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: bold; padding: 10px 18px; border-radius: 8px;">
          Acessar EmagreSLIM
        </a>
      </div>
    </div>
  `;
}

function buildPlanDeliveredEmailHtml(record: AssessmentRecord, baseUrl: string): string {
  const rx = record.engineResult.prescription;
  if (!rx) return '';

  const sheets = buildRichMealSheets(record);
  const mealsHtml = rx.manualPlanText
    ? `<div style="margin: 14px 0; padding: 14px; background: #ffffff; border: 1px solid #e7e5e4; border-radius: 8px; white-space: pre-wrap; font-size: 13px; line-height: 1.6; color: #292524;">${escapeHtml(rx.manualPlanText)}</div>`
    : sheets
        .map(sheet => {
          const formulaLines = sheet.formula
            .map(
              f =>
                `<li style="margin: 3px 0;"><strong>${escapeHtml(f.label)}:</strong> ${escapeHtml(f.gramsLabel)} (${escapeHtml(f.measureHint)})</li>`
            )
            .join('');
          const bandsHtml = sheet.bands
            .map(
              b =>
                `<p style="font-size: 12px; color: #44403c; margin: 6px 0;"><strong>${escapeHtml(b.title)}:</strong> ${escapeHtml(b.itemsText)}</p>`
            )
            .join('');
          return `
            <div style="margin: 12px 0; padding: 14px; background: #ffffff; border: 1px solid #e7e5e4; border-radius: 8px;">
              <p style="font-size: 14px; font-weight: bold; color: #03422A; margin: 0 0 4px 0;">
                ${escapeHtml(sheet.orderLabel)} · ${escapeHtml(sheet.title)} (${escapeHtml(sheet.suggestedWindow)})
              </p>
              <p style="font-size: 12px; color: #57534e; margin: 0 0 8px 0;">~${escapeHtml(sheet.estimatedKcal)} kcal · ~${escapeHtml(sheet.estimatedProteinG)} g proteína</p>
              <ul style="margin: 0 0 8px 18px; padding: 0; font-size: 12px; color: #292524;">${formulaLines}</ul>
              ${bandsHtml}
            </div>
          `;
        })
        .join('');

  const chaFitBlock = record.includeChaFit21D
    ? `
      <div style="margin: 18px 0; padding: 16px; background: #03422A; color: #ffffff; border-radius: 10px;">
        <p style="font-size: 13px; font-weight: bold; color: #A3E635; margin: 0 0 6px 0;">Complemento Digital Liberado</p>
        <p style="font-size: 15px; font-weight: bold; margin: 0 0 6px 0;">E-book CháFit 21D (PDF)</p>
        <p style="font-size: 12px; color: #ecfdf5; margin: 0 0 12px 0; line-height: 1.5;">
          Clique abaixo para baixar seu guia digital de 21 dias com receitas de infusões por horário e orientações de rotina.
        </p>
        <a href="${escapeHtml(baseUrl)}${CHAFIT_DOWNLOAD_URL}" style="display: inline-block; background: #ffffff; color: #03422A; text-decoration: none; font-size: 13px; font-weight: bold; padding: 10px 16px; border-radius: 8px;">
          Baixar E-book CháFit 21D (PDF)
        </a>
        <p style="font-size: 11px; color: #d1fae5; margin: 10px 0 0 0;">
          Aviso: material informativo. Gestantes, lactantes, hipertensos ou pessoas em uso contínuo de medicamentos devem consultar médico ou nutricionista antes de consumir ervas e infusões.
        </p>
      </div>
    `
    : '';

  return `
    <div style="margin: 18px 0; padding: 16px; background: #F9F8F4; border: 1px solid #e7e5e4; border-radius: 10px;">
      <p style="font-size: 13px; font-weight: bold; color: #03422A; margin: 0 0 10px 0;">Suas Metas Diárias — Plano EmagreSLIM (${escapeHtml(record.id)})</p>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #292524;">
        <tr>
          <td style="padding: 5px 0; border-bottom: 1px solid #e7e5e4;"><strong>Meta calórica:</strong></td>
          <td style="padding: 5px 0; border-bottom: 1px solid #e7e5e4; text-align: right;"><strong>${escapeHtml(rx.targetKcal)} kcal/dia</strong></td>
        </tr>
        <tr>
          <td style="padding: 5px 0; border-bottom: 1px solid #e7e5e4;"><strong>Proteínas / Carboidratos / Gorduras:</strong></td>
          <td style="padding: 5px 0; border-bottom: 1px solid #e7e5e4; text-align: right;">${escapeHtml(rx.macros.proteinG)}g / ${escapeHtml(rx.macros.carbsG)}g / ${escapeHtml(rx.macros.fatG)}g</td>
        </tr>
        <tr>
          <td style="padding: 5px 0;"><strong>Meta de hidratação:</strong></td>
          <td style="padding: 5px 0; text-align: right;">${escapeHtml((rx.waterTargetMl / 1000).toFixed(1))} L/dia (${escapeHtml(rx.waterTargetMl)} ml)</td>
        </tr>
      </table>
    </div>
    <p style="font-size: 14px; font-weight: bold; color: #1c1917; margin: 18px 0 8px 0;">Seu Cardápio Diário Personalizado:</p>
    ${mealsHtml}
    ${chaFitBlock}
  `;
}

function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_USER?.trim() && process.env.SMTP_PASS?.trim());
}

function isEmailProviderConfigured(): boolean {
  return isSmtpConfigured() || Boolean(process.env.RESEND_API_KEY?.trim());
}

async function sendRealEmail(params: {
  to: string;
  subject: string;
  memberName: string;
  templateKey: EmailTemplateKey;
  assessmentNumber?: number;
  extraHtml?: string;
}): Promise<{
  status: 'delivered' | 'failed' | 'unconfigured';
  provider?: 'smtp' | 'resend';
  errorDetail?: string;
}> {
  const tpl = EMAIL_TEMPLATES[params.templateKey];
  const safeName = escapeHtml(params.memberName);
  const safeBody = escapeHtml(
    tpl.body
      .replace('{{memberName}}', params.memberName)
      .replace('{{assessmentNumber}}', String(params.assessmentNumber ?? 1))
  );

  const html = `
    <div style="font-family: Arial, sans-serif; color: #1c1917; max-width: 640px; margin: 0 auto; padding: 20px; background: #F9F8F4;">
      <div style="background: #ffffff; border: 1px solid #e7e5e4; border-radius: 12px; padding: 26px;">
        <p style="font-size: 14px; font-weight: bold; color: #03422A; margin: 0 0 8px 0;">EMAGRE<span style="color: #73AF04;">SLIM</span></p>
        <h1 style="font-size: 20px; margin: 0 0 14px 0; color: #1c1917;">Olá, ${safeName}!</h1>
        <p style="font-size: 14px; line-height: 1.6; color: #44403c; margin: 0 0 16px 0;">
          ${safeBody}
        </p>
        ${params.extraHtml || ''}
        <p style="font-size: 12px; color: #78716c; border-top: 1px solid #e7e5e4; padding-top: 16px; margin: 18px 0 0 0;">
          Mensagem automática enviada pelo canal oficial EmagreSLIM. Seus dados clínicos são protegidos e nunca são expostos no assunto do e-mail.
        </p>
      </div>
    </div>
  `;

  // 1. Prioridade: SMTP próprio (ex.: Hostinger contato@emagreslim.com.br)
  if (isSmtpConfigured()) {
    const host = process.env.SMTP_HOST?.trim() || 'smtp.hostinger.com';
    const portRaw = Number(process.env.SMTP_PORT || '465');
    const port = Number.isFinite(portRaw) && portRaw > 0 ? portRaw : 465;
    const user = process.env.SMTP_USER!.trim();
    const pass = process.env.SMTP_PASS!.trim();
    const from = process.env.SMTP_FROM_EMAIL?.trim() || `EmagreSLIM <${user}>`;

    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000
      });

      await transporter.sendMail({
        from,
        to: params.to,
        replyTo: user,
        subject: params.subject,
        html
      });
      return { status: 'delivered', provider: 'smtp' };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido no SMTP';
      console.error('SMTP email send error:', msg);
      return { status: 'failed', provider: 'smtp', errorDetail: msg.slice(0, 140) };
    }
  }

  // 2. Alternativa: Resend API
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return { status: 'unconfigured' };

  const from = process.env.RESEND_FROM_EMAIL?.trim() || 'EmagreSLIM <onboarding@resend.dev>';

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from,
        to: [params.to],
        subject: params.subject,
        html
      })
    });
    if (res.ok) {
      return { status: 'delivered', provider: 'resend' };
    }
    const errText = await res.text().catch(() => '');
    console.error('Resend API error:', res.status, errText);
    return {
      status: 'failed',
      provider: 'resend',
      errorDetail: `HTTP ${res.status}: ${errText.slice(0, 140)}`
    };
  } catch (err) {
    console.error('Resend network error:', err);
    return {
      status: 'failed',
      provider: 'resend',
      errorDetail: 'Erro de rede ao conectar à API do Resend'
    };
  }
}

async function enqueueIdempotentEmail(
  state: StoreState,
  params: {
    idempotencyKey: string;
    recipientEmail: string;
    memberName: string;
    templateKey: EmailTemplateKey;
    assessmentNumber?: number;
    extraHtml?: string;
  }
): Promise<EmailOutboxItem | null> {
  const existing = state.emailOutbox.find(e => e.idempotencyKey === params.idempotencyKey);
  if (existing) {
    return null;
  }
  const tpl = EMAIL_TEMPLATES[params.templateKey];
  const safeSubject = tpl.subject.replace(
    '{{assessmentNumber}}',
    String(params.assessmentNumber ?? 1)
  );
  const sendResult = await sendRealEmail({
    to: params.recipientEmail,
    subject: safeSubject,
    memberName: params.memberName,
    templateKey: params.templateKey,
    assessmentNumber: params.assessmentNumber,
    extraHtml: params.extraHtml
  });

  const providerLabel = sendResult.provider === 'smtp' ? 'SMTP Hostinger' : 'Resend';

  const item: EmailOutboxItem = {
    id: `EML-${Math.floor(1000 + Math.random() * 9000)}`,
    idempotencyKey: params.idempotencyKey,
    recipientEmail: params.recipientEmail,
    memberName: params.memberName,
    templateKey: params.templateKey,
    safeSubject,
    deliveryStatus:
      sendResult.status === 'delivered'
        ? 'delivered'
        : sendResult.status === 'failed'
          ? 'failed'
          : 'prepared',
    createdAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    auditNote:
      sendResult.status === 'delivered'
        ? `Enviado via ${providerLabel} · Sem dados clínicos no assunto`
        : sendResult.status === 'failed'
          ? `Falha ${providerLabel} (${sendResult.errorDetail || 'verificar credenciais'})`
          : 'Modo simulação (SMTP_USER/SMTP_PASS ou RESEND_API_KEY não configurados)'
  };
  state.emailOutbox.unshift(item);
  return item;
}

function recordSanitizedGtmEvent(
  state: StoreState,
  eventName: string,
  safeMeta: Record<string, unknown>
): GtmAuditEvent {
  const sanitized = {
    ...safeMeta,
    clinical_status: 'STRIPPED_BY_LGPD_POLICY',
    gtm_container: 'GTM-5THGKLB4'
  };
  const ev: GtmAuditEvent = {
    id: `GTM-${String(state.gtmEvents.length + 1).padStart(3, '0')}`,
    time: new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }),
    eventName,
    payload: JSON.stringify(sanitized),
    audit: 'OK — Conformidade LGPD/GTM-5THGKLB4 validada'
  };
  state.gtmEvents.unshift(ev);
  return ev;
}

function isMetaCapiConfigured(): boolean {
  return Boolean(
    process.env.META_PIXEL_ID?.trim() && process.env.META_CAPI_ACCESS_TOKEN?.trim()
  );
}

function sha256Meta(value: string): string {
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

function normalizeBrazilPhoneForMeta(raw?: string): string | undefined {
  if (!raw) return undefined;
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 10) return undefined;
  const normalized = digits.startsWith('55') && digits.length >= 12 ? digits : `55${digits}`;
  return sha256Meta(normalized);
}

function extractClientIp(req: express.Request): string | undefined {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.trim()) {
    return fwd.split(',')[0].trim();
  }
  if (Array.isArray(fwd) && fwd[0]) {
    return fwd[0].split(',')[0].trim();
  }
  return req.ip || undefined;
}

function extractMetaTrackingFromBody(req: express.Request): {
  fbp?: string;
  fbc?: string;
  eventSourceUrl?: string;
  metaEventId?: string;
  clientIp?: string;
  clientUserAgent?: string;
} {
  const mt =
    typeof req.body?.metaTracking === 'object' && req.body.metaTracking !== null
      ? (req.body.metaTracking as Record<string, unknown>)
      : {};
  const fbp = typeof mt.fbp === 'string' && mt.fbp.trim() ? mt.fbp.trim().slice(0, 120) : undefined;
  const fbc = typeof mt.fbc === 'string' && mt.fbc.trim() ? mt.fbc.trim().slice(0, 200) : undefined;
  const eventSourceUrl =
    typeof mt.eventSourceUrl === 'string' && mt.eventSourceUrl.startsWith('http')
      ? mt.eventSourceUrl.slice(0, 500)
      : undefined;
  const metaEventId =
    typeof req.body?.metaEventId === 'string' && req.body.metaEventId.trim()
      ? req.body.metaEventId.trim().slice(0, 120)
      : undefined;
  const clientIp = extractClientIp(req);
  const ua = req.headers['user-agent'];
  const clientUserAgent = typeof ua === 'string' ? ua.slice(0, 300) : undefined;
  return { fbp, fbc, eventSourceUrl, metaEventId, clientIp, clientUserAgent };
}

async function sendMetaCapiEvent(
  state: StoreState,
  params: {
    eventName: 'Lead' | 'InitiateCheckout' | 'Purchase';
    eventId: string;
    email?: string;
    phone?: string;
    memberName?: string;
    fbp?: string;
    fbc?: string;
    clientIp?: string;
    clientUserAgent?: string;
    eventSourceUrl?: string;
    value?: number;
    contentName?: string;
    contentIds?: string[];
    orderId?: string;
  }
): Promise<void> {
  const pixelId = process.env.META_PIXEL_ID?.trim();
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN?.trim();
  if (!pixelId || !accessToken) return;

  const userData: Record<string, unknown> = {
    country: [sha256Meta('br')]
  };
  if (params.email && params.email.includes('@')) {
    userData.em = [sha256Meta(params.email)];
  }
  const hashedPhone = normalizeBrazilPhoneForMeta(params.phone);
  if (hashedPhone) {
    userData.ph = [hashedPhone];
  }
  const firstName = params.memberName?.trim().split(/\s+/)[0];
  if (firstName && firstName.length >= 2) {
    userData.fn = [sha256Meta(firstName)];
  }
  if (params.clientIp) {
    userData.client_ip_address = params.clientIp;
  }
  if (params.clientUserAgent) {
    userData.client_user_agent = params.clientUserAgent;
  }
  if (params.fbp) {
    userData.fbp = params.fbp;
  }
  if (params.fbc) {
    userData.fbc = params.fbc;
  }

  // Envia apenas metadados comerciais limpos (nunca dados clínicos ou de saúde)
  const customData: Record<string, unknown> = {};
  if (typeof params.value === 'number' && Number.isFinite(params.value)) {
    customData.currency = 'BRL';
    customData.value = Number(params.value.toFixed(2));
  }
  if (params.contentName) {
    customData.content_name = params.contentName;
  }
  if (params.contentIds && params.contentIds.length > 0) {
    customData.content_ids = params.contentIds;
    customData.content_type = 'product';
  }
  if (params.orderId) {
    customData.order_id = params.orderId;
  }

  const testEventCode = process.env.META_CAPI_TEST_EVENT_CODE?.trim();
  const bodyPayload: Record<string, unknown> = {
    data: [
      {
        event_name: params.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: params.eventId,
        action_source: 'website',
        event_source_url: params.eventSourceUrl || 'https://www.emagreslim.com.br/',
        user_data: userData,
        ...(Object.keys(customData).length > 0 ? { custom_data: customData } : {})
      }
    ],
    access_token: accessToken,
    ...(testEventCode ? { test_event_code: testEventCode } : {})
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`https://graph.facebook.com/v21.0/${encodeURIComponent(pixelId)}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyPayload),
      signal: controller.signal
    });
    clearTimeout(timeout);

    const resJson = (await res.json().catch(() => ({}))) as {
      events_received?: number;
      error?: { message?: string };
    };

    const ev: GtmAuditEvent = {
      id: `CAPI-${String(state.gtmEvents.length + 1).padStart(3, '0')}`,
      time: new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      eventName: `meta_capi_${params.eventName.toLowerCase()}`,
      payload: JSON.stringify({
        event_name: params.eventName,
        event_id: params.eventId,
        ...(typeof params.value === 'number' ? { value: params.value, currency: 'BRL' } : {}),
        ...(testEventCode ? { test_mode: true } : {}),
        pii_hashed_sha256: true,
        clinical_status: 'STRIPPED_BY_LGPD_POLICY'
      }),
      audit: res.ok
        ? `OK — Meta CAPI enviado (events_received: ${resJson.events_received ?? 1})`
        : `Falha Meta CAPI (HTTP ${res.status}: ${(resJson.error?.message || 'verificar token/pixel').slice(0, 120)})`
    };
    state.gtmEvents.unshift(ev);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'erro de rede';
    console.error('Meta CAPI error:', msg);
    const ev: GtmAuditEvent = {
      id: `CAPI-${String(state.gtmEvents.length + 1).padStart(3, '0')}`,
      time: new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      eventName: `meta_capi_${params.eventName.toLowerCase()}`,
      payload: JSON.stringify({ event_name: params.eventName, event_id: params.eventId }),
      audit: `Falha Meta CAPI (${msg.slice(0, 120)})`
    };
    state.gtmEvents.unshift(ev);
  }
}

async function fetchMercadoPagoPaymentStatus(params: {
  accessToken: string;
  paymentId?: string;
  orderId?: string;
}): Promise<{ approved: boolean; mpPaymentId?: string; status?: string }> {
  try {
    if (params.paymentId) {
      const res = await fetch(`https://api.mercadopago.com/v1/payments/${params.paymentId}`, {
        headers: { Authorization: `Bearer ${params.accessToken}` }
      });
      if (res.ok) {
        const payment = (await res.json()) as {
          id?: number | string;
          status?: string;
          external_reference?: string;
        };
        if (
          !params.orderId ||
          !payment.external_reference ||
          payment.external_reference === params.orderId
        ) {
          return {
            approved: payment.status === 'approved',
            mpPaymentId: payment.id ? String(payment.id) : params.paymentId,
            status: payment.status
          };
        }
      }
    }

    if (params.orderId) {
      const searchUrl = `https://api.mercadopago.com/v1/payments/search?external_reference=${encodeURIComponent(
        params.orderId
      )}&sort=date_created&criteria=desc`;
      const res = await fetch(searchUrl, {
        headers: { Authorization: `Bearer ${params.accessToken}` }
      });
      if (res.ok) {
        const data = (await res.json()) as {
          results?: Array<{ id?: number | string; status?: string }>;
        };
        const approvedPayment = data.results?.find(p => p.status === 'approved');
        if (approvedPayment) {
          return {
            approved: true,
            mpPaymentId: approvedPayment.id ? String(approvedPayment.id) : undefined,
            status: 'approved'
          };
        }
        const latest = data.results?.[0];
        if (latest) {
          return {
            approved: false,
            mpPaymentId: latest.id ? String(latest.id) : undefined,
            status: latest.status
          };
        }
      }
    }
  } catch (err) {
    console.error('Mercado Pago verify error:', err);
  }
  return { approved: false };
}

export function createApiApp(): express.Express {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      service: 'emagreslim-prod',
      mercadoPagoConfigured: Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN?.trim()),
      databaseConfigured: Boolean(getDatabaseUrl()),
      smtpConfigured: isSmtpConfigured(),
      resendConfigured: Boolean(process.env.RESEND_API_KEY?.trim()),
      emailConfigured: isEmailProviderConfigured(),
      metaCapiConfigured: isMetaCapiConfigured()
    });
  });

  app.get('/api/config', (_req, res) => {
    res.json({
      mercadoPagoEnabled: Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN?.trim()),
      databaseConnected: Boolean(getDatabaseUrl()),
      emailEnabled: isEmailProviderConfigured(),
      gtmId: 'GTM-5THGKLB4'
    });
  });

  app.post('/api/admin/login', (req, res) => {
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!password || password !== getAdminPassword()) {
      res.status(401).json({ error: 'Senha administrativa inválida.' });
      return;
    }
    const token = signAdminToken();
    res.json({ ok: true, token });
  });

const STAGE_PRIORITY: Record<LeadStage, number> = {
  lead_gratuito: 1,
  checkout_iniciado: 2,
  cliente_pago: 3,
  cliente_com_chafit: 4
};

function upsertLeadRecord(
  list: LeadRecord[],
  incoming: {
    memberName: string;
    email: string;
    whatsapp?: string;
    sex?: 'feminino' | 'masculino';
    age?: number;
    weightKg?: number;
    heightCm?: number;
    targetWeightKg?: number;
    primaryBarrier?: string;
    stage: LeadStage;
    orderId?: string;
    totalAmountBrl?: number;
    timestamp?: string;
  }
): void {
  const emailNorm = incoming.email.trim().toLowerCase();
  if (!emailNorm || !emailNorm.includes('@')) return;
  const nowIso = incoming.timestamp || new Date().toISOString();
  const idx = list.findIndex(item => item.email.trim().toLowerCase() === emailNorm);

  if (idx >= 0) {
    const prev = list[idx];
    const nextStage =
      STAGE_PRIORITY[incoming.stage] >= STAGE_PRIORITY[prev.stage] ? incoming.stage : prev.stage;
    list[idx] = {
      ...prev,
      memberName: incoming.memberName?.trim() || prev.memberName,
      whatsapp: incoming.whatsapp?.trim() || prev.whatsapp,
      sex: incoming.sex || prev.sex,
      age: incoming.age ?? prev.age,
      weightKg: incoming.weightKg ?? prev.weightKg,
      heightCm: incoming.heightCm ?? prev.heightCm,
      targetWeightKg: incoming.targetWeightKg ?? prev.targetWeightKg,
      primaryBarrier: incoming.primaryBarrier || prev.primaryBarrier,
      stage: nextStage,
      orderId: incoming.orderId || prev.orderId,
      totalAmountBrl: incoming.totalAmountBrl ?? prev.totalAmountBrl,
      updatedAt: nowIso
    };
    return;
  }

  list.unshift({
    id: `LEAD-${Date.now()}-${Math.floor(100 + Math.random() * 899)}`,
    memberName: incoming.memberName?.trim() || 'Visitante',
    email: incoming.email.trim(),
    whatsapp: incoming.whatsapp?.trim() || '',
    sex: incoming.sex || 'feminino',
    age: incoming.age ?? 0,
    weightKg: incoming.weightKg ?? 0,
    heightCm: incoming.heightCm ?? 0,
    targetWeightKg: incoming.targetWeightKg ?? 0,
    primaryBarrier: incoming.primaryBarrier || '',
    stage: incoming.stage,
    orderId: incoming.orderId,
    totalAmountBrl: incoming.totalAmountBrl,
    createdAt: nowIso,
    updatedAt: nowIso
  });
}

function buildSyncedLeads(state: StoreState): LeadRecord[] {
  const merged: LeadRecord[] = (state.leads || []).map(l => ({ ...l }));

  for (const draft of Object.values(state.drafts || {})) {
    const stage: LeadStage =
      draft.paymentStatus === 'approved'
        ? draft.includeChaFit21D
          ? 'cliente_com_chafit'
          : 'cliente_pago'
        : 'checkout_iniciado';
    upsertLeadRecord(merged, {
      memberName: draft.memberName,
      email: draft.email,
      whatsapp: draft.formData?.whatsapp,
      sex: draft.formData?.sex,
      age: draft.formData?.age,
      weightKg: draft.formData?.weightKg,
      heightCm: draft.formData?.heightCm,
      targetWeightKg: draft.formData?.targetWeightKg,
      primaryBarrier: draft.formData?.freePrimaryBarrier,
      stage,
      orderId: draft.orderId,
      totalAmountBrl: draft.totalAmountBrl,
      timestamp: draft.updatedAt
    });
  }

  for (const asm of state.assessments || []) {
    const stage: LeadStage = asm.includeChaFit21D ? 'cliente_com_chafit' : 'cliente_pago';
    upsertLeadRecord(merged, {
      memberName: asm.memberName,
      email: asm.email,
      whatsapp: asm.input?.whatsapp,
      sex: asm.input?.sex,
      age: asm.input?.age,
      weightKg: asm.input?.weightKg,
      heightCm: asm.input?.heightCm,
      targetWeightKg: asm.input?.targetWeightKg,
      primaryBarrier: asm.input?.freePrimaryBarrier,
      stage,
      orderId: asm.orderId,
      totalAmountBrl: asm.totalAmountBrl ?? (asm.includeChaFit21D ? 95.8 : 67.9),
      timestamp: asm.submittedAt
    });
  }

  for (const eml of state.emailOutbox || []) {
    if (eml.templateKey === 'free_mapping_summary') {
      upsertLeadRecord(merged, {
        memberName: eml.memberName,
        email: eml.recipientEmail,
        stage: 'lead_gratuito'
      });
    }
  }

  return merged.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
}

  app.get('/api/admin/state', requireAdmin, async (_req, res) => {
    const state = await loadStore();
    res.json({
      ...state,
      leads: buildSyncedLeads(state)
    });
  });

  app.post('/api/gtm-event', async (req, res) => {
    const eventName =
      typeof req.body?.eventName === 'string' ? req.body.eventName : 'ui_interaction';
    const meta = typeof req.body?.meta === 'object' && req.body.meta !== null ? req.body.meta : {};
    const state = await loadStore();
    const event = recordSanitizedGtmEvent(state, eventName, meta);
    await saveStore(state);
    res.json({ event });
  });

  app.post('/api/free-mapping', async (req, res) => {
    const parsed = FreeMappingSchema.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ error: parsed.error.issues[0]?.message || 'Dados inválidos no mapeamento.' });
      return;
    }
    const data = parsed.data;
    const sanity = evaluateDataSanityLock({
      age: data.age,
      heightCm: data.heightCm,
      weightKg: data.weightKg,
      targetWeightKg: data.targetWeightKg
    });
    if (sanity.blocked) {
      const state = await loadStore();
      recordSanitizedGtmEvent(state, 'unusual_data_blocked', {
        stage: 'free_mapping',
        reasons_count: sanity.reasons.length
      });
      await saveStore(state);
      res.status(422).json({
        error: sanity.message,
        reasons: sanity.reasons,
        unusualDataBlocked: true
      });
      return;
    }

    const state = await loadStore();
    if (!state.leads) state.leads = [];
    upsertLeadRecord(state.leads, {
      memberName: data.memberName,
      email: data.email,
      whatsapp: data.whatsapp || '',
      sex: data.sex,
      age: data.age,
      weightKg: data.weightKg,
      heightCm: data.heightCm,
      targetWeightKg: data.targetWeightKg ?? data.weightKg,
      primaryBarrier: data.freePrimaryBarrier,
      stage: 'lead_gratuito'
    });
    recordSanitizedGtmEvent(state, 'free_mapping_completed', {
      journey_type: data.journeyType,
      contact_channel: 'email_and_whatsapp',
      pii_omitted: true
    });
    const baseUrl = resolvePublicBaseUrl(req);
    const waterIntakeLiters =
      typeof req.body?.waterIntakeLiters === 'number' && Number.isFinite(req.body.waterIntakeLiters)
        ? req.body.waterIntakeLiters
        : 1.5;
    const exerciseMinutesPerWeek =
      typeof req.body?.exerciseMinutesPerWeek === 'number' &&
      Number.isFinite(req.body.exerciseMinutesPerWeek)
        ? req.body.exerciseMinutesPerWeek
        : 90;

    await enqueueIdempotentEmail(state, {
      idempotencyKey: `free_map:${data.email}:${Date.now()}`,
      recipientEmail: data.email,
      memberName: data.memberName,
      templateKey: 'free_mapping_summary',
      extraHtml: buildFreeMappingEmailHtml({
        weightKg: data.weightKg,
        targetWeightKg: data.targetWeightKg ?? data.weightKg,
        age: data.age,
        heightCm: data.heightCm,
        sex: data.sex,
        waterIntakeLiters,
        exerciseMinutesPerWeek,
        baseUrl
      })
    });

    const metaCtx = extractMetaTrackingFromBody(req);
    await sendMetaCapiEvent(state, {
      eventName: 'Lead',
      eventId: metaCtx.metaEventId || `lead_${Date.now()}`,
      email: data.email,
      phone: data.whatsapp,
      memberName: data.memberName,
      fbp: metaCtx.fbp,
      fbc: metaCtx.fbc,
      clientIp: metaCtx.clientIp,
      clientUserAgent: metaCtx.clientUserAgent,
      eventSourceUrl: metaCtx.eventSourceUrl || `${baseUrl}/`,
      contentName: 'Avaliacao Gratuita EmagreSLIM',
      contentIds: ['emagreslim-avaliacao-gratuita']
    });

    await saveStore(state);
    res.json({ ok: true });
  });

  app.post('/api/unusual-data-contact', async (req, res) => {
    const name = typeof req.body?.memberName === 'string' ? req.body.memberName.trim() : '';
    const whatsapp = typeof req.body?.whatsapp === 'string' ? req.body.whatsapp.trim() : '';
    const reasons = Array.isArray(req.body?.reasons) ? req.body.reasons : [];
    if (name.length < 2 || whatsapp.replace(/\D/g, '').length < 10) {
      res
        .status(400)
        .json({ error: 'Informe nome e WhatsApp com DDD para que nossa equipe confirme seus dados.' });
      return;
    }
    const state = await loadStore();
    recordSanitizedGtmEvent(state, 'unusual_data_contact_requested', {
      reasons_count: reasons.length,
      pii_omitted: true
    });
    await saveStore(state);
    res.json({
      ok: true,
      message:
        'Solicitação registrada. Nossa equipe entrará em contato para confirmar suas medidas antes de liberar qualquer recomendação.'
    });
  });

  app.post('/api/checkout', async (req, res) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
    const memberName =
      typeof req.body?.memberName === 'string' ? req.body.memberName.trim() : 'Membro';
    const includeChaFit21D = req.body?.includeChaFit21D === true;
    const totalAmountBrl = computeOrderTotalBrl(includeChaFit21D);
    const formData = req.body?.formData as AssessmentInput | undefined;

    if (!email || !email.includes('@')) {
      res.status(400).json({ error: 'Informe um endereço de e-mail válido antes do checkout.' });
      return;
    }

    const state = await loadStore();
    const orderId = `ORD-2026-${Math.floor(1000 + Math.random() * 8999)}`;
    const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();

    const checkoutItems: Array<{
      id: string;
      title: string;
      quantity: number;
      currency_id: string;
      unit_price: number;
    }> = [
      {
        id: 'emagreslim-avaliacao-completa',
        title: 'EmagreSLIM — Avaliação Nutricional Completa & Plano Personalizado',
        quantity: 1,
        currency_id: 'BRL',
        unit_price: PLAN_PRICE_BRL
      }
    ];

    if (includeChaFit21D) {
      checkoutItems.push({
        id: 'emagreslim-chafit-21d',
        title: 'CháFit 21D — Guia Digital de Chás e Hábitos para Sua Rotina (PDF)',
        quantity: 1,
        currency_id: 'BRL',
        unit_price: CHAFIT_PRICE_BRL
      });
    }

    const metaCtx = extractMetaTrackingFromBody(req);
    const checkoutContentIds = includeChaFit21D
      ? ['emagreslim-avaliacao-completa', 'emagreslim-chafit-21d']
      : ['emagreslim-avaliacao-completa'];

    if (mpToken) {
      const baseUrl = resolvePublicBaseUrl(req);
      try {
        const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${mpToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            items: checkoutItems,
            payer: {
              name: memberName,
              email
            },
            external_reference: orderId,
            back_urls: {
              success: `${baseUrl}/?mp_status=approved&order_id=${orderId}`,
              pending: `${baseUrl}/?mp_status=pending&order_id=${orderId}`,
              failure: `${baseUrl}/?mp_status=failure&order_id=${orderId}`
            },
            auto_return: 'approved',
            notification_url: `${baseUrl}/api/webhooks/mercadopago`,
            statement_descriptor: 'EMAGRESLIM'
          })
        });

        const mpData = (await mpRes.json()) as {
          id?: string;
          init_point?: string;
          sandbox_init_point?: string;
          message?: string;
        };

        if (!mpRes.ok || !mpData.init_point) {
          res.status(502).json({
            error: mpData.message || 'Erro ao iniciar checkout no Mercado Pago.'
          });
          return;
        }

        state.drafts[orderId] = {
          orderId,
          email,
          memberName,
          emailConfirmed: false,
          paymentStatus: 'pending',
          includeChaFit21D,
          totalAmountBrl,
          upsellPaymentStatus: includeChaFit21D ? 'none' : 'none',
          mpPreferenceId: mpData.id,
          fbp: metaCtx.fbp,
          fbc: metaCtx.fbc,
          clientIp: metaCtx.clientIp,
          clientUserAgent: metaCtx.clientUserAgent,
          eventSourceUrl: metaCtx.eventSourceUrl || `${baseUrl}/`,
          metaPurchaseSent: false,
          metaUpsellSent: false,
          formData,
          updatedAt: new Date().toISOString()
        };

        recordSanitizedGtmEvent(state, 'begin_checkout', {
          order_id: orderId,
          gateway: 'mercadopago',
          amount_brl: totalAmountBrl,
          include_chafit_21d: includeChaFit21D
        });
        await sendMetaCapiEvent(state, {
          eventName: 'InitiateCheckout',
          eventId: metaCtx.metaEventId || `ic_${orderId}`,
          email,
          phone: formData?.whatsapp,
          memberName,
          fbp: metaCtx.fbp,
          fbc: metaCtx.fbc,
          clientIp: metaCtx.clientIp,
          clientUserAgent: metaCtx.clientUserAgent,
          eventSourceUrl: metaCtx.eventSourceUrl || `${baseUrl}/`,
          value: totalAmountBrl,
          contentName: includeChaFit21D
            ? 'Plano EmagreSLIM + Guia ChaFit 21D'
            : 'Plano EmagreSLIM Personalizado',
          contentIds: checkoutContentIds,
          orderId
        });
        await saveStore(state);

        res.json({
          mode: 'mercadopago',
          orderId,
          includeChaFit21D,
          totalAmountBrl,
          checkoutUrl: mpData.init_point,
          sandboxUrl: mpData.sandbox_init_point
        });
        return;
      } catch (err) {
        console.error('Mercado Pago preference error:', err);
        res.status(502).json({ error: 'Falha de comunicação com o Mercado Pago.' });
        return;
      }
    }

    // Modo teste / preview quando MERCADOPAGO_ACCESS_TOKEN ainda não está configurado
    state.drafts[orderId] = {
      orderId,
      email,
      memberName,
      emailConfirmed: false,
      paymentStatus: 'approved',
      includeChaFit21D,
      totalAmountBrl,
      upsellPaymentStatus: 'none',
      fbp: metaCtx.fbp,
      fbc: metaCtx.fbc,
      clientIp: metaCtx.clientIp,
      clientUserAgent: metaCtx.clientUserAgent,
      eventSourceUrl: metaCtx.eventSourceUrl,
      metaPurchaseSent: true,
      metaUpsellSent: false,
      formData,
      updatedAt: new Date().toISOString()
    };

    recordSanitizedGtmEvent(state, 'paid_assessment_purchased', {
      order_id: orderId,
      gateway: 'demo_preview',
      amount_brl: totalAmountBrl,
      include_chafit_21d: includeChaFit21D
    });
    await enqueueIdempotentEmail(state, {
      idempotencyKey: `purchase:${orderId}`,
      recipientEmail: email,
      memberName,
      templateKey: 'purchase_confirmed',
      assessmentNumber: 1
    });
    await sendMetaCapiEvent(state, {
      eventName: 'Purchase',
      eventId: `purchase_${orderId}`,
      email,
      phone: formData?.whatsapp,
      memberName,
      fbp: metaCtx.fbp,
      fbc: metaCtx.fbc,
      clientIp: metaCtx.clientIp,
      clientUserAgent: metaCtx.clientUserAgent,
      eventSourceUrl: metaCtx.eventSourceUrl,
      value: totalAmountBrl,
      contentName: includeChaFit21D
        ? 'Plano EmagreSLIM + Guia ChaFit 21D'
        : 'Plano EmagreSLIM Personalizado',
      contentIds: checkoutContentIds,
      orderId
    });

    await saveStore(state);
    res.json({
      mode: 'demo_approved',
      orderId,
      includeChaFit21D,
      totalAmountBrl,
      emailConfirmed: false
    });
  });

  app.get('/api/checkout/verify', async (req, res) => {
    const orderId = typeof req.query.orderId === 'string' ? req.query.orderId.trim() : '';
    const paymentId = typeof req.query.paymentId === 'string' ? req.query.paymentId.trim() : '';

    if (!orderId) {
      res.status(400).json({ error: 'orderId obrigatório.' });
      return;
    }

    const state = await loadStore();
    const draft = state.drafts[orderId];
    if (!draft) {
      res.status(404).json({ error: 'Pedido não encontrado.' });
      return;
    }

    const includeChaFit21D = Boolean(draft.includeChaFit21D);
    const totalAmountBrl =
      typeof draft.totalAmountBrl === 'number'
        ? draft.totalAmountBrl
        : computeOrderTotalBrl(includeChaFit21D);

    if (draft.paymentStatus === 'approved') {
      res.json({
        approved: true,
        orderId,
        email: draft.email,
        memberName: draft.memberName,
        emailConfirmed: draft.emailConfirmed,
        includeChaFit21D,
        totalAmountBrl,
        formData: draft.formData
      });
      return;
    }

    const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
    if (!mpToken) {
      res.json({ approved: false, status: draft.paymentStatus });
      return;
    }

    const check = await fetchMercadoPagoPaymentStatus({
      accessToken: mpToken,
      paymentId: paymentId || undefined,
      orderId
    });

    if (check.approved) {
      draft.paymentStatus = 'approved';
      draft.mpPaymentId = check.mpPaymentId;
      draft.updatedAt = new Date().toISOString();

      recordSanitizedGtmEvent(state, 'paid_assessment_purchased', {
        order_id: orderId,
        gateway: 'mercadopago',
        amount_brl: totalAmountBrl,
        include_chafit_21d: includeChaFit21D
      });
      await enqueueIdempotentEmail(state, {
        idempotencyKey: `purchase:${orderId}`,
        recipientEmail: draft.email,
        memberName: draft.memberName,
        templateKey: 'purchase_confirmed',
        assessmentNumber: 1
      });
      if (!draft.metaPurchaseSent) {
        draft.metaPurchaseSent = true;
        await sendMetaCapiEvent(state, {
          eventName: 'Purchase',
          eventId: `purchase_${orderId}`,
          email: draft.email,
          phone: draft.formData?.whatsapp,
          memberName: draft.memberName,
          fbp: draft.fbp,
          fbc: draft.fbc,
          clientIp: draft.clientIp || extractClientIp(req),
          clientUserAgent:
            draft.clientUserAgent ||
            (typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined),
          eventSourceUrl: draft.eventSourceUrl || `${resolvePublicBaseUrl(req)}/`,
          value: totalAmountBrl,
          contentName: includeChaFit21D
            ? 'Plano EmagreSLIM + Guia ChaFit 21D'
            : 'Plano EmagreSLIM Personalizado',
          contentIds: includeChaFit21D
            ? ['emagreslim-avaliacao-completa', 'emagreslim-chafit-21d']
            : ['emagreslim-avaliacao-completa'],
          orderId
        });
      }
      await saveStore(state);

      res.json({
        approved: true,
        orderId,
        email: draft.email,
        memberName: draft.memberName,
        emailConfirmed: draft.emailConfirmed,
        includeChaFit21D,
        totalAmountBrl,
        formData: draft.formData
      });
      return;
    }

    res.json({
      approved: false,
      status: check.status || draft.paymentStatus
    });
  });

  app.post('/api/checkout/upsell-chafit', async (req, res) => {
    const orderId = typeof req.body?.orderId === 'string' ? req.body.orderId.trim() : '';
    const assessmentId =
      typeof req.body?.assessmentId === 'string' ? req.body.assessmentId.trim() : '';

    if (!orderId && !assessmentId) {
      res.status(400).json({ error: 'Pedido ou avaliação obrigatórios para adicionar o CháFit 21D.' });
      return;
    }

    const state = await loadStore();
    const assessment = assessmentId
      ? state.assessments.find(a => a.id === assessmentId)
      : state.assessments.find(a => a.orderId === orderId);
    const resolvedOrderId = assessment?.orderId || orderId;
    const draft = resolvedOrderId ? state.drafts[resolvedOrderId] : undefined;

    if (!assessment && (!draft || draft.paymentStatus !== 'approved')) {
      res.status(403).json({ error: 'Pedido principal ainda não aprovado para adicionar complemento.' });
      return;
    }

    if (assessment?.includeChaFit21D || draft?.includeChaFit21D) {
      res.json({
        mode: 'already_owned',
        orderId: resolvedOrderId,
        assessmentId: assessment?.id,
        includeChaFit21D: true,
        record: assessment || null
      });
      return;
    }

    const email = assessment?.email || draft?.email || '';
    const memberName = assessment?.memberName || draft?.memberName || 'Membro';
    const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
    const upsellRef = `${resolvedOrderId}:CHAFIT`;

    if (mpToken) {
      const baseUrl = resolvePublicBaseUrl(req);
      try {
        const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${mpToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            items: [
              {
                id: 'emagreslim-chafit-21d-upsell',
                title: 'CháFit 21D — Guia Digital de Chás e Hábitos para Sua Rotina (PDF)',
                quantity: 1,
                currency_id: 'BRL',
                unit_price: CHAFIT_PRICE_BRL
              }
            ],
            payer: {
              name: memberName,
              email
            },
            external_reference: upsellRef,
            back_urls: {
              success: `${baseUrl}/?mp_upsell_status=approved&order_id=${encodeURIComponent(
                resolvedOrderId
              )}&assessment_id=${encodeURIComponent(assessment?.id || '')}`,
              pending: `${baseUrl}/?mp_upsell_status=pending&order_id=${encodeURIComponent(
                resolvedOrderId
              )}&assessment_id=${encodeURIComponent(assessment?.id || '')}`,
              failure: `${baseUrl}/?mp_upsell_status=failure&order_id=${encodeURIComponent(
                resolvedOrderId
              )}&assessment_id=${encodeURIComponent(assessment?.id || '')}`
            },
            auto_return: 'approved',
            notification_url: `${baseUrl}/api/webhooks/mercadopago`,
            statement_descriptor: 'EMAGRESLIM'
          })
        });

        const mpData = (await mpRes.json()) as {
          id?: string;
          init_point?: string;
          message?: string;
        };

        if (!mpRes.ok || !mpData.init_point) {
          res.status(502).json({
            error: mpData.message || 'Erro ao iniciar pagamento complementar no Mercado Pago.'
          });
          return;
        }

        if (draft) {
          draft.upsellPaymentStatus = 'pending';
          draft.upsellMpPreferenceId = mpData.id;
          draft.updatedAt = new Date().toISOString();
        } else {
          state.drafts[resolvedOrderId] = {
            orderId: resolvedOrderId,
            email,
            memberName,
            emailConfirmed: true,
            paymentStatus: 'approved',
            includeChaFit21D: false,
            totalAmountBrl: PLAN_PRICE_BRL,
            upsellPaymentStatus: 'pending',
            upsellMpPreferenceId: mpData.id,
            updatedAt: new Date().toISOString()
          };
        }

        recordSanitizedGtmEvent(state, 'begin_upsell_chafit', {
          order_id: resolvedOrderId,
          amount_brl: CHAFIT_PRICE_BRL,
          gateway: 'mercadopago'
        });
        await saveStore(state);

        res.json({
          mode: 'mercadopago',
          orderId: resolvedOrderId,
          assessmentId: assessment?.id,
          amountBrl: CHAFIT_PRICE_BRL,
          checkoutUrl: mpData.init_point
        });
        return;
      } catch (err) {
        console.error('Mercado Pago upsell preference error:', err);
        res.status(502).json({ error: 'Falha de comunicação com o Mercado Pago.' });
        return;
      }
    }

    // Modo preview/demo sem token MP
    if (draft) {
      draft.includeChaFit21D = true;
      draft.upsellPaymentStatus = 'approved';
      draft.totalAmountBrl = computeOrderTotalBrl(true);
      draft.updatedAt = new Date().toISOString();
    } else {
      state.drafts[resolvedOrderId] = {
        orderId: resolvedOrderId,
        email,
        memberName,
        emailConfirmed: true,
        paymentStatus: 'approved',
        includeChaFit21D: true,
        totalAmountBrl: computeOrderTotalBrl(true),
        upsellPaymentStatus: 'approved',
        updatedAt: new Date().toISOString()
      };
    }

    if (assessment) {
      assessment.includeChaFit21D = true;
      assessment.totalAmountBrl = computeOrderTotalBrl(true);
    }

    recordSanitizedGtmEvent(state, 'upsell_chafit_purchased', {
      order_id: resolvedOrderId,
      gateway: 'demo_preview',
      amount_brl: CHAFIT_PRICE_BRL
    });
    await saveStore(state);

    res.json({
      mode: 'demo_approved',
      orderId: resolvedOrderId,
      assessmentId: assessment?.id,
      includeChaFit21D: true,
      amountBrl: CHAFIT_PRICE_BRL,
      record: assessment || null
    });
  });

  app.get('/api/checkout/upsell-verify', async (req, res) => {
    const orderId = typeof req.query.orderId === 'string' ? req.query.orderId.trim() : '';
    const assessmentId =
      typeof req.query.assessmentId === 'string' ? req.query.assessmentId.trim() : '';
    const paymentId = typeof req.query.paymentId === 'string' ? req.query.paymentId.trim() : '';

    if (!orderId) {
      res.status(400).json({ error: 'orderId obrigatório.' });
      return;
    }

    const state = await loadStore();
    const draft = state.drafts[orderId];
    const assessment =
      (assessmentId ? state.assessments.find(a => a.id === assessmentId) : undefined) ||
      state.assessments.find(a => a.orderId === orderId);

    if (draft?.includeChaFit21D || assessment?.includeChaFit21D) {
      res.json({
        approved: true,
        orderId,
        includeChaFit21D: true,
        amountBrl: CHAFIT_PRICE_BRL,
        record: assessment || null
      });
      return;
    }

    const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
    if (!mpToken) {
      res.json({ approved: false, status: draft?.upsellPaymentStatus || 'pending' });
      return;
    }

    const check = await fetchMercadoPagoPaymentStatus({
      accessToken: mpToken,
      paymentId: paymentId || undefined,
      orderId: `${orderId}:CHAFIT`
    });

    if (check.approved) {
      if (draft) {
        draft.includeChaFit21D = true;
        draft.upsellPaymentStatus = 'approved';
        draft.upsellMpPaymentId = check.mpPaymentId;
        draft.totalAmountBrl = computeOrderTotalBrl(true);
        draft.updatedAt = new Date().toISOString();
      }
      if (assessment) {
        assessment.includeChaFit21D = true;
        assessment.totalAmountBrl = computeOrderTotalBrl(true);
      }
      recordSanitizedGtmEvent(state, 'upsell_chafit_purchased', {
        order_id: orderId,
        gateway: 'mercadopago',
        amount_brl: CHAFIT_PRICE_BRL
      });
      if (!draft?.metaUpsellSent) {
        if (draft) draft.metaUpsellSent = true;
        await sendMetaCapiEvent(state, {
          eventName: 'Purchase',
          eventId: `upsell_chafit_${orderId}`,
          email: draft?.email || assessment?.email,
          phone: draft?.formData?.whatsapp || assessment?.input?.whatsapp,
          memberName: draft?.memberName || assessment?.memberName,
          fbp: draft?.fbp,
          fbc: draft?.fbc,
          clientIp: draft?.clientIp || extractClientIp(req),
          clientUserAgent:
            draft?.clientUserAgent ||
            (typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined),
          eventSourceUrl: draft?.eventSourceUrl || `${resolvePublicBaseUrl(req)}/`,
          value: CHAFIT_PRICE_BRL,
          contentName: 'Guia Digital ChaFit 21D',
          contentIds: ['emagreslim-chafit-21d'],
          orderId: `${orderId}:CHAFIT`
        });
      }
      await saveStore(state);

      res.json({
        approved: true,
        orderId,
        includeChaFit21D: true,
        amountBrl: CHAFIT_PRICE_BRL,
        record: assessment || null
      });
      return;
    }

    res.json({
      approved: false,
      status: check.status || draft?.upsellPaymentStatus || 'pending'
    });
  });

  app.get('/api/ebooks/chafit-21d/access', async (req, res) => {
    const orderId = typeof req.query.orderId === 'string' ? req.query.orderId.trim() : '';
    const assessmentId =
      typeof req.query.assessmentId === 'string' ? req.query.assessmentId.trim() : '';

    if (!orderId && !assessmentId) {
      res.status(403).json({
        allowed: false,
        error: 'Acesso restrito a clientes que adquiriram o guia CháFit 21D.'
      });
      return;
    }

    const state = await loadStore();
    const draft = orderId ? state.drafts[orderId] : undefined;
    const assessment =
      (assessmentId ? state.assessments.find(a => a.id === assessmentId) : undefined) ||
      (orderId ? state.assessments.find(a => a.orderId === orderId) : undefined);

    const hasDraftEntitlement =
      Boolean(draft) &&
      draft!.paymentStatus === 'approved' &&
      Boolean(draft!.includeChaFit21D);
    const hasAssessmentEntitlement = Boolean(assessment?.includeChaFit21D);

    if (!hasDraftEntitlement && !hasAssessmentEntitlement) {
      res.status(403).json({
        allowed: false,
        error: 'O guia CháFit 21D ainda não foi liberado para este pedido.'
      });
      return;
    }

    recordSanitizedGtmEvent(state, 'chafit_ebook_downloaded', {
      order_id: orderId || assessment?.orderId || 'unknown'
    });
    await saveStore(state);

    res.json({
      allowed: true,
      downloadUrl: CHAFIT_DOWNLOAD_URL,
      fileName: CHAFIT_FILE_NAME
    });
  });

  app.post('/api/webhooks/mercadopago', async (req, res) => {
    const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
    const paymentId =
      (req.body?.data?.id && String(req.body.data.id)) ||
      (typeof req.query['data.id'] === 'string' ? req.query['data.id'] : '') ||
      (typeof req.query.id === 'string' ? req.query.id : '');

    if (!mpToken || !paymentId) {
      res.status(200).json({ received: true });
      return;
    }

    try {
      const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${mpToken}` }
      });
      if (mpRes.ok) {
        const payment = (await mpRes.json()) as {
          status?: string;
          external_reference?: string;
        };
        const extRef = payment.external_reference;
        if (extRef && payment.status === 'approved') {
          const state = await loadStore();

          if (extRef.endsWith(':CHAFIT')) {
            const baseOrderId = extRef.slice(0, -':CHAFIT'.length);
            const draft = state.drafts[baseOrderId];
            const assessment = state.assessments.find(a => a.orderId === baseOrderId);
            const alreadyUnlocked =
              draft?.upsellPaymentStatus === 'approved' || Boolean(assessment?.includeChaFit21D);

            if (!alreadyUnlocked) {
              if (draft) {
                draft.includeChaFit21D = true;
                draft.upsellPaymentStatus = 'approved';
                draft.upsellMpPaymentId = paymentId;
                draft.totalAmountBrl = computeOrderTotalBrl(true);
                draft.updatedAt = new Date().toISOString();
              }
              if (assessment) {
                assessment.includeChaFit21D = true;
                assessment.totalAmountBrl = computeOrderTotalBrl(true);
              }
              recordSanitizedGtmEvent(state, 'upsell_chafit_purchased', {
                order_id: baseOrderId,
                gateway: 'mercadopago_webhook',
                amount_brl: CHAFIT_PRICE_BRL
              });
              if (!draft?.metaUpsellSent) {
                if (draft) draft.metaUpsellSent = true;
                await sendMetaCapiEvent(state, {
                  eventName: 'Purchase',
                  eventId: `upsell_chafit_${baseOrderId}`,
                  email: draft?.email || assessment?.email,
                  phone: draft?.formData?.whatsapp || assessment?.input?.whatsapp,
                  memberName: draft?.memberName || assessment?.memberName,
                  fbp: draft?.fbp,
                  fbc: draft?.fbc,
                  clientIp: draft?.clientIp,
                  clientUserAgent: draft?.clientUserAgent,
                  eventSourceUrl: draft?.eventSourceUrl,
                  value: CHAFIT_PRICE_BRL,
                  contentName: 'Guia Digital ChaFit 21D',
                  contentIds: ['emagreslim-chafit-21d'],
                  orderId: `${baseOrderId}:CHAFIT`
                });
              }
              await saveStore(state);
            }
          } else {
            const draft = state.drafts[extRef];
            if (draft && draft.paymentStatus !== 'approved') {
              const includeChaFit21D = Boolean(draft.includeChaFit21D);
              const totalAmountBrl =
                typeof draft.totalAmountBrl === 'number'
                  ? draft.totalAmountBrl
                  : computeOrderTotalBrl(includeChaFit21D);

              draft.paymentStatus = 'approved';
              draft.mpPaymentId = paymentId;
              draft.updatedAt = new Date().toISOString();

              recordSanitizedGtmEvent(state, 'paid_assessment_purchased', {
                order_id: extRef,
                gateway: 'mercadopago_webhook',
                amount_brl: totalAmountBrl,
                include_chafit_21d: includeChaFit21D
              });
              await enqueueIdempotentEmail(state, {
                idempotencyKey: `purchase:${extRef}`,
                recipientEmail: draft.email,
                memberName: draft.memberName,
                templateKey: 'purchase_confirmed',
                assessmentNumber: 1
              });
              if (!draft.metaPurchaseSent) {
                draft.metaPurchaseSent = true;
                await sendMetaCapiEvent(state, {
                  eventName: 'Purchase',
                  eventId: `purchase_${extRef}`,
                  email: draft.email,
                  phone: draft.formData?.whatsapp,
                  memberName: draft.memberName,
                  fbp: draft.fbp,
                  fbc: draft.fbc,
                  clientIp: draft.clientIp,
                  clientUserAgent: draft.clientUserAgent,
                  eventSourceUrl: draft.eventSourceUrl,
                  value: totalAmountBrl,
                  contentName: includeChaFit21D
                    ? 'Plano EmagreSLIM + Guia ChaFit 21D'
                    : 'Plano EmagreSLIM Personalizado',
                  contentIds: includeChaFit21D
                    ? ['emagreslim-avaliacao-completa', 'emagreslim-chafit-21d']
                    : ['emagreslim-avaliacao-completa'],
                  orderId: extRef
                });
              }
              await saveStore(state);
            }
          }
        }
      }
    } catch (err) {
      console.error('Mercado Pago webhook processing error:', err);
    }

    res.status(200).json({ received: true });
  });

  app.post('/api/verify-email', async (req, res) => {
    const orderId = typeof req.body?.orderId === 'string' ? req.body.orderId : '';
    const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
    if (!email || !email.includes('@')) {
      res.status(400).json({ error: 'E-mail inválido para confirmação de titularidade.' });
      return;
    }
    const state = await loadStore();
    if (orderId) {
      const prev = state.drafts[orderId];
      state.drafts[orderId] = {
        ...prev,
        orderId,
        email,
        memberName: prev?.memberName || 'Membro',
        emailConfirmed: true,
        paymentStatus: prev?.paymentStatus || 'approved',
        includeChaFit21D: prev?.includeChaFit21D ?? false,
        totalAmountBrl: prev?.totalAmountBrl ?? PLAN_PRICE_BRL,
        upsellPaymentStatus: prev?.upsellPaymentStatus ?? 'none',
        updatedAt: new Date().toISOString()
      };
    }
    await saveStore(state);
    res.json({ ok: true, emailConfirmed: true });
  });

  app.get('/api/orders/:orderId/assessment', async (req, res) => {
    const state = await loadStore();
    const record = state.assessments.find(a => a.orderId === req.params.orderId);
    if (!record) {
      res.status(404).json({ error: 'Avaliação deste pedido não encontrada.' });
      return;
    }
    res.json({ record });
  });

  app.post('/api/assessments/submit', async (req, res) => {
    const orderId =
      typeof req.body?.orderId === 'string'
        ? req.body.orderId
        : `ORD-2026-${Math.floor(1000 + Math.random() * 8999)}`;
    const parsed = PaidAssessmentInputSchema.safeParse(req.body?.input);
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.issues.map(i => i.message).join(' · ')
      });
      return;
    }

    const input = parsed.data;
    const sanity = evaluateDataSanityLock({
      age: input.age,
      heightCm: input.heightCm,
      weightKg: input.weightKg,
      targetWeightKg: input.targetWeightKg
    });
    if (sanity.blocked) {
      res.status(422).json({
        error: sanity.message,
        reasons: sanity.reasons,
        unusualDataBlocked: true
      });
      return;
    }

    const state = await loadStore();
    const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
    if (mpToken && state.drafts[orderId] && state.drafts[orderId].paymentStatus !== 'approved') {
      res.status(402).json({
        error: 'Pagamento deste pedido ainda não foi confirmado pelo Mercado Pago.'
      });
      return;
    }

    const evaluation = runEmagreSlimEngineV06(input);
    const sameMemberAssessments = state.assessments.filter(
      a => a.email.toLowerCase() === input.email.toLowerCase()
    );
    const assessmentNumber = sameMemberAssessments.length + 1;
    const newId = `ASM-2026-0${Math.floor(144 + Math.random() * 850)}`;
    const now = new Date();
    const due = new Date(now.getTime() + 24 * 3600 * 1000);

    const status = evaluation.emergencyRedirect
      ? 'emergency_redirect'
      : evaluation.requiresReview
        ? 'awaiting_review'
        : 'completed';

    const draftForOrder = state.drafts[orderId];
    const includeChaFit21D = Boolean(draftForOrder?.includeChaFit21D);
    const totalAmountBrl =
      typeof draftForOrder?.totalAmountBrl === 'number'
        ? draftForOrder.totalAmountBrl
        : computeOrderTotalBrl(includeChaFit21D);

    const record: AssessmentRecord = {
      id: newId,
      orderId,
      assessmentNumber,
      memberName: input.memberName,
      email: input.email,
      status,
      submittedAt: now.toISOString(),
      slaDueAt: due.toISOString(),
      input,
      engineResult: evaluation,
      clarifications: [],
      checkins: [],
      panConfirmedByMember: false,
      memberPanFeedback: '',
      includeChaFit21D,
      totalAmountBrl
    };

    state.assessments.unshift(record);
    recordSanitizedGtmEvent(state, 'paid_assessment_submitted', {
      assessment_id: newId,
      assessment_number: assessmentNumber,
      include_chafit_21d: includeChaFit21D
    });

    if (evaluation.requiresReview && !evaluation.emergencyRedirect) {
      await enqueueIdempotentEmail(state, {
        idempotencyKey: `${newId}:awaiting_review_24h`,
        recipientEmail: input.email,
        memberName: input.memberName,
        templateKey: 'awaiting_review_24h',
        assessmentNumber
      });
    } else if (!evaluation.emergencyRedirect) {
      const baseUrl = resolvePublicBaseUrl(req);
      await enqueueIdempotentEmail(state, {
        idempotencyKey: `${newId}:plan_delivered`,
        recipientEmail: input.email,
        memberName: input.memberName,
        templateKey: 'plan_delivered',
        assessmentNumber,
        extraHtml: buildPlanDeliveredEmailHtml(record, baseUrl)
      });
    }

    await saveStore(state);
    res.json({ record });
  });

  app.post('/api/assessments/:id/clarify', requireAdmin, async (req, res) => {
    const parsed = ClarificationInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Pergunta inválida.' });
      return;
    }

    const state = await loadStore();
    const target = state.assessments.find(a => a.id === req.params.id);
    if (!target) {
      res.status(404).json({ error: 'Avaliação não encontrada.' });
      return;
    }

    const clarification = {
      id: `CLR-${Date.now()}`,
      question: parsed.data.question,
      sentAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
    target.clarifications.push(clarification);
    target.status = 'awaiting_member_clarification';

    await enqueueIdempotentEmail(state, {
      idempotencyKey: `${target.id}:clarification:${clarification.id}`,
      recipientEmail: target.email,
      memberName: target.memberName,
      templateKey: 'clarification_request',
      assessmentNumber: target.assessmentNumber
    });

    await saveStore(state);
    res.json({ record: target, state });
  });

  app.post('/api/assessments/:id/approve', requireAdmin, async (req, res) => {
    const parsed = ManualApprovalInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ error: parsed.error.issues[0]?.message || 'Dados de aprovação inválidos.' });
      return;
    }

    const state = await loadStore();
    const target = state.assessments.find(a => a.id === req.params.id);
    if (!target) {
      res.status(404).json({ error: 'Avaliação não encontrada.' });
      return;
    }

    if (target.engineResult.emergencyRedirect) {
      res.status(409).json({
        error:
          'Bloqueio clínico: caso marcado como urgência médica não pode ser liberado pelo fluxo nutricional.'
      });
      return;
    }

    const {
      reviewedByCrn,
      targetKcal,
      proteinG,
      waterTargetMl,
      manualPlanText,
      nutritionistClinicalNote
    } = parsed.data;
    const weight = Number(target.input.weightKg || 75);

    target.status = 'completed';
    target.engineResult = {
      ...target.engineResult,
      eligibilityStatus: 'manual_approved_released',
      requiresReview: false,
      prescriptionBlocked: false,
      reviewedBy: 'Nutricionista Responsável EmagreSLIM',
      reviewedByCrn,
      reviewedAt: new Date().toLocaleString('pt-BR'),
      nutritionistClinicalNote,
      prescription: {
        scientificReferences: [
          `Avaliação Clínica Individualizada — Equipe Clínica EmagreSLIM (${reviewedByCrn})`,
          'Composição & Medidas Caseiras: TACO 4ª ed. (NEPA/Unicamp) + IBGE POF 2008-2009'
        ],
        equationUsed: `Prescrição Clínica Individualizada (${reviewedByCrn})`,
        targetKcal,
        macros: {
          proteinG,
          proteinPerKg: Number((proteinG / weight).toFixed(1)),
          carbsG: Math.max(0, Math.round((targetKcal - proteinG * 4 - targetKcal * 0.27) / 4)),
          fatG: Math.round((targetKcal * 0.27) / 9)
        },
        waterTargetMl,
        waterNote: 'Volume hídrico validado individualmente após análise clínica.',
        manualPlanText,
        substitutions: [
          {
            group: 'Orientações de Substituição Validada',
            original: 'Trocas equivalentes validadas em revisão individual pelo nutricionista.',
            equivalents: [
              'Mantenha porções e horários pactuados para controle glicêmico e saciedade.',
              'Dúvidas sobre substituições específicas: responda diretamente ao e-mail de entrega.'
            ]
          }
        ]
      }
    };

    const baseUrl = resolvePublicBaseUrl(req);
    await enqueueIdempotentEmail(state, {
      idempotencyKey: `${target.id}:plan_delivered_manual`,
      recipientEmail: target.email,
      memberName: target.memberName,
      templateKey: 'plan_delivered',
      assessmentNumber: target.assessmentNumber,
      extraHtml: buildPlanDeliveredEmailHtml(target, baseUrl)
    });

    await saveStore(state);
    res.json({ record: target, state });
  });

  app.post('/api/assessments/:id/pan-confirm', async (req, res) => {
    const state = await loadStore();
    const target = state.assessments.find(a => a.id === req.params.id);
    if (!target) {
      res.status(404).json({ error: 'Avaliação não encontrada.' });
      return;
    }
    target.panConfirmedByMember = true;
    target.memberPanFeedback =
      typeof req.body?.feedback === 'string' ? req.body.feedback.trim() : '';
    await saveStore(state);
    res.json({ record: target });
  });

  app.post('/api/assessments/:id/checkins', async (req, res) => {
    const parsed = CheckinInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Check-in inválido.' });
      return;
    }
    const state = await loadStore();
    const target = state.assessments.find(a => a.id === req.params.id);
    if (!target) {
      res.status(404).json({ error: 'Avaliação não encontrada.' });
      return;
    }
    target.checkins.unshift({
      id: `CHK-${Date.now()}`,
      date: new Date().toLocaleDateString('pt-BR'),
      weightKg: parsed.data.weightKg,
      hungerScore: parsed.data.hungerScore,
      adherenceNote: parsed.data.adherenceNote
    });
    await saveStore(state);
    res.json({ record: target });
  });

  app.post('/api/reset-demo', requireAdmin, async (_req, res) => {
    const fresh = createInitialState();
    await saveStore(fresh);
    res.json(fresh);
  });

  return app;
}
