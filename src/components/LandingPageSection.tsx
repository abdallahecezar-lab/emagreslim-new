import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Utensils
} from 'lucide-react';
import { pushDataLayerEvent } from '../utils/analytics';

interface LandingPageSectionProps {
  onStartFreeAssessment: (preselectedBarrier?: string) => void;
}

export const LandingPageSection: React.FC<LandingPageSectionProps> = ({
  onStartFreeAssessment
}) => {
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [bannerImgFailed, setBannerImgFailed] = useState(false);

  useEffect(() => {
    pushDataLayerEvent('view_landing');
  }, []);

  return (
    <div className="space-y-12 sm:space-y-16 pb-8">
      {/* HERO — DIRETO AO PONTO, MOBILE-FIRST, ZERO MURO DE TEXTO */}
      <section className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <p className="text-xs font-semibold tracking-wide text-[#03422A]">
                EMAGRE<span className="text-[#73AF04]">SLIM</span> · Sistema de Dieta Inteligente
              </p>

              <h1 className="text-3xl sm:text-4xl lg:text-[46px] font-serif font-semibold text-stone-900 leading-[1.1] tracking-tight text-balance">
                Descubra qual a melhor dieta para você emagrecer de forma definitiva.
              </h1>

              <p className="text-base sm:text-lg text-stone-600 leading-relaxed max-w-xl">
                O EmagreSLIM calcula a estratégia ideal para o seu corpo, sua rotina e o seu objetivo — com comida de verdade e sem cardápios impossíveis.
              </p>
            </div>

            {/* 3 Benefícios Palpáveis Imediatos */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {[
                {
                  title: 'Comida de verdade',
                  sub: 'Alimentos comuns do seu dia a dia'
                },
                {
                  title: 'Porções calculadas',
                  sub: 'Gramas e medidas caseiras exatas'
                },
                {
                  title: 'Lista de substituições',
                  sub: 'Varie o prato sem sair da dieta'
                }
              ].map(item => (
                <div
                  key={item.title}
                  className="p-3.5 rounded-xl bg-[#F9F8F4] border border-stone-200/90 space-y-0.5"
                >
                  <p className="text-xs font-semibold text-[#03422A] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#73AF04] shrink-0" />
                    <span>{item.title}</span>
                  </p>
                  <p className="text-[11px] text-stone-600 leading-snug">{item.sub}</p>
                </div>
              ))}
            </div>

            {/* CTA Principal Único */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={() => onStartFreeAssessment()}
                className="w-full sm:w-auto px-7 py-4 rounded-xl bg-[#03422A] hover:bg-[#02311F] text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-colors whitespace-nowrap"
              >
                <span>QUERO DESCOBRIR MINHA DIETA IDEAL</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>
              <p className="text-xs text-stone-500">
                Avaliação inicial gratuita · Leva 2 minutos · Resultado na hora + PDF grátis
              </p>
            </div>
          </div>

          {/* Imagem Real de Comida Brasileira Equilibrada */}
          <div className="lg:col-span-5 relative min-h-[280px] sm:min-h-[340px] lg:min-h-full bg-stone-100">
            {!heroImgFailed ? (
              <img
                src="/src/assets/images/hero_brazilian_meal_1794863008521.jpg"
                alt="Prato brasileiro equilibrado com comida de verdade, folhas frescas, legumes, proteína e carboidrato na porção ideal"
                referrerPolicy="no-referrer"
                onError={() => setHeroImgFailed(true)}
                className="w-full h-full object-cover lg:absolute lg:inset-0"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-[#03422A]/10 to-[#73AF04]/10 text-stone-700">
                <Utensils className="w-8 h-8 mb-2 text-[#03422A]" />
                <p className="text-sm font-semibold">Comida de verdade, porções calculadas</p>
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-6 text-white">
              <p className="text-sm font-semibold leading-snug">
                Prato cheio de volume, variedade real e calorias no ponto certo para emagrecer sem passar fome.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* BANNER VISUAL ASPIRACIONAL (REFERÊNCIA DE IMPACTO EMOCIONAL) */}
      <section className="relative rounded-2xl overflow-hidden border border-stone-200 min-h-[300px] sm:min-h-[380px] flex items-center justify-center bg-[#03422A]">
        {!bannerImgFailed && (
          <img
            src="/src/assets/images/hero_vitality_lifestyle_1794869866334.jpg"
            alt="Mulher brasileira sorridente e confiante ao ar livre"
            referrerPolicy="no-referrer"
            onError={() => setBannerImgFailed(true)}
            className="absolute inset-0 w-full h-full object-cover object-[center_22%]"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/45 to-black/35" />

        <div className="relative z-10 max-w-3xl mx-auto px-6 py-12 text-center space-y-5 text-white">
          <h2 className="text-3xl sm:text-5xl font-serif font-medium leading-[1.15] tracking-tight text-balance">
            Você irreconhecível em 3 meses, não tem preço.
          </h2>
          <p className="text-sm sm:text-base text-stone-100/95 max-w-xl mx-auto leading-relaxed">
            Dê o primeiro passo hoje com uma estratégia pensada para o seu corpo e fácil de manter na rotina real.
          </p>
          <div className="pt-1">
            <button
              type="button"
              onClick={() => onStartFreeAssessment()}
              className="px-6 py-3.5 rounded-xl bg-white hover:bg-stone-100 text-[#03422A] font-semibold text-xs sm:text-sm inline-flex items-center gap-2 transition-colors whitespace-nowrap"
            >
              <span>Começar minha avaliação gratuita</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* SEÇÃO 1 — IDENTIFICAÇÃO + ATALHO DIRETO POR DIFICULDADE */}
      <section className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-10 space-y-6">
        <div className="max-w-2xl space-y-2">
          <span className="text-xs font-semibold text-[#03422A]">
            01. Por que dietas prontas não funcionam
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-stone-900 text-balance">
            Já tentou emagrecer seguindo dietas prontas e acabou desistindo?
          </h2>
          <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
            Dietas genéricas falham porque ignoram seus horários, sua fome e o que você realmente come. O EmagreSLIM analisa seu perfil antes de calcular qualquer recomendação.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold text-stone-800">
            Qual é a sua maior trava hoje? Toque para iniciar sua avaliação já focada nisso:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                key: 'fome_noturna_tarde',
                title: 'Fome à tarde ou à noite',
                sub: 'Perco o controle no fim do dia'
              },
              {
                key: 'restricao_abandono',
                title: 'Efeito sanfona',
                sub: 'Começo bem e desisto em semanas'
              },
              {
                key: 'custo_estrutura_preparo',
                title: 'Rotina corrida',
                sub: 'Pouco tempo e comida prática'
              },
              {
                key: 'condicao_clinica_medos',
                title: 'Saúde e segurança',
                sub: 'Quero emagrecer sem passar mal'
              }
            ].map(item => (
              <button
                key={item.key}
                type="button"
                onClick={() => onStartFreeAssessment(item.key)}
                className="group p-4 rounded-xl border border-stone-200 bg-[#F9F8F4] hover:border-[#03422A] hover:bg-[#03422A]/5 text-left transition-colors flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-stone-900 group-hover:text-[#03422A]">
                    {item.title}
                  </p>
                  <p className="text-xs text-stone-500 mt-0.5">{item.sub}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-[#03422A] shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* SEÇÃO 2 — BENEFÍCIOS PALPÁVEIS (4 BLOCOS CURTOS E CONCRETOS) */}
      <section className="space-y-6">
        <div className="max-w-2xl space-y-2">
          <span className="text-xs font-semibold text-[#03422A]">
            02. O que você recebe na prática
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-stone-900 text-balance">
            Uma dieta que faz sentido na vida real.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              num: '01',
              title: 'Coma alimentos que você conhece',
              desc: 'Arroz, feijão, frutas, folhas, legumes, ovos e proteínas comuns do mercado. Nada de ingredientes caros ou difíceis.'
            },
            {
              num: '02',
              title: 'Saiba exatamente quanto comer',
              desc: 'Calorias, proteínas, água e porções em gramas e medidas caseiras calculadas para a sua meta de peso.'
            },
            {
              num: '03',
              title: 'Lista completa de substituições',
              desc: 'Troque frutas, legumes, carboidratos e proteínas com equivalência exata para variar o prato sem enjoar.'
            },
            {
              num: '04',
              title: 'Ajustado à sua rotina real',
              desc: 'Organizado de 3 a 6 refeições por dia, respeitando seus horários, alergias, preferências e orçamento.'
            }
          ].map(card => (
            <div
              key={card.num}
              className="bg-white border border-stone-200 rounded-2xl p-6 space-y-2"
            >
              <span className="text-xs font-mono font-semibold text-[#73AF04] tabular-nums">
                {card.num}
              </span>
              <h3 className="text-lg font-serif font-semibold text-stone-900">{card.title}</h3>
              <p className="text-sm text-stone-600 leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SEÇÃO 3 — COMO FUNCIONA EM 3 PASSOS */}
      <section className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-10 space-y-6">
        <div className="max-w-2xl space-y-2">
          <span className="text-xs font-semibold text-[#03422A]">
            03. Simples do começo ao fim
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-stone-900 text-balance">
            Como funciona em 3 passos
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              step: 'Passo 01',
              title: 'Conte sobre você',
              desc: 'Responda perguntas rápidas sobre medidas, meta, rotina e dificuldade atual. Leva 2 minutos e é grátis.'
            },
            {
              step: 'Passo 02',
              title: 'Veja sua leitura gratuita',
              desc: 'Receba sua estimativa de calorias, meta de água, ciclos de acompanhamento até o objetivo e PDF gratuito.'
            },
            {
              step: 'Passo 03',
              title: 'Ative seu plano completo',
              desc: 'Se fizer sentido para você, libere seu cardápio completo, lista de substituições e PDF por pagamento único.'
            }
          ].map(item => (
            <div key={item.step} className="space-y-2 pt-2 border-t border-stone-200">
              <span className="text-xs font-semibold text-[#03422A]">{item.step}</span>
              <h3 className="text-base font-serif font-semibold text-stone-900">{item.title}</h3>
              <p className="text-sm text-stone-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SEÇÃO 4 — CREDIBILIDADE REAL + CTA FINAL */}
      <section className="bg-[#03422A] text-white rounded-2xl p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-5 space-y-2.5 border-b lg:border-b-0 lg:border-r border-emerald-800 pb-6 lg:pb-0 lg:pr-8">
          <p className="text-xs font-semibold text-[#A3E635] flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Critério técnico e segurança clínica</span>
          </p>
          <p className="text-sm text-emerald-100/90 leading-relaxed">
            Cálculos fundamentados em <strong>Mifflin-St Jeor</strong>, <strong>DRI 2023</strong> e tabelas oficiais <strong>TACO/IBGE</strong>. Casos com condições de saúde ou histórico bariátrico passam por revisão individual de nutricionista em até 24h.
          </p>
        </div>

        <div className="lg:col-span-7 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-md">
            <h2 className="text-2xl sm:text-[26px] font-serif font-semibold leading-snug text-balance">
              Você não precisa de mais uma dieta aleatória. Precisa descobrir a que faz sentido para você.
            </h2>
            <p className="text-xs text-emerald-100/85">
              Avaliação inicial gratuita · Sem cartão · PDF liberado na hora
            </p>
          </div>

          <button
            type="button"
            onClick={() => onStartFreeAssessment()}
            className="w-full sm:w-auto px-6 py-4 rounded-xl bg-white hover:bg-stone-100 text-[#03422A] font-semibold text-sm flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0"
          >
            <span>FAZER MINHA AVALIAÇÃO GRATUITA</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </button>
        </div>
      </section>
    </div>
  );
};
