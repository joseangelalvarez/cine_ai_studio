import { CinemaSubagent } from './types';

export const CINEMA_LAYERS = [
  'Capa 0 – Orquestador General',
  'Capa 1 – Narrativa',
  'Capa 2 – Visual',
  'Capa 3 – Animación y VFX',
  'Capa 4 – Sonido',
  'Capa 5 – Postproducción',
  'Capa 6 – Producción y Control',
] as const;

export const CINEMA_SUBAGENTS_CATALOG: CinemaSubagent[] = [
  // Capa 0
  {
    key: 'SHOWRUNNER',
    name: 'Director Ejecutivo / Showrunner IA',
    role: 'Director + Productor ejecutivo',
    layer: CINEMA_LAYERS[0],
    layerId: 0,
    duties: [
      'Recibe el brief de la producción cinematográfica.',
      'Define la biblia del proyecto (tono, dirección de estilo, target de audiencia).',
      'Coordina a todos los demás subagentes bajo contratos unificados.',
      'Decide cuándo un guion, toma o escena reúne los estándares estéticos.',
    ],
    inputDescription: 'Sinopsis de base, presupuesto, género literario, duración estimada, formato.',
    outputDescription: 'Project Bible unificado + Plan de producción estratégico.',
    suggestedPrompt: 'Genera la Project Bible y directiva maestra de producción cinematográfica adaptada al argumento, tono narrativo y estilo visual del proyecto.',
    iconName: 'stars',
  },

  // Capa 1
  {
    key: 'GUIONISTA',
    name: 'Guionista Principal',
    role: 'Guionista de Cine',
    layer: CINEMA_LAYERS[1],
    layerId: 1,
    duties: [
      'Genera sinopsis extendida, tratamiento, escaleta técnica y guion literario.',
      'Escribe y estructura los diálogos y las acotaciones.',
      'Maneja el versionado de guion en base a notas de producción.',
    ],
    inputDescription: 'Project Bible, notas del Showrunner, esquema de personajes.',
    outputDescription: 'Guion Literario (Escenas estructuradas con diálogos en formato profesional).',
    suggestedPrompt: 'Escribe la escena de apertura y guion literario con formato cinematográfico estándar, diálogos contundentes y acotaciones visuales inmersivas basadas en el argumento.',
    iconName: 'description',
  },
  {
    key: 'SCRIPT_DOCTOR',
    name: 'Script Doctor',
    role: 'Asesor y Pulidor de Guion',
    layer: CINEMA_LAYERS[1],
    layerId: 1,
    duties: [
      'Mejora diálogos, ritmo narrativo y coherencia de los arcos del guion.',
      'Ajusta el guion a restricciones físicas y logísticas de la producción.',
    ],
    inputDescription: 'Guion literario original, notas de revisión del Showrunner.',
    outputDescription: 'Guion Pulido con diálogos intensificados y ritmo optimizado.',
    suggestedPrompt: 'Realiza el análisis dramatúrgico y pulido de guion: optimiza el ritmo, intensifica el subtexto y elimina redundancias en los diálogos.',
    iconName: 'healing',
  },
  {
    key: 'CONTINUISTA',
    name: 'Continuista',
    role: 'Script / Continuity Supervisor',
    layer: CINEMA_LAYERS[1],
    layerId: 1,
    duties: [
      'Monitorea el control de continuidad técnica y lógica (vestuario, props, maquillaje, iluminación, posiciones, tiempo del día).',
      'Genera la Continuity Bible para que la usen los agentes visuales de cámara.',
    ],
    inputDescription: 'Guion literario pulido, esquemas de desglose de arte.',
    outputDescription: 'Continuity Bible detallando el estado de cada personaje y escena.',
    suggestedPrompt: 'Genera las especificaciones de continuidad técnica y raccord: estado físico de personajes, vestuario, utilería de mano e iluminación diegética entre planos.',
    iconName: 'history',
  },
  {
    key: 'DIRECTOR_ESCENA',
    name: 'Director de Escena',
    role: 'Director Artístico / Bloqueador',
    layer: CINEMA_LAYERS[1],
    layerId: 1,
    duties: [
      'Define la intención emocional profunda de cada escena.',
      'Establece el ritmo actoral, tono o énfasis.',
      'Proporciona marcas concretas de cámara, luz y animación.',
    ],
    inputDescription: 'Guion literario, Continuity Bible.',
    outputDescription: 'Instrucciones de Intención Directorial (Traducción de narrativa a parámetros técnicos).',
    suggestedPrompt: 'Elabora las directivas de puesta en escena y blocking actoral: vector psicológico dominante, subtexto emocional y trayectorias físicas de los personajes respecto a cámara.',
    iconName: 'movie',
  },

  // Capa 2
  {
    key: 'DIRECTOR_ARTE',
    name: 'Director de Arte',
    role: 'Concept & Environment Director',
    layer: CINEMA_LAYERS[2],
    layerId: 2,
    duties: [
      'Define la estética e identidad visual global de la obra.',
      'Crea la Art Bible (estilo artístico, paleta de colores oficial, texturas y referencias).',
    ],
    inputDescription: 'Project Bible, Guion literario.',
    outputDescription: 'Art Bible con paleta de colores hexadecimales, materialidad y estilos de referencia.',
    suggestedPrompt: 'Define la propuesta estética visual y Art Bible: paleta cromática con códigos hexadecimales (#HEX), materialidad de superficies y dirección artística general.',
    iconName: 'palette',
  },
  {
    key: 'CHARACTER_DESIGNER',
    name: 'Diseñador de Personajes',
    role: 'Diseñador Creativo de Personajes',
    layer: CINEMA_LAYERS[2],
    layerId: 2,
    duties: [
      'Diseña personajes centrales y extras en turnaround (vistas múltiples).',
      'Define proporciones, silueta, texturas y esquemas de color específicos.',
      'Genera Character Sheets detallados.',
    ],
    inputDescription: 'Art Bible, descripciones de personajes del guion.',
    outputDescription: 'Character Sheets y Turnaround referenciales.',
    suggestedPrompt: 'Genera el Character Sheet y ficha de vestuario del personaje protagónico: fisionomía, rasgos fisonómicos, marcas distintivas, silueta y prendas acordes al estilo visual.',
    iconName: 'face',
  },
  {
    key: 'CHARACTER_SUPERVISOR',
    name: 'Supervisor de Personajes',
    role: 'Character Consistency Supervisor',
    layer: CINEMA_LAYERS[2],
    layerId: 2,
    duties: [
      'Mantiene la consistencia de la cara e identidad visual del personaje en todos los planos.',
      'Gestiona adaptadores IP‑Adapter y FaceID.',
      'Emite tokens de consistencia del personaje.',
    ],
    inputDescription: 'Character Sheets primarios, renders de prueba.',
    outputDescription: 'Guía de Coherencia Facial y Tokens de Consistencia del Rostro.',
    suggestedPrompt: 'Escribe la guía de coherencia facial y anclaje de identidad: define proporciones óseas, parámetros FaceID y tokens de consistencia para prevenir aberraciones en los generadores.',
    iconName: 'portrait',
  },
  {
    key: 'PRODUCTION_DESIGNER',
    name: 'Diseñador de Producción',
    role: 'Production / Scenic Designer',
    layer: CINEMA_LAYERS[2],
    layerId: 2,
    duties: [
      'Diseña el entorno, la arquitectura de los sets y props mecánicos o decorativos.',
      'Crea blueprints de escenarios (Environment Blueprints).',
    ],
    inputDescription: 'Art Bible, descripciones escénicas de guion.',
    outputDescription: 'Environment Blueprint y guías arquitectónicas del set.',
    suggestedPrompt: 'Diseña el Environment Blueprint y la arquitectura escénica del set principal: distribución espacial en planta, materiales constructivos y puntos focales para la cámara.',
    iconName: 'domain',
  },
  {
    key: 'DOP',
    name: 'Director de Fotografía',
    role: 'Director de Fotografía / DoP',
    layer: CINEMA_LAYERS[2],
    layerId: 2,
    duties: [
      'Define lentes, distancia focal, profundidad de campo, composición y encuadres.',
      'Diseña el movimiento físico de la cámara y genera el Camera & Lens Bible.',
    ],
    inputDescription: "Director's Plan (Capa 1), Environment Blueprints.",
    outputDescription: 'Camera & Lens Bible detallando distancias focales, velocidad de diafragma y movimiento.',
    suggestedPrompt: 'Define la configuración de cámara y óptica cinematográfica: relación de aspecto (2.39:1 o 16:9), distancia focal de lentes (35mm / 85mm), diafragma y estilo de movimiento.',
    iconName: 'videocam',
  },
  {
    key: 'GAFFER',
    name: 'Gaffer / Iluminador',
    role: 'Chief Lighting Technician',
    layer: CINEMA_LAYERS[2],
    layerId: 2,
    duties: [
      'Define esquemas de luz precisos por escena (temperatura, intensidad, dirección, tipo de fuente).',
      'Mantiene coherencia lumínica a través de Lighting Blueprints.',
    ],
    inputDescription: 'Camera & Lens Bible, Art Bible, descripción física del set.',
    outputDescription: 'Lighting Blueprint con diagramas y temperaturas de color en grados Kelvin.',
    suggestedPrompt: 'Crea el esquema de iluminación cinematográfica para las tomas clave: esquema de tres puntos (Key, Fill, Rim), temperaturas de color en Kelvin y ratio de contraste de sombras.',
    iconName: 'wb_sunny',
  },
  {
    key: 'STORYBOARD',
    name: 'Storyboard Artist',
    role: 'Dibujante de Storyboard',
    layer: CINEMA_LAYERS[2],
    layerId: 2,
    duties: [
      'Traduce la secuencia de guion e instrucciones de cámara a dibujos secuenciales.',
      'Estructura los encuadres clave y poses para definir el ritmo visual inicial.',
    ],
    inputDescription: 'Guion de escena, Camera & Lens Bible.',
    outputDescription: 'Secuencia de Storyboard (Descripción técnica y visual de frames clave).',
    suggestedPrompt: 'Genera las descripciones detalladas de una secuencia de 4 cuadros de storyboard: encuadre, ángulo de cámara, acción dramática y prompts optimizados en inglés para renderizadores de video.',
    iconName: 'grid_view',
  },
  {
    key: 'LAYOUT',
    name: 'Layout Artist',
    role: 'Artista de Composición de Escena',
    layer: CINEMA_LAYERS[2],
    layerId: 2,
    duties: [
      'Coloca a los personajes y la cámara en un espacio tridimensional o plano maestro.',
      'Define el "blocking" (posiciones físicas de inicio, trayectorias y descansos actoriales).',
    ],
    inputDescription: 'Environment Blueprint, Storyboard, Fichas de personaje.',
    outputDescription: 'Layout Spatial Plan (Blocking técnico de personajes y cámara).',
    suggestedPrompt: 'Define la composición espacial y el blocking técnico: posiciones métricas iniciales, trayectorias sobre el eje de coordenadas y desplazamientos de cámara coordinados.',
    iconName: 'layers',
  },
  {
    key: 'PROMPT_ENGINEER',
    name: 'Ingeniero de Prompts Generativos',
    role: 'Multimedia Prompt Engineer (Imagen, Video, Audio, Música)',
    layer: CINEMA_LAYERS[2],
    layerId: 2,
    duties: [
      'Destila y ensambla los entregables de todos los orquestadores eliminando el 100% de metadatos burocráticos.',
      'Sintetiza prompts fotorrealistas de alta fidelidad para modelos de imagen (Google Imagen 3, Flux Pro, Midjourney).',
      'Diseña prompts cinemáticos de cámara, movimiento y física para motores de video (Google Veo, Runway Gen-3, ByteDance Seedance 2.0, Kling).',
      'Formula directivas acústicas y de foley para generadores de efectos de sonido (ElevenLabs SFX, AudioCraft, Stable Audio).',
      'Estructura prompts de tempo (BPM), instrumentación y emoción para generadores musicales (Suno, Udio, MusicFX).',
    ],
    inputDescription: 'Character Sheets, Environment Blueprints, Art Bible, Camera & Lens Bible, Foley Cue Sheets y Score Directives.',
    outputDescription: 'Prompts Maestros Limpios y Optimizados para Generación de Imagen, Video, Audio y Música.',
    suggestedPrompt: 'Sintetiza las directivas de todos los departamentos en prompts maestros optimizados para Imagen (fotorrealismo), Video (movimiento de cámara), Audio (foley ambiental) y Música (leitmotifs), eliminando todo residuo burocrático.',
    iconName: 'auto_fix_high',
  },

  // Capa 3
  {
    key: 'LEAD_ANIMATOR',
    name: 'Animador Principal',
    role: 'Lead Motion & Performance Animator',
    layer: CINEMA_LAYERS[3],
    layerId: 3,
    duties: [
      'Define poses clave, gestualidad actoral primordial y timming del movimiento.',
      'Usa herramientas como AnimateDiff, Mochi o ControlNet Pose.',
    ],
    inputDescription: 'Storyboard sequences, Layout Spatial Plan.',
    outputDescription: 'Instrucciones de Animación Clave y curvas de tiempo/frecuencia.',
    suggestedPrompt: 'Genera el plan de animación de poses clave: cinética corporal, gestualidad emocional, peso físico y arcos de aceleración/desaceleración en cada acción.',
    iconName: 'run_circle',
  },
  {
    key: 'SEC_ANIMATOR',
    name: 'Animador Secundario',
    role: 'Secondary & Physics Animator',
    layer: CINEMA_LAYERS[3],
    layerId: 3,
    duties: [
      'Diseña e implementa el movimiento secundario (pelo, tela, ropa, correas, accesorios, follow-through).',
      'Configura los adaptadores de movimiento e inercia.',
    ],
    inputDescription: 'Animación principal aprobada, características materiales de la tela y ropa.',
    outputDescription: 'Instructivo de Simulación Física de Ropa y Dinámicas de Viento.',
    suggestedPrompt: 'Configura las físicas secundarias: dinámica de telas, comportamiento del cabello ante el movimiento e inercias de accesorios con seguimiento inercial.',
    iconName: 'waves',
  },
  {
    key: 'TEMPORAL_SUPERVISOR',
    name: 'Supervisor de Coherencia Temporal',
    role: 'Temporal Consistency Supervisor',
    layer: CINEMA_LAYERS[3],
    layerId: 3,
    duties: [
      'Analiza la transición de píxeles entre frames contiguos (Color, Luz, Estructura, Posición).',
      'Utiliza técnicas de flujo óptico (Optical Flow) y profundidad de ruido para evitar parpadeos no deseados (flicker).',
    ],
    inputDescription: 'Flujos de render brutos, mapas de profundidad secuenciales.',
    outputDescription: 'Reporte de Consistencia Temporal y Parámetros de Estabilización de Ruido.',
    suggestedPrompt: 'Establece el protocolo de coherencia temporal: control de flujo óptico, atenuación de artefactos de parpadeo (deflickering) y anclaje de ruido latente entre fotogramas.',
    iconName: 'lock',
  },
  {
    key: 'VFX_SUPERVISOR',
    name: 'Supervisor de Efectos Visuales',
    role: 'VFX Supervisor',
    layer: CINEMA_LAYERS[3],
    layerId: 3,
    duties: [
      'Diseña la creación e integración de efectos de partículas (lluvia, chispas eléctricas, fuego, humo, magia, atmósfera).',
      'Asegura la fusión natural de estos generadores con el fondo.',
    ],
    inputDescription: 'Art Bible, secuencias de animación aprobadas.',
    outputDescription: 'VFX Blueprint (Capas y especificaciones de partículas y chispas).',
    suggestedPrompt: 'Diseña el VFX Blueprint: efectos de partículas ambientales, capas atmosféricas, elementos volumétricos e integración con la geometría diegética del set.',
    iconName: 'bolt',
  },
  {
    key: 'SIMULATOR_TD',
    name: 'Director Técnico de Simulación',
    role: 'FX Technical Director',
    layer: CINEMA_LAYERS[3],
    layerId: 3,
    duties: [
      'Optimiza y simula fluidos complejos, colisiones e interacciones de partículas con geometría.',
      'Establece ecuaciones simplificadas de simulador físico.',
    ],
    inputDescription: 'VFX Blueprints, Layout Spatial Plan.',
    outputDescription: 'Ficha de Parámetros Dinámicos de Colisión Física.',
    suggestedPrompt: 'Configura las simulaciones físicas de colisión y fluidos: viscosidad, rebote superficial, fricción de materiales y dispersión geométrica de micropartículas.',
    iconName: 'grain',
  },

  // Capa 4
  {
    key: 'COMPOSER',
    name: 'Compositor Musical',
    role: 'Music Director & Composer',
    layer: CINEMA_LAYERS[4],
    layerId: 4,
    duties: [
      'Genera temas principales, leitmotivs por personaje y variaciones emocionales.',
      'Diseña las atmósferas orquestales o sintéticas.',
    ],
    inputDescription: 'Guion de la escena, Project Bible (Tono y ritmo).',
    outputDescription: 'Score Directives (Estructura de la partitura, instrumentos, acordes, ritmo bpm).',
    suggestedPrompt: 'Genera las directivas de partitura y banda sonora original: instrumentación, tempo (BPM), progresión armónica y leitmotivs que refuercen el tono dramático de la escena.',
    iconName: 'music_note',
  },
  {
    key: 'SOUND_DESIGNER',
    name: 'Diseñador de Sonido',
    role: 'Foley & Ambient Sound Designer',
    layer: CINEMA_LAYERS[4],
    layerId: 4,
    duties: [
      'Diseña los efectos acústicos (foley): pasos, ropa, golpes, chirridos mecánicos.',
      'Crea la pista de sonido ambiental detallada.',
    ],
    inputDescription: 'Guion literario con acciones físicas, Layout Spatial Plan.',
    outputDescription: 'Sound FX Cue Sheet (Listado e instrucciones de sonidos de foley).',
    suggestedPrompt: 'Diseña el Sound FX Cue Sheet y capas de foley: texturas acústicas ambientales, ruidos de indumentaria, pasos y puntuaciones de impacto diegético.',
    iconName: 'volume_up',
  },
  {
    key: 'MIXER',
    name: 'Mezclador final',
    role: 'Re‑Recording Mixer & Audio Engineer',
    layer: CINEMA_LAYERS[4],
    layerId: 4,
    duties: [
      'Balancea diálogos, música y pistas de efectos de sonido.',
      'Estructura el paneo acústico envolvente, ecualización y reverberaciones de sala.',
    ],
    inputDescription: 'Diálogos grabados, Score musical, Sound FX cues.',
    outputDescription: 'Plan de Mezcla Multicanal y Reverberaciones de Entorno.',
    suggestedPrompt: 'Diseña la mezcla de audio multicanal: balance de ganancia entre diálogos, música y efectos (ducking), paneo envolvente y curvas de ecualización espacial.',
    iconName: 'equalizer',
  },

  // Capa 5
  {
    key: 'EDITOR',
    name: 'Montador / Editor de Cine',
    role: 'Film Editor',
    layer: CINEMA_LAYERS[5],
    layerId: 5,
    duties: [
      'Elige las mejores tomas de cámara y define el corte final.',
      'Ajusta el ritmo, longitud de la secuencia y la fluidez del montaje narrativo.',
    ],
    inputDescription: 'Secuencias renderizadas, Storyboard, Temas aprobados.',
    outputDescription: 'Editing Decision List (EDL) con cortes exactos por segundo.',
    suggestedPrompt: 'Genera el plan de montaje y ritmo editorial: duraciones exactas de planos, puntos de corte dramático y transiciones directas para maximizar la tensión narrativa.',
    iconName: 'content_cut',
  },
  {
    key: 'COLORIST',
    name: 'Colorista',
    role: 'Colorist / Digital Colorist',
    layer: CINEMA_LAYERS[5],
    layerId: 5,
    duties: [
      'Aplica correcciones cromáticas y gradación de color (Color Grading).',
      'Sincroniza y estandariza looks cromáticos previniendo saltos visuales.',
    ],
    inputDescription: 'Art Bible, tomas montadas en crudo.',
    outputDescription: 'LUT de Color Cinematográfico Oficial y Guía de Look / Hue.',
    suggestedPrompt: 'Diseña el LUT cinematográfico y especificaciones de etalonaje digital: contraste tonal, gradación de sombras, medios tonos y altas luces en concordancia con la Art Bible.',
    iconName: 'compare',
  },
  {
    key: 'MASTER_SUPERVISOR',
    name: 'Supervisor de Mastering',
    role: 'Online / Finishing & Mastering Editor',
    layer: CINEMA_LAYERS[5],
    layerId: 5,
    duties: [
      'Genera versiones finales de exhibición (4K UHD, 1080p, SDR, HDR10, Dolby Vision).',
      'Supervisa conversión de framerates y empaquetado final (DCP).',
    ],
    inputDescription: 'Montaje final mezclado y con color definitivo.',
    outputDescription: 'Ficha de Envíos Cinematográficos y Configuración de Rendering Ultra-HD.',
    suggestedPrompt: 'Define las especificaciones de masterización final y entrega técnica: espacio de color, codificación para cines (DCP) o streaming, y rango dinámico HDR.',
    iconName: 'settings_backup_restore',
  },

  // Capa 6
  {
    key: 'PRODUCTION_MANAGER',
    name: 'Jefe de Producción',
    role: 'Production Manager',
    layer: CINEMA_LAYERS[6],
    layerId: 6,
    duties: [
      'Planifica el orden de cronograma de las escenas de rodaje.',
      'Optimiza los recursos energéticos o de tiempo de renderizado artificial.',
      'Prioriza planos críticos que alimentan a múltiples subagentes.',
    ],
    inputDescription: 'Project Bible, Escaleta de escenas, número de planos.',
    outputDescription: 'Project Schedule (Cronograma de Rodaje y Prioridades de Renderizado).',
    suggestedPrompt: 'Crea el cronograma de rodaje y optimización de render: orden secuencial de planos, estimación de cómputo y prioridades de preproducción para la entrega.',
    iconName: 'schedule',
  },
  {
    key: 'PIPELINE_TD',
    name: 'Coordinador de Pipeline',
    role: 'Pipeline Technical Director',
    layer: CINEMA_LAYERS[6],
    layerId: 6,
    duties: [
      'Gestiona las dependencias e intercambio de archivos entre los subagentes.',
      'Asegura la actualización unificada y sincronizada de la memoria central (Project, Art, Character, Lighting, Camera y Continuity Bibles).',
    ],
    inputDescription: 'Archivos generados por cada capa de agentes, alertas de cambios.',
    outputDescription: 'Sincronizador Automático de Metadatos y Estructuras.',
    suggestedPrompt: 'Genera el esquema de dependencias del pipeline: flujo de datos entre capas, contratos de sincronización de memoria y trazabilidad de cambios en tiempo real.',
    iconName: 'sync',
  },
  {
    key: 'QC_SUPERVISOR',
    name: 'Control de Calidad',
    role: 'QC Supervisor / Quality Inspector',
    layer: CINEMA_LAYERS[6],
    layerId: 6,
    duties: [
      'Detecta anomalías visuales: parpadeos excesivos, chispas desfasadas, chatarra espacial desalineada, ojos desproporcionados (AI glitches).',
      'Aprueba planos o marca tomas concretas con orden estricta de rehacer.',
    ],
    inputDescription: 'Fotomontajes finales, tomas renderizadas terminadas.',
    outputDescription: 'Reporte de Control de Calidad (QC Audit Report) con marcas de aprobación o reprobación.',
    suggestedPrompt: 'Ejecuta la auditoría de control de calidad: verificación de consistencia anatómica en personajes, ausencia de artefactos generativos y fidelidad a la Project Bible.',
    iconName: 'fact_check',
  },
];

export function getSubagentCostInfo(key: string): string | null {
  switch (key) {
    case 'DIRECTOR_ARTE':
      return 'Costo estimado: $0.03 USD (Categoría IMAGEN/Moodboard)';
    case 'CHARACTER_DESIGNER':
      return 'Costo estimado: $0.04 USD (Categoría IMAGEN/Fichas)';
    case 'PROMPT_ENGINEER':
      return 'Costo estimado: $0.01 USD (Categoría MULTIMODAL/Prompt Synthesis)';
    case 'STORYBOARD':
      return 'Costo estimado: $0.08 USD (Categoría IMAGEN/Secuencia)';
    case 'LEAD_ANIMATOR':
      return 'Costo estimado: $0.25 USD (Categoría VIDEO/Mochi-1 Heavy)';
    case 'SEC_ANIMATOR':
      return 'Costo estimado: $0.15 USD (Categoría VIDEO/Physics)';
    case 'VFX_SUPERVISOR':
      return 'Costo estimado: $0.20 USD (Categoría VIDEO/VFX Particle)';
    case 'COMPOSER':
      return 'Costo estimado: $0.10 USD (Categoría MÚSICA/Score)';
    case 'SOUND_DESIGNER':
      return 'Costo estimado: $0.05 USD (Categoría AUDIO/Foley Cue)';
    case 'MIXER':
      return 'Costo estimado: $0.03 USD (Categoría AUDIO/Atmos Surround)';
    default:
      return null;
  }
}

export function isSubagentExpensive(key: string): boolean {
  return getSubagentCostInfo(key) !== null;
}
