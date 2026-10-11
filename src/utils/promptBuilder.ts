import { MovieProject, CinemaSubagent } from '../types';

/**
 * Checks whether a prompt string is an obsolete template residue from
 * the offline demo mockups (e.g. Kael, brutalist megacity, holographic repair).
 */
export function isLegacyOrResiduePrompt(prompt?: string, projectTitle?: string): boolean {
  if (!prompt || !prompt.trim()) return true;

  // If the user's project explicitly has "Kael" in its title, keep it
  if (projectTitle && projectTitle.toLowerCase().includes('kael')) {
    return false;
  }

  const legacyMarkers = [
    'brutalista',
    'kael',
    'megaciudad',
    'panel holográfico',
    'paneles holográficos',
    'torre 09',
    'torre inclinada',
    'andamio voladizo',
    'cuota de tiempo de altura',
    'silicio en los dedos',
    'gabardina sintética de lluvia reforzada',
    'marcas de quemaduras por silicio',
    'visor hud desgastado',
  ];

  const lower = prompt.toLowerCase();
  return legacyMarkers.some((marker) => lower.includes(marker));
}

/**
 * Builds a rich, production-grade prompt for a specialized cinema subagent,
 * deeply grounding it in the user's actual project premise, genre, visual style,
 * and character concepts, ensuring zero offline mockup residues survive.
 */
export function buildSubagentPrompt(
  agent: CinemaSubagent,
  project: MovieProject,
  customInstruction?: string
): string {
  // If the user provided a genuine, customized instruction in the workstation
  // (and it is NOT an obsolete hardcoded template residue), honor it.
  if (
    customInstruction &&
    customInstruction.trim() &&
    !isLegacyOrResiduePrompt(customInstruction, project.title) &&
    !customInstruction.startsWith('Genera el Project Bible para una miniserie de ciencia ficción')
  ) {
    return customInstruction;
  }

  const title = project.title?.trim() || 'Producción Cinematográfica';
  const synopsis = project.description?.trim() || 'Una narrativa cinematográfica cautivadora.';
  const genre = project.genre || 'Drama / Ficción';
  const style = project.artStyle || 'Cinemático Ultra-Realista';
  const target = project.targetAudience || 'Público General';
  const duration = (project as any).duration || '3 minutos';

  switch (agent.key) {
    case 'SHOWRUNNER':
      return `Genera la Project Bible y directiva maestra de producción cinematográfica para el cortometraje "${title}".
PREMISA / IDEA ORIGINAL DEL CREADOR:
"${synopsis}"

GÉNERO: ${genre}
ESTILO VISUAL: ${style}
DURACIÓN ESTIMADA: ${duration}
TARGET: ${target}

INSTRUCCIONES CLAVE:
1. Define la visión creativa global, tono cinematográfico y logline de alto impacto.
2. Establece las reglas del mundo y los pilares estéticos inquebrantables.
3. Desglosa los arcos emocionales de los personajes clave que nacen de esta premisa.
4. Dicta las directivas unificadas y contratos de entrega para los departamentos subordinados.`;

    case 'GUIONISTA':
      return `Escribe el Guion Literario y la Secuencia de Apertura (Escena 1 completa) para el cortometraje "${title}".
ARGUMENTO E IDEA DEL CREADOR:
"${synopsis}"

GÉNERO: ${genre}
ESTILO: ${style}

REQUISITOS OBLIGATORIOS:
- Formato profesional estándar de guion cinematográfico (Master Scene Format).
- Encabezado de escena claro (ej. EXT. o INT. - LUGAR - MOMENTO DEL DÍA).
- Acotaciones visuales ricas en atmósfera sensorial, textura y lenguaje cinematográfico.
- Nombres de personajes en mayúsculas, acotaciones interpretativas breves y diálogos con subtexto y tensión, fieles a la idea original del creador.`;

    case 'SCRIPT_DOCTOR':
      return `Realiza el análisis dramatúrgico y pulido de guion para el cortometraje "${title}" basado en:
"${synopsis}"

Evalúa:
1. Ritmo dramático (Pacing) y dosificación de información.
2. Naturalidad y contundencia de las líneas de diálogo.
3. Potenciación de las pausas dramáticas y subtexto cinematográfico.`;

    case 'CONTINUISTA':
      return `Genera la Continuity Bible y control de raccord para la producción de "${title}" a partir del concepto:
"${synopsis}"

Detalla:
1. Estado físico, vestuario y marcas de los personajes principales en la secuencia.
2. Props y utilería de mano diegética.
3. Coherencia cronológica y lumínica entre planos consecutivos.`;

    case 'DIRECTOR_ESCENA':
      return `Elabora las directivas de puesta en escena y dirección actoral para "${title}".
Concepto: "${synopsis}"
Estilo: ${style}

Define:
1. Vector emocional dominante y subtexto de cada personaje en escena.
2. Bloqueo actoral (movimiento físico, distancias y orientación respecto a la cámara).
3. Intenciones no verbales, miradas y ritmo de respiración de la escena.`;

    case 'DIRECTOR_ARTE':
      return `Crea la Art Bible y propuesta estética visual oficial para "${title}".
Idea / Premisa: "${synopsis}"
Estilo Visual Solicitado: ${style}

Incluye:
1. Paleta cromática oficial con códigos hexadecimales exactos (#HEX), explicando el rol dramático de cada color.
2. Materialidad, texturas (orgánicas, arquitectónicas, desgaste) y atmósfera ambiental.
3. Referencias estéticas y dirección de iluminación ambiental.`;

    case 'CHARACTER_DESIGNER':
      return `Diseña el Character Sheet detallado para el o los personajes protagónicos de "${title}".
Idea / Premisa: "${synopsis}"
Estilo: ${style}

Especifica:
1. Nombre, edad estimada, complexión y silueta distintiva.
2. Rostro, rasgos fisionómicos, peinado y marcas particulares (cicatrices, miradas, accesorios).
3. Diseño de vestuario, materiales de ropa y paleta cromática asignada.`;

    case 'CHARACTER_SUPERVISOR':
      return `Establece la guía de consistencia facial y tokens de coherencia (FaceID / IP-Adapter) para los personajes de "${title}" (${synopsis}).
Especifica las métricas invariantes de rostro y parámetros de anclaje para que ningún generador deforme su identidad visual a lo largo de las tomas.`;

    case 'PRODUCTION_DESIGNER':
      return `Diseña el Environment Blueprint y la arquitectura del set principal para "${title}".
Premisa del set: "${synopsis}"
Estilo: ${style}

Describe la distribución espacial, materiales constructivos, niveles de elevación, props de fondo y puntos de interacción para la cámara.`;

    case 'DOP':
    case 'DIRECTOR_FOTOGRAFIA':
      return `Diseña la propuesta cinematográfica completa (Camera & Lens Bible) para "${title}".
Idea: "${synopsis}"
Estilo: ${style}

Especifica:
1. Relación de aspecto (ej. 2.39:1 anamórfico o 16:9).
2. Paquete de lentes (focales recomendadas: 35mm, 50mm, 85mm), profundidad de campo y apertura.
3. Movimientos de cámara (Dolly in, Steadicam, cámara en mano, plano grúa).
4. Esquema de iluminación (Key, Fill, Rim y fuentes prácticas en escena).`;

    case 'GAFFER':
      return `Elabora el mapa de iluminación (Lighting Blueprint) para las escenas clave de "${title}" (${synopsis}).
Especifica temperaturas de color (Kelvin), ratios de contraste y fuentes de luz artificiales o naturales.`;

    case 'STORYBOARD':
    case 'STORYBOARDER':
      return `Crea el desglose de Storyboard con 4 planos clave cinematográficos para el cortometraje "${title}".
Idea / Premisa: "${synopsis}"
Estilo: ${style}

Para cada plano (Planos 1 a 4) incluye:
- Tipo de plano (Gran Plano General, Plano Medio, Primer Plano, etc.)
- Ángulo y movimiento de cámara
- Acción en pantalla
- Prompt en inglés optimizado para renderizadores de video generativo (ByteDance Seedance 2.0 / Runway Gen-3 / Luma Dream Machine / Kling AI).`;

    case 'LAYOUT':
      return `Diseña el Layout Spatial Plan para "${title}".
Espacio y Premisa: "${synopsis}"
Estilo: ${style}
Establece la composición espacial, profundidad de campo en capas múltiples y trayectorias exactas de personajes y cámara.`;

    case 'PROMPT_ENGINEER':
      return `Como Ingeniero de Prompts Generativos de Cine para "${title}", sintetiza y formula los Prompts Maestros definitivos para los motores de IA generativa:
1. PROMPT DE IMAGEN FOTORREALISTA (Google Imagen 3 / Flux Pro / Midjourney v6): Sujeto, anatomía, vestuario, iluminación volumétrica, lentes (85mm T1.4), texturas 8k, sin etiquetas administrativas ni metadatos.
2. PROMPT DE VIDEO CINEMÁTICO (Google Veo / Runway Gen-3 / ByteDance Seedance 2.0): Movimiento de cámara (dolly, tracking, crane), acción física, dinámica lumínica, 24fps.
3. PROMPT DE AUDIO Y FOLEY (ElevenLabs SFX / AudioCraft): Capas acústicas, texturas sensoriales, ruidos diegéticos de props y pasos, espacialización sonora.
4. PROMPT DE MÚSICA Y SCORE (Suno / Udio / MusicFX): Instrumentación exacta, tempo BPM, acordes emocionales y leitmotif para la película.
Premisa: "${synopsis}"
Género: ${genre} | Estilo: ${style}`;

    case 'LEAD_ANIMATOR':
      return `Genera el plan de animación de poses clave y física actoral para "${title}".
Premisa: "${synopsis}"
Define la cinemática de los personajes, gestualidad emocional, tensión muscular y curvas de aceleración de movimientos.`;

    case 'SEC_ANIMATOR':
      return `Configura las dinámicas secundarias para "${title}" (${synopsis}):
Físicas de vestuario, cabello, interacción de telas con el viento y respuestas inerciales al movimiento actoral.`;

    case 'TEMPORAL_SUPERVISOR':
      return `Define el plan de consistencia temporal y estabilización para "${title}":
Control de flujo óptico, parámetros de supresión de flicker y coherencia estructural entre fotogramas sucesivos.`;

    case 'VFX_SUPERVISOR':
      return `Diseña el VFX Blueprint para el cortometraje "${title}".
Premisa visual: "${synopsis}"
Estilo: ${style}
Detalla la integración de partículas diegéticas, capas atmosféricas, elementos volumétricos e interacción con el set.`;

    case 'SIMULATOR_TD':
      return `Configura las simulaciones físicas avanzadas de colisiones y fluidos para "${title}" (${synopsis}).`;

    case 'COMPOSER':
    case 'COMPOSITOR_MUSICAL':
      return `Escribe la directiva musical y de banda sonora original para "${title}".
Premisa: "${synopsis}"
Estilo: ${style}

Describe la instrumentación sugerida, tempo (BPM), leitmotivs melódicos para cada personaje y evolución del tema musical con las curvas dramáticas.`;

    case 'SOUND_DESIGNER':
      return `Diseña la arquitectura sonora (Sound Design Bible & Cue Sheet) para "${title}".
Premisa: "${synopsis}"

Detalla las capas de foley, atmósferas envolventes, sonidos diegéticos clave y efectos acústicos para potenciar la inmersión del espectador.`;

    case 'MIXER':
      return `Diseña el plan de mezcla y balance multicanal de audio para "${title}" (${synopsis}):
Curvas de ducking en diálogos, balance entre score y foley, y espacialización envolvente.`;

    case 'EDITOR':
    case 'MONTADOR':
      return `Establece la guía de montaje y edición para "${title}" (${synopsis}).
Define el ritmo de corte, métrica temporal de las tomas y transiciones dramáticas entre momentos clave.`;

    case 'COLORIST':
    case 'COLORISTA':
      return `Define la propuesta de Color Grading y LUT cinematográfica para "${title}" bajo el estilo "${style}".
Especifica contraste, saturación, tonalidad de sombras (lift), tonos medios (gamma) y altas luces (gain).`;

    case 'MASTER_SUPERVISOR':
      return `Establece las directivas de masterización y entrega para "${title}" (${synopsis}):
Espacio de color (Rec.709 / ACES), empaquetado para cine o streaming y rango dinámico HDR.`;

    case 'PRODUCTION_MANAGER':
      return `Crea el plan de producción y orden de rodaje óptimo para "${title}" (${synopsis}):
Priorización de planos críticos y optimización de recursos generativos.`;

    case 'PIPELINE_TD':
      return `Estructura el mapa de dependencias de pipeline técnico para "${title}" (${synopsis}):
Flujo de datos entre preproducción, arte conceptual, storyboard y motores de renderizado.`;

    case 'QC_SUPERVISOR':
      return `Define la lista de control de calidad (QC Audit) para "${title}" (${synopsis}):
Detección de artefactos, consistencia de personajes y fidelidad al estilo visual solicitado.`;

    default:
      return `Genera el entregable técnico de producción para el departamento de ${agent.name} (${agent.layer}) en el cortometraje "${title}".
PREMISA / IDEA: "${synopsis}"
GÉNERO: ${genre}
ESTILO: ${style}
Funciones de tu departamento: ${(agent.duties || []).join(', ')}.`;
  }
}
