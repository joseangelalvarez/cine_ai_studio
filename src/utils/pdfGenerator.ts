import { jsPDF } from 'jspdf';
import { MovieProject, ProjectMemory, GeneratedImage } from '../types';
import { CINEMA_SUBAGENTS_CATALOG } from '../catalog';

interface PitchBibleData {
  project: MovieProject;
  memories: ProjectMemory[];
  characterImage?: string | null;
  environmentImage?: string | null;
  storyboardImages?: { title: string; url: string; prompt: string }[];
  characterCustomNotes?: string;
  environmentCustomNotes?: string;
  soundCustomNotes?: string;
}

// Convert image URL or SVG data URL to clean JPEG/PNG data URL for jsPDF
export async function convertImageToCanvasDataUrl(src: string): Promise<string | null> {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 800;
        canvas.height = img.naturalHeight || 500;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(null);
        // Fill dark background in case of transparent SVGs
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      } catch (e) {
        console.warn('Could not rasterize image for PDF', e);
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export async function generatePitchBiblePdf(data: PitchBibleData): Promise<Blob> {
  const { project, memories } = data;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Pre-load images
  const [charDataUrl, envDataUrl] = await Promise.all([
    data.characterImage ? convertImageToCanvasDataUrl(data.characterImage) : Promise.resolve(null),
    data.environmentImage ? convertImageToCanvasDataUrl(data.environmentImage) : Promise.resolve(null),
  ]);

  // Helper: Draw standard page header & footer
  const drawPageChrome = (pageNum: number, totalPages: number, sectionTitle: string) => {
    // Header line
    doc.setDrawColor(245, 158, 11); // Amber
    doc.setLineWidth(0.4);
    doc.line(margin, 12, pageWidth - margin, 12);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(245, 158, 11);
    doc.text('CINE AI STUDIO • PITCH BIBLE & ART BOOK', margin, 10);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text(sectionTitle.toUpperCase(), pageWidth - margin, 10, { align: 'right' });

    // Footer
    doc.setDrawColor(51, 65, 85);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(`PROYECTO: "${project.title.toUpperCase()}" • MEMORIA CENTRAL`, margin, pageHeight - 8);
    doc.text(`PÁGINA ${pageNum} DE ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
  };

  // Helper: clean text lines
  const addWrappedText = (
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    fontSize: number,
    lineHeight: number,
    color: [number, number, number] = [30, 41, 59],
    fontStyle: 'normal' | 'bold' | 'italic' = 'normal',
    fontFamily: string = 'helvetica'
  ): number => {
    doc.setFont(fontFamily, fontStyle);
    doc.setFontSize(fontSize);
    doc.setTextColor(color[0], color[1], color[2]);
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, y);
    return y + lines.length * lineHeight;
  };

  // ==========================================
  // PÁGINA 1: PORTADA CINEMATOGRÁFICA
  // ==========================================
  // Fondo oscuro de portada
  doc.setFillColor(9, 13, 22); // Deep Cinematic Slate #090D16
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Marco dorado elegante
  doc.setDrawColor(245, 158, 11); // Amber
  doc.setLineWidth(0.8);
  doc.rect(margin, margin, contentWidth, pageHeight - margin * 2);
  doc.setDrawColor(56, 189, 248); // Sky
  doc.setLineWidth(0.2);
  doc.rect(margin + 2, margin + 2, contentWidth - 4, pageHeight - margin * 2 - 4);

  // Top header de portada
  doc.setFont('courier', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(245, 158, 11);
  doc.text('OFFICIAL CINEMA PITCH BIBLE & ART BOOK', pageWidth / 2, 28, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('DOSSIER DE PREPRODUCCIÓN • ARQUITECTURA DE SUBAGENTES L0-L6', pageWidth / 2, 33, { align: 'center' });

  // Título del Film
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(255, 255, 255);
  const titleLines = doc.splitTextToSize(project.title.toUpperCase(), contentWidth - 20);
  doc.text(titleLines, pageWidth / 2, 50, { align: 'center' });

  // Estilo visual & Género
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(56, 189, 248);
  doc.text(`${project.artStyle.toUpperCase()} • ${project.genre.toUpperCase()}`, pageWidth / 2, 62, { align: 'center' });

  // Hero Image Box (Environment or Character)
  const heroImageY = 70;
  const heroImageH = 88;
  const heroImageW = contentWidth - 16;
  const heroImageX = margin + 8;

  if (envDataUrl) {
    try {
      doc.addImage(envDataUrl, 'JPEG', heroImageX, heroImageY, heroImageW, heroImageH);
      doc.setDrawColor(245, 158, 11);
      doc.setLineWidth(0.5);
      doc.rect(heroImageX, heroImageY, heroImageW, heroImageH);
    } catch {
      // Fallback if image fails
      doc.setFillColor(15, 23, 42);
      doc.rect(heroImageX, heroImageY, heroImageW, heroImageH, 'F');
    }
  } else if (charDataUrl) {
    try {
      doc.addImage(charDataUrl, 'JPEG', pageWidth / 2 - 35, heroImageY, 70, heroImageH);
    } catch {
      doc.setFillColor(15, 23, 42);
      doc.rect(heroImageX, heroImageY, heroImageW, heroImageH, 'F');
    }
  } else {
    // Cinematic Blueprint Box
    doc.setFillColor(15, 23, 42);
    doc.rect(heroImageX, heroImageY, heroImageW, heroImageH, 'F');
    doc.setDrawColor(56, 189, 248);
    doc.setLineWidth(0.3);
    doc.rect(heroImageX, heroImageY, heroImageW, heroImageH);
    doc.setFont('courier', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text('CONCEPT ART VISUAL HERO FRAME', pageWidth / 2, heroImageY + heroImageH / 2, { align: 'center' });
  }

  // Logline / Premisa
  const synopsisY = heroImageY + heroImageH + 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(245, 158, 11);
  doc.text('PREMISA & LOGLINE DEL FILM:', margin + 12, synopsisY);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9.5);
  doc.setTextColor(226, 232, 240);
  const loglineLines = doc.splitTextToSize(`"${project.description}"`, contentWidth - 24);
  doc.text(loglineLines, margin + 12, synopsisY + 6);

  // Metadata Table
  const tableY = synopsisY + 28;
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(margin + 10, tableY, contentWidth - 20, 36, 3, 3, 'F');
  doc.setDrawColor(51, 65, 85);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin + 10, tableY, contentWidth - 20, 36, 3, 3, 'S');

  const col1X = margin + 16;
  const col2X = margin + 70;
  const col3X = margin + 125;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('GÉNERO / TONO', col1X, tableY + 8);
  doc.text('TARGET DE AUDIENCIA', col2X, tableY + 8);
  doc.text('DURACIÓN ESTIMADA', col3X, tableY + 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text(project.genre, col1X, tableY + 14);
  doc.text(project.targetAudience || 'Adulto / Cinéfilo', col2X, tableY + 14);
  doc.text(project.duration || '3 minutos', col3X, tableY + 14);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('ESTILO VISUAL', col1X, tableY + 24);
  doc.text('MOTOR DE PREPRODUCCIÓN', col2X, tableY + 24);
  doc.text('FECHA DE PRODUCCIÓN', col3X, tableY + 24);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(245, 158, 11);
  doc.text(project.artStyle, col1X, tableY + 30);
  doc.setTextColor(56, 189, 248);
  doc.text('Cine AI 24-Agent Suite', col2X, tableY + 30);
  doc.setTextColor(255, 255, 255);
  doc.text(new Date(project.createdAt).toLocaleDateString(), col3X, tableY + 30);

  // Footer Cover
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('CONFIDENCIAL • PARA PRESENTACIÓN A PRODUCTORAS Y DISTRIBUIDORAS', pageWidth / 2, pageHeight - 18, { align: 'center' });

  // ==========================================
  // PÁGINA 2: VISIÓN DEL SHOWRUNNER & WORLD-BUILDING
  // ==========================================
  doc.addPage();
  drawPageChrome(2, 6, 'Capa 0 • Visión del Showrunner');

  let curY = 22;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('1. VISIÓN EJECUTIVA & REGLAS DEL MUNDO (SHOWRUNNER BIBLE)', margin, curY);

  curY += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'Directiva maestra emanada de la Capa 0. Define el tono emocional, las leyes físicas y el canon del universo cinematográfico.',
    margin,
    curY
  );

  curY += 8;
  const showrunnerMem = memories.find((m) => m.key === 'SHOWRUNNER');
  const showrunnerContent = showrunnerMem?.content || project.description;

  // Box for Showrunner Content
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, curY, contentWidth, 115, 2, 2, 'FD');

  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  const showrunnerLines = doc.splitTextToSize(showrunnerContent, contentWidth - 10);
  doc.text(showrunnerLines.slice(0, 36), margin + 5, curY + 7);

  curY += 123;

  // Pilares Narrativos & Estéticos
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('PILARES ESTRUCTURALES DEL PROYECTO', margin, curY);

  curY += 6;
  const pillars = [
    {
      title: 'Tono y Ritmo Narrativo',
      desc: 'Pausado, reflexivo y de atmósfera opresiva. Cada plano está diseñado para generar tensión psicológica y transmitir escala monumental.',
    },
    {
      title: 'Leyes Visuales y Composición',
      desc: `Estética definida en ${project.artStyle}. Uso de óptica anamórfica 2.39:1, encuadres geométricos rigurosos y contrastes extremos de claroscuro.`,
    },
    {
      title: 'Continuidad Estricta y Coherencia L0-L6',
      desc: 'Sincronización total entre memoria central, diseño de personajes (FaceID), paleta de colores de arte y curvas de sonido foley.',
    },
  ];

  pillars.forEach((p, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 241 : 248, 245, 249);
    doc.roundedRect(margin, curY, contentWidth, 24, 2, 2, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.2);
    doc.roundedRect(margin, curY, contentWidth, 24, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(217, 119, 6); // Amber dark
    doc.text(`● ${p.title.toUpperCase()}`, margin + 5, curY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    const pLines = doc.splitTextToSize(p.desc, contentWidth - 12);
    doc.text(pLines, margin + 5, curY + 12);

    curY += 28;
  });

  // ==========================================
  // PÁGINA 3: DISEÑO DE PERSONAJES (CHARACTER DOSSIER & ART)
  // ==========================================
  doc.addPage();
  drawPageChrome(3, 6, 'Capa 2 • Diseño de Personajes');

  curY = 22;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('2. DOSSIER DE PERSONAJES & HOJAS DE CONSISTENCIA', margin, curY);

  curY += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('Supervisión de identidad facial y vestuario emitida por el Character Designer y Character Supervisor.', margin, curY);

  curY += 8;

  // Left Column: Character Image
  const charBoxW = 75;
  const charBoxH = 100;
  if (charDataUrl) {
    try {
      doc.addImage(charDataUrl, 'JPEG', margin, curY, charBoxW, charBoxH);
      doc.setDrawColor(245, 158, 11);
      doc.setLineWidth(0.4);
      doc.rect(margin, curY, charBoxW, charBoxH);
    } catch {
      doc.setFillColor(15, 23, 42);
      doc.rect(margin, curY, charBoxW, charBoxH, 'F');
    }
  } else {
    doc.setFillColor(15, 23, 42);
    doc.rect(margin, curY, charBoxW, charBoxH, 'F');
    doc.setFont('courier', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('CHARACTER ART SHEET', margin + charBoxW / 2, curY + charBoxH / 2, { align: 'center' });
  }

  // Right Column: Character Details & Memory
  const rightColX = margin + charBoxW + 6;
  const rightColW = contentWidth - charBoxW - 6;

  const charMem = memories.find((m) => m.key === 'CHARACTER_DESIGNER');
  const charContent = charMem?.content || 'Diseño de personaje principal registrado en el estudio.';

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(rightColX, curY, rightColW, charBoxH, 2, 2, 'FD');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(rightColX, curY, rightColW, charBoxH, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('FICHA TÉCNICA: PROTAGONISTA', rightColX + 5, curY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  const charLines = doc.splitTextToSize(charContent, rightColW - 10);
  doc.text(charLines.slice(0, 28), rightColX + 5, curY + 14);

  curY += charBoxH + 10;

  // Consistency & FaceID Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('CONTROL DE CONSISTENCIA FACIAL & VESTUARIO (IP-ADAPTER / FACEID)', margin, curY);

  curY += 6;
  const charSuperMem = memories.find((m) => m.key === 'CHARACTER_SUPERVISOR');
  const superContent =
    charSuperMem?.content ||
    `Parámetros de bloqueo facial: Anclaje de proporciones óseas mandibulares, cicatriz nasal, visor táctico reflectante y gabardina impermeable con desgaste por radiación y lluvia ácida.`;

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, curY, contentWidth, 42, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.2);
  doc.roundedRect(margin, curY, contentWidth, 42, 2, 2, 'S');

  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  const superLines = doc.splitTextToSize(superContent, contentWidth - 10);
  doc.text(superLines.slice(0, 10), margin + 5, curY + 6);

  curY += 48;

  // Notas de personalización de personaje
  if (data.characterCustomNotes) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(217, 119, 6);
    doc.text(`DIRECTIVA PERSONALIZADA: "${data.characterCustomNotes}"`, margin, curY);
  }

  // ==========================================
  // PÁGINA 4: ENTORNOS, ESCENARIOS & PALETA CROMÁTICA
  // ==========================================
  doc.addPage();
  drawPageChrome(4, 6, 'Capa 2 • Entornos y Dirección de Arte');

  curY = 22;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('3. ENTORNOS, ESCENOGRAFÍA & ART BIBLE', margin, curY);

  curY += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('Blueprints de arquitectura, meteorología y paleta de color oficial (Production Designer & Art Director).', margin, curY);

  curY += 8;

  // Environment Concept Art Widescreen Box
  const envImageW = contentWidth;
  const envImageH = 78;
  if (envDataUrl) {
    try {
      doc.addImage(envDataUrl, 'JPEG', margin, curY, envImageW, envImageH);
      doc.setDrawColor(245, 158, 11);
      doc.setLineWidth(0.4);
      doc.rect(margin, curY, envImageW, envImageH);
    } catch {
      doc.setFillColor(15, 23, 42);
      doc.rect(margin, curY, envImageW, envImageH, 'F');
    }
  } else {
    doc.setFillColor(15, 23, 42);
    doc.rect(margin, curY, envImageW, envImageH, 'F');
    doc.setFont('courier', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('ENVIRONMENT CONCEPT BLUEPRINT', margin + envImageW / 2, curY + envImageH / 2, { align: 'center' });
  }

  curY += envImageH + 8;

  // Paleta de Color Oficial (Swatches)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('PALETA CROMÁTICA OFICIAL (COLOR SCRIPT)', margin, curY);

  curY += 6;
  const swatches = [
    { name: 'Negro Abisal', hex: '#090D16', r: 9, g: 13, b: 22 },
    { name: 'Hormigón Mojado', hex: '#1E293B', r: 30, g: 41, b: 59 },
    { name: 'Neón Turquesa', hex: '#06B6D4', r: 6, g: 182, b: 212 },
    { name: 'Ámbar Alerta', hex: '#F59E0B', r: 245, g: 158, b: 11 },
    { name: 'Cian Profundo', hex: '#0284C7', r: 2, g: 132, b: 199 },
  ];

  const swatchWidth = (contentWidth - (swatches.length - 1) * 3) / swatches.length;
  swatches.forEach((s, idx) => {
    const sx = margin + idx * (swatchWidth + 3);
    doc.setFillColor(s.r, s.g, s.b);
    doc.roundedRect(sx, curY, swatchWidth, 14, 2, 2, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.2);
    doc.roundedRect(sx, curY, swatchWidth, 14, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(s.r < 50 ? 255 : 15, s.r < 50 ? 255 : 23, s.r < 50 ? 255 : 42);
    doc.text(s.hex, sx + swatchWidth / 2, curY + 6, { align: 'center' });
    doc.setFontSize(6.5);
    doc.text(s.name, sx + swatchWidth / 2, curY + 11, { align: 'center' });
  });

  curY += 20;

  // Environment Blueprint Text
  const prodMem = memories.find((m) => m.key === 'PRODUCTION_DESIGNER');
  const prodContent = prodMem?.content || 'Especificaciones de arquitectura escénica y sets.';

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, curY, contentWidth, 75, 2, 2, 'FD');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, curY, contentWidth, 75, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('BLUEPRINT DEL SET: ARQUITECTURA & MATERIALIDAD', margin + 5, curY + 7);

  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  const prodLines = doc.splitTextToSize(prodContent, contentWidth - 10);
  doc.text(prodLines.slice(0, 18), margin + 5, curY + 14);

  // ==========================================
  // PÁGINA 5: GUION LITERARIO & STORYBOARD CLAVE
  // ==========================================
  doc.addPage();
  drawPageChrome(5, 6, 'Capas 1 & 2 • Guion y Storyboard');

  curY = 22;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('4. GUION LITERARIO & PLANOS DE STORYBOARD', margin, curY);

  curY += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('Texto cinematográfico oficial con desglose de planos de cámara para Runway, Seedance 2.0, Kling y Luma.', margin, curY);

  curY += 8;

  // Screenplay Excerpt Box
  const scriptMem = memories.find((m) => m.key === 'GUIONISTA');
  const scriptContent =
    scriptMem?.content ||
    `EXT. SET PRINCIPAL - DIA / NOCHE\n\nSecuencia de apertura de "${project.title}".\nLos personajes se preparan mientras la atmósfera visual de ${project.artStyle} envuelve la escena...`;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, curY, contentWidth, 100, 2, 2, 'FD');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, curY, contentWidth, 100, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('EXTRACTO DE GUION OFICIAL (ESCENA 1)', margin + 6, curY + 7);

  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  const scriptLines = doc.splitTextToSize(scriptContent, contentWidth - 12);
  doc.text(scriptLines.slice(0, 26), margin + 6, curY + 15);

  curY += 108;

  // Key Frames Specifications for Video AI
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('PLANOS CLAVE DE CÁMARA (DoP & STORYBOARD)', margin, curY);

  curY += 6;
  const shots = [
    {
      title: 'Plano 1: Establecimiento (Gran Plano General)',
      optics: 'Lente Anamórfico 35mm • T2.4 • Relación 2.39:1',
      prompt: `Extreme wide shot, cinematic 2.39:1. A lone maintenance worker standing on a wet scaffolding at 120m high. Acid rain, dystopian brutalist megacity towers. Low angle slow camera pan down. Photorealistic.`,
    },
    {
      title: 'Plano 2: Tensión Dramática (Primer Plano)',
      optics: 'Cooke Anamorphic 65mm • T2.0 • Profundidad de campo reducida',
      prompt: `Close up, shallow depth of field. Weathered technician with HUD visor reflecting amber glitch codes. Eyes widening with tension. Volumetric haze, 4K film grain.`,
    },
  ];

  shots.forEach((shot) => {
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, curY, contentWidth, 32, 2, 2, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.2);
    doc.roundedRect(margin, curY, contentWidth, 32, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(217, 119, 6);
    doc.text(shot.title, margin + 5, curY + 6);

    doc.setFont('courier', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(14, 116, 144); // Cyan 700
    doc.text(shot.optics, margin + 5, curY + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(51, 65, 85);
    const pLines = doc.splitTextToSize(`Prompt para Runway/Seedance 2.0: "${shot.prompt}"`, contentWidth - 10);
    doc.text(pLines.slice(0, 3), margin + 5, curY + 18);

    curY += 36;
  });

  // ==========================================
  // PÁGINA 6: SONIDO, POSTPRODUCCIÓN Y CHECKLIST DE LOS 24 SUBAGENTES
  // ==========================================
  doc.addPage();
  drawPageChrome(6, 6, 'Capas 4-6 • Sonido y Auditoría Técnica');

  curY = 22;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('5. BANDA SONORA, SONIDO & COMPENDIO DEL ESTUDIO', margin, curY);

  curY += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('Especificaciones de Score (Composer), Foley (Sound Designer) y certificación de los 24 orquestadores.', margin, curY);

  curY += 8;

  // Sound Directives Box
  const composerMem = memories.find((m) => m.key === 'COMPOSER');
  const soundMem = memories.find((m) => m.key === 'SOUND_DESIGNER');

  const soundContent = `LEITMOTIV MUSICAL (COMPOSER):
${composerMem?.content || 'Tempo: 60 BPM. Sintetizador monofónico sub-grave con violonchelo acústico en re menor.'}

DISEÑO DE EFECTOS SONOROS (SOUND DESIGNER):
${soundMem?.content || '- Viento de altitud a 30Hz con componentes subsónicos.\n- Goteo metálico de lluvia ácida sobre chapa galvanizada.\n- Arco voltaico de radiofrecuencia a 120Hz.'}`;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, curY, contentWidth, 55, 2, 2, 'FD');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, curY, contentWidth, 55, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('DIRECTIVAS ACÚSTICAS & SCORE CINEMATOGRÁFICO', margin + 6, curY + 7);

  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  const soundLines = doc.splitTextToSize(soundContent, contentWidth - 12);
  doc.text(soundLines.slice(0, 11), margin + 6, curY + 14);

  curY += 63;

  // Checklist de los 24 Subagentes Especializados
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('CHECKLIST DE LOS 24 SUBAGENTES DEL PIPELINE CINEMATOGRÁFICO', margin, curY);

  curY += 6;
  const gridRows = 6;
  const colW = contentWidth / 4;
  const rowH = 14;

  CINEMA_SUBAGENTS_CATALOG.forEach((agent, i) => {
    const c = Math.floor(i / gridRows);
    const r = i % gridRows;
    const ax = margin + c * colW;
    const ay = curY + r * rowH;

    const hasMem = memories.some((m) => m.key === agent.key);

    doc.setFillColor(hasMem ? 240 : 248, hasMem ? 253 : 250, hasMem ? 244 : 252);
    doc.roundedRect(ax, ay, colW - 2, rowH - 2, 1.5, 1.5, 'F');
    doc.setDrawColor(hasMem ? 187 : 226, hasMem ? 247 : 232, hasMem ? 208 : 240);
    doc.setLineWidth(0.2);
    doc.roundedRect(ax, ay, colW - 2, rowH - 2, 1.5, 1.5, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(hasMem ? 22 : 100, hasMem ? 101 : 116, hasMem ? 52 : 139);
    doc.text(`${hasMem ? '✓' : '•'} ${agent.name.substring(0, 19)}`, ax + 2.5, ay + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(100, 116, 139);
    doc.text(agent.role.substring(0, 22), ax + 2.5, ay + 9);
  });

  curY += gridRows * rowH + 8;

  // Studio Seal & Signature of Approval
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(margin, curY, contentWidth, 22, 2, 2, 'F');

  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(245, 158, 11);
  doc.text('ESTADO OFICIAL: APROBADO PARA PITCH Y PRODUCCIÓN AUDIOVISUAL', margin + 8, curY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(226, 232, 240);
  doc.text(
    `Firmado por el Showrunner IA y certificado bajo estándares DCI 4K. Este dossier representa la biblia oficial para distribución.`,
    margin + 8,
    curY + 15
  );

  return doc.output('blob');
}
