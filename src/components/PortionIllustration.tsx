import React from 'react';

export type PortionVisualType =
  | 'colher_sopa'
  | 'concha'
  | 'file_palma'
  | 'ovos'
  | 'pao'
  | 'fruta'
  | 'copo'
  | 'prato_salada'
  | 'lata'
  | 'aveia_colher';

export function inferPortionType(foodId: string, measureText: string): PortionVisualType {
  const lower = measureText.toLowerCase();
  if (foodId === 'TACO-005' || lower.includes('ovo')) return 'ovos';
  if (foodId === 'TACO-006' || lower.includes('pão') || lower.includes('unidade média (50g')) return 'pao';
  if (foodId === 'TACO-007' || lower.includes('banana')) return 'fruta';
  if (foodId === 'TACO-009' || lower.includes('copo')) return 'copo';
  if (foodId === 'TACO-010' || lower.includes('lata')) return 'lata';
  if (foodId === 'TACO-012' || lower.includes('prato')) return 'prato_salada';
  if (foodId === 'TACO-003' || foodId === 'TACO-014' || lower.includes('concha')) return 'concha';
  if (foodId === 'TACO-004' || lower.includes('filé')) return 'file_palma';
  if (foodId === 'TACO-008' || foodId === 'TACO-015') return 'aveia_colher';
  return 'colher_sopa';
}

export const PortionIllustration: React.FC<{ type: PortionVisualType; label?: string }> = ({
  type,
  label
}) => {
  return (
    <div
      className="w-12 h-12 rounded-lg bg-white border border-stone-200 flex items-center justify-center shrink-0"
      title={label}
      aria-hidden="true"
    >
      {type === 'colher_sopa' && (
        <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none">
          <ellipse cx="14" cy="18" rx="8" ry="5.5" fill="#03422A" fillOpacity="0.14" stroke="#03422A" strokeWidth="1.5" />
          <path d="M22 18H34" stroke="#03422A" strokeWidth="2" strokeLinecap="round" />
          <circle cx="14" cy="16" r="3" fill="#03422A" fillOpacity="0.35" />
          <text x="20" y="33" textAnchor="middle" fontSize="8" fill="#57534E" fontFamily="monospace">4x</text>
        </svg>
      )}

      {type === 'aveia_colher' && (
        <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none">
          <ellipse cx="14" cy="18" rx="8" ry="5.5" fill="#03422A" fillOpacity="0.14" stroke="#03422A" strokeWidth="1.5" />
          <path d="M22 18H34" stroke="#03422A" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="17" r="1.2" fill="#03422A" />
          <circle cx="15" cy="16" r="1.2" fill="#03422A" />
          <circle cx="16" cy="19" r="1.2" fill="#03422A" />
          <text x="20" y="33" textAnchor="middle" fontSize="8" fill="#57534E" fontFamily="monospace">1-2x</text>
        </svg>
      )}

      {type === 'concha' && (
        <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none">
          <path d="M8 22C8 27 12.5 30 18 30C23.5 30 28 27 28 22H8Z" fill="#03422A" fillOpacity="0.18" stroke="#03422A" strokeWidth="1.5" />
          <path d="M27 22L33 10" stroke="#03422A" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="15" cy="25" r="1.5" fill="#03422A" fillOpacity="0.5" />
          <circle cx="20" cy="26" r="1.5" fill="#03422A" fillOpacity="0.5" />
        </svg>
      )}

      {type === 'file_palma' && (
        <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none">
          <rect x="7" y="12" width="26" height="16" rx="7" fill="#03422A" fillOpacity="0.14" stroke="#03422A" strokeWidth="1.5" />
          <path d="M13 17L17 23M19 16L23 24M25 17L28 22" stroke="#03422A" strokeWidth="1.3" strokeLinecap="round" />
          <text x="20" y="36" textAnchor="middle" fontSize="7" fill="#57534E" fontFamily="monospace">100g</text>
        </svg>
      )}

      {type === 'ovos' && (
        <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none">
          <ellipse cx="14" cy="21" rx="6" ry="8" fill="#03422A" fillOpacity="0.12" stroke="#03422A" strokeWidth="1.5" />
          <ellipse cx="26" cy="21" rx="6" ry="8" fill="#03422A" fillOpacity="0.22" stroke="#03422A" strokeWidth="1.5" />
          <circle cx="26" cy="22" r="2.2" fill="#D97706" fillOpacity="0.6" />
        </svg>
      )}

      {type === 'pao' && (
        <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none">
          <path d="M8 23C8 16 13 12 20 12C27 12 32 16 32 23C32 26 29 28 20 28C11 28 8 26 8 23Z" fill="#D97706" fillOpacity="0.14" stroke="#03422A" strokeWidth="1.5" />
          <path d="M14 15L17 20M21 14L23 20M26 16L27 21" stroke="#03422A" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      )}

      {type === 'fruta' && (
        <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none">
          <path d="M10 26C16 28 24 23 28 13C29 11 31 11 31 13C28 25 19 31 10 28C8 27 8 25 10 26Z" fill="#D97706" fillOpacity="0.22" stroke="#03422A" strokeWidth="1.5" />
          <path d="M29 12L31 9" stroke="#03422A" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      )}

      {type === 'copo' && (
        <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none">
          <path d="M12 10H28L26 31H14L12 10Z" stroke="#03422A" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M13.2 18H26.8L25.5 30H14.5L13.2 18Z" fill="#03422A" fillOpacity="0.16" />
        </svg>
      )}

      {type === 'prato_salada' && (
        <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none">
          <circle cx="20" cy="20" r="13" stroke="#03422A" strokeWidth="1.5" />
          <circle cx="20" cy="20" r="9" fill="#03422A" fillOpacity="0.12" stroke="#03422A" strokeWidth="1" strokeDasharray="2 2" />
          <circle cx="17" cy="18" r="2.5" fill="#03422A" fillOpacity="0.45" />
          <circle cx="23" cy="21" r="2.2" fill="#BE123C" fillOpacity="0.45" />
          <circle cx="20" cy="16" r="2" fill="#03422A" fillOpacity="0.35" />
        </svg>
      )}

      {type === 'lata' && (
        <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none">
          <rect x="9" y="13" width="22" height="15" rx="4" fill="#03422A" fillOpacity="0.12" stroke="#03422A" strokeWidth="1.5" />
          <ellipse cx="20" cy="15" rx="8" ry="2.5" stroke="#03422A" strokeWidth="1.2" />
          <text x="20" y="25" textAnchor="middle" fontSize="7" fill="#03422A" fontFamily="monospace">84g</text>
        </svg>
      )}
    </div>
  );
};

export const WaterCupIllustration: React.FC<{ cupsCount: number; mlAmount: number }> = ({
  cupsCount,
  mlAmount
}) => {
  const filledCups = Math.max(1, Math.min(4, cupsCount));
  return (
    <div className="flex items-center gap-1.5" aria-hidden="true">
      {Array.from({ length: filledCups }).map((_, idx) => (
        <svg key={idx} viewBox="0 0 24 28" className="w-5 h-6" fill="none">
          <path d="M5 4H19L17.2 24H6.8L5 4Z" stroke="#0369A1" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M6 11H18L16.8 23H7.2L6 11Z" fill="#0EA5E9" fillOpacity="0.28" />
        </svg>
      ))}
      <span className="text-[11px] font-mono text-sky-900 ml-1 tabular-nums">
        {mlAmount} ml
      </span>
    </div>
  );
};

export const PlateSplitIllustration: React.FC<{ mode: 'full' | 'half' }> = ({ mode }) => {
  return (
    <svg viewBox="0 0 56 56" className="w-12 h-12 shrink-0" fill="none" aria-hidden="true">
      <circle cx="28" cy="28" r="24" fill="#FFFFFF" stroke="#D6D3D1" strokeWidth="1.5" />
      {mode === 'full' ? (
        <>
          <circle cx="28" cy="28" r="17" fill="#03422A" fillOpacity="0.16" stroke="#03422A" strokeWidth="1.5" />
          <text x="28" y="31" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#03422A" fontFamily="monospace">
            100%
          </text>
        </>
      ) : (
        <>
          <path
            d="M28 11A17 17 0 0 0 28 45Z"
            fill="#03422A"
            fillOpacity="0.18"
            stroke="#03422A"
            strokeWidth="1.5"
          />
          <path
            d="M28 11A17 17 0 0 1 28 45Z"
            fill="#D97706"
            fillOpacity="0.18"
            stroke="#B45309"
            strokeWidth="1.5"
          />
          <text x="19" y="31" textAnchor="middle" fontSize="8" fontWeight="700" fill="#03422A" fontFamily="monospace">
            ½
          </text>
          <text x="37" y="31" textAnchor="middle" fontSize="8" fontWeight="700" fill="#92400E" fontFamily="monospace">
            ½
          </text>
        </>
      )}
    </svg>
  );
};

