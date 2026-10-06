// ─── Visual QA engine (juez Gemini) — Plan v3.1 ───────────────────────────────
// Módulo zero-dependency: solo fetch nativo (Node 18+). El juez siempre corre
// server-side; la API key jamás viaja al navegador.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(path.resolve(__dirname, '..'), '.cineai');

const GEMINI_BASE = 'https://generativelanguage.googleapis.com';
const QA_BASE_NEGATIVES = ['flickering', 'sudden morphing', 'limb mutations', 'freezing frames', 'temporal inconsistency'];
const MAX_QA_VIDEO_BYTES = 100 * 1024 * 1024; // guard: QA de clips, no de películas

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// F14/M1. Carga lazy (solo si el QA está activado): env → .cineai/gemini-key.txt → .env raíz.
// Detecta el placeholder MY_GEMINI_API_KEY de .env.example y lo rechaza.
async function loadGeminiKey() {
  const clean = (value) => value.trim().replace(/^['"]|['"]$/g, '');
  const envKey = clean(process.env.GEMINI_API_KEY ?? '');
  if (envKey && !envKey.startsWith('MY_')) return envKey;

  const keyFile = path.join(DATA_DIR, 'gemini-key.txt');
  const fileKey = clean(await fs.readFile(keyFile, 'utf8').catch(() => ''));
  if (fileKey && !fileKey.startsWith('MY_')) return fileKey;

  const envPath = path.resolve(__dirname, '..', '..', '.env'); // web/helper → raíz del proyecto
  const envRaw = await fs.readFile(envPath, 'utf8').catch(() => '');
  const match = envRaw.match(/^GEMINI_API_KEY\s*=\s*(.+)$/m);
  const dotEnvKey = match ? clean(match[1]) : '';
  if (dotEnvKey && !dotEnvKey.startsWith('MY_')) return dotEnvKey;

  throw new Error('Falta la API key de Gemini. Configúrala como GEMINI_API_KEY en el .env de la raíz o ejecuta: node helper/video-helper.mjs save-gemini-key \'{"key":"..."}\'');
}

async function saveGeminiKey(key) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(path.join(DATA_DIR, 'gemini-key.txt'), String(key).trim(), 'utf8');
  return { saved: true };
}

// C7. Toda llamada saliente lleva AbortController con timeout.
export async function fetchWithTimeout(url, options = {}, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// C1/F1/F2. Subida resumable oficial (init con metadata → bytes → poll hasta ACTIVE).
async function uploadVideoToGemini(apiKey, videoPath) {
  const stats = await fs.stat(videoPath);
  if (stats.size > MAX_QA_VIDEO_BYTES) {
    throw new Error(`El clip supera el límite de ${Math.round(MAX_QA_VIDEO_BYTES / 1024 / 1024)}MB para auditoría visual`);
  }

  const initResponse = await fetchWithTimeout(`${GEMINI_BASE}/upload/v1beta/files?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'X-Goog-Upload-Protocol': 'resumable',
      'X-Goog-Upload-Command': 'start',
      'X-Goog-Upload-Header-Content-Length': String(stats.size),
      'X-Goog-Upload-Header-Content-Type': 'video/mp4',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ file: { display_name: path.basename(videoPath) } }), // C2: REST usa snake_case
  }, 30000);

  if (!initResponse.ok) {
    throw new Error(`Error iniciando subida a Gemini: ${initResponse.status} ${await initResponse.text()}`);
  }
  const uploadUrl = initResponse.headers.get('x-goog-upload-url');
  if (!uploadUrl) throw new Error('No se recibió la URL de subida resumable de Gemini');

  const buffer = await fs.readFile(videoPath);
  const uploadResponse = await fetchWithTimeout(uploadUrl, {
    method: 'POST',
    headers: {
      'X-Goog-Upload-Offset': '0',
      'X-Goog-Upload-Command': 'upload, finalize',
      'Content-Length': String(stats.size),
    },
    body: new Uint8Array(buffer),
  }, 300000);

  if (!uploadResponse.ok) {
    throw new Error(`Error transmitiendo el clip a Gemini: ${uploadResponse.status} ${await uploadResponse.text()}`);
  }

  const fileInfo = await uploadResponse.json();
  const fileUri = fileInfo?.file?.uri;
  const fileId = fileInfo?.file?.name; // formato "files/xxxx"
  if (!fileUri || !fileId) throw new Error('Respuesta inesperada de la Files API de Gemini');

  // F2. Poll hasta ACTIVE (deadline 120s, backoff 2s→5s, FAILED manejado).
  const deadline = Date.now() + 120000;
  let delay = 2000;
  while (Date.now() < deadline) {
    const check = await fetchWithTimeout(`${GEMINI_BASE}/v1beta/${fileId}?key=${apiKey}`, {}, 20000);
    if (!check.ok) throw new Error(`Fallo verificando estado del archivo: ${check.status}`);
    const data = await check.json();
    if (data.state === 'ACTIVE') return { fileUri, fileId };
    if (data.state === 'FAILED') throw new Error('Gemini no pudo procesar el contenedor de video');
    await sleep(delay);
    delay = Math.min(delay + 1000, 5000);
  }
  throw new Error('Timeout esperando el procesamiento del video en Gemini');
}

// F4. Extracción defensiva de JSON con validación de esquema y valores por defecto.
function extractJsonSafe(rawText) {
  const fallback = {
    approved: false,
    criticism: 'No se pudo interpretar el veredicto estructurado del juez visual.',
    suggestedPromptRefinement: '',
    suggestedNegativeTerms: [],
  };
  try {
    const cleaned = String(rawText).replace(/```json\s*|```/gi, '').trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end <= start) return fallback;
    const parsed = JSON.parse(cleaned.slice(start, end + 1));
    return {
      approved: typeof parsed.approved === 'boolean' ? parsed.approved : false,
      criticism: typeof parsed.criticism === 'string' && parsed.criticism.trim() ? parsed.criticism : fallback.criticism,
      suggestedPromptRefinement: typeof parsed.suggestedPromptRefinement === 'string' ? parsed.suggestedPromptRefinement : '',
      suggestedNegativeTerms: Array.isArray(parsed.suggestedNegativeTerms)
        ? parsed.suggestedNegativeTerms.map((t) => String(t)).filter(Boolean)
        : [],
    };
  } catch {
    return fallback;
  }
}

export function splitPromptTerms(negativePrompt) {
  return String(negativePrompt ?? '')
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
}

// F9/M3. Composición: prompt base SIEMPRE + refinamientos acumulados con dedupe (nunca reemplazo).
export function composePrompt(basePrompt, refinements) {
  const seen = new Set();
  const extras = [];
  for (const refinement of refinements) {
    for (const phrase of String(refinement).split(/[.,;]\s*/)) {
      const clean = phrase.trim();
      const key = clean.toLowerCase();
      if (clean && !seen.has(key)) {
        seen.add(key);
        extras.push(clean);
      }
    }
  }
  return extras.length ? `${basePrompt}. Reinforce: ${extras.join(', ')}` : basePrompt;
}

// F3/F5/C6/C7/C8/M4/F11. Juez visual Gemini: part de video primero, texto al final.
// Devuelve QAResult, o null cuando la respuesta fue bloqueada por seguridad (→ skipped, no falso rechazo).
async function geminiVisualQA(apiKey, videoPath, originalPrompt, qaConfig = {}) {
  const modelId = qaConfig.model || 'gemini-3.8-flash';
  let uploaded = null;
  try {
    uploaded = await uploadVideoToGemini(apiKey, videoPath);

    const payload = {
      contents: [{
        parts: [
          { fileData: { fileUri: uploaded.fileUri, mimeType: 'video/mp4' } },
          { text: `Actúa como un Director de Control de Calidad Visual de Cine IA.
Analiza este clip de video generado. El prompt original del guionista era: "${originalPrompt}".

Evalúa si el video tiene fallas catastróficas: parpadeos extremos, mutaciones de extremidades, pérdida total de estilo, congelamientos.
Responde ESTRICTAMENTE en formato JSON válido con esta estructura:
{
  "approved": false,
  "criticism": "Explicación breve del fallo detectado",
  "suggestedPromptRefinement": "Corrección en inglés con descriptores visuales POSITIVOS (sin nombrar el defecto) optimizada para Wan2.2/LTX/AnimateDiff: consistencia, iluminación, estabilidad temporal",
  "suggestedNegativeTerms": ["términos negativos cortos en inglés"]
}
Si el video es físicamente consistente y respeta el prompt original, responde exactamente con "approved": true.` },
        ],
      }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    };

    // C6: mediaResolution SOLO existe en Gemini 3 (y su alias gemini-flash-latest); valor minúscula ('low' ≡ 'medium' a 70 tokens/frame en video).
    if (/^(gemini-3|gemini-flash)/.test(modelId)) {
      payload.generationConfig.mediaResolution = 'low';
    }

    const generateUrl = `${GEMINI_BASE}/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

    // M4: un reintento ante 429/5xx antes de rendirse.
    let response = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      response = await fetchWithTimeout(generateUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }, 120000);
      if (response.ok) break;
      const retriable = response.status === 429 || response.status >= 500;
      if (!retriable || attempt === 1) {
        throw new Error(`Gemini generateContent ${response.status}: ${await response.text()}`);
      }
      await sleep(3000);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const blocked = data.promptFeedback?.blockReason || candidate?.finishReason === 'SAFETY';
    if (!candidate || blocked) return null; // C8

    const rawText = candidate.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
    return extractJsonSafe(rawText);
  } finally {
    // F11: liberar la cuota SIEMPRE, incluso si generateContent falló.
    if (uploaded?.fileId) {
      await fetchWithTimeout(`${GEMINI_BASE}/v1beta/${uploaded.fileId}?key=${apiKey}`, { method: 'DELETE' }, 20000)
        .catch((err) => console.error('[QA] No se pudo liberar el archivo en Gemini:', err?.message ?? err));
    }
  }
}

export { loadGeminiKey, saveGeminiKey, geminiVisualQA, QA_BASE_NEGATIVES };

