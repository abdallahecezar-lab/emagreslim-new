import { jsPDF } from 'jspdf';
import emagreslimLogo from '../assets/images/emagreslim-logo.png';
import type { FreeMappingAnalysis } from '../shared/clinicalEngine';
import {
  buildCompleteSubstitutionCatalog,
  buildRichMealSheets,
  type FoodBandTone
} from '../shared/mealBuilder';
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

function measureWrappedLines(
  doc: jsPDF,
  text: string,
  maxWidthMm: number,
  fontStyle: 'normal' | 'bold' = 'normal',
  fontSize = 9
): string[] {
  doc.setFont('helvetica', fontStyle);
  doc.setFontSize(fontSize);
  return doc.splitTextToSize(text, maxWidthMm) as string[];
}

const PDF_BAND_PALETTE: Record<
  FoodBandTone,
  {
    headerRgb: [number, number, number];
    bodyRgb: [number, number, number];
    borderRgb: [number, number, number];
  }
> = {
  forest: {
    headerRgb: [3, 66, 42],
    bodyRgb: [236, 253, 245],
    borderRgb: [167, 243, 208]
  },
  green: {
    headerRgb: [101, 163, 13],
    bodyRgb: [247, 254, 231],
    borderRgb: [190, 242, 100]
  },
  red: {
    headerRgb: [185, 28, 28],
    bodyRgb: [254, 242, 242],
    borderRgb: [254, 202, 202]
  },
  blue: {
    headerRgb: [3, 105, 161],
    bodyRgb: [240, 249, 255],
    borderRgb: [186, 230, 253]
  },
  slate: {
    headerRgb: [87, 83, 78],
    bodyRgb: [245, 245, 244],
    borderRgb: [214, 211, 209]
  }
};

export function exportAssessmentPlanPdf(evaluation: AssessmentRecord): void {
  const { prescription, pan, feasibilityProfile, reviewedBy, reviewedByCrn } = evaluation.engineResult;
  if (!prescription) return;

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const maxWidth = pageWidth - margin * 2;
  const bottomLimit = pageHeight - 17;
  let y = 18;

  const startSubPage = (subtitle: string) => {
    doc.addPage();
    paintWarmPageBackground(doc);
    doc.setFillColor(3, 66, 42);
    doc.rect(0, 0, pageWidth, 13, 'F');
    doc.setFillColor(115, 175, 4);
    doc.rect(0, 13, pageWidth, 1.2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(`EmagreSLIM · ${subtitle} · ${evaluation.memberName}`, margin, 8.6);
    y = 20;
  };

  const ensureSpace = (neededMm: number, subtitle = 'Plano Alimentar & PAN') => {
    if (y + neededMm > bottomLimit) {
      startSubPage(subtitle);
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
      : 'Nutrição Baseada em Evidências · Alto Volume de Folhas, Verduras e Frutas Variadas · TACO / IBGE'
  );

  y = 48;

  const gap = 3.5;
  const cardW = (maxWidth - gap * 3) / 4;
  const kpis = [
    {
      label: 'META CALÓRICA',
      value: `${prescription.targetKcal} kcal/dia`,
      sub: `TDEE: ${prescription.tdeeKcal} kcal`,
      accent: true
    },
    {
      label: 'PROTEÍNA PROTETORA',
      value: `${prescription.macros.proteinG}g / dia`,
      sub: `${prescription.macros.proteinPerKg} g/kg massa`,
      accent: true
    },
    {
      label: 'CARBO / GORDURA',
      value: `${prescription.macros.carbsG}g / ${prescription.macros.fatG}g`,
      sub: 'Energia equilibrada',
      accent: false
    },
    {
      label: 'META DE ÁGUA',
      value: `${(prescription.waterTargetMl / 1000).toFixed(1)} L/dia`,
      sub: `${Math.round(prescription.waterTargetMl / 250)} copos de 250 ml`,
      accent: false
    }
  ];

  kpis.forEach((k, idx) => {
    const cx = margin + idx * (cardW + gap);
    doc.setFillColor(k.accent ? 236 : 255, k.accent ? 253 : 255, k.accent ? 245 : 255);
    doc.setDrawColor(k.accent ? 167 : 231, k.accent ? 243 : 229, k.accent ? 208 : 228);
    doc.roundedRect(cx, y, cardW, 24, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(k.accent ? 3 : 120, k.accent ? 66 : 113, k.accent ? 42 : 108);
    doc.text(k.label, cx + 3.2, y + 6.2);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.8);
    doc.setTextColor(k.accent ? 3 : 28, k.accent ? 66 : 25, k.accent ? 42 : 23);
    doc.text(k.value, cx + 3.2, y + 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.4);
    doc.setTextColor(87, 83, 78);
    doc.text(k.sub, cx + 3.2, y + 20);
  });

  y += 28.5;
  const eqLines = measureWrappedLines(doc, `Memorial energético: ${prescription.equationUsed}`, maxWidth, 'normal', 8.2);
  doc.setTextColor(87, 83, 78);
  doc.text(eqLines, margin, y);
  y += eqLines.length * 4 + 3;

  // Ilustração: Regra da Porção Inteira vs Mix por Classes
  const platePng = renderPlateSplitRulePng();
  if (platePng) {
    doc.addImage(platePng, 'PNG', margin, y, maxWidth, 42);
    y += 46;
  }

  // Ilustração: Massa Magra
  const leanPng = renderLeanMassIllustrationPng(
    `Aporte proteico de ${prescription.macros.proteinG}g/dia protege sua massa magra`
  );
  if (leanPng) {
    doc.addImage(leanPng, 'PNG', margin, y, maxWidth, 54);
    y += 58;
  }

  // Ilustração ou Nota de Hidratação
  if (evaluation.input.fluidRestriction) {
    const noteLines = measureWrappedLines(
      doc,
      'Restrição hídrica clínica declarada: siga exclusivamente o volume de líquidos liberado na revisão individual.',
      maxWidth - 12,
      'bold',
      9
    );
    const boxH = 10 + noteLines.length * 4.5;
    doc.setFillColor(255, 251, 235);
    doc.setDrawColor(253, 230, 138);
    doc.roundedRect(margin, y, maxWidth, boxH, 3, 3, 'FD');
    doc.setTextColor(146, 64, 14);
    doc.text(noteLines, margin + 6, y + 7);
  } else {
    const waterPng = renderWaterHydrationPng({
      idealWaterMl: prescription.waterTargetMl,
      idealWaterCups: Math.round(prescription.waterTargetMl / 250)
    });
    if (waterPng) {
      doc.addImage(waterPng, 'PNG', margin, y, maxWidth, 61);
    }
  }

  // ===================== PÁGINAS DE REFEIÇÕES — 1 FICHA IMPECÁVEL POR REFEIÇÃO =====================
  if (prescription.manualPlanText) {
    startSubPage('Cardápio Individualizado');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(3, 66, 42);
    doc.text('Cardápio Definido Individualmente pelo Nutricionista', margin, y);
    y += 7;

    const manualLines = measureWrappedLines(doc, prescription.manualPlanText, maxWidth - 12, 'normal', 9.2);
    let cursor = 0;
    while (cursor < manualLines.length) {
      const availableLines = Math.max(4, Math.floor((bottomLimit - y - 10) / 4.6));
      const slice = manualLines.slice(cursor, cursor + availableLines);
      const h = 10 + slice.length * 4.6;
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(231, 229, 228);
      doc.roundedRect(margin, y, maxWidth, h, 3, 3, 'FD');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.2);
      doc.setTextColor(41, 37, 36);
      doc.text(slice, margin + 6, y + 7);
      cursor += slice.length;
      if (cursor < manualLines.length) {
        startSubPage('Cardápio Individualizado (cont.)');
      }
    }
  } else {
    const mealSheets = buildRichMealSheets(evaluation);

    mealSheets.forEach(sheet => {
      // Cada refeição começa limpa em sua própria página (estilo ficha de montagem!)
      doc.addPage();
      paintWarmPageBackground(doc);

      // Banner superior dedicado à refeição (ZERO colisão de texto!)
      doc.setFillColor(3, 66, 42);
      doc.rect(0, 0, pageWidth, 22, 'F');
      doc.setFillColor(115, 175, 4);
      doc.rect(0, 22, pageWidth, 1.5, 'F');

      // Título à esquerda (largura controlada de 128mm para nunca encostar no selo da direita)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(190, 242, 100);
      doc.text(`${sheet.orderLabel.toUpperCase()}  ·  ${sheet.suggestedWindow.toUpperCase()}`, margin, 7.2);

      const titleLines = measureWrappedLines(doc, sheet.title, 128, 'bold', 12.2);
      doc.setTextColor(255, 255, 255);
      doc.text(titleLines[0], margin, 14.2);
      if (titleLines[1]) {
        doc.setFontSize(9.2);
        doc.text(titleLines[1], margin, 19.2);
      }

      // Caixa de meta da refeição à direita (44mm fixos)
      const badgeW = 44;
      const badgeX = pageWidth - margin - badgeW;
      doc.setFillColor(2, 49, 31);
      doc.roundedRect(badgeX, 4.2, badgeW, 13.8, 2.2, 2.2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.2);
      doc.setTextColor(255, 255, 255);
      doc.text(`~${sheet.estimatedKcal} kcal`, badgeX + badgeW / 2, 10, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.6);
      doc.setTextColor(190, 242, 100);
      doc.text(`~${sheet.estimatedProteinG}g proteína`, badgeX + badgeW / 2, 15.2, { align: 'center' });

      y = 27.5;

      // 1. QUADRO FÓRMULA DA REFEIÇÃO (MONTE SOMANDO OS GRUPOS)
      const formulaRowsMeta = sheet.formula.map(step => {
        const labelLines = measureWrappedLines(doc, step.label, maxWidth - 52, 'bold', 8.3);
        const hintLines = measureWrappedLines(doc, `Medida prática: ${step.measureHint}`, maxWidth - 52, 'normal', 7.3);
        const rowH = Math.max(9.5, labelLines.length * 3.7 + hintLines.length * 3.3 + 3.2);
        return { step, labelLines, hintLines, rowH };
      });
      const formulaHeaderH = 6.5;
      const formulaTotalH =
        formulaHeaderH + formulaRowsMeta.reduce((acc, r) => acc + r.rowH, 0) + 2;

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(214, 211, 209);
      doc.roundedRect(margin, y, maxWidth, formulaTotalH, 2.8, 2.8, 'FD');

      // Cabeçalho da fórmula
      doc.setFillColor(245, 245, 244);
      doc.roundedRect(margin + 0.2, y + 0.2, maxWidth - 0.4, formulaHeaderH, 2.5, 2.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(68, 64, 60);
      doc.text('FÓRMULA DA REFEIÇÃO — MONTE SOMANDO OS GRUPOS', margin + 4, y + 4.4);
      doc.text('QUANTIDADE', pageWidth - margin - 4, y + 4.4, { align: 'right' });

      let fy = y + formulaHeaderH + 1;
      formulaRowsMeta.forEach((row, rIdx) => {
        if (rIdx > 0) {
          doc.setDrawColor(231, 229, 228);
          doc.setLineWidth(0.25);
          doc.line(margin + 3, fy, pageWidth - margin - 3, fy);
          // Sinal "+" discreto no divisor
          doc.setFillColor(255, 255, 255);
          doc.circle(margin + maxWidth / 2, fy, 2.1, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(3, 66, 42);
          doc.text('+', margin + maxWidth / 2, fy + 0.9, { align: 'center' });
        }

        // Número
        doc.setFillColor(3, 66, 42);
        doc.roundedRect(margin + 3.5, fy + 1.8, 4.4, 4.4, 1, 1, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(255, 255, 255);
        doc.text(`${rIdx + 1}`, margin + 5.7, fy + 5, { align: 'center' });

        // Texto do grupo
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.3);
        doc.setTextColor(28, 25, 23);
        doc.text(row.labelLines, margin + 10, fy + 4.4);

        const hintY = fy + 4.4 + row.labelLines.length * 3.7;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.3);
        doc.setTextColor(120, 113, 108);
        doc.text(row.hintLines, margin + 10, hintY);

        // Caixa da quantidade em gramas à direita
        const qtyBoxW = 34;
        const qtyBoxX = pageWidth - margin - qtyBoxW - 3.5;
        doc.setFillColor(236, 253, 245);
        doc.setDrawColor(167, 243, 208);
        doc.roundedRect(qtyBoxX, fy + 1.8, qtyBoxW, 6.2, 1.5, 1.5, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.4);
        doc.setTextColor(3, 66, 42);
        doc.text(row.step.gramsLabel, qtyBoxX + qtyBoxW / 2, fy + 5.8, { align: 'center' });

        fy += row.rowH;
      });

      y += formulaTotalH + 3.5;

      // 2. EXPLICAÇÃO PRÁTICA
      const howLines = measureWrappedLines(
        doc,
        `Como montar na prática: ${sheet.howToBuild}`,
        maxWidth - 8,
        'normal',
        7.9
      );
      const howH = howLines.length * 3.6 + 5;
      ensureSpace(howH + 3, sheet.title);
      doc.setFillColor(236, 253, 245);
      doc.setDrawColor(167, 243, 208);
      doc.roundedRect(margin, y, maxWidth, howH, 2.2, 2.2, 'FD');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.9);
      doc.setTextColor(28, 25, 23);
      doc.text(howLines, margin + 4, y + 4.6);
      y += howH + 3.5;

      // 3. FAIXAS COLORIDAS POR CLASSE DE ALIMENTO
      sheet.bands.forEach(band => {
        const pal = PDF_BAND_PALETTE[band.tone];
        const bodyLines = measureWrappedLines(doc, band.itemsText, maxWidth - 8, 'normal', 7.8);
        const headerH = 5.4;
        const bodyH = bodyLines.length * 3.5 + 3.8;
        const totalBandH = headerH + bodyH;

        ensureSpace(totalBandH + 3, sheet.title);

        // Corpo colorido suave
        doc.setFillColor(...pal.bodyRgb);
        doc.setDrawColor(...pal.borderRgb);
        doc.roundedRect(margin, y, maxWidth, totalBandH, 2.2, 2.2, 'FD');

        // Cabeçalho colorido forte
        doc.setFillColor(...pal.headerRgb);
        doc.roundedRect(margin, y, maxWidth, headerH, 2, 2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.8);
        doc.setTextColor(255, 255, 255);
        doc.text(band.title, margin + 3.8, y + 3.8);

        // Lista de alimentos
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.8);
        doc.setTextColor(28, 25, 23);
        doc.text(bodyLines, margin + 3.8, y + headerH + 3.8);

        y += totalBandH + 2.6;
      });

      y += 1.2;

      // 4. TABELAS DE SUBSTITUTOS (ESQUERDA) + QUADRO AMARELO DE OBSERVAÇÕES (DIREITA)
      const colGap = 3.5;
      const leftW = Math.round(maxWidth * 0.57);
      const rightW = maxWidth - leftW - colGap;
      const rightX = margin + leftW + colGap;

      sheet.substituteTables.forEach(table => {
        // Medir altura real da tabela à esquerda
        const tableHeaderH = 6.2;
        const measuredRows = table.rows.map(row => {
          const nameLines = measureWrappedLines(
            doc,
            row.measureHint ? `${row.name} (${row.measureHint})` : row.name,
            leftW - 26,
            'normal',
            7.6
          );
          const rowH = Math.max(5.8, nameLines.length * 3.4 + 2.4);
          return { row, nameLines, rowH };
        });
        const leftTableH = tableHeaderH + measuredRows.reduce((acc, r) => acc + r.rowH, 0) + 1;

        // Medir altura real das observações amarelas à direita
        const measuredNotes = table.notes.map(note =>
          measureWrappedLines(doc, `• ${note}`, rightW - 7, 'normal', 7.5)
        );
        const rightNotesH =
          9 + measuredNotes.reduce((acc, lines) => acc + lines.length * 3.5 + 1.8, 0);

        const blockH = Math.max(leftTableH, rightNotesH);
        ensureSpace(blockH + 3.5, sheet.title);

        // Desenha Tabela Esquerda
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(214, 211, 209);
        doc.roundedRect(margin, y, leftW, blockH, 2.2, 2.2, 'FD');

        doc.setFillColor(245, 245, 244);
        doc.roundedRect(margin + 0.2, y + 0.2, leftW - 0.4, tableHeaderH, 2, 2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.4);
        doc.setTextColor(41, 37, 36);
        const leftTitleLines = measureWrappedLines(doc, table.title, leftW - 24, 'bold', 7.4);
        doc.text(leftTitleLines[0], margin + 3, y + 4.3);
        doc.text('QTD.', margin + leftW - 3, y + 4.3, { align: 'right' });

        let ty = y + tableHeaderH + 0.6;
        measuredRows.forEach((mr, rIdx) => {
          if (rIdx > 0) {
            doc.setDrawColor(231, 229, 228);
            doc.setLineWidth(0.2);
            doc.line(margin + 2, ty, margin + leftW - 2, ty);
          }
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.6);
          doc.setTextColor(41, 37, 36);
          doc.text(mr.nameLines, margin + 3, ty + 3.8);

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.8);
          doc.setTextColor(3, 66, 42);
          doc.text(mr.row.grams, margin + leftW - 3, ty + 3.8, { align: 'right' });

          ty += mr.rowH;
        });

        // Desenha Quadro Amarelo de Observações à Direita
        doc.setFillColor(254, 249, 195);
        doc.setDrawColor(234, 179, 8);
        doc.roundedRect(rightX, y, rightW, blockH, 2.2, 2.2, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(133, 77, 14);
        doc.text('OBSERVAÇÕES PRÁTICAS', rightX + 3.5, y + 5.2);

        let ny = y + 9.4;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(113, 63, 18);
        measuredNotes.forEach(lines => {
          doc.text(lines, rightX + 3.5, ny);
          ny += lines.length * 3.5 + 1.8;
        });

        y += blockH + 3.2;
      });

      // 5. BLOCO "MINHAS ANOTAÇÕES" se houver espaço na folha
      if (bottomLimit - y >= 16) {
        const notesH = Math.min(22, bottomLimit - y - 1);
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(214, 211, 209);
        doc.roundedRect(margin, y, maxWidth, notesH, 2.2, 2.2, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.4);
        doc.setTextColor(120, 113, 108);
        doc.text('MINHAS ANOTAÇÕES:', margin + 3.5, y + 5);
        doc.setDrawColor(231, 229, 228);
        doc.setLineWidth(0.25);
        if (notesH >= 15) {
          doc.line(margin + 3.5, y + 11, pageWidth - margin - 3.5, y + 11);
        }
        if (notesH >= 20) {
          doc.line(margin + 3.5, y + 17, pageWidth - margin - 3.5, y + 17);
        }
      }
    });
  }

  // ===================== GUIA COMPLETO DE SUBSTITUIÇÕES EM 6 GRUPOS =====================
  const completeCatalog = buildCompleteSubstitutionCatalog(evaluation);
  startSubPage('Guia Completo de Substituições por Grupo');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(3, 66, 42);
  doc.text('Guia Completo de Substituições (Folhas, Legumes, Frutas, Carboidratos, Proteínas e Gorduras)', margin, y);
  y += 6.5;

  completeCatalog.forEach(group => {
    const pal = PDF_BAND_PALETTE[group.tone];
    const subLines = measureWrappedLines(doc, group.subtitle, maxWidth - 8, 'normal', 7.8);
    const itemLinesList = group.items.map(it =>
      measureWrappedLines(doc, `• ${it}`, maxWidth - 10, 'normal', 8)
    );
    const headerH = 6.2;
    const bodyH =
      subLines.length * 3.6 +
      3 +
      itemLinesList.reduce((acc, lines) => acc + lines.length * 3.7 + 1, 0) +
      3;
    const totalH = headerH + bodyH;

    ensureSpace(totalH + 3.5, 'Guia Completo de Substituições');

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...pal.borderRgb);
    doc.roundedRect(margin, y, maxWidth, totalH, 2.5, 2.5, 'FD');

    doc.setFillColor(...pal.headerRgb);
    doc.roundedRect(margin, y, maxWidth, headerH, 2.2, 2.2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.setTextColor(255, 255, 255);
    doc.text(group.title, margin + 4, y + 4.3);

    let gy = y + headerH + 4.2;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(120, 113, 108);
    doc.text(subLines, margin + 4, gy);
    gy += subLines.length * 3.6 + 2;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(41, 37, 36);
    itemLinesList.forEach(lines => {
      doc.text(lines, margin + 5, gy);
      gy += lines.length * 3.7 + 1;
    });

    y += totalH + 3.5;
  });

  // ===================== RELATÓRIO PAN EM 7 EIXOS =====================
  ensureSpace(55, 'Relatório PAN em 7 Eixos');
  y += 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(3, 66, 42);
  doc.text('Relatório PAN (Plano de Ação Nutricional) & 7 Eixos de Viabilidade', margin, y);
  y += 6;

  const panBarrierLines = measureWrappedLines(
    doc,
    `Barreira Principal: ${pan.primaryBarrier}`,
    maxWidth - 10,
    'bold',
    8.8
  );
  const invLinesList = pan.methodInterventions.map(inv =>
    measureWrappedLines(doc, `• ${inv}`, maxWidth - 12, 'normal', 8.2)
  );
  const panH =
    10 +
    panBarrierLines.length * 4.1 +
    invLinesList.reduce((acc, lines) => acc + lines.length * 3.9 + 0.8, 0);
  ensureSpace(panH + 5, 'Relatório PAN em 7 Eixos');

  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(margin, y, maxWidth, panH, 2.8, 2.8, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.8);
  doc.setTextColor(3, 66, 42);
  doc.text(panBarrierLines, margin + 5, y + 6);

  let py = y + 6 + panBarrierLines.length * 4.1 + 1.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(41, 37, 36);
  invLinesList.forEach(lines => {
    doc.text(lines, margin + 6, py);
    py += lines.length * 3.9 + 0.8;
  });
  y += panH + 4.5;

  feasibilityProfile.forEach(axis => {
    const lines = measureWrappedLines(
      doc,
      `${axis.axis} (${axis.status}): ${axis.detail}`,
      maxWidth - 10,
      'normal',
      8.1
    );
    const ah = 6 + lines.length * 3.8;
    ensureSpace(ah + 2.5, 'Relatório PAN em 7 Eixos');
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(231, 229, 228);
    doc.roundedRect(margin, y, maxWidth, ah, 2.2, 2.2, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.1);
    doc.setTextColor(68, 64, 60);
    doc.text(lines, margin + 5, y + 4.8);
    y += ah + 2.5;
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
