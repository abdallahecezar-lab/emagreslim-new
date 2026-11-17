import { jsPDF } from 'jspdf';
import emagreslimLogo from '../assets/images/emagreslim-logo.png';
import type { FreeMappingAnalysis } from '../shared/clinicalEngine';
import type { AssessmentInput, AssessmentRecord } from '../shared/types';

let cachedLogoDataUrl: string | null = null;
if (typeof window !== 'undefined' && typeof Image !== 'undefined') {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    try {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth || 837;
      c.height = img.naturalHeight || 280;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        cachedLogoDataUrl = c.toDataURL('image/png');
      }
    } catch {
      cachedLogoDataUrl = null;
    }
  };
  img.src = emagreslimLogo;
}

function formatHalfMeasurePdf(householdMeasure: string, portionGrams: number): string {
  const clean = householdMeasure.replace(/\s*\([^)]*IBGE[^)]*\)/gi, '').trim();
  const halfGrams = Math.round(portionGrams / 2);

  if (clean.startsWith('4 colheres de sopa')) return `2 colheres de sopa (${halfGrams}g)`;
  if (clean.startsWith('2 colheres de sopa')) return `1 colher de sopa (${halfGrams}g)`;
  if (clean.startsWith('1 colher de sopa')) return `1/2 colher de sopa (${halfGrams}g)`;
  if (clean.startsWith('2 unidades médias')) return `1 unidade média (${halfGrams}g)`;
  if (clean.startsWith('1 unidade média')) return `1/2 unidade média (${halfGrams}g)`;
  if (clean.startsWith('1 filé médio')) return `1/2 filé médio (${halfGrams}g)`;
  if (clean.startsWith('1 concha')) return `1/2 concha (${halfGrams}g)`;
  if (clean.startsWith('1 lata pequena')) return `1/2 lata pequena (${halfGrams}g)`;
  if (clean.startsWith('1 copo americano')) return `1/2 copo americano (${halfGrams} ml)`;
  if (clean.startsWith('1 fatia média / 4 colheres de sopa')) return `2 colheres de sopa (${halfGrams}g)`;
  return `Metade da porção (${halfGrams}g)`;
}

function createHiDpiCanvas(logicalW: number, logicalH: number, scale = 3): {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
} | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(logicalW * scale);
  canvas.height = Math.round(logicalH * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.scale(scale, scale);
  return { canvas, ctx };
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/** Emblema botânico fallback com as duas cores oficiais (#03422A e #73AF04) */
function renderBrandEmblemPng(): string | null {
  const res = createHiDpiCanvas(120, 120, 3);
  if (!res) return null;
  const { canvas, ctx } = res;

  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(60, 60, 52, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#73AF04';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(60, 60, 52, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#73AF04';
  ctx.beginPath();
  ctx.moveTo(60, 24);
  ctx.bezierCurveTo(88, 34, 92, 72, 60, 92);
  ctx.bezierCurveTo(28, 72, 32, 34, 60, 24);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#03422A';
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(60, 34);
  ctx.lineTo(60, 88);
  ctx.moveTo(60, 54);
  ctx.lineTo(74, 44);
  ctx.moveTo(60, 66);
  ctx.lineTo(46, 56);
  ctx.stroke();

  return canvas.toDataURL('image/png');
}

function drawBrandedCoverHeader(
  doc: jsPDF,
  pageWidth: number,
  margin: number,
  title: string,
  line1: string,
  line2: string
) {
  doc.setFillColor(3, 66, 42); // #03422A
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setFillColor(115, 175, 4); // #73AF04
  doc.rect(0, 40, pageWidth, 1.8, 'F');

  let textX = margin;
  if (cachedLogoDataUrl) {
    // Cartão branco suave para exibir a logo oficial de duas cores com contraste máximo
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margin, 8, 42, 16, 2.5, 2.5, 'F');
    doc.addImage(cachedLogoDataUrl, 'PNG', margin + 2.5, 9.5, 37, 12.4);
    textX = margin + 47;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14.5);
    doc.setTextColor(255, 255, 255);
    doc.text(title, textX, 16.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.8);
    doc.setTextColor(225, 245, 210);
    doc.text(line1, margin, 30.5);
    doc.text(line2, margin, 36);
  } else {
    const emblemPng = renderBrandEmblemPng();
    if (emblemPng) {
      doc.addImage(emblemPng, 'PNG', margin, 11, 18, 18);
      textX = margin + 22;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17.5);
    doc.setTextColor(255, 255, 255);
    doc.text(`EmagreSLIM — ${title}`, textX, 17);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(225, 245, 210);
    doc.text(line1, textX, 24.5);
    doc.text(line2, textX, 30.5);
  }
}

/** Ilustração 1: Jornada por Ciclos de Avaliação & Ajuste Alimentar */
function renderTimelineRoadmapPng(params: {
  currentWeight: number;
  targetWeight: number;
  evalsMin: number;
  evalsMax: number;
  dietKcal: number;
}): string | null {
  const W = 720;
  const H = 195;
  const res = createHiDpiCanvas(W, H, 3);
  if (!res) return null;
  const { canvas, ctx } = res;

  // Fundo do cartão
  drawRoundedRect(ctx, 2, 2, W - 4, H - 4, 16);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.strokeStyle = '#E7E5E4';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Faixa de título interno
  ctx.fillStyle = '#03422A';
  ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
  ctx.fillText('JORNADA POR CICLOS DE AVALIAÇÃO — COMO CONSULTAS DE AJUSTE', 24, 30);

  ctx.fillStyle = '#57534E';
  ctx.font = '12px system-ui, -apple-system, sans-serif';
  ctx.fillText(
    `Dieta inicial em ~${params.dietKcal} kcal/dia e recalibração contínua a cada ciclo para não travar seu metabolismo`,
    24,
    49
  );

  // Trilha curva de progresso
  const yTrack = 104;
  const x1 = 76;
  const x2 = 266;
  const x3 = 456;
  const x4 = 640;

  // Linha base cinza
  ctx.strokeStyle = '#E7E5E4';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, yTrack);
  ctx.bezierCurveTo(x1 + 95, yTrack - 18, x2 + 95, yTrack + 18, x4, yTrack);
  ctx.stroke();

  // Linha gradiente esmeralda
  const grad = ctx.createLinearGradient(x1, yTrack, x4, yTrack);
  grad.addColorStop(0, '#059669');
  grad.addColorStop(0.6, '#03422A');
  grad.addColorStop(1, '#02311F');
  ctx.strokeStyle = grad;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(x1, yTrack);
  ctx.bezierCurveTo(x1 + 95, yTrack - 18, x2 + 95, yTrack + 18, x4, yTrack);
  ctx.stroke();

  const kgDiff = Math.max(0, Number((params.currentWeight - params.targetWeight).toFixed(1)));
  const midWeight = Number((params.currentWeight - kgDiff * 0.55).toFixed(1));

  const milestones = [
    {
      x: x1,
      y: yTrack,
      badge: 'AVALIAÇÃO 01',
      title: `${params.currentWeight} kg`,
      sub: 'Plano inicial',
      fill: '#03422A'
    },
    {
      x: x2,
      y: yTrack - 4,
      badge: 'AVALIAÇÃO 02',
      title: '1º Reajuste',
      sub: 'Recalibra fome e porções',
      fill: '#059669'
    },
    {
      x: x3,
      y: yTrack + 4,
      badge: 'CICLO MÉDIO',
      title: kgDiff > 0 ? `~${midWeight} kg` : 'Constância',
      sub: 'Gordura ↓ Massa ↑',
      fill: '#0D9488'
    },
    {
      x: x4,
      y: yTrack,
      badge: kgDiff > 0 ? `${params.evalsMin}–${params.evalsMax} AVALIAÇÕES` : 'MANUTENÇÃO',
      title: `${params.targetWeight} kg`,
      sub: kgDiff > 0 ? 'Ajustes até consolidar' : 'Meta consolidada',
      fill: '#B45309'
    }
  ];

  milestones.forEach((m, idx) => {
    // Anel externo
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(m.x, m.y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = m.fill;
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // Número do marco
    ctx.fillStyle = m.fill;
    ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`0${idx + 1}`, m.x, m.y + 4);

    // Pílula de fase acima (dentro do canvas da ilustração)
    drawRoundedRect(ctx, m.x - 56, yTrack - 42, 112, 18, 9);
    ctx.fillStyle = idx === 3 ? '#FEF3C7' : '#ECFDF5';
    ctx.fill();
    ctx.fillStyle = idx === 3 ? '#92400E' : '#03422A';
    ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
    ctx.fillText(m.badge, m.x, yTrack - 29);

    // Valor e subtítulo abaixo
    ctx.fillStyle = '#1C1917';
    ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
    ctx.fillText(m.title, m.x, yTrack + 36);

    ctx.fillStyle = '#57534E';
    ctx.font = '11px system-ui, -apple-system, sans-serif';
    ctx.fillText(m.sub, m.x, yTrack + 52);
  });

  ctx.textAlign = 'left';
  return canvas.toDataURL('image/png');
}

/** Ilustração 2: Proteção da Massa Magra vs Dieta Restritiva */
function renderLeanMassIllustrationPng(exerciseLabel: string): string | null {
  const W = 720;
  const H = 225;
  const res = createHiDpiCanvas(W, H, 3);
  if (!res) return null;
  const { canvas, ctx } = res;

  drawRoundedRect(ctx, 2, 2, W - 4, H - 4, 16);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.strokeStyle = '#E7E5E4';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#03422A';
  ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
  ctx.fillText('POR QUE PROTEGER A MASSA MAGRA ACELERA A QUEIMA DE GORDURA REAL', 24, 30);

  // Coluna esquerda: Dieta Radical (Alerta)
  drawRoundedRect(ctx, 22, 46, 326, 158, 12);
  ctx.fillStyle = '#FFF7ED';
  ctx.fill();
  ctx.strokeStyle = '#FED7AA';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.fillStyle = '#9A3412';
  ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
  ctx.fillText('✕  Dietas radicais (cortes extremos)', 38, 70);

  // Barras de composição corporal (perde músculo)
  ctx.fillStyle = '#78716C';
  ctx.font = '11px system-ui, -apple-system, sans-serif';
  ctx.fillText('Músculo / Massa Magra', 38, 98);
  drawRoundedRect(ctx, 38, 105, 290, 14, 7);
  ctx.fillStyle = '#FDBA74';
  ctx.fill();
  drawRoundedRect(ctx, 38, 105, 130, 14, 7);
  ctx.fillStyle = '#EA580C';
  ctx.fill();
  ctx.fillStyle = '#9A3412';
  ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
  ctx.fillText('QUEDA (-)', 176, 116);

  ctx.fillStyle = '#78716C';
  ctx.font = '11px system-ui, -apple-system, sans-serif';
  ctx.fillText('Metabolismo Basal & Energia', 38, 138);
  drawRoundedRect(ctx, 38, 145, 290, 14, 7);
  ctx.fillStyle = '#FED7AA';
  ctx.fill();
  drawRoundedRect(ctx, 38, 145, 110, 14, 7);
  ctx.fillStyle = '#DC2626';
  ctx.fill();

  ctx.fillStyle = '#9A3412';
  ctx.font = '11px system-ui, -apple-system, sans-serif';
  ctx.fillText('Resultado: cansaço, fome noturna e efeito sanfona.', 38, 184);

  // Coluna direita: Método EmagreSLIM (Proteção Muscular)
  drawRoundedRect(ctx, 370, 46, 326, 158, 12);
  ctx.fillStyle = '#ECFDF5';
  ctx.fill();
  ctx.strokeStyle = '#A7F3D0';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#03422A';
  ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
  ctx.fillText('✓  Estratégia EmagreSLIM (Déficit Inteligente)', 386, 70);

  // Ícone ilustrativo de músculo/haltere estilizado
  ctx.save();
  ctx.fillStyle = '#03422A';
  drawRoundedRect(ctx, 636, 56, 44, 24, 8);
  ctx.fill();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  // Barra haltere
  ctx.beginPath();
  ctx.moveTo(646, 68);
  ctx.lineTo(670, 68);
  ctx.stroke();
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(644, 62, 4, 12);
  ctx.fillRect(668, 62, 4, 12);
  ctx.restore();

  ctx.fillStyle = '#334155';
  ctx.font = '11px system-ui, -apple-system, sans-serif';
  ctx.fillText('Massa Magra Preservada (Proteína + Movimento)', 386, 98);
  drawRoundedRect(ctx, 386, 105, 290, 14, 7);
  ctx.fillStyle = '#D1FAE5';
  ctx.fill();
  drawRoundedRect(ctx, 386, 105, 265, 14, 7);
  ctx.fillStyle = '#03422A';
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
  ctx.fillText('PROTEGIDA', 400, 116);

  ctx.fillStyle = '#334155';
  ctx.font = '11px system-ui, -apple-system, sans-serif';
  ctx.fillText('Perda de Gordura Corporal Real', 386, 138);
  drawRoundedRect(ctx, 386, 145, 290, 14, 7);
  ctx.fillStyle = '#D1FAE5';
  ctx.fill();
  drawRoundedRect(ctx, 386, 145, 240, 14, 7);
  ctx.fillStyle = '#059669';
  ctx.fill();

  ctx.fillStyle = '#03422A';
  ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
  ctx.fillText(`Foco atual: ${exerciseLabel}`, 386, 184);

  return canvas.toDataURL('image/png');
}

/** Ilustração 3: Hidratação Personalizada nos 4 Períodos com Copos Desenhados */
function renderWaterHydrationPng(params: {
  idealWaterMl: number;
  currentWaterLiters?: number;
  idealWaterCups: number;
}): string | null {
  const W = 720;
  const H = 250;
  const res = createHiDpiCanvas(W, H, 3);
  if (!res) return null;
  const { canvas, ctx } = res;

  drawRoundedRect(ctx, 2, 2, W - 4, H - 4, 16);
  ctx.fillStyle = '#F0F9FF';
  ctx.fill();
  ctx.strokeStyle = '#BAE6FD';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Gota d'água desenhada
  ctx.fillStyle = '#0284C7';
  ctx.beginPath();
  ctx.moveTo(36, 22);
  ctx.bezierCurveTo(47, 34, 48, 44, 36, 46);
  ctx.bezierCurveTo(24, 44, 25, 34, 36, 22);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#0C4A6E';
  ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
  ctx.fillText(
    `META DIÁRIA DE HIDRATAÇÃO: ${(params.idealWaterMl / 1000).toFixed(1)} L/DIA (${params.idealWaterCups} copos de 250 ml)`,
    56,
    38
  );

  // Barra comparativa se houver consumo atual
  if (typeof params.currentWaterLiters === 'number') {
    const targetL = params.idealWaterMl / 1000;
    const ratio = Math.max(0.12, Math.min(1, params.currentWaterLiters / Math.max(0.5, targetL)));

    ctx.fillStyle = '#0369A1';
    ctx.font = '12px system-ui, -apple-system, sans-serif';
    ctx.fillText(
      `Consumo atual relatado: ~${params.currentWaterLiters} L/dia   •   Meta ideal para o seu peso (35 ml/kg): ${targetL.toFixed(1)} L/dia`,
      26,
      64
    );

    drawRoundedRect(ctx, 26, 73, 668, 14, 7);
    ctx.fillStyle = '#E0F2FE';
    ctx.fill();
    drawRoundedRect(ctx, 26, 73, Math.round(668 * ratio), 14, 7);
    ctx.fillStyle = '#0284C7';
    ctx.fill();
  } else {
    ctx.fillStyle = '#0369A1';
    ctx.font = '12px system-ui, -apple-system, sans-serif';
    ctx.fillText(
      'Distribua a água ao longo dos 4 períodos para manter saciedade, intestino regular e diferenciar sede de fome.',
      26,
      68
    );
  }

  const w1 = Math.round(params.idealWaterMl * 0.15);
  const w2 = Math.round(params.idealWaterMl * 0.3);
  const w3 = Math.round(params.idealWaterMl * 0.35);
  const w4 = Math.max(250, params.idealWaterMl - w1 - w2 - w3);

  const periods = [
    { label: 'Ao acordar', ml: w1, cups: Math.max(1, Math.round(w1 / 250)), why: 'Desperta o organismo' },
    { label: 'Manhã', ml: w2, cups: Math.max(1, Math.round(w2 / 250)), why: 'Mantém foco e energia' },
    { label: 'Tarde', ml: w3, cups: Math.max(1, Math.round(w3 / 250)), why: 'Reduz beliscos à toa' },
    { label: 'Início da noite', ml: w4, cups: Math.max(1, Math.round(w4 / 250)), why: 'Sem atrapalhar o sono' }
  ];

  const cardW = 156;
  const startX = 24;
  const gap = 16;
  const cardY = 104;
  const cardH = 128;

  periods.forEach((p, idx) => {
    const cx = startX + idx * (cardW + gap);
    drawRoundedRect(ctx, cx, cardY, cardW, cardH, 12);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = '#BAE6FD';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.fillStyle = '#0C4A6E';
    ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(p.label, cx + cardW / 2, cardY + 22);

    // Desenha até 4 copos de água lado a lado
    const visibleCups = Math.min(4, p.cups);
    const cupWidth = 18;
    const cupGap = 6;
    const totalCupsW = visibleCups * cupWidth + (visibleCups - 1) * cupGap;
    const firstCupX = cx + (cardW - totalCupsW) / 2;

    for (let c = 0; c < visibleCups; c++) {
      const gx = firstCupX + c * (cupWidth + cupGap);
      const gy = cardY + 34;
      // Líquido azul dentro do copo
      ctx.fillStyle = 'rgba(14, 165, 233, 0.35)';
      ctx.beginPath();
      ctx.moveTo(gx + 1.5, gy + 10);
      ctx.lineTo(gx + cupWidth - 1.5, gy + 10);
      ctx.lineTo(gx + cupWidth - 3, gy + 28);
      ctx.lineTo(gx + 3, gy + 28);
      ctx.closePath();
      ctx.fill();

      // Contorno do copo
      ctx.strokeStyle = '#0369A1';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(gx, gy);
      ctx.lineTo(gx + cupWidth, gy);
      ctx.lineTo(gx + cupWidth - 3, gy + 29);
      ctx.lineTo(gx + 3, gy + 29);
      ctx.closePath();
      ctx.stroke();
    }

    ctx.fillStyle = '#0369A1';
    ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
    ctx.fillText(`${p.ml} ml`, cx + cardW / 2, cardY + 84);

    ctx.fillStyle = '#475569';
    ctx.font = '11px system-ui, -apple-system, sans-serif';
    ctx.fillText(`(~${p.cups} ${p.cups === 1 ? 'copo' : 'copos'} de 250 ml)`, cx + cardW / 2, cardY + 100);

    ctx.fillStyle = '#0284C7';
    ctx.font = '10px system-ui, -apple-system, sans-serif';
    ctx.fillText(p.why, cx + cardW / 2, cardY + 116);
  });

  ctx.textAlign = 'left';
  return canvas.toDataURL('image/png');
}

/** Ilustração 4: Regra da Porção Inteira (100%) vs Regra da Metade (½ + ½) */
function renderPlateSplitRulePng(): string | null {
  const W = 720;
  const H = 170;
  const res = createHiDpiCanvas(W, H, 3);
  if (!res) return null;
  const { canvas, ctx } = res;

  drawRoundedRect(ctx, 2, 2, W - 4, H - 4, 16);
  ctx.fillStyle = '#FFFBEB';
  ctx.fill();
  ctx.strokeStyle = '#FDE68A';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#92400E';
  ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
  ctx.fillText('COMO ESCOLHER SEUS ALIMENTOS NO PRATO SEM ERRAR NA QUANTIDADE', 24, 28);

  // Lado Esquerdo: Prato 100%
  const p1x = 82;
  const py = 96;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(p1x, py, 44, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#D6D3D1';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = 'rgba(20, 83, 60, 0.16)';
  ctx.beginPath();
  ctx.arc(p1x, py, 32, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#03422A';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#03422A';
  ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('100%', p1x, py + 5);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#1C1917';
  ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
  ctx.fillText('1 Alimento = Porção Inteira', 142, 82);
  ctx.fillStyle = '#57534E';
  ctx.font = '11px system-ui, -apple-system, sans-serif';
  ctx.fillText('Ex.: Só arroz -> consuma as', 142, 100);
  ctx.fillText('4 colheres de sopa indicadas.', 142, 115);

  // Divisória vertical
  ctx.strokeStyle = '#FDE68A';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(356, 46);
  ctx.lineTo(356, 148);
  ctx.stroke();

  // Lado Direito: Prato ½ + ½
  const p2x = 420;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(p2x, py, 44, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#D6D3D1';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Metade esquerda verde
  ctx.fillStyle = 'rgba(20, 83, 60, 0.2)';
  ctx.beginPath();
  ctx.arc(p2x, py, 32, Math.PI * 0.5, Math.PI * 1.5);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#03422A';
  ctx.lineWidth = 1.8;
  ctx.stroke();

  // Metade direita âmbar
  ctx.fillStyle = 'rgba(217, 119, 6, 0.22)';
  ctx.beginPath();
  ctx.arc(p2x, py, 32, -Math.PI * 0.5, Math.PI * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#B45309';
  ctx.lineWidth = 1.8;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#03422A';
  ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
  ctx.fillText('1/2', p2x - 14, py + 4);
  ctx.fillStyle = '#92400E';
  ctx.fillText('1/2', p2x + 14, py + 4);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#1C1917';
  ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
  ctx.fillText('Misturar 2 Opções = Metade + Metade', 480, 82);
  ctx.fillStyle = '#57534E';
  ctx.font = '11px system-ui, -apple-system, sans-serif';
  ctx.fillText('Ex.: Arroz + Batata -> 2 colheres', 480, 100);
  ctx.fillText('de arroz + 1/2 porção de batata.', 480, 115);

  return canvas.toDataURL('image/png');
}

function drawPageFooter(doc: jsPDF, pageNum: number, totalPages: number, margin: number) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setDrawColor(231, 229, 228);
  doc.setLineWidth(0.3);
  doc.line(margin, pageHeight - 13, pageWidth - margin, pageHeight - 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(120, 113, 108);
  doc.text('Equipe Clínica EmagreSLIM · Nutrição Baseada em Evidências', margin, pageHeight - 8);
  doc.text(`Página ${pageNum} de ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
}

function paintWarmPageBackground(doc: jsPDF) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  doc.setFillColor(249, 248, 244);
  doc.rect(0, 0, w, h, 'F');
}

export function exportFreeMappingPdf(
  input: AssessmentInput,
  analysis: FreeMappingAnalysis,
  barrierTitle: string,
  barrierText: string
): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 16;
  const maxWidth = pageWidth - margin * 2;

  // ===================== PÁGINA 1 =====================
  paintWarmPageBackground(doc);

  // Cabeçalho Editorial Rico com logo oficial
  drawBrandedCoverHeader(
    doc,
    pageWidth,
    margin,
    'Seu Mapeamento Nutricional',
    `Participante: ${input.memberName}  |  ${input.age} anos  |  ${input.heightCm} cm  |  Atual: ${input.weightKg} kg -> Meta: ${input.targetWeightKg} kg`,
    `E-mail: ${input.email}${input.whatsapp ? `  |  WhatsApp: ${input.whatsapp}` : ''}`
  );

  let y = 49;

  // Introdução calorosa e direta
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13.5);
  doc.setTextColor(28, 25, 23);
  doc.text(`Olá, ${input.memberName}. Este é o retrato personalizado do seu ponto de partida:`, margin, y);
  y += 8;

  // 4 Cartões de KPI com bastante espaço
  const cardGap = 4;
  const cardW = (maxWidth - cardGap * 3) / 4;
  const cardH = 26;
  const kpis = [
    {
      label: 'PONTO DE PARTIDA',
      value: `${input.weightKg} -> ${input.targetWeightKg} kg`,
      sub: `IMC ${analysis.bmi} -> ${analysis.targetBmi} kg/m²`,
      highlight: false
    },
    {
      label: 'GASTO DIÁRIO (DRI)',
      value: `~${analysis.tdeeKcal} kcal`,
      sub: `Basal: ~${analysis.bmrKcal} kcal/dia`,
      highlight: false
    },
    {
      label: 'DIETA ESTIMADA',
      value: `~${analysis.estimatedDietKcal} kcal`,
      sub: `Déficit ~${analysis.dailyDeficitKcal} kcal/dia`,
      highlight: true
    },
    {
      label: 'AVALIAÇÕES ATÉ A META',
      value:
        analysis.kgToLose > 0
          ? `${analysis.estimatedEvaluationsMin}–${analysis.estimatedEvaluationsMax} avaliações`
          : '1 avaliação',
      sub:
        analysis.kgToLose > 0
          ? 'Ciclos de ajuste alimentar'
          : 'Ajuste de manutenção',
      highlight: true
    }
  ];

  kpis.forEach((k, idx) => {
    const cx = margin + idx * (cardW + cardGap);
    if (k.highlight) {
      doc.setFillColor(236, 253, 245);
      doc.setDrawColor(167, 243, 208);
    } else {
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(231, 229, 228);
    }
    doc.roundedRect(cx, y, cardW, cardH, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(k.highlight ? 3 : 120, k.highlight ? 66 : 113, k.highlight ? 42 : 108);
    doc.text(k.label, cx + 3.5, y + 6.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11.5);
    doc.setTextColor(k.highlight ? 3 : 28, k.highlight ? 66 : 25, k.highlight ? 42 : 23);
    doc.text(k.value, cx + 3.5, y + 14.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(87, 83, 78);
    doc.text(k.sub, cx + 3.5, y + 21);
  });

  y += cardH + 8;

  // Ilustração 1: Jornada por Ciclos de Avaliação
  const timelinePng = renderTimelineRoadmapPng({
    currentWeight: Number(input.weightKg),
    targetWeight: Number(input.targetWeightKg),
    evalsMin: analysis.estimatedEvaluationsMin,
    evalsMax: analysis.estimatedEvaluationsMax,
    dietKcal: analysis.estimatedDietKcal
  });
  if (timelinePng) {
    const imgH = 48;
    doc.addImage(timelinePng, 'PNG', margin, y, maxWidth, imgH);
    y += imgH + 8;
  }

  // Ilustração 2: Massa Magra vs Cortes Radicais
  const leanPng = renderLeanMassIllustrationPng(analysis.exerciseRecommendationTitle);
  if (leanPng) {
    const imgH = 56;
    doc.addImage(leanPng, 'PNG', margin, y, maxWidth, imgH);
    y += imgH + 7;
  }

  // Bloco textual sobre Atividade Física personalizada
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(231, 229, 228);
  const exerciseLines = doc.splitTextToSize(analysis.exerciseRecommendationDetail, maxWidth - 12) as string[];
  const exBoxH = 16 + exerciseLines.length * 4.8;
  doc.roundedRect(margin, y, maxWidth, exBoxH, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(3, 66, 42);
  doc.text(`Orientação de Movimento: ${analysis.exerciseRecommendationTitle}`, margin + 6, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.2);
  doc.setTextColor(68, 64, 60);
  doc.text(exerciseLines, margin + 6, y + 14.5);
  y += exBoxH + 6;

  if (analysis.hasClinicalFlags) {
    doc.setFillColor(255, 251, 235);
    doc.setDrawColor(253, 230, 138);
    const flagLines = doc.splitTextToSize(
      'Nota clínica importante: como você marcou condição de saúde ou histórico bariátrico, essa faixa calórica é educativa e no plano completo passa por revisão individual do nutricionista em até 24h.',
      maxWidth - 12
    ) as string[];
    const flagH = 8 + flagLines.length * 4.5;
    doc.roundedRect(margin, y, maxWidth, flagH, 3, 3, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(146, 64, 14);
    doc.text(flagLines, margin + 6, y + 6.5);
  }

  // ===================== PÁGINA 2 =====================
  doc.addPage();
  paintWarmPageBackground(doc);

  // Faixa superior fina
  doc.setFillColor(3, 66, 42);
  doc.rect(0, 0, pageWidth, 14, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  doc.text(`EmagreSLIM · Hidratação e Estratégia Prática de ${input.memberName}`, margin, 9);

  y = 24;

  // Ilustração 3: Hidratação Personalizada com Copos
  const waterPng = renderWaterHydrationPng({
    idealWaterMl: analysis.idealWaterMl,
    currentWaterLiters: analysis.currentWaterLiters,
    idealWaterCups: analysis.idealWaterCups
  });
  if (waterPng) {
    const waterH = 62;
    doc.addImage(waterPng, 'PNG', margin, y, maxWidth, waterH);
    y += waterH + 10;
  }

  // Seção Barreira Principal em Cartão Amplo
  const barrierLines = doc.splitTextToSize(barrierText, maxWidth - 14) as string[];
  const barrierBoxH = 22 + barrierLines.length * 5;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(231, 229, 228);
  doc.roundedRect(margin, y, maxWidth, barrierBoxH, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(3, 66, 42);
  doc.text('SUA PRINCIPAL BARREIRA IDENTIFICADA', margin + 7, y + 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(28, 25, 23);
  doc.text(barrierTitle, margin + 7, y + 15.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(68, 64, 60);
  doc.text(barrierLines, margin + 7, y + 22);
  y += barrierBoxH + 10;

  // 3 Ajustes Práticos para Começar Ainda Esta Semana
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(3, 66, 42);
  doc.text('3 Ajustes Práticos Para Você Começar Ainda Esta Semana', margin, y);
  y += 6;

  const tips = [
    input.freePrimaryBarrier === 'fome_noturna_tarde'
      ? 'Antecipe um lanche estruturado cerca de 2h30 antes do horário em que sua fome costuma apertar (ex.: fruta + aveia ou proteína prática).'
      : 'Mantenha alimentos do seu dia a dia (arroz, feijão, pão, ovo) em porções medidas, evitando cortes radicais que geram abandono.',
    input.exerciseMinutesPerWeek === 0
      ? 'Inclua 20 a 30 minutos de caminhada leve 3 vezes nesta semana — é o suficiente para começar a proteger massa magra e regular a fome.'
      : 'Preserve seus treinos semanais e distribua proteína ao longo das refeições para perder gordura corporal sem flacidez nem queda de energia.',
    analysis.waterGapMl > 0
      ? `Acrescente aos poucos +${analysis.waterGapMl} ml de água divididos nos 4 períodos do dia — muita gente confunde sede leve com vontade de beliscar.`
      : 'Continue dividindo seus copos de água nos 4 períodos do dia para manter intestino regular e boa saciedade.'
  ];

  tips.forEach((tip, idx) => {
    const lines = doc.splitTextToSize(tip, maxWidth - 22) as string[];
    const h = Math.max(18, 10 + lines.length * 4.8);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(231, 229, 228);
    doc.roundedRect(margin, y, maxWidth, h, 3, 3, 'FD');

    doc.setFillColor(3, 66, 42);
    doc.circle(margin + 9, y + h / 2, 4.2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text(`0${idx + 1}`, margin + 9, y + h / 2 + 1.2, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.3);
    doc.setTextColor(41, 37, 36);
    doc.text(lines, margin + 17, y + 7.5);
    y += h + 4.5;
  });

  y += 5;

  // Cartão final de próximo passo
  doc.setFillColor(3, 66, 42);
  doc.roundedRect(margin, y, maxWidth, 34, 3.5, 3.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(255, 255, 255);
  doc.text(`Pronto para transformar ~${analysis.estimatedDietKcal} kcal/dia em um cardápio completo?`, margin + 7, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(209, 250, 229);
  const inviteLines = doc.splitTextToSize(
    'No Plano Completo EmagreSLIM, você recebe todas as refeições ajustadas ao seu dia (3 a 6 refeições), porções em medidas caseiras ilustradas, lista de substituições equivalentes e relatório PAN em 7 eixos.',
    maxWidth - 14
  ) as string[];
  doc.text(inviteLines, margin + 7, y + 17.5);

  y += 40;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(120, 113, 108);
  const ethicLines = doc.splitTextToSize(
    'Nota ética: Este mapeamento inicial gratuito organiza sua estimativa metabólica, ciclos de ajuste alimentar, hidratação e ponto de partida. Ele não constitui diagnóstico clínico nem prescrição médica individualizada.',
    maxWidth
  ) as string[];
  doc.text(ethicLines, margin, y);

  doc.setPage(1);
  drawPageFooter(doc, 1, 2, margin);
  doc.setPage(2);
  drawPageFooter(doc, 2, 2, margin);

  const safeName = input.memberName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
  doc.save(`EmagreSLIM_Mapeamento_${safeName || 'Inicial'}.pdf`);
}

export function exportAssessmentPlanPdf(evaluation: AssessmentRecord): void {
  const { prescription, pan, feasibilityProfile, reviewedBy, reviewedByCrn } = evaluation.engineResult;
  if (!prescription) return;

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const maxWidth = pageWidth - margin * 2;
  let y = 18;

  const startNewPage = (subtitle: string) => {
    doc.addPage();
    paintWarmPageBackground(doc);
    doc.setFillColor(3, 66, 42);
    doc.rect(0, 0, pageWidth, 14, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(255, 255, 255);
    doc.text(`EmagreSLIM · ${subtitle} · ${evaluation.memberName}`, margin, 9);
    y = 22;
  };

  const ensureSpace = (neededMm: number, subtitle = 'Plano Alimentar & PAN') => {
    if (y + neededMm > pageHeight - 18) {
      startNewPage(subtitle);
    }
  };

  // ===================== PÁGINA 1 — CAPA EXECUTIVA + ILUSTRAÇÕES =====================
  paintWarmPageBackground(doc);

  drawBrandedCoverHeader(
    doc,
    pageWidth,
    margin,
    'Plano Alimentar & PAN',
    `Membro: ${evaluation.memberName} (${evaluation.email})  |  Registro: ${evaluation.id}  |  Avaliação #${evaluation.assessmentNumber}`,
    reviewedBy
      ? `Validado clinicamente por ${reviewedBy} (${reviewedByCrn || 'CRN'})`
      : 'Nutrição Baseada em Evidências · Mifflin-St Jeor (1990) · DRI (2023) · TACO 4ª ed. / IBGE'
  );

  y = 48;

  // 4 Cartões de Metas Nutricionais
  const gap = 4;
  const cardW = (maxWidth - gap * 3) / 4;
  const kpis = [
    { label: 'META CALÓRICA', value: `${prescription.targetKcal} kcal/dia`, sub: `TDEE: ${prescription.tdeeKcal} kcal`, accent: true },
    { label: 'PROTEÍNA PROTETORA', value: `${prescription.macros.proteinG}g / dia`, sub: `${prescription.macros.proteinPerKg} g/kg massa`, accent: true },
    { label: 'CARBOIDRATOS / GORD.', value: `${prescription.macros.carbsG}g / ${prescription.macros.fatG}g`, sub: 'Energia equilibrada', accent: false },
    { label: 'META DE ÁGUA', value: `${(prescription.waterTargetMl / 1000).toFixed(1)} L/dia`, sub: `${Math.round(prescription.waterTargetMl / 250)} copos de 250 ml`, accent: false }
  ];

  kpis.forEach((k, idx) => {
    const cx = margin + idx * (cardW + gap);
    doc.setFillColor(k.accent ? 236 : 255, k.accent ? 253 : 255, k.accent ? 245 : 255);
    doc.setDrawColor(k.accent ? 167 : 231, k.accent ? 243 : 229, k.accent ? 208 : 228);
    doc.roundedRect(cx, y, cardW, 25, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(k.accent ? 3 : 120, k.accent ? 66 : 113, k.accent ? 42 : 108);
    doc.text(k.label, cx + 3.5, y + 6.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(k.accent ? 3 : 28, k.accent ? 66 : 25, k.accent ? 42 : 23);
    doc.text(k.value, cx + 3.5, y + 14.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.6);
    doc.setTextColor(87, 83, 78);
    doc.text(k.sub, cx + 3.5, y + 20.5);
  });

  y += 30;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(87, 83, 78);
  doc.text(`Memorial energético: ${prescription.equationUsed}`, margin, y);
  y += 6;

  // Ilustração: Regra da Porção Inteira vs Regra da Metade
  const platePng = renderPlateSplitRulePng();
  if (platePng) {
    doc.addImage(platePng, 'PNG', margin, y, maxWidth, 42);
    y += 48;
  }

  // Ilustração: Massa Magra
  const leanPng = renderLeanMassIllustrationPng(`Aporte proteico de ${prescription.macros.proteinG}g/dia protege sua massa magra`);
  if (leanPng) {
    doc.addImage(leanPng, 'PNG', margin, y, maxWidth, 55);
    y += 61;
  }

  // Ilustração ou Nota de Hidratação
  if (evaluation.input.fluidRestriction) {
    doc.setFillColor(255, 251, 235);
    doc.setDrawColor(253, 230, 138);
    doc.roundedRect(margin, y, maxWidth, 24, 3, 3, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(146, 64, 14);
    doc.text(
      'Restrição hídrica clínica declarada: siga exclusivamente o volume de líquidos liberado na revisão individual.',
      margin + 6,
      y + 13
    );
  } else {
    const waterPng = renderWaterHydrationPng({
      idealWaterMl: prescription.waterTargetMl,
      idealWaterCups: Math.round(prescription.waterTargetMl / 250)
    });
    if (waterPng) {
      doc.addImage(waterPng, 'PNG', margin, y, maxWidth, 61);
    }
  }

  // ===================== PÁGINA 2+ — CARDÁPIO EM CARTÕES ESPAÇOSOS =====================
  const meals = prescription.meals || [];
  startNewPage(`Cardápio Individualizado (${meals.length} refeições)`);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13.5);
  doc.setTextColor(3, 66, 42);
  doc.text(`Seu Plano Alimentar em ${meals.length} Refeições (${prescription.targetKcal} kcal/dia)`, margin, y);
  y += 7;

  if (prescription.manualPlanText) {
    const manualLines = doc.splitTextToSize(prescription.manualPlanText, maxWidth - 12) as string[];
    const h = 14 + manualLines.length * 4.8;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(231, 229, 228);
    doc.roundedRect(margin, y, maxWidth, h, 3, 3, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(41, 37, 36);
    doc.text(manualLines, margin + 6, y + 8);
    y += h + 6;
  } else {
    meals.forEach((meal, idx) => {
      const slots = meal.slots && meal.slots.length > 0
        ? meal.slots
        : meal.items.map((item, sIdx) => ({
            roleLabel: `Item ${sIdx + 1}`,
            primary: item,
            swapOptions: []
          }));

      // Calcula altura aproximada do cartão da refeição para não quebrar feio no meio
      let estimatedHeight = 18;
      slots.forEach(slot => {
        const mainText = `Passo: ${slot.primary.name} — 100%: ${slot.primary.householdMeasure} (${slot.primary.portionGrams}g | ${slot.primary.kcal} kcal)`;
        const mainLines = doc.splitTextToSize(mainText, maxWidth - 14) as string[];
        estimatedHeight += mainLines.length * 4.4 + 4;
        if (slot.swapOptions.length > 0) {
          const swapStr = slot.swapOptions
            .map(
              alt =>
                `${alt.name} [100%: ${alt.householdMeasure} | se misturar: ${formatHalfMeasurePdf(alt.householdMeasure, alt.portionGrams)}]`
            )
            .join(' OU ');
          const swapText = `Se misturar 2 opções: ${formatHalfMeasurePdf(slot.primary.householdMeasure, slot.primary.portionGrams)} + metade de: ${swapStr}`;
          const swapLines = doc.splitTextToSize(swapText, maxWidth - 18) as string[];
          estimatedHeight += swapLines.length * 4.1 + 5;
        }
      });

      ensureSpace(Math.min(estimatedHeight, 120), `Cardápio (${meals.length} refeições)`);

      const mealKcal = meal.items.reduce((acc, f) => acc + f.kcal, 0);
      const mealProt = meal.items.reduce((acc, f) => acc + f.protein_g, 0);

      // Cartão branco da refeição
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(214, 211, 209);
      doc.roundedRect(margin, y, maxWidth, estimatedHeight, 3.5, 3.5, 'FD');

      // Cabeçalho suave esmeralda dentro do cartão
      doc.setFillColor(236, 253, 245);
      doc.roundedRect(margin + 0.3, y + 0.3, maxWidth - 0.6, 11, 3, 3, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(3, 66, 42);
      doc.text(`Refeição 0${idx + 1}: ${meal.name} (${meal.suggestedWindow})`, margin + 5, y + 7.2);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(87, 83, 78);
      doc.text(`${mealKcal} kcal | ${mealProt.toFixed(1)}g proteína`, pageWidth - margin - 5, y + 7.2, {
        align: 'right'
      });

      let innerY = y + 16.5;

      slots.forEach((slot, sIdx) => {
        const f = slot.primary;
        const mainText = `Passo ${sIdx + 1} (${slot.roleLabel}): ${f.name} — 100%: ${f.householdMeasure} (${f.portionGrams}g | ${f.kcal} kcal | ${f.source} ${f.sourceCode})`;
        const mainLines = doc.splitTextToSize(mainText, maxWidth - 14) as string[];

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.2);
        doc.setTextColor(28, 25, 23);
        doc.text(mainLines, margin + 6, innerY);
        innerY += mainLines.length * 4.4 + 1.5;

        if (slot.swapOptions.length > 0) {
          const swapStr = slot.swapOptions
            .map(
              alt =>
                `${alt.name} [100%: ${alt.householdMeasure} | se misturar: ${formatHalfMeasurePdf(alt.householdMeasure, alt.portionGrams)}]`
            )
            .join(' OU ');
          const swapText = `Se misturar 2 opções: ${formatHalfMeasurePdf(f.householdMeasure, f.portionGrams)} + metade de: ${swapStr}`;
          const swapLines = doc.splitTextToSize(swapText, maxWidth - 18) as string[];

          doc.setFillColor(255, 251, 235);
          doc.roundedRect(margin + 6, innerY - 3, maxWidth - 12, swapLines.length * 4.1 + 3.5, 2, 2, 'F');

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.2);
          doc.setTextColor(120, 53, 15);
          doc.text(swapLines, margin + 9, innerY + 1);
          innerY += swapLines.length * 4.1 + 4.5;
        } else {
          innerY += 1.5;
        }
      });

      y += estimatedHeight + 6;
    });
  }

  // ===================== SUBSTITUIÇÕES + PAN EM 7 EIXOS =====================
  if (prescription.substitutions && prescription.substitutions.length > 0) {
    ensureSpace(45, 'Substituições e PAN');
    y += 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(3, 66, 42);
    doc.text('Lista Completa de Substituições Equivalentes', margin, y);
    y += 6;

    prescription.substitutions.forEach(sub => {
      const eqLinesCount = sub.equivalents.reduce((sum, eq) => {
        return sum + (doc.splitTextToSize(`• ${eq}`, maxWidth - 16) as string[]).length;
      }, 0);
      const boxH = 13 + eqLinesCount * 4.4;
      ensureSpace(boxH + 4, 'Substituições e PAN');

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(231, 229, 228);
      doc.roundedRect(margin, y, maxWidth, boxH, 3, 3, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(3, 66, 42);
      doc.text(`${sub.group} — Base: ${sub.original}`, margin + 5, y + 6.5);

      let sy = y + 12;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.8);
      doc.setTextColor(68, 64, 60);
      sub.equivalents.forEach(eq => {
        const lines = doc.splitTextToSize(`• ${eq}`, maxWidth - 16) as string[];
        doc.text(lines, margin + 7, sy);
        sy += lines.length * 4.4;
      });
      y += boxH + 4.5;
    });
  }

  ensureSpace(60, 'Relatório PAN em 7 Eixos');
  y += 3;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(3, 66, 42);
  doc.text('Relatório PAN (Plano de Ação Nutricional) & 7 Eixos de Viabilidade', margin, y);
  y += 6;

  const panBarrierLines = doc.splitTextToSize(`Barreira Principal: ${pan.primaryBarrier}`, maxWidth - 12) as string[];
  const invLinesCount = pan.methodInterventions.reduce(
    (sum, inv) => sum + (doc.splitTextToSize(`• ${inv}`, maxWidth - 16) as string[]).length,
    0
  );
  const panH = 12 + panBarrierLines.length * 4.5 + invLinesCount * 4.4;
  ensureSpace(panH + 6, 'Relatório PAN em 7 Eixos');

  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(margin, y, maxWidth, panH, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(3, 66, 42);
  doc.text(panBarrierLines, margin + 5, y + 7);

  let py = y + 7 + panBarrierLines.length * 4.5 + 2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.8);
  doc.setTextColor(41, 37, 36);
  pan.methodInterventions.forEach(inv => {
    const lines = doc.splitTextToSize(`• ${inv}`, maxWidth - 16) as string[];
    doc.text(lines, margin + 7, py);
    py += lines.length * 4.4;
  });
  y += panH + 6;

  feasibilityProfile.forEach(axis => {
    const lines = doc.splitTextToSize(`${axis.axis} (${axis.status}): ${axis.detail}`, maxWidth - 12) as string[];
    const ah = 7 + lines.length * 4.2;
    ensureSpace(ah + 3, 'Relatório PAN em 7 Eixos');
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(231, 229, 228);
    doc.roundedRect(margin, y, maxWidth, ah, 2.5, 2.5, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.6);
    doc.setTextColor(68, 64, 60);
    doc.text(lines, margin + 5, y + 5.5);
    y += ah + 3;
  });

  // Numeração de páginas em todas as páginas
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawPageFooter(doc, p, totalPages, margin);
  }

  const safeName = evaluation.memberName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
  doc.save(`EmagreSLIM_Plano_${safeName || evaluation.id}.pdf`);
}
