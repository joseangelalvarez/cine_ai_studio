// ─── Motores de render en la nube (Plan multi-rol) ────────────────────────────
// Veo 3.1 (Gemini API, flujo oficial: predictLongRunning → poll → descarga)
// Nano Banana (generateContent con responseModalities IMAGE)
// Zero-dependency: fetch nativo + utilidades compartidas de visual-qa.mjs.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchWithTimeout, sleep } from './visual-qa.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GEMINI_BASE = 'https://generativelanguage.googleapis.com';
const MODEL_DIR = path.join(path.resolve(__dirname, '..'), '.cineai', 'video-models');

/** Busca recursivamente el primer .uri de video en la respuesta de la operación. */
function findVideoUri(node, depth = 0) {
  if (!node || typeof node !== 'object' || depth > 8) return null;
  if (typeof node.uri === 'string' && /^https?:/.test(node.uri)) return node.uri;
  for (const value of Object.values(node)) {
    const found = findVideoUri(value, depth + 1);
    if (found) return found;
  }
  return null;
}

/**
 * Veo 3.1: lanza la generación (operación de larga duración), hace poll cada 10s
 * (patrón de la doc oficial) y descarga el MP4 para servirlo por /output/.
 */
export async function renderWithVeo(apiKey, { model = 'veo-3.1-generate-preview', prompt, aspectRatio = '16:9', negativePrompt, onProgress } = {}) {
  const body = {
    instances: [{ prompt }],
    parameters: { aspectRatio },
  };
  if (negativePrompt) body.parameters.negativePrompt = negativePrompt;

  onProgress?.(5, `Enviando trabajo a ${model}...`);
  const start = await fetchWithTimeout(`${GEMINI_BASE}/v1beta/models/${model}:predictLongRunning?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }, 60000);

  if (!start.ok) {
    throw new Error(`Veo ${start.status}: ${await start.text()}`);
  }
  const operation = await start.json();
  if (!operation?.name) throw new Error('Veo no devolvió el nombre de la operación');

  // Poll de la operación (deadline 10 min, cada 10s como en la doc oficial).
  const deadline = Date.now() + 600000;
  while (Date.now() < deadline) {
    const check = await fetchWithTimeout(`${GEMINI_BASE}/v1beta/${operation.name}?key=${apiKey}`, {}, 30000);
    if (!check.ok) throw new Error(`Veo poll ${check.status}: ${await check.text()}`);
    const op = await check.json();
    if (op.done) {
      if (op.error) throw new Error(`Veo: ${op.error.message ?? JSON.stringify(op.error)}`);
      const videoUri = findVideoUri(op.response);
      if (!videoUri) throw new Error('Veo completó pero no se encontró la URI del video en la respuesta');
      onProgress?.(85, 'Descargando video generado...');

      const downloadRes = await fetchWithTimeout(`${videoUri}${videoUri.includes('?') ? '&' : '?'}key=${apiKey}`, {}, 300000);
      if (!downloadRes.ok) throw new Error(`Descarga Veo ${downloadRes.status}`);
      const buffer = Buffer.from(await downloadRes.arrayBuffer());

      const outputDir = path.join(MODEL_DIR, `veo_${Date.now()}`);
      await fs.mkdir(outputDir, { recursive: true });
      const diskPath = path.join(outputDir, 'video.mp4');
      await fs.writeFile(diskPath, buffer);
      await fs.writeFile(path.join(outputDir, 'metadata.json'), JSON.stringify({
        engine: 'veo', model, prompt, aspectRatio, generatedAt: new Date().toISOString(),
      }, null, 2), 'utf8');
      onProgress?.(100, 'Video de Veo listo');
      return { diskPath, model };
    }
    onProgress?.(45, 'Veo generando el clip (suele tardar 1-3 min)...');
    await sleep(10000);
  }
  throw new Error('Timeout esperando la operación de Veo');
}

/**
 * Nano Banana (imágenes de personajes): generateContent con responseModalities IMAGE.
 * Devuelve el PNG guardado en MODEL_DIR/characters/ para servirlo por /output/.
 */
export async function generateCharacterImageGemini(apiKey, { model = 'gemini-3.1-flash-image', prompt } = {}) {
  const res = await fetchWithTimeout(`${GEMINI_BASE}/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['IMAGE'] },
    }),
  }, 120000);

  if (!res.ok) throw new Error(`Nano Banana ${res.status}: ${await res.text()}`);
  const data = await res.json();

  const parts = data.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((p) => p.inlineData?.data || p.inline_data?.data);
  if (!imagePart) {
    throw new Error('La respuesta no incluyó imagen (¿el modelo soporta responseModalities IMAGE?)');
  }
  const inline = imagePart.inlineData ?? imagePart.inline_data;
  const ext = (inline.mimeType ?? inline.mime_type ?? 'image/png').includes('jpeg') ? 'jpg' : 'png';

  const dir = path.join(MODEL_DIR, 'characters');
  await fs.mkdir(dir, { recursive: true });
  const diskPath = path.join(dir, `character_${Date.now()}.${ext}`);
  await fs.writeFile(diskPath, Buffer.from(inline.data, 'base64'));
  return { diskPath, mimeType: inline.mimeType ?? inline.mime_type };
}
