import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialise Gemini SDK if key is configured
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Detailed domain-specific responses generator for Simulation Mode (L5 Resilient Offline Mode)
function generateSimulationContent(
  project: { title: string; genre: string; artStyle: string; description: string },
  subagent: { key: string; name: string; role: string; layer: string; outputDescription: string },
  customPrompt?: string
): string {
  const title = project.title || 'El Proyecto';
  const style = project.artStyle || 'Cinemático';
  const synopsis = project.description || 'Una historia cinematográfica envolvente.';

  switch (subagent.key) {
    case 'SHOWRUNNER':
      return `=======================================================
PROYECTO: "${title.toUpperCase()}"
BIBLIA DEL SHOWRUNNER & DIRECTIVA GENERAL DE PRODUCCIÓN (CAPA 0)
=======================================================
1. VISIÓN CREATIVA & TONO:
   - Género: ${project.genre || 'Drama / Ciencia Ficción'}
   - Estilo Visual: ${style}
   - Tono Narrativo: Grave, reflexivo, con tensión latente y realismo visceral.
   - Target de Audiencia: Adulto / Cinefilo contemporáneo.

2. PREMISA & LOGLINE:
   ${synopsis}

3. PILARES ESTÉTICOS & REGLAS DE MUNDO:
   - Arquitectura y textura: Dominio de materiales crudos, contrastes lumínicos marcados.
   - Tratamiento de personajes: Arcos de conflicto interior expresados a través de microexpresiones y silencios.
   - Dirección de ritmo: Pausa contemplativa que culmina en secuencias de dinamismo cinético sostenido.

4. DIRECTIVA UNIFICADA PARA LOS SUBAGENTES:
   Todos los departamentos deben alinear sus entregables a la presente biblia. Cualquier desviación en el diseño de arte, paleta cromática o balance de frecuencias sonoras debe ser validada contra este documento.`;

    case 'GUIONISTA':
      return `=======================================================
GUION LITERARIO - SECUENCIA 1: APERTURA
PROYECTO: "${title.toUpperCase()}" | CAPA 1 - NARRATIVA
=======================================================
EXT. PERÍMETRO PRINCIPAL - NOCHE / AMANECER

Atmósfera cargada. El vapor y la condensación gotean lentamente sobre superficies metálicas húmedas. La bruma difumina los perfiles del horizonte.

De espaldas a cámara, una silueta solitaria ajusta los cierres herméticos de su indumentaria técnica desgastada.

OPERADOR
(con voz raspada, por el comunicador interno)
Control de enlace, aquí puesto tres. Confirmando lectura de sector.

VOZ EN FRECUENCIA (OFF)
(distorsión estática de baja señal)
Tres, reporte anómalo en la cuadrícula exterior. No te desvíes del protocolo.

El operador detiene el movimiento. Suspira pesadamente; el vaho empaña el visor por una fracción de segundo antes de disiparse. Mira hacia el vacío frontal.

OPERADOR
El protocolo dejó de tener sentido hace seis horas.

CORTA A:

INT. SALA DE CONEXIONES - CONTINUO
Luces tenues de emergencia en tono ámbar pulsante. Los cables cuelgan desordenados sobre el pasillo inundado por dos centímetros de agua aceitosa.`;

    case 'SCRIPT_DOCTOR':
      return `=======================================================
INFORME DE OPTIMIZACIÓN DRAMÁTICA - SCRIPT DOCTOR
=======================================================
1. DIAGNÓSTICO DE RITMO:
   - La transición entre el plano de apertura y la interacción por radio posee una carga de tensión acertada.
   - Recomendación: Acentuar la pausa de tres segundos antes de la réplica: "El protocolo dejó de tener sentido".

2. SUBTEXTO & NATURALISMO:
   - Se han eliminado dos líneas redundantes de exposición técnica para privilegiar la comunicación no verbal y el lenguaje corporal de fatiga.
   - Puntuación dramática reforzada para dar espacio al diseño sonoro y la respiración del protagonista.`;

    case 'CONTINUISTA':
      return `=======================================================
CONTINUITY BIBLE & HOJA DE SUPERVISIÓN TÉCNICA
=======================================================
- ESTADO TEMPORAL: Hora diegética 05:42 AM. Amanecer tardío bajo cielo cubierto.
- VESTUARIO PROTAGONISTA: Gabardina industrial grado 4, mancha de grasa sintética en hombro derecho, hebilla oxidada en cinto de herramientas.
- PROPS & UTILERÍA: Visor holográfico portátil (desgaste en lente izquierdo, batería al 42%), linterna de haz estrecho sujeta al arnés.
- ILUMINACIÓN DE CONTINUIDAD: Fuentes lumínicas constantes desde cuadrante norte en tono cian frío 6500K.`;

    case 'DIRECTOR_ESCENA':
      return `=======================================================
INSTRUCCIONES DE INTENCIÓN DIRECTORIAL & BLOCKING
=======================================================
- VECTOR EMOCIONAL: Aislamiento opresivo y determinación estoica frente a una fuerza abrumadora.
- DINÁMICA ACTORAL: Movimientos lentos y pesados que evidencian agotamiento físico acumulado.
- PLAN DE CÁMARA: Comenzar en plano dorsal a la altura del hombro (Dirty Single), paneo progresivo hacia plano cenital amplio para enfatizar la escala minúscula del sujeto frente al entorno.`;

    case 'DIRECTOR_ARTE':
      return `=======================================================
ART BIBLE & GUÍA ESTÉTICA VISUAL (CAPA 2)
=======================================================
1. PALETA CROMÁTICA OFICIAL (HEX):
   - Primario fondo: #0B0F19 (Negro Abisal Profundo)
   - Secundario set: #1E293B (Gris Hormigón Mojado)
   - Acento frío: #06B6D4 (Neón Cian 7000K)
   - Acento cálido: #F59E0B (Ámbar Alerta 2800K)
   - Desaturación global: -25% en tonos verdes orgánicos.

2. MATERIALIDAD Y TEXTURAS:
   - Hormigón brutalista con marcas de encofrado y escorrentía mineral.
   - Metales anodizados con corrosión galvánica en juntas y remaches.
   - Superficies brillantes por humedad reflectante (Wet look continuo).`;

    case 'CHARACTER_DESIGNER':
      return `=======================================================
CHARACTER SHEET & TURNAROUND DEL PROTAGONISTA
=======================================================
- NOMBRE / IDENTIFICADOR: Kael (Sujeto 03)
- COMPLEXIÓN FÍSICA: 1.84m, complexión enjuta y fibrosa, hombros ligeramente caídos por carga física.
- ROSTRO: Mandíbula angulosa, cicatriz oblicua en pómulo izquierdo, barba de varios días, ojos hundidos color avellana con ojeras marcadas.
- VESTIMENTA: Traje modular de protección de neopreno reforzado con kevlar gris mate, guantes tácticos desgastados con sensores táctiles en yemas.`;

    case 'CHARACTER_SUPERVISOR':
      return `=======================================================
GUÍA DE COHERENCIA FACIAL & TOKENS DE CONSISTENCIA
=======================================================
- IP-ADAPTER TOKENS: [kael_char_base, jaw_angular_38yo, dark_amber_eyes]
- FACE ANCHOR METRICS: Relación interocular 1.04, ángulo nasal 32°, índice de contraste pómulo 0.78.
- TOLERANCIA DE VARIANZA: <4% entre planos cerrados y planos generales. Anclaje estricto de textura de piel para evitar suavizado artificial (anti-smoothing filter).`;

    case 'PRODUCTION_DESIGNER':
      return `=======================================================
ENVIRONMENT BLUEPRINT & DISEÑO ESCÉNICO DEL SET
=======================================================
- ESTRUCTURA PRINCIPAL: Plataforma suspendida a 120 metros de cota cero. Andamios voladizos con piso de rejilla de fibra de vidrio translúcida.
- DETALLES ESCÉNICOS: Conductores de ventilación de 1.8m de diámetro expulsando vapor intermitente.
- PUNTOS DE INTERACCIÓN: Consola maestra despiezada con paneles de policarbonato agrietado y cables de fibra óptica sueltos parpadeando.`;

    case 'DOP':
      return `=======================================================
CAMERA & LENS BIBLE - DIRECTOR DE FOTOGRAFÍA (DoP)
=======================================================
- RELACIÓN DE ASPECTO: 2.39:1 (Anamórfico Scope de cine).
- SISTEMA DE CÁMARA & LENTES: Arri Alexa 65 sensor grande + Cooke Anamorphic/i Full Frame Plus (35mm y 65mm).
- APERTURA & PROFUNDIDAD: T2.0 en tomas medias y primeros planos, T4.0 en planos de establecimiento. Profundidad de campo extremadamente selectiva.
- MOVIMIENTO: Dolly horizontal amortiguado con compensación giroscópica sutil; cámara en mano orgánica para momentos de clímax.`;

    case 'GAFFER':
      return `=======================================================
LIGHTING BLUEPRINT & ESQUEMA DE ILUMINACIÓN
=======================================================
- PLANO 1 (EXT. PERÍMETRO):
  * Key Light: Luz difusa cenital fría 5600K rebotada en tela ultrabounce (20% intensidad).
  * Rim Light: Proyector LED fresnel en ángulo de 135° en cian intenso 7500K para despegar silueta del fondo.
  * Practical: Luz ámbar parpadeante del visor del traje (3000K, pulsos aleatorios de 0.8 Hz).
  * Ratio de contraste: 8:1 en sombras.`;

    case 'STORYBOARD':
      return `=======================================================
SECUENCIA DE STORYBOARD NARRATIVO (FRAMES CLAVE 1-4)
=======================================================
FRAME 1 [E-01]: Gran Plano General (Extreme Wide Shot).
- Encuadre: La inmensidad de la plataforma flotando entre nieblas densas.
- Acción: Silueta diminuta en el tercio inferior derecho.
- Tiempo estimado: 4.5 segundos.

FRAME 2 [E-02]: Plano Medio (Medium Shot).
- Encuadre: Kael inclinándose sobre la consola con cables expuestos.
- Acción: Sus manos tiemblan ligeramente al insertar un conector.
- Tiempo estimado: 3.0 segundos.

FRAME 3 [E-03]: Primer Plano (Close-Up).
- Encuadre: Reflejo del chispazo eléctrico en el visor de su casco.
- Acción: Ojos que se abren de golpe al registrar una señal en pantalla.
- Tiempo estimado: 2.5 segundos.

FRAME 4 [E-04]: Plano Contraplano (Reverse Shot / POV).
- Encuadre: La compuerta exterior desbloqueándose lentamente en la oscuridad.
- Tiempo estimado: 4.0 segundos.`;

    case 'LAYOUT':
      return `=======================================================
LAYOUT SPATIAL PLAN & MAPA DE BLOCKING TRIDIMENSIONAL
=======================================================
- POSICIÓN CÁMARA INICIAL: Coordenada X: 0, Y: -4.5m, Z: 1.6m (altura de vista).
- TRAYECTORIA ACTOR: Desplazamiento lineal de 3.2m desde consola central hacia el límite de la barandilla norte.
- COMPOSICIÓN GEOMÉTRICA: Ley de los tercios con líneas de fuga convergentes en la compuerta hidráulica de fondo.`;

    case 'LEAD_ANIMATOR':
      return `=======================================================
INSTRUCCIONES DE ANIMACIÓN MAESTRA & PROMPTS DE VIDEO
=======================================================
- MODELO DE REFERENCIA: Runway Gen-3 Alpha / Luma Dream Machine / Kling AI.
- PROMPT MAESTRO DE GENERACIÓN CINEMATOGRÁFICA:
  "Cinematic 2.39:1 aspect ratio anamorphic 35mm lens, moody atmospheric rain, high shutter speed realistic physics, weathered technician in tactical suit touching sparking industrial terminal, slow camera push-in, volumetric light haze, octane render 8k detail."
- TIMING CURVES: Desaceleración suave (ease-in-out) al inicio y aceleración súbita al saltar las chispas del cableado.`;

    case 'SEC_ANIMATOR':
      return `=======================================================
SIMULACIÓN FÍSICA SECUNDARIA & DINÁMICA DE TELAS
=======================================================
- INTERACCIÓN VIENTO: Vector de viento noroeste a 22 km/h con turbulencia fractal media.
- COMPORTAMIENTO TEXTIL: La gabardina sintética pesada muestra resistencia al movimiento con oscilaciones de baja frecuencia en los faldones inferiores.
- GOTAS & CONDENSACIÓN: Las gotas de agua resbalan en trayectoria no lineal sobre la visera de policarbonato con micro-salpicaduras en hombreras.`;

    case 'TEMPORAL_SUPERVISOR':
      return `=======================================================
CONTROL DE COHERENCIA TEMPORAL & ESTABILIZACIÓN
=======================================================
- OPTICAL FLOW AUDIT: Sin distorsión de malla en transiciones de frame 0 a 72.
- PARÁMETROS DE ANCLAJE: Semilla latente fijada con lock de ruido gaussiano al 65% en fondos arquitectónicos para prevenir el parpadeo de texturas (anti-flicker).`;

    case 'VFX_SUPERVISOR':
      return `=======================================================
VFX BLUEPRINT - SISTEMAS DE PARTÍCULAS & EFECTOS
=======================================================
- CAPA PARTÍCULAS 1: Lluvia ácida vertical fina con densidad de 12,000 partículas/m³.
- CAPA PARTÍCULAS 2: Chispas de cortocircuito en cobre expuesto (rebote físico en suelo metálico con decaimiento de brillo en 0.4s).
- CAPA GASES: Vapor volumétrico a baja presión emanando de rejillas con atenuación de luz cian.`;

    case 'SIMULATOR_TD':
      return `=======================================================
DIRECTORIO TÉCNICO DE COLISIÓN DINÁMICA DE FLUIDOS
=======================================================
- VISCOSIDAD DE FLUIDO: Escala 1.2 Pa·s para emular mezcla aceitosa industrial.
- COEFICIENTE DE FRICCIÓN: Rejillas metálicas con coeficiente mu=0.82; charcos reflectantes con ondulación armónica por vibración de generador subyacente.`;

    case 'COMPOSER':
      return `=======================================================
DIRECTIVAS DE BANDA SONORA - SCORE & LEITMOTIFS
=======================================================
- CONCEPTO MUSICAL: Hibridación de sintetizadores analógicos modulares (sub-graves pesados a 45 Hz) con cuarteto de cuerdas disonante procesado con cinta magnética desgastada.
- TEMPO: 62 BPM, compás ternario 6/8 con cadencia arrastrada.
- TEMA PRINCIPAL: Entrada de violonchelo solista en re menor en compás 9, expresando desolación antes de ser absorbido por una capa de distorsión armónica cálida.`;

    case 'SOUND_DESIGNER':
      return `=======================================================
SOUND DESIGN CUE SHEET & BANCO DE FOLEY CINEMÁTICO
=======================================================
- CUE SFX 01: Zumbido de reactor a 50Hz con resonancia en cavidad metálica.
- CUE SFX 02: Crujido de suela de bota táctica sobre rejilla empapada (sonido seco, micro-reverberación de 0.3s).
- CUE SFX 03: Chasquido de relé de alta tensión seguido de zumbido de capacitor cargándose.
- ATMÓSFERA FONDO: Viento ululante a través de vigas huecas con goteo constante a tempos polirrítmicos.`;

    case 'MIXER':
      return `=======================================================
PLAN DE MEZCLA MULTICANAL DOLBY ATMOS & MASTER
=======================================================
- ESPACIALIZACIÓN DE PISTAS:
  * Diálogos: Canal Central aislado con compresión suave (-18 LUFS objetivo).
  * Foley: Panning estéreo dinámico de 30% a 70% según posición del actor.
  * Celdas Atmos de Techo: Reservadas para viento exterior, lluvia y eco lejano de turbinas.
  * Subwoofer LFE (+10dB): Disparo en el momento del cortocircuito de la consola (pico a 32 Hz).`;

    case 'EDITOR':
      return `=======================================================
EDIT DECISION LIST (EDL) & PLAN DE MONTAJE
=======================================================
- CORTE 01 (00:00:00 - 00:04:12): Plano general atmosférico. Establece soledad.
- CORTE 02 (00:04:12 - 00:07:05): Plano medio Kael. Transición en corte directo al sonido del comunicador.
- CORTE 03 (00:07:05 - 00:09:20): Detalle manos y visor. Acelera el pulso narrativo.
- RITMO GLOBAL: Cadencia pausada que genera anticipación claustrofóbica.`;

    case 'COLORIST':
      return `=======================================================
COLOR GRADE BIBLE & ESPECIFICACIONES DE LUT
=======================================================
- COLOR SPACE: ACEScc / Rec.709 y entrega HDR10 (PQ ST.2084).
- CONTRASTE: Curva S pronunciada con elevación de sombras negras a nivel 0.02 nits (matte look en sombras profundas).
- TONOS DE PIEL: Bloqueados en vector 115° con desaturación periférica para evitar rostros anaranjados.
- HIGHLIGHTS: Rolloff suave en neones cian y ámbar para evitar clipeo digital.`;

    case 'MASTER_SUPERVISOR':
      return `=======================================================
FICHA TÉCNICA DE MASTERING & EXHIBICIÓN (DCP)
=======================================================
- MASTER FORMAT: 4K DCI Flat/Scope (4096x1716) @ 24.000 fps.
- CÓDEC DE ENTREGA: Apple ProRes 4444 XQ y DCP SMPTE D-Cinema con cifrado KDM.
- NIVELES DE AUDIO: Integrado R128 a -24.0 LUFS ±0.5 LUFS, True Peak máximo a -1.0 dBTP.`;

    case 'PRODUCTION_MANAGER':
      return `=======================================================
CRONOGRAMA DE PRODUCCIÓN & OPTIMIZACIÓN DE RECURSOS
=======================================================
- FASE 1 (Pre-producción completada): Storyboard, Biblia de Arte y Lentes unificados.
- FASE 2 (Generación IA): Renderizado secuencial de 4 planos clave.
- FASE 3 (Post-producción final): Montaje EDL, inserción de Score y Control de Calidad.`;

    case 'PIPELINE_TD':
      return `=======================================================
SISTEMA DE SINCRONIZACIÓN DE METADATOS & DEPENDENCIAS
=======================================================
- MAPEO DE DEPENDENCIAS:
  [Showrunner Bible] --> [Guion + Storyboard] --> [Art Bible + DoP] --> [VFX + Sonido]
- ESTADO DE INTEGRIDAD DE MEMORIA: 100% de consistencia entre paleta cromática de Arte y LUT del Colorista.`;

    case 'QC_SUPERVISOR':
      return `=======================================================
AUDITORÍA DE CONTROL DE CALIDAD (QC REPORT)
=======================================================
- ANOMALÍAS DETECTADAS: 0 artefactos críticos.
- CONSISTENCIA ANATÓMICA: 5 dedos por mano verificados en planos de Kael.
- CONTINUIDAD LUMÍNICA: Aprobada sin saltos de exposición entre cortes 01 y 02.
- ESTADO FINAL: CERTIFICADO PARA RENDERIZADO Y DISTRIBUCIÓN.`;

    default:
      return `[ENTREGABLE TÉCNICO OFICIAL - ${subagent.name.toUpperCase()}]
Departamento: ${subagent.layer}
Rol: ${subagent.role}
Objetivo: ${subagent.outputDescription}

Entregable formulado para "${title}":
El departamento ha procesado los requerimientos del proyecto considerando el estilo visual ${style}.
Todas las especificaciones técnicas han sido verificadas contra la memoria central compartida.`;
  }
}

// API: Orchestrate a subagent
app.post('/api/orchestrate', async (req: Request, res: Response) => {
  try {
    const { project, subagent, prompt, accumulatedMemories, useSimulation } = req.body;

    if (!project || !subagent) {
      return res.status(400).json({ error: 'Faltan parámetros requeridos (project, subagent)' });
    }

    const startTime = Date.now();

    // If simulation mode was selected or Gemini client is not initialized, use simulation engine
    if (useSimulation || !ai) {
      const content = generateSimulationContent(project, subagent, prompt);
      const latencyMs = Date.now() - startTime;
      const tokens = (prompt?.length || 0) + content.length / 4;
      const estimatedCost = 0.00015;

      return res.json({
        success: true,
        content,
        latencyMs: Math.max(latencyMs, 400),
        estimatedCost,
        mode: 'simulation',
      });
    }

    // Prepare system instructions and memory prompt for real Gemini execution
    const memoriesText = Array.isArray(accumulatedMemories) && accumulatedMemories.length > 0
      ? accumulatedMemories.map((m: { title: string; content: string }) => `--- [${m.title}] ---\n${m.content}`).join('\n\n')
      : '(No hay entregables previos en la memoria. Comienza la fase de arranque.)';

    const systemInstruction = `Eres un Agente Profesional de Inteligencia Artificial de Cine en el rol de: ${subagent.name} (${subagent.role}).
Perteneces al departamento de producción: ${subagent.layer}.
Tus obligaciones profesionales son:
${(subagent.duties || []).map((d: string) => ` - ${d}`).join('\n')}

DATOS DE LA PRODUCCIÓN:
- Título: "${project.title}"
- Género: ${project.genre || 'Drama'}
- Estilo Visual: ${project.artStyle || 'Cinemático'}
- Sinopsis / Idea: ${project.description || ''}
- Target: ${project.targetAudience || 'Público General'}

MEMORIA CENTRAL COMPARTIDA DEL PROYECTO:
${memoriesText}

REQUERIMIENTOS FORMALES:
- Entrada esperada: ${subagent.inputDescription || ''}
- Salida exigida: ${subagent.outputDescription || ''}
Redacta en ESPAÑOL con jerga y precisión cinematográfica profesional, estructurado con encabezados claros y sin preámbulos conversacionales.`;

    const userPrompt = prompt || subagent.suggestedPrompt || `Genera el entregable para ${subagent.name}`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: userPrompt,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const textOutput = response.text || '';
      const latencyMs = Date.now() - startTime;
      const tokens = (userPrompt.length + textOutput.length) / 4;
      const estimatedCost = (tokens * 0.000000075);

      return res.json({
        success: true,
        content: textOutput,
        latencyMs,
        estimatedCost,
        mode: 'gemini',
      });
    } catch (apiError: any) {
      console.warn('Gemini API call failed, falling back gracefully to high-res simulation content:', apiError?.message);
      // Resilient fallback to simulation output
      const content = generateSimulationContent(project, subagent, prompt);
      const latencyMs = Date.now() - startTime;
      return res.json({
        success: true,
        content,
        latencyMs,
        estimatedCost: 0.0001,
        mode: 'simulation_fallback',
        warning: `Gemini API devolvió: ${apiError?.message || 'Error de llamada'}. Se suministró resultado técnico de simulación L5.`,
      });
    }
  } catch (error: any) {
    console.error('Error in /api/orchestrate:', error);
    return res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
});

// API: Export package for external video providers
app.post('/api/export-package', (req: Request, res: Response) => {
  const { project, provider, characters, background, sound } = req.body;
  const targetProvider = provider || 'Runway Gen-3';

  const title = project?.title || 'Cortometraje';
  const style = project?.artStyle || 'Cinemático Ultra-Realista';
  const idea = project?.description || '';

  const scene1Prompt = `Cinematic wide aspect ratio 2.39:1, establishing shot. High detail, octane render, 8k resolution. ${idea}. ${style} style, moody lighting, lens flares, dramatic atmosphere. ${background ? `Environment: ${background}.` : ''} ${characters ? `Characters: ${characters}.` : ''}`;
  const scene2Prompt = `Close up, shallow depth of field, 2.39:1 aspect ratio. Subject expressing intense emotion facing the camera. ${style} style. Cinematic lighting, soft shadows, sharp focus on eyes. ${characters ? `Character details: ${characters}.` : ''}`;
  const audioDirective = sound || 'Atmósfera ambiental con viento grave a 60 bpm y cuerdas disonantes sutiles.';

  return res.json({
    success: true,
    provider: targetProvider,
    package: {
      title,
      style,
      targetEngine: targetProvider,
      prompts: [
        { scene: 1, type: 'ESTABLECIMIENTO (PLANO GENERAL)', prompt: scene1Prompt, durationSec: 4 },
        { scene: 2, type: 'ACCIÓN Y TENSIÓN (PRIMER PLANO)', prompt: scene2Prompt, durationSec: 3 },
      ],
      audioDirective,
      technicalSpecs: {
        aspectRatio: '2.39:1',
        resolution: '4K DCI',
        frameRate: '24fps',
        colorSpace: 'ACEScc Rec.709',
      },
    },
  });
});

// API: Health / config check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasGeminiApiKey: !!apiKey,
    service: 'Cine AI Studio Backend',
    timestamp: Date.now(),
  });
});

// Mounting Vite in development or static assets in production
async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎬 Cine AI Studio dev server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
