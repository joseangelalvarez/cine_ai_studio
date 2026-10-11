import { MovieProject, ProjectMemory } from '../types';

export interface PromptLayerBreakdown {
  characterDirectives: string;
  environmentDirectives: string;
  artDirectives: string;
  cameraDirectives: string;
  scriptDirectives: string;
  fullPrompt: string;
  negativePrompt?: string;
  hasCharacterMemory: boolean;
  hasEnvironmentMemory: boolean;
  hasArtMemory: boolean;
  hasDopMemory: boolean;
  hasScriptMemory: boolean;
}

export type PromptModality = 'image' | 'video' | 'audio' | 'music';

export interface SynthesizedPromptResult {
  modality: PromptModality;
  title: string;
  masterPrompt: string;
  negativePrompt?: string;
  targetEngines: string[];
  specs: Record<string, string>;
  rawExtractedLayers: {
    character?: string;
    environment?: string;
    art?: string;
    camera?: string;
    sound?: string;
    music?: string;
  };
}

/**
 * Aggressively purges ALL administrative studio bureaucracy, markdown headers,
 * roles, departmental tags, and technical delivery boilerplate.
 * Works both on whole lines and inline substrings.
 */
export function purgeAdministrativeJunk(content: string): string {
  if (!content || !content.trim()) return '';

  let text = content;

  // 1. Remove bracketed department tags e.g. [PERSONAJE]:, [ENTORNO Y FONDO]:, [ARTE Y COLOR]:, [FOTOGRAFÍA]:
  text = text.replace(/\[\s*(?:PERSONAJE|ENTORNO|FONDO|ARTE|COLOR|FOTOGRAF[IÍ]A|C[AÁ]MARA|ENTREGABLE|ESCENA|AUDIO|M[UÚ]SICA|DEPARTAMENTO|DIRECCI[OÓ]N)[^\]]*\]\s*:?/gi, ' ');

  // 2. Remove standard administrative labels with markdown or plain text (ROL:, PROYECTO:, ENTREGABLE:, etc.)
  // Matches both inline and line-start: **ROL:** ... or ROL: ...
  text = text.replace(
    /\*{0,2}(?:ROL|PROYECTO|DEPARTAMENTO|ENTREGABLE|DISTRIBUCI[OÓ]N|FORMATO(?:\s+T[EÉ]CNICO)?|SISTEMA(?:\s+DE\s+CONSTRUCCI[OÓ]N)?|FRAME\s+RATE|RATIO|RESOLUCI[OÓ]N|VERSI[OÓ]N|VERSION|FECHA|ESTADO|AUTOR|SUPERVISOR|FECHA\s+DE\s+EMISI[OÓ]N|DOCUMENTO|DESTINATARIOS|CONFIDENCIALIDAD)\*{0,2}\s*:[^\n*•|—–-]+/gi,
    ' '
  );

  // 3. Remove header banners e.g. "====================", "------------------", "ART BIBLE (CAPA 2)", etc.
  text = text.replace(/^[=\-_*#]{2,}.*$/gm, ' ');
  text = text.replace(
    /^(?:#+\s*)?(?:PROYECTO:|BIBLIA|CHARACTER\s+DESIGN|CAMERA\s+&\s+LENS|ENVIRONMENT\s+BLUEPRINT|ART\s+BIBLE|ESTUDIO\s+DE|MEMORIA\s+DE|DIRECTIVA\s+DE|ENTREGABLE\s+T[EÉ]CNICO|SOUND\s+DESIGN|SCORE\s+DIRECTIVES).*$/gim,
    ' '
  );

  // 4. Remove markdown table formatting (| --- | --- |)
  text = text.replace(/^\|.*\|$/gm, ' ');

  // 5. Remove bullet prefixes and field labels like "- ARQUETIPO:", "- TOKENS DE IDENTIDAD:", etc.
  text = text.replace(/^[*-•]\s*(?:ARQUETIPO|APARIENCIA|VESTUARIO|PALETA|TOKENS|ANCLAJE|COMPATIBILIDAD|LOCALIZACI[OÓ]N|DESCRIPCI[OÓ]N|GEOMETR[IÍ]A|RELACI[OÓ]N|SISTEMA|PROFUNDIDAD|MOVIMIENTO|KEY\s+LIGHT|FILL\s+LIGHT|RIM\s+LIGHT|ATM[OÓ]SFERA|CAPAS|EFECTOS|CONCEPTO|INSTRUMENTACI[OÓ]N|TEMPO|ESTRUCTURA|TRANSICIONES|ESPACIO|TONOS|CURVA)\s*:[^\n]+/gim, ' ');

  // 6. Remove residual markdown asterisks and backticks
  text = text.replace(/\*{1,3}/g, '');
  text = text.replace(/`{1,3}/g, '');

  // 7. Clean up sentence artifacts and whitespace
  text = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => {
      if (!line) return false;
      if (line.length < 5) return false;
      // Filter out lines that are purely metadata remnants
      if (/^(?:capa\s*\d|v\d+\.\d+|locked|acescg|scope|2\.39:1|2880\s*x\s*1205|24\s*fps)$/i.test(line)) return false;
      return true;
    })
    .join('. ')
    .replace(/\.\s*\./g, '.')
    .replace(/\s+/g, ' ')
    .trim();

  return text;
}

/**
 * Truncates text cleanly at word or sentence boundary
 */
function truncateCleanly(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  const slice = text.substring(0, maxLength);
  const lastPeriod = slice.lastIndexOf('.');
  if (lastPeriod > maxLength * 0.45) {
    return slice.substring(0, lastPeriod + 1).trim();
  }
  const lastSpace = slice.lastIndexOf(' ');
  if (lastSpace > 0) {
    return slice.substring(0, lastSpace).trim() + '...';
  }
  return slice.trim() + '...';
}

/**
 * Extracts targeted sensory and visual directives for a specific department
 */
export function extractDepartmentDirectives(
  content: string | undefined,
  category: 'character' | 'environment' | 'art' | 'camera' | 'sound' | 'music',
  maxLength = 260
): string {
  if (!content || !content.trim()) return '';

  const cleaned = purgeAdministrativeJunk(content);
  if (!cleaned) return '';

  // Extract relevant sentences matching the department's domain
  const sentences = cleaned.split(/(?<=[.!?])\s+/);

  const domainKeywords: Record<string, RegExp> = {
    character: /fisiognom[ií]a|rostro|mirada|ojos|piel|edad|vestuario|ropa|traje|silueta|anatom[ií]a|expresi[oó]n|porte|postura|cicatriz|cabello/i,
    environment: /arquitectura|set|locaci[oó]n|escenario|espacio|edificio|paredes|materiales|estructura|fondo|geograf[ií]a|calle|interior|exterior|horizonte/i,
    art: /paleta|color|crom[aá]tic|hex|textura|materialidad|iluminaci[oó]n|tonos|sombras|contraste|est[eé]tica|saturaci[oó]n|brillo/i,
    camera: /[oó]ptica|lente|focal|85mm|35mm|50mm|anam[oó]rfic|bokeh|encuadre|plano|c[aá]mara|profundidad\s+de\s+campo|diafragma|shutter/i,
    sound: /ac[uú]stic|foley|pasos|sonido|audio|atm[oó]sfera|textura\s+sonora|eco|reverberaci[oó]n|ambiente|viento|lluvia|crujido/i,
    music: /melod[ií]a|partitura|orquest|acorde|score|leitmotif|instrument|tempo|bpm|viol[ií]n|sintetizador|piano|chelo|ritmo/i,
  };

  const regex = domainKeywords[category];
  const matchedSentences: string[] = [];

  for (const s of sentences) {
    const trimmed = s.trim();
    if (trimmed.length < 15) continue;
    if (regex && regex.test(trimmed)) {
      matchedSentences.push(trimmed);
      if (matchedSentences.join(' ').length >= maxLength) break;
    }
  }

  if (matchedSentences.length > 0) {
    return truncateCleanly(matchedSentences.join(' '), maxLength);
  }

  // Fallback: take the cleanest initial sentences of the purged text
  const fallback = sentences
    .filter((s) => s.length > 20 && !s.toLowerCase().includes('entregable') && !s.toLowerCase().includes('formato'))
    .slice(0, 2)
    .join(' ');

  return truncateCleanly(fallback || cleaned, maxLength);
}

/**
 * Extracts protagonist name from character memory or project synopsis
 */
export function extractProtagonistName(characterContent?: string, description?: string): string {
  if (characterContent) {
    const cleaned = purgeAdministrativeJunk(characterContent);
    const lines = cleaned.split(/[.\n]/);
    for (const raw of lines) {
      const match = raw.match(/(?:nombre|protagonista|personaje|sujeto|lead)\s*(?:es|llamado|denominado)?\s*:?\s*([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)?)/i);
      if (match && match[1]) {
        const cand = match[1].trim();
        if (cand.length > 2 && cand.length < 25 && !/^(Diseñador|Personaje|Sheet|Turnaround|Capa|Estilo)$/i.test(cand)) {
          return cand;
        }
      }
    }
  }

  if (description) {
    const descMatch = description.match(/(?:protagonista|sigue a|trata de|historia de|vida de)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)?)/i);
    if (descMatch && descMatch[1]) {
      return descMatch[1].trim();
    }
  }

  return 'Protagonista';
}

/**
 * Extracts location name from environment memory or project synopsis
 */
export function extractLocationName(environmentContent?: string, description?: string): string {
  if (environmentContent) {
    const cleaned = purgeAdministrativeJunk(environmentContent);
    const lines = cleaned.split(/[.\n]/);
    for (const raw of lines) {
      const match = raw.match(/(?:localizaci[oó]n|entorno|set|lugar|escenario|locaci[oó]n)\s*(?:principal|es|situado)?\s*:?\s*([A-Za-zÀ-ÿ0-9'\s]+)/i);
      if (match && match[1]) {
        const cand = match[1].trim().replace(/[.,;:]/g, '');
        if (cand.length > 3 && cand.length < 35 && !/^(Diseñador|Blueprint|Capa|Formato)$/i.test(cand)) {
          return cand;
        }
      }
    }
  }

  if (description) {
    const locMatch = description.match(/(?:en|ambientad[ao]\s+en|locaci[oó]n)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ0-9]+(?:\s+[A-ZÁÉÍÓÚÑa-z0-9]+)?)/i);
    if (locMatch && locMatch[1]) {
      return locMatch[1].trim();
    }
  }

  return 'Set Principal';
}

/**
 * Extracts narrative stage directions, dramatic situations, and scene atmosphere from GUIONISTA (Capa 1)
 * specifically tailored for text-to-image diffusion models.
 */
export function extractScriptDirectives(scriptContent: string | undefined, maxLength = 240): string {
  if (!scriptContent || !scriptContent.trim()) return '';

  let cleaned = purgeAdministrativeJunk(scriptContent);

  // Remove shouting dialogue speaker labels like "OPERARIO\n" or "NANO BANANA\n(mirando fijamente)"
  cleaned = cleaned.replace(/^[A-ZÁÉÍÓÚÑ\s]{3,25}(?:\s*\(.*?\))?$/gm, ' ');

  const lines = cleaned.split('\n').map((l) => l.trim()).filter(Boolean);
  const actionLines: string[] = [];

  for (const line of lines) {
    // If it's a scene heading, capture the location/time atmosphere e.g. EXT. PLAYA DE LA ISLA
    if (/^(?:EXT\.|INT\.)/i.test(line)) {
      actionLines.push(line.replace(/^(?:EXT\.|INT\.)\s*/i, 'Ambientado en '));
      continue;
    }
    // Skip direct spoken dialogue in quotes or exclamation marks
    if (/^[¡!¿?"«'—]/.test(line)) continue;
    // Collect vivid descriptive action lines
    if (line.length > 20 && !line.includes(':')) {
      actionLines.push(line);
    }
  }

  const result = actionLines.join('. ').replace(/\.\s*\./g, '.').trim();
  return truncateCleanly(result || cleaned, maxLength);
}

/**
 * Builds clean 5-layer orchestrated prompt for image generation,
 * transcribing directives from Character, Environment, Art, Camera, and the Scriptwriter (GUIONISTA).
 * Guaranteed 100% free of administrative boilerplate or bracket tags.
 */
export function buildOrchestratedPrompt(params: {
  role: 'protagonist' | 'turnaround' | 'costar' | 'environment';
  project: MovieProject;
  characterMemory?: ProjectMemory;
  environmentMemory?: ProjectMemory;
  artMemory?: ProjectMemory;
  dopMemory?: ProjectMemory;
  scriptMemory?: ProjectMemory;
  customNotes?: string;
}): PromptLayerBreakdown {
  const { role, project, characterMemory, environmentMemory, artMemory, dopMemory, scriptMemory, customNotes } = params;

  // 1. Character layer
  let characterDirectives = extractDepartmentDirectives(characterMemory?.content, 'character', 240);
  if (!characterDirectives) {
    characterDirectives = `Fisiognomía definida, expresión concentrada y vestuario coherente con la premisa dramática.`;
  }

  // 2. Environment layer
  let environmentDirectives = extractDepartmentDirectives(environmentMemory?.content, 'environment', 220);
  if (!environmentDirectives) {
    environmentDirectives = `Arquitectura y ambientación del universo de "${project.title}".`;
  }

  // 3. Art & Color layer
  let artDirectives = extractDepartmentDirectives(artMemory?.content, 'art', 200);
  if (!artDirectives) {
    artDirectives = `Estilo visual ${project.artStyle}, paleta cromática con contraste cinematográfico y texturas orgánicas.`;
  }

  // 4. Camera & DOP layer
  let cameraDirectives = extractDepartmentDirectives(dopMemory?.content, 'camera', 190);
  if (!cameraDirectives) {
    cameraDirectives = `Óptica anamórfica de 85mm T1.4, relación de aspecto 2.39:1 scope, iluminación volumétrica suave y profundidad de campo reducida.`;
  }

  // 5. Scriptwriter layer (Guionista) - Scene action, physical situations, dramatic tension
  let scriptDirectives = extractScriptDirectives(scriptMemory?.content, 240);
  if (!scriptDirectives) {
    scriptDirectives = `Acción cinematográfica y situación dramática directa basada en la premisa: "${project.description || project.title}".`;
  }

  const protagonistName = extractProtagonistName(characterMemory?.content, project.description);
  const locationName = extractLocationName(environmentMemory?.content, project.description);

  let fullPrompt = '';

  if (role === 'protagonist') {
    fullPrompt = `Retrato cinematográfico fotorrealista en plano medio-corto de ${protagonistName} para la película "${project.title}". ` +
      `Fisiognomía y vestuario: ${characterDirectives}. ` +
      `Situación y acción dramática del guion: ${scriptDirectives}. ` +
      `Ambientado en el set de ${locationName}: ${environmentDirectives}, con fondo desenfocado en bokeh natural. ` +
      `Estilo y paleta: ${artDirectives}. ` +
      `Cinematografía: ${cameraDirectives}. Master film still 8k, fotorrealismo de producción cinematográfica, sin marcas de agua ni texto.`;
  } else if (role === 'turnaround') {
    fullPrompt = `Concept art técnico y hoja de turnaround de producción (vistas frontal, perfil y detalle de vestuario) de ${protagonistName} para "${project.title}". ` +
      `Fisiognomía anatómica: ${characterDirectives}. ` +
      `Detalles y vestuario del guion: ${scriptDirectives}. ` +
      `Paleta cromática y materiales: ${artDirectives}. ` +
      `Iluminación de estudio neutra de alta definición sin sombras duras, alta fidelidad de proporciones anatómicas, fondo gris neutro de producción 3D.`;
  } else if (role === 'costar') {
    fullPrompt = `Plano cinematográfico de dos personajes en set para "${project.title}". ` +
      `Encuentro dramático de la escena del guionista: ${scriptDirectives}. ` +
      `Interacción entre ${protagonistName} (${characterDirectives}) y personaje secundario en ${locationName}: ${environmentDirectives}. ` +
      `Atmósfera visual y paleta: ${artDirectives}. ` +
      `Cámara: iluminación lateral dramática, lente de 50mm f/1.8, bokeh anamórfico, 8k film still.`;
  } else if (role === 'environment') {
    fullPrompt = `Plano general cinematográfico (master establishing shot) de ${locationName} para "${project.title}". ` +
      `Atmósfera y situación de la escena en el guion: ${scriptDirectives}. ` +
      `Arquitectura y entorno: ${environmentDirectives}. ` +
      `Atmósfera visual y paleta: ${artDirectives}. ` +
      `Encuadre cinematográfico: ${cameraDirectives}, formato anamórfico 2.39:1 scope, iluminación ambiental de alta producción, 8k.`;
  }

  if (customNotes && customNotes.trim().length > 0) {
    fullPrompt = `${customNotes.trim()}. ${fullPrompt}`;
  }

  // Final sanity sweep to guarantee zero administrative leakage
  fullPrompt = purgeAdministrativeJunk(fullPrompt);

  return {
    characterDirectives,
    environmentDirectives,
    artDirectives,
    cameraDirectives,
    scriptDirectives,
    fullPrompt,
    negativePrompt: 'text, watermark, ugly, deformed, blurry, extra limbs, bad anatomy, administrative tags, oversaturated, low quality, draft',
    hasCharacterMemory: !!characterMemory?.content,
    hasEnvironmentMemory: !!environmentMemory?.content,
    hasArtMemory: !!artMemory?.content,
    hasDopMemory: !!dopMemory?.content,
    hasScriptMemory: !!scriptMemory?.content,
  };
}

/**
 * MULTIMEDIA PROMPT ENGINEER
 * Synthesizes cohesive, professional generative AI prompts for:
 * - Image (Google Imagen 3 / Flux Pro / Midjourney)
 * - Video (Google Veo / Runway Gen-3 / ByteDance Seedance 2.0 / Kling)
 * - Audio / SFX (ElevenLabs SFX / AudioCraft / Stable Audio)
 * - Music / Score (Suno v3.5 / Udio / MusicFX)
 */
export class MultimediaPromptEngineer {
  /**
   * Synthesize master prompt for Image Generation
   */
  static synthesizeImagePrompt(
    project: MovieProject,
    memories: ProjectMemory[],
    role: 'protagonist' | 'turnaround' | 'costar' | 'environment' = 'protagonist',
    customNotes?: string
  ): SynthesizedPromptResult {
    const charMem = memories.find((m) => m.key === 'CHARACTER_DESIGNER');
    const envMem = memories.find((m) => m.key === 'PRODUCTION_DESIGNER');
    const artMem = memories.find((m) => m.key === 'DIRECTOR_ARTE');
    const dopMem = memories.find((m) => m.key === 'DOP' || m.key === 'DIRECTOR_FOTOGRAFIA');
    const scriptMem = memories.find((m) => m.key === 'GUIONISTA');

    const breakdown = buildOrchestratedPrompt({
      role,
      project,
      characterMemory: charMem,
      environmentMemory: envMem,
      artMemory: artMem,
      dopMemory: dopMem,
      scriptMemory: scriptMem,
      customNotes,
    });

    const protagonistName = extractProtagonistName(charMem?.content, project.description);
    const locationName = extractLocationName(envMem?.content, project.description);

    let titleLabel = `Retrato Fotorrealista - ${protagonistName}`;
    if (role === 'turnaround') titleLabel = `Turnaround Sheet Técnico - ${protagonistName}`;
    if (role === 'costar') titleLabel = `Plano Dramático Dual - ${protagonistName} en Set`;
    if (role === 'environment') titleLabel = `Master Establishing Shot - ${locationName}`;

    return {
      modality: 'image',
      title: titleLabel,
      masterPrompt: breakdown.fullPrompt,
      negativePrompt: breakdown.negativePrompt,
      targetEngines: ['Google Imagen 3', 'Flux 1.1 Pro', 'Midjourney v6.1', 'SDXL Cinema'],
      specs: {
        'Relación de Aspecto': '2.39:1 Anamórfico Scope',
        'Resolución Base': '8K Ultra HD (Master Still)',
        'Óptica / Lente': '85mm T1.4 Cooke / Zeiss Master Anamorphic',
        'Espacio de Color': 'ACEScg / Rec.709',
      },
      rawExtractedLayers: {
        character: breakdown.characterDirectives,
        environment: breakdown.environmentDirectives,
        art: breakdown.artDirectives,
        camera: breakdown.cameraDirectives,
      },
    };
  }

  /**
   * Synthesize master prompt for Video Generation
   */
  static synthesizeVideoPrompt(
    project: MovieProject,
    memories: ProjectMemory[],
    shotType: 'establishing' | 'medium_dramatic' | 'close_up' | 'tracking_action' = 'establishing',
    customNotes?: string
  ): SynthesizedPromptResult {
    const charMem = memories.find((m) => m.key === 'CHARACTER_DESIGNER');
    const envMem = memories.find((m) => m.key === 'PRODUCTION_DESIGNER');
    const artMem = memories.find((m) => m.key === 'DIRECTOR_ARTE');
    const dopMem = memories.find((m) => m.key === 'DOP' || m.key === 'DIRECTOR_FOTOGRAFIA');

    const protagonistName = extractProtagonistName(charMem?.content, project.description);
    const locationName = extractLocationName(envMem?.content, project.description);
    const charDir = extractDepartmentDirectives(charMem?.content, 'character', 180) || `Sujeto principal en vestuario auténtico`;
    const envDir = extractDepartmentDirectives(envMem?.content, 'environment', 180) || `Set cinematográfico detallado de ${locationName}`;
    const artDir = extractDepartmentDirectives(artMem?.content, 'art', 150) || `Estilo ${project.artStyle}`;
    const dopDir = extractDepartmentDirectives(dopMem?.content, 'camera', 160) || `Lente anamórfica, iluminación cinematográfica volumétrica`;

    let shotTitle = `Plano General Panorámico (Establishing) - ${locationName}`;
    let motionPrompt = '';

    if (shotType === 'establishing') {
      shotTitle = `Plano General Panorámico (Establishing) - ${locationName}`;
      motionPrompt = `Cinematic wide establishing drone shot smoothly drifting forward across ${locationName}. ` +
        `Architecture and atmosphere: ${envDir}. ` +
        `Visual aesthetic: ${artDir}. ` +
        `Camera movement: slow cinematic forward dolly push-in at 24fps, anamorphic 2.39:1 scope, volumetric lighting, atmospheric fog, photorealistic motion, hyperrealistic 8k film production render.`;
    } else if (shotType === 'medium_dramatic') {
      shotTitle = `Plano Medio Dramático - ${protagonistName}`;
      motionPrompt = `Cinematic medium shot of ${protagonistName} turning slowly towards camera in ${locationName}. ` +
        `Subject appearance: ${charDir}. ` +
        `Camera movement: subtle steadicam orbit around protagonist with shallow depth of field, 85mm anamorphic lens, realistic fabric dynamics, dramatic key lighting, 24fps motion blur.`;
    } else if (shotType === 'close_up') {
      shotTitle = `Primer Plano Emocional - ${protagonistName}`;
      motionPrompt = `Cinematic tight close-up shot of ${protagonistName}'s face reacting emotionally. ` +
        `Facial details: ${charDir}, intense gaze, micro-expressions, hyper-detailed skin pores and eye refractions. ` +
        `Lighting: high-contrast chiaroscuro with soft rim light, 2.39:1 anamorphic bokeh background of ${locationName}, steady slow push-in.`;
    } else if (shotType === 'tracking_action') {
      shotTitle = `Tracking Shot en Movimiento - ${protagonistName}`;
      motionPrompt = `Dynamic low-angle tracking shot following ${protagonistName} walking through ${locationName}. ` +
        `Kinetic motion: ${charDir}, realistic walking physics and clothing movement. ` +
        `Environment: ${envDir}, lens flares, wet reflective ground, anamorphic streak, handheld stabilizer movement at 24fps.`;
    }

    if (customNotes && customNotes.trim()) {
      motionPrompt = `${customNotes.trim()} ${motionPrompt}`;
    }

    return {
      modality: 'video',
      title: shotTitle,
      masterPrompt: motionPrompt,
      negativePrompt: 'morphing, sudden jerky camera jumps, cartoon, low framerate, flicker, unnatural physics, text, watermark',
      targetEngines: ['Google Veo 3.1', 'ByteDance Seedance 2.0', 'Runway Gen-3 Alpha', 'Luma Dream Machine', 'Kling AI v1.5'],
      specs: {
        'Frame Rate': '24 fps (Cinematic Shutter 180°)',
        'Relación de Aspecto': '2.39:1 Scope',
        'Movimiento de Cámara': shotType === 'establishing' ? 'Slow Dolly Forward' : shotType === 'tracking_action' ? 'Low-Angle Tracking' : 'Steadicam Subtle Push-In',
        'Resolución de Salida': '1080p / 4K UHD Render',
      },
      rawExtractedLayers: {
        character: charDir,
        environment: envDir,
        art: artDir,
        camera: dopDir,
      },
    };
  }

  /**
   * Synthesize master prompt for Audio & Foley Generation
   */
  static synthesizeAudioPrompt(
    project: MovieProject,
    memories: ProjectMemory[],
    audioType: 'ambient_foley' | 'impact_action' | 'props_diegetic' = 'ambient_foley',
    customNotes?: string
  ): SynthesizedPromptResult {
    const soundMem = memories.find((m) => m.key === 'SOUND_DESIGNER');
    const envMem = memories.find((m) => m.key === 'PRODUCTION_DESIGNER');
    const locationName = extractLocationName(envMem?.content, project.description);
    const soundDir = extractDepartmentDirectives(soundMem?.content, 'sound', 200) || `Atmósfera acústica cinematográfica de ${locationName}`;

    let audioTitle = `Diseño de Paisaje Sonoro y Foley - ${locationName}`;
    let soundPrompt = '';

    if (audioType === 'ambient_foley') {
      audioTitle = `Ambiente Inmersivo & Room Tone - ${locationName}`;
      soundPrompt = `Cinematic immersive room tone and foley soundscape for "${project.title}" set in ${locationName}. ` +
        `Acoustic textures: ${soundDir}. ` +
        `Layers: low-frequency distant rumble, subtle wind through architectural gaps, atmospheric reverb, natural stereo panning, high-definition 48kHz audio.`;
    } else if (audioType === 'impact_action') {
      audioTitle = `Efectos Diegéticos de Impacto - Secuencia Acción`;
      soundPrompt = `High-impact cinematic sound effect (SFX): heavy mechanical hydraulic hiss, metallic clank, deep sub-bass cinematic boom with decaying reverb tail, perfectly isolated and dry-mixed.`;
    } else if (audioType === 'props_diegetic') {
      audioTitle = `Foley Detallado de Ropa y Pasos`;
      soundPrompt = `Foley recording of footsteps on damp textured surfaces, rustle of heavy synthetic fabrics, leather creaks, and subtle breathing, crisp proximity microphone capture with zero background noise.`;
    }

    if (customNotes && customNotes.trim()) {
      soundPrompt = `${customNotes.trim()} ${soundPrompt}`;
    }

    return {
      modality: 'audio',
      title: audioTitle,
      masterPrompt: soundPrompt,
      targetEngines: ['ElevenLabs Sound Effects', 'AudioCraft / AudioGen', 'Stable Audio 2.0'],
      specs: {
        'Frecuencia de Muestreo': '48 kHz / 24-bit PCM',
        'Canales': 'Estéreo Binaural / Dolby Atmos Bed',
        'Duración Óptima': audioType === 'impact_action' ? '3 - 6 segundos' : '15 - 30 segundos en bucle',
      },
      rawExtractedLayers: {
        sound: soundDir,
      },
    };
  }

  /**
   * Synthesize master prompt for Music & Score Generation
   */
  static synthesizeMusicPrompt(
    project: MovieProject,
    memories: ProjectMemory[],
    musicType: 'main_theme' | 'tension_cue' | 'emotional_climax' = 'main_theme',
    customNotes?: string
  ): SynthesizedPromptResult {
    const compMem = memories.find((m) => m.key === 'COMPOSER' || m.key === 'COMPOSITOR_MUSICAL');
    const compDir = extractDepartmentDirectives(compMem?.content, 'music', 220) || `Partitura orquestal evocadora en ${project.artStyle}`;

    let musicTitle = `Leitmotif Principal - "${project.title}"`;
    let musicPrompt = '';
    let bpm = '72 BPM';

    if (musicType === 'main_theme') {
      musicTitle = `Tema Principal (Main Title Theme) - "${project.title}"`;
      bpm = '72 BPM';
      musicPrompt = `Cinematic film score main theme for "${project.title}". ` +
        `Style: ${project.artStyle}, ${project.genre}. ` +
        `Instrumentation: ${compDir}. ` +
        `Emotional arc: contemplative opening on solo cello and analog synth pads, swelling into rich cinematic orchestral strings, deep brass accents, slow powerful tempo (72 BPM), haunting and memorable leitmotif.`;
    } else if (musicType === 'tension_cue') {
      musicTitle = `Tensión & Suspenso (Underscore Cue)`;
      bpm = '88 BPM';
      musicPrompt = `Dark atmospheric cinematic tension underscore: pulsating low synth bassline, ticking clock-like percussion, discordant strings crescendo, nervous tempo (88 BPM), psychological thriller pacing.`;
    } else if (musicType === 'emotional_climax') {
      musicTitle = `Clímax Emocional (Heroic / Tragic Peak)`;
      bpm = '64 BPM';
      musicPrompt = `Majestic orchestral emotional climax: sweeping full orchestra, soaring violin melodies, French horns triumphant and melancholic, thunderous timpani rolls, bittersweet cinematic resolution.`;
    }

    if (customNotes && customNotes.trim()) {
      musicPrompt = `${customNotes.trim()} ${musicPrompt}`;
    }

    return {
      modality: 'music',
      title: musicTitle,
      masterPrompt: musicPrompt,
      targetEngines: ['Suno v3.5 / v4', 'Udio v1.5', 'Google MusicFX'],
      specs: {
        'Tempo': bpm,
        'Género': `${project.genre || 'Cinematic'} Score`,
        'Estructura': 'Intro (0-15s) -> Leitmotif (15-45s) -> Crescendo (45-75s) -> Outro',
        'Etiquetas de Estilo': 'cinematic orchestral, analog synth pads, cello solo, epic emotional crescendo, film soundtrack',
      },
      rawExtractedLayers: {
        music: compDir,
      },
    };
  }
}
