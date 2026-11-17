import React from 'react';
import emagreslimLogo from '../assets/images/emagreslim-logo.png';

export type AppTab =
  | 'lead_journey'
  | 'nutritionist_panel'
  | 'email_gtm_audit'
  | 'tech_architecture';

interface TopBarProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  pendingReviewsCount: number;
  emailCount: number;
  onStartFreeQuiz: () => void;
  isAdminAuthenticated: boolean;
  onExitAdmin: () => void;
  onLogoClick: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onSelectTab,
  pendingReviewsCount,
  emailCount,
  onStartFreeQuiz,
  isAdminAuthenticated,
  onExitAdmin,
  onLogoClick
}) => {
  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        <button
          type="button"
          onClick={onLogoClick}
          className="flex items-center shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#03422A]"
        >
          <img
            src={emagreslimLogo}
            alt="EmagreSLIM"
            className="h-9 sm:h-10 w-auto object-contain"
          />
        </button>

        {isAdminAuthenticated && (
          <nav className="flex items-center gap-6 overflow-x-auto no-scrollbar text-sm font-medium">
            <button
              type="button"
              onClick={() => onSelectTab('lead_journey')}
              className={`py-5 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'lead_journey'
                  ? 'border-[#03422A] text-stone-900 font-semibold'
                  : 'border-transparent text-stone-500 hover:text-stone-900'
              }`}
            >
              Avaliação e Plano
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('nutritionist_panel')}
              className={`py-5 border-b-2 transition-colors whitespace-nowrap shrink-0 tabular-nums ${
                activeTab === 'nutritionist_panel'
                  ? 'border-[#03422A] text-stone-900 font-semibold'
                  : 'border-transparent text-stone-500 hover:text-stone-900'
              }`}
            >
              Painel Clínico ({pendingReviewsCount})
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('email_gtm_audit')}
              className={`py-5 border-b-2 transition-colors whitespace-nowrap shrink-0 tabular-nums ${
                activeTab === 'email_gtm_audit'
                  ? 'border-[#03422A] text-stone-900 font-semibold'
                  : 'border-transparent text-stone-500 hover:text-stone-900'
              }`}
            >
              E-mails e GTM ({emailCount})
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('tech_architecture')}
              className={`py-5 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'tech_architecture'
                  ? 'border-[#03422A] text-stone-900 font-semibold'
                  : 'border-transparent text-stone-500 hover:text-stone-900'
              }`}
            >
              Arquitetura e Deploy
            </button>
          </nav>
        )}

        <div className="flex items-center gap-3 shrink-0">
          {isAdminAuthenticated ? (
            <button
              type="button"
              onClick={onExitAdmin}
              className="px-3.5 py-2 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold whitespace-nowrap"
            >
              Sair do Admin
            </button>
          ) : (
            <button
              type="button"
              onClick={onStartFreeQuiz}
              className="px-4 py-2 rounded-lg bg-[#03422A] hover:bg-[#02311F] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              Avaliação Grátis
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
