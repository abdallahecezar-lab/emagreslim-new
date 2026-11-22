declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    fbq?: (...args: unknown[]) => void;
  }
}

export interface MetaBrowserContext {
  fbp?: string;
  fbc?: string;
  eventSourceUrl?: string;
}

function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

export function getMetaBrowserContext(): MetaBrowserContext {
  if (typeof window === 'undefined') return {};
  const fbp = readCookie('_fbp');
  let fbc = readCookie('_fbc');
  if (!fbc) {
    try {
      const fbclid = new URLSearchParams(window.location.search).get('fbclid')?.trim();
      if (fbclid) {
        fbc = `fb.1.${Date.now()}.${fbclid}`;
      }
    } catch {
      // Ignora URL malformada
    }
  }
  return {
    ...(fbp ? { fbp } : {}),
    ...(fbc ? { fbc } : {}),
    eventSourceUrl: window.location.href
  };
}

export function createMetaEventId(prefix: string): string {
  const randomPart =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 12)
      : Math.random().toString(36).slice(2, 12);
  return `${prefix}_${Date.now()}_${randomPart}`;
}

function mirrorToMetaPixel(eventName: string, params: Record<string, unknown>): void {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;
  if (window.location.pathname.startsWith('/admin')) return;

  const eventId = typeof params.event_id === 'string' && params.event_id ? params.event_id : undefined;
  const eventOpts = eventId ? { eventID: eventId } : undefined;

  try {
    switch (eventName) {
      case 'free_mapping_step': {
        window.fbq('trackCustom', 'QuizStep', {
          step_number: params.step_number,
          step_key: params.step_key,
          step_name: params.step_name,
          progress_percent: params.progress_percent,
          funnel_stage: params.funnel_stage
        });
        break;
      }
      case 'free_mapping_completed': {
        const payload = {
          content_name: 'Avaliacao Gratuita EmagreSLIM',
          content_ids: ['emagreslim-avaliacao-gratuita']
        };
        if (eventOpts) {
          window.fbq('track', 'Lead', payload, eventOpts);
        } else {
          window.fbq('track', 'Lead', payload);
        }
        break;
      }
      case 'view_offer': {
        window.fbq('track', 'ViewContent', {
          content_name: 'Plano EmagreSLIM Personalizado',
          content_ids: ['emagreslim-avaliacao-completa'],
          content_type: 'product',
          value: 67.9,
          currency: 'BRL'
        });
        break;
      }
      case 'begin_checkout': {
        const withChaFit = params.include_chafit_21d === true;
        const val = typeof params.value === 'number' ? params.value : withChaFit ? 95.8 : 67.9;
        const payload = {
          value: val,
          currency: 'BRL',
          content_type: 'product',
          content_ids: withChaFit
            ? ['emagreslim-avaliacao-completa', 'emagreslim-chafit-21d']
            : ['emagreslim-avaliacao-completa'],
          num_items: withChaFit ? 2 : 1
        };
        if (eventOpts) {
          window.fbq('track', 'InitiateCheckout', payload, eventOpts);
        } else {
          window.fbq('track', 'InitiateCheckout', payload);
        }
        break;
      }
      case 'purchase': {
        const withChaFit = params.include_chafit_21d === true;
        const val = typeof params.value === 'number' ? params.value : withChaFit ? 95.8 : 67.9;
        const payload = {
          value: val,
          currency: 'BRL',
          content_type: 'product',
          content_ids: withChaFit
            ? ['emagreslim-avaliacao-completa', 'emagreslim-chafit-21d']
            : ['emagreslim-avaliacao-completa']
        };
        if (eventOpts) {
          window.fbq('track', 'Purchase', payload, eventOpts);
        } else {
          window.fbq('track', 'Purchase', payload);
        }
        break;
      }
      case 'upsell_chafit_purchased': {
        const payload = {
          value: 27.9,
          currency: 'BRL',
          content_name: 'Guia Digital ChaFit 21D',
          content_type: 'product',
          content_ids: ['emagreslim-chafit-21d']
        };
        if (eventOpts) {
          window.fbq('track', 'Purchase', payload, eventOpts);
        } else {
          window.fbq('track', 'Purchase', payload);
        }
        break;
      }
      default:
        break;
    }
  } catch {
    // Nunca bloqueia a experiência do usuário se um ad-blocker interferir
  }
}

export function pushDataLayerEvent(
  eventName: string,
  params: Record<string, unknown> = {}
): void {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: eventName,
    ...params
  });
  mirrorToMetaPixel(eventName, params);
}
