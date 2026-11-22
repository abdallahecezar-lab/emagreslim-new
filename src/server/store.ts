import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { PRESET_SCENARIOS } from '../shared/catalog.js';
import { runEmagreSlimEngineV06 } from '../shared/clinicalEngine.js';
import type {
  AssessmentInput,
  AssessmentRecord,
  EmailOutboxItem,
  GtmAuditEvent,
  LeadRecord
} from '../shared/types.js';

const { Pool } = pg;

export interface OrderDraft {
  orderId: string;
  email: string;
  memberName: string;
  emailConfirmed: boolean;
  paymentStatus: 'pending' | 'approved' | 'rejected';
  includeChaFit21D?: boolean;
  totalAmountBrl?: number;
  mpPreferenceId?: string;
  mpPaymentId?: string;
  upsellPaymentStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  upsellMpPreferenceId?: string;
  upsellMpPaymentId?: string;
  fbp?: string;
  fbc?: string;
  clientIp?: string;
  clientUserAgent?: string;
  eventSourceUrl?: string;
  metaPurchaseSent?: boolean;
  metaUpsellSent?: boolean;
  formData?: AssessmentInput;
  updatedAt: string;
}

export interface StoreState {
  assessments: AssessmentRecord[];
  emailOutbox: EmailOutboxItem[];
  gtmEvents: GtmAuditEvent[];
  drafts: Record<string, OrderDraft>;
  leads: LeadRecord[];
}

const STORE_ROW_KEY = 'emagreslim_main_store';
const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORE_PATH = path.join(DATA_DIR, 'emagreslim_store.json');

let pgPool: pg.Pool | null = null;
let tableInitialized = false;

export function getDatabaseUrl(): string | undefined {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.STORAGE_DATABASE_URL ||
    process.env.STORAGE_URL ||
    undefined
  )?.trim() || undefined;
}

function getPool(): pg.Pool | null {
  const dbUrl = getDatabaseUrl();
  if (!dbUrl) return null;
  if (!pgPool) {
    const isLocal = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
    pgPool = new Pool({
      connectionString: dbUrl,
      ssl: isLocal ? false : { rejectUnauthorized: false },
      max: 3
    });
  }
  return pgPool;
}

async function ensureTable(pool: pg.Pool): Promise<void> {
  if (tableInitialized) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS emagreslim_kv_store (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  tableInitialized = true;
}

export function createInitialState(): StoreState {
  const now = Date.now();
  const initialCarlos = runEmagreSlimEngineV06(PRESET_SCENARIOS.preset_b_diabetes.data);
  const carlosSubmittedAt = new Date(now - 21 * 3600 * 1000).toISOString();
  const carlosSlaDueAt = new Date(now + 3 * 3600 * 1000).toISOString();

  return {
    assessments: [
      {
        id: 'ASM-2026-0142',
        orderId: 'ORD-2026-8810',
        assessmentNumber: 1,
        memberName: PRESET_SCENARIOS.preset_b_diabetes.data.memberName,
        email: PRESET_SCENARIOS.preset_b_diabetes.data.email,
        status: 'awaiting_review',
        submittedAt: carlosSubmittedAt,
        slaDueAt: carlosSlaDueAt,
        input: PRESET_SCENARIOS.preset_b_diabetes.data,
        engineResult: initialCarlos,
        clarifications: [],
        checkins: [],
        panConfirmedByMember: false,
        memberPanFeedback: ''
      }
    ],
    emailOutbox: [
      {
        id: 'EML-9001',
        idempotencyKey: 'ASM-2026-0142:awaiting_review_24h',
        recipientEmail: PRESET_SCENARIOS.preset_b_diabetes.data.email,
        memberName: PRESET_SCENARIOS.preset_b_diabetes.data.memberName,
        templateKey: 'awaiting_review_24h',
        safeSubject: 'EmagreSLIM — Recebemos sua avaliação (Análise do Nutricionista em até 24h)',
        deliveryStatus: 'delivered',
        createdAt: new Date(now - 21 * 3600 * 1000).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        auditNote: 'Canal exclusivo por e-mail · Sem dados clínicos no assunto'
      }
    ],
    gtmEvents: [
      {
        id: 'GTM-001',
        time: new Date(now).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }),
        eventName: 'page_view_home',
        payload: JSON.stringify({
          path: '/',
          whatsapp_collector: false,
          clinical_status: 'OMITTED'
        }),
        audit: 'OK — Conformidade LGPD/GTM-5THGKLB4 validada'
      }
    ],
    drafts: {},
    leads: []
  };
}

export async function loadStore(): Promise<StoreState> {
  const pool = getPool();
  if (pool) {
    try {
      await ensureTable(pool);
      const res = await pool.query<{ value: StoreState }>(
        'SELECT value FROM emagreslim_kv_store WHERE key = $1 LIMIT 1',
        [STORE_ROW_KEY]
      );
      if (res.rows[0]?.value) {
        const parsed = res.rows[0].value;
        return {
          assessments: parsed.assessments || [],
          emailOutbox: parsed.emailOutbox || [],
          gtmEvents: parsed.gtmEvents || [],
          drafts: parsed.drafts || {},
          leads: parsed.leads || []
        };
      }
      const initial = createInitialState();
      await saveStore(initial);
      return initial;
    } catch (err) {
      console.error('Postgres loadStore fallback:', err);
    }
  }

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(STORE_PATH)) {
      const initial = createInitialState();
      fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const raw = fs.readFileSync(STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as StoreState;
    return {
      assessments: parsed.assessments || [],
      emailOutbox: parsed.emailOutbox || [],
      gtmEvents: parsed.gtmEvents || [],
      drafts: parsed.drafts || {},
      leads: parsed.leads || []
    };
  } catch {
    return createInitialState();
  }
}

export async function saveStore(state: StoreState): Promise<void> {
  const pool = getPool();
  if (pool) {
    await ensureTable(pool);
    await pool.query(
      `
      INSERT INTO emagreslim_kv_store (key, value, updated_at)
      VALUES ($1, $2::jsonb, NOW())
      ON CONFLICT (key)
      DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
      `,
      [STORE_ROW_KEY, JSON.stringify(state)]
    );
    return;
  }

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('File saveStore error:', err);
  }
}
