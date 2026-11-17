import React, { useState } from 'react';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  HeartPulse,
  ShieldCheck,
  Sparkles,
  Sun
} from 'lucide-react';

interface LandingPageSectionProps {
  onStartFreeAssessment: (preselectedBarrier?: string) => void;
}

const TRANSFORMATION_SCENARIOS = {
  afternoon_peace: {
    label: 'Controle à tarde e à noite',
    headline: 'Você termina o dia com tranquilidade, sem descontar cansaço e ansiedade no impulso.',
    outcomes: [
      'Menos quedas bruscas de energia no meio da tarde e mais clareza mental até o fim do expediente',
      'Noites mais leves, sem sensação de culpa ou peso estomacal que atrapalha a qualidade do sono',
      'A alimentação entra apenas como apoio discreto de saciedade — você volta a ter o comando das suas escolhas'
    ]
  },
  busy_life: {
    label: 'Rotina corrida sem tempo',
    headline: 'Cuidar do próprio corpo deixa de exigir horas livre e passa a caber dentro do seu dia real.',
    outcomes: [
      'Menos desgaste mental decidindo o que fazer todos os dias: o plano acompanha seus horários e locais',
      'Hidratação, ritmo e energia organizados de forma prática mesmo para quem trabalha fora o dia inteiro',
      'Você ganha constância — e é a constância, não a perfeição radical, que transforma suas medidas'
    ]
  },
  health_yoyo: {
    label: 'Fim do efeito sanfona',
    headline: 'Emagrecimento que preserva sua saúde, sua força e o resultado que você conquistou no espelho.',
    outcomes: [
      'Ritmo planejado em ciclos claros de acompanhamento para eliminar gordura sem sacrificar massa magra',
      'Mais conforto nas articulações, fôlego nas escadas e melhora progressiva dos marcadores de saúde',
      'Autonomia para viver eventos sociais, viagens e fins de semana sem jogar todo o progresso fora'
    ]
  }
};

export const LandingPageSection: React.FC<LandingPageSectionProps> = ({
  onStartFreeAssessment
}) => {
  const [scenarioTab, setScenarioTab] = useState<'afternoon_peace' | 'busy_life' | 'health_yoyo'>(
    'afternoon_peace'
  );
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [selfcareImgFailed, setSelfcareImgFailed] = useState(false);

  const activeScenario = TRANSFORMATION_SCENARIOS[scenarioTab];

  return (
    <div className="space-y-16 pb-8">
      {/* 1. HERO DE PRÉ-VENDAS: TRANSFORMAÇÃO, DESEJO E AÇÃO */}
      <section className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          {/* Coluna Esquerda: Promessa de Transformação, Gatilhos de Realidade e CTA Único */}
          <div className="lg:col-span-7 p-7 sm:p-11 lg:p-12 flex flex-col justify-between space-y-7">
            <div className="space-y-4">
              <p className="text-xs font-semibold tracking-wide text-[#03422A]">
                Método <span className="text-[#03422A]">EMAGRE</span>
                <span className="text-[#73AF04]">SLIM</span> · Transformação Sustentável e Autocuidado
              </p>

              <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-serif font-semibold text-stone-900 leading-[1.12] tracking-tight">
                Volte a se sentir bem no próprio corpo — com energia, saúde e leveza sem viver preso a dietas
              </h1>

              <p className="text-base text-stone-600 leading-relaxed max-w-2xl">
                Pessoas não buscam mais uma lista de proibições. Elas querem acordar com disposição, vestir as próprias roupas com conforto, dormir melhor e olhar para o espelho com orgulho. Aqui, a comida é apenas o meio para sustentar sua vida — nunca uma prisão.
              </p>
            </div>

            {/* Hook Interativo orientado ao desejo / trava real */}
            <div className="space-y-3.5 pt-3 border-t border-stone-200/80">
              <p className="text-xs font-semibold text-stone-800">
                Qual transformação você mais precisa destravar hoje? (clique para iniciar sua avaliação):
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  {
                    key: 'fome_noturna_tarde',
                    title: 'Ter calma e controle à noite',
                    sub: 'Parar de descontar o cansaço do dia no impulso'
                  },
                  {
                    key: 'restricao_abandono',
                    title: 'Vencer o efeito sanfona de vez',
                    sub: 'Chega de recomeçar com culpa toda segunda'
                  },
                  {
                    key: 'custo_estrutura_preparo',
                    title: 'Cuidar de mim na rotina corrida',
                    sub: 'Quero resultado que caiba no meu tempo e bolso'
                  },
                  {
                    key: 'condicao_clinica_medos',
                    title: 'Proteger minha saúde e exames',
                    sub: 'Emagrecer com segurança e preservando força'
                  }
                ].map(item => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => onStartFreeAssessment(item.key)}
                    className="group p-3.5 rounded-xl border border-stone-200 bg-[#F9F8F4] hover:border-[#03422A] hover:bg-[#03422A]/5 text-left transition-colors flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-stone-900 group-hover:text-[#03422A] truncate">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-stone-500 truncate mt-0.5">{item.sub}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-[#03422A] shrink-0" />
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => onStartFreeAssessment()}
                  className="px-6 py-3.5 rounded-lg bg-[#03422A] hover:bg-[#02311F] text-white font-semibold text-sm flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
                >
                  <span>Fazer minha avaliação gratuita agora</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <span className="text-xs text-stone-500">
                  100% gratuita · Sem cartão de crédito · Resultado na hora + guia em PDF
                </span>
              </div>
            </div>
          </div>

          {/* Coluna Direita: Fotografia de Vitalidade, Movimento e Bem-Estar */}
          <div className="lg:col-span-5 relative min-h-[340px] lg:min-h-full bg-stone-100">
            {!heroImgFailed ? (
              <img
                src="/src/assets/images/hero_vitality_lifestyle_1794869866334.jpg"
                alt="Mulher brasileira sorridente caminhando ao ar livre pela manhã com energia, leveza e bem-estar"
                referrerPolicy="no-referrer"
                onError={() => setHeroImgFailed(true)}
                className="w-full h-full object-cover object-top lg:absolute lg:inset-0"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-[#03422A]/10 to-[#73AF04]/10 text-stone-700">
                <Sun className="w-8 h-8 mb-2 text-[#03422A]" />
                <p className="text-sm font-semibold">Leveza, disposição e saúde na prática</p>
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-6 text-white">
              <p className="text-sm font-semibold leading-snug">
                Emagrecer de verdade devolve o fôlego, a confiança e o prazer de estar presente na própria vida.
              </p>
              <p className="text-xs text-stone-200 mt-1">
                Metodologia orientada a autocuidado, preservação muscular e ritmo sustentável.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. BENEFÍCIOS REAIS DA TRANSFORMAÇÃO (SAÚDE, ENERGIA E AUTOESTIMA) */}
      <section className="space-y-6">
        <div className="max-w-3xl space-y-2">
          <span className="text-xs font-medium text-[#03422A]">
            01. O que você realmente conquista ao emagrecer com critério
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-stone-900">
            Benefícios que vão muito além do número na balança
          </h2>
          <p className="text-sm text-stone-600 leading-relaxed">
            Quando o corpo recebe o estímulo certo sem restrições extremas, o primeiro ganho não é estética isolada — é sentir a diferença na sua rotina desde as primeiras semanas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Card Principal A */}
          <div className="md:col-span-6 bg-white border border-stone-200 rounded-xl p-6 sm:p-7 flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-lg bg-[#03422A]/8 text-[#03422A] flex items-center justify-center">
                <Sun className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-serif font-semibold text-stone-900">
                Mais disposição física e clareza do acordar ao anoitecer
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Emagrecer preservando massa magra e ajustando hidratação elimina aquela sensação crônica de peso, sonolência pós-almoço e exaustão no fim da tarde. Sobra energia para trabalhar bem, estar presente com a família e se movimentar com prazer.
              </p>
            </div>
            <p className="text-xs font-semibold text-[#03422A] pt-2 border-t border-stone-100">
              Vitalidade constante sem depender de estimulantes ou cortes radicais
            </p>
          </div>

          {/* Card Principal B */}
          <div className="md:col-span-6 bg-white border border-stone-200 rounded-xl p-6 sm:p-7 flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-lg bg-[#73AF04]/15 text-[#03422A] flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-serif font-semibold text-stone-900">
                Roupas voltando a vestir bem e autoestima sem esforço forçado
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Reduzir medidas abdominais e retenção devolve o prazer de escolher o que vestir sem esconder o corpo ou evitar fotos. Você sente segurança na própria postura porque construiu um processo que respeita quem você é.
              </p>
            </div>
            <p className="text-xs font-semibold text-[#03422A] pt-2 border-t border-stone-100">
              Foco em composição corporal e medidas reais, não apenas em perda passageira de líquido
            </p>
          </div>

          {/* Card Secundário 1 */}
          <div className="md:col-span-4 bg-white border border-stone-200 rounded-xl p-6 space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-stone-100 text-[#03422A] flex items-center justify-center">
              <HeartPulse className="w-4 h-4" />
            </div>
            <h3 className="text-base font-serif font-semibold text-stone-900">
              Saúde metabólica e exames protegidos
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Diminuir gordura visceral alivia pressão arterial, glicemia, perfil lipídico e sobrecarga silenciosa nos seus órgãos e articulações.
            </p>
          </div>

          {/* Card Secundário 2 */}
          <div className="md:col-span-4 bg-white border border-stone-200 rounded-xl p-6 space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-stone-100 text-[#03422A] flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="text-base font-serif font-semibold text-stone-900">
              Sono mais profundo e recuperação real
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Ritmo diário equilibrado reduz refluxo, compulsões noturnas e acordar cansado — criando um ciclo positivo de bem-estar no dia seguinte.
            </p>
          </div>

          {/* Card Secundário 3 */}
          <div className="md:col-span-4 bg-white border border-stone-200 rounded-xl p-6 space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-stone-100 text-[#03422A] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-base font-serif font-semibold text-stone-900">
              Autocuidado leve e livre de culpa
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              A comida deixa de ser vilã ou recompensa emocional. Ela assume seu lugar simples como ferramenta para você viver melhor e com autonomia.
            </p>
          </div>
        </div>
      </section>

      {/* 3. MECANISMO: COMO SUA VIDA DESTRAVA NA PRÁTICA */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-5 relative rounded-xl overflow-hidden border border-stone-200 min-h-[290px] bg-stone-100">
          {!selfcareImgFailed ? (
            <img
              src="/src/assets/images/transformation_selfcare_routine_1794869866239.jpg"
              alt="Rotina matinal serena de autocuidado com jarra de água fresca, fita métrica e caderno de planejamento"
              referrerPolicy="no-referrer"
              onError={() => setSelfcareImgFailed(true)}
              className="w-full h-full object-cover lg:absolute lg:inset-0"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center p-8 bg-stone-200 text-stone-700 text-sm font-medium">
              Autocuidado organizado, hidratação e progresso visível
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent p-5 text-white">
            <p className="text-xs font-semibold">
              O alimento é apenas o meio. O que transforma seu corpo é um sistema que funciona nos seus dias bons e nos dias difíceis.
            </p>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white border border-stone-200 rounded-xl p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-medium text-[#03422A]">
              02. Por que aqui você consegue sustentar o resultado
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-stone-900">
              Você não falhou nas dietas anteriores — faltou uma estratégia desenhada para a sua vida
            </h2>
            <p className="text-sm text-stone-600 leading-relaxed">
              Veja como a condução do EmagreSLIM destrava cada perfil de rotina sem transformar o cuidado pessoal em um segundo emprego:
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-1.5 p-1 bg-stone-100 rounded-lg border border-stone-200">
              {(['afternoon_peace', 'busy_life', 'health_yoyo'] as const).map(key => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setScenarioTab(key)}
                  className={`flex-1 py-2 px-3 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                    scenarioTab === key
                      ? 'bg-white text-stone-900 shadow-sm'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {TRANSFORMATION_SCENARIOS[key].label}
                </button>
              ))}
            </div>

            <div className="p-5 rounded-xl bg-[#F9F8F4] border border-stone-200 space-y-3">
              <p className="text-xs sm:text-sm font-semibold text-[#03422A]">
                {activeScenario.headline}
              </p>
              <ul className="space-y-2 text-xs text-stone-700">
                {activeScenario.outcomes.map((line, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#73AF04] shrink-0 mt-0.5" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-stone-500">
              Em 2 minutos você recebe sua análise gratuita e vê exatamente por onde começar.
            </span>
            <button
              type="button"
              onClick={() => onStartFreeAssessment()}
              className="px-4 py-2.5 rounded-lg bg-[#03422A] hover:bg-[#02311F] text-white text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
            >
              <span>Descobrir meu perfil gratuito</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 4. CLAREZA DE VALOR: O QUE VOCÊ DESTRAVA HOJE GRÁTIS E A JORNADA COMPLETA */}
      <section className="space-y-6">
        <div className="max-w-2xl space-y-2">
          <span className="text-xs font-medium text-[#03422A]">
            03. Passo a passo transparente, sem surpresas
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-stone-900">
            Comece gratuitamente agora e avance para o plano completo só se fizer total sentido para você
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          <div className="bg-white border border-[#03422A]/30 rounded-xl p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-baseline justify-between border-b border-stone-200 pb-4">
                <div>
                  <h3 className="text-lg font-serif font-semibold text-stone-900">
                    Diagnóstico Inicial Personalizado
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Leitura imediata para organizar seu ponto de partida hoje
                  </p>
                </div>
                <span className="text-xl font-serif font-semibold text-[#03422A] tabular-nums">
                  Grátis
                </span>
              </div>

              <ul className="space-y-2.5 text-xs sm:text-sm text-stone-700">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#03422A] shrink-0 mt-0.5" />
                  <span>
                    Mapeamento metabólico, identificação da sua principal trava de rotina e estimativa de ciclos de avaliação até o objetivo
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#03422A] shrink-0 mt-0.5" />
                  <span>
                    Meta diária de hidratação, direção prática de movimento e proteção de massa magra no seu ritmo
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#03422A] shrink-0 mt-0.5" />
                  <span>
                    Relatório ilustrado na tela e em PDF para baixar na hora, além de cópia no seu e-mail
                  </span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => onStartFreeAssessment()}
              className="w-full py-3.5 rounded-lg bg-[#03422A] hover:bg-[#02311F] text-white text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <span>Começar minha avaliação gratuita</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-white border border-stone-200 rounded-xl p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-baseline justify-between border-b border-stone-200 pb-4">
                <div>
                  <h3 className="text-lg font-serif font-semibold text-stone-900">
                    Jornada Completa EmagreSLIM (Opcional)
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Desbloqueie depois da avaliação se quiser o plano completo em mãos
                  </p>
                </div>
                <span className="text-xl font-serif font-semibold text-stone-900 tabular-nums">
                  R$ 67,90
                </span>
              </div>

              <ul className="space-y-2.5 text-xs sm:text-sm text-stone-700">
                <li className="flex items-start gap-2.5">
                  <FileText className="w-4 h-4 text-[#03422A] shrink-0 mt-0.5" />
                  <span>
                    Continuidade guiada sem repetir perguntas, cobrindo sono, saúde, rotina e preferências reais
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-[#03422A] shrink-0 mt-0.5" />
                  <span>
                    Triagem conservadora de segurança com revisão por nutricionista em até 24h corridas sempre que houver agravantes
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <HeartPulse className="w-4 h-4 text-[#03422A] shrink-0 mt-0.5" />
                  <span>
                    Entrega completa com Relatório + PAN, estratégia prática adaptada à sua vida e PDF completo para acompanhar seus ciclos
                  </span>
                </li>
              </ul>
            </div>

            <p className="text-xs text-stone-500 leading-relaxed">
              Pagamento único, sem mensalidade escondida. Primeiro você vê sua leitura gratuita com total clareza — depois decide se quer avançar.
            </p>
          </div>
        </div>
      </section>

      {/* 5. FECHAMENTO DE CONVERSÃO */}
      <section className="bg-[#03422A] text-white rounded-xl p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-4 space-y-2 border-b lg:border-b-0 lg:border-r border-emerald-800 pb-5 lg:pb-0 lg:pr-6">
          <p className="text-xs text-[#A3E635] flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>Saúde e Segurança em Primeiro Lugar</span>
          </p>
          <p className="font-serif font-semibold text-lg leading-snug">
            Transformação real respeita o seu corpo e o seu tempo
          </p>
          <p className="text-xs text-emerald-100/85 leading-relaxed">
            Metodologia embasada no Guia Alimentar Brasileiro, referências TACO/IBGE e DRI 2023, com trava de segurança e revisão clínica quando necessário.
          </p>
        </div>

        <div className="lg:col-span-5 space-y-2">
          <h2 className="text-2xl font-serif font-semibold leading-snug">
            Sua mudança não precisa esperar mais uma segunda-feira com promessas radicais
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/90">
            Leva menos de 2 minutos. Sem cartão de crédito e com diagnóstico imediato pronto para baixar em PDF.
          </p>
        </div>

        <div className="lg:col-span-3 flex lg:justify-end">
          <button
            type="button"
            onClick={() => onStartFreeAssessment()}
            className="w-full lg:w-auto px-6 py-3.5 rounded-lg bg-white hover:bg-stone-100 text-[#03422A] font-semibold text-sm flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0"
          >
            <span>Iniciar avaliação grátis</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
};
