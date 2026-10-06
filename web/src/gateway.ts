// ─── Gateway — SOLO Google Gemini (decisión del usuario) ─────────────────────

import type { ApiKeySettings } from './types';
import { DEFAULT_ROLES } from './constants';
import { getSubagentTier } from './subagents';

export interface AIRequestOptions {
  prompt: string;
  systemInstruction?: string;
  model?: string;
}

export interface AIResponse {
  text: string;
  estimatedCost: number;
  latencyMs: number;
}

const GEMINI_BASE = 'https://generativelanguage.googleapis.com';

async function callGemini(apiKey: string, model: string, opts: AIRequestOptions): Promise<string> {
  const body: Record<string, unknown> = {
    contents: [{ parts: [{ text: opts.prompt }] }],
    generationConfig: { temperature: 0.7 },
  };
  if (opts.systemInstruction) {
    body.systemInstruction = { parts: [{ text: opts.systemInstruction }] };
  }
  const url = `${GEMINI_BASE}/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) {
    const detail = await res.text();
    if (res.status === 404) {
      throw new Error(`Gemini 404: el modelo "${model}" no existe o fue retirado. Selecciona otro (p. ej. gemini-3.8-flash) en el panel 🎛️. Detalle: ${detail.slice(0, 200)}`);
    }
    if (res.status === 403 || res.status === 401) {
      throw new Error(`Gemini ${res.status}: API key inválida o sin permisos. Revisa tu key de Google en el panel 🎛️. Detalle: ${detail.slice(0, 200)}`);
    }
    if (res.status === 429) {
      throw new Error(`Gemini 429: límite de cuota alcanzado (espera un momento o revisa tu plan en ai.google.dev). Detalle: ${detail.slice(0, 200)}`);
    }
    throw new Error(`Gemini error ${res.status}: ${detail}`);
  }
  const data = await res.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
  if (!text) throw new Error('Gemini: respuesta vacía');
  return text;
}

export async function executeAIRequest(settings: ApiKeySettings, opts: AIRequestOptions): Promise<AIResponse> {
  const start = performance.now();
  const model = settings.selectedModels.gemini ?? 'gemini-3.8-flash';
  const apiKey = settings.apiKeys.gemini ?? '';

  if (!apiKey) {
    throw new Error('Falta tu API key de Google. Ábrela en el panel 🎛️ Configurador de producción y pega tu key de Gemini (aistudio.google.com → Get API key).');
  }

  const text = await callGemini(apiKey, opts.model ?? model, opts);

  const latencyMs = performance.now() - start;
  const tokens = (opts.prompt.length + text.length) / 4;
  const estimatedCost = tokens * 0.000000075; // aproximación Flash

  return { text, estimatedCost, latencyMs };
}

// ─── Enrutamiento por tier (override individual > tier heredado > default) ────

export function resolveAssignmentForSubagent(
  settings: ApiKeySettings,
  subagentKey: string,
): { provider: 'gemini'; model: string } {
  const override = settings.roleOverrides?.[subagentKey];
  const tier = getSubagentTier(subagentKey);
  const base = settings.roles?.orchestrator?.[tier] ?? DEFAULT_ROLES.orchestrator[tier];
  const chosen = override ?? base;
  return { provider: 'gemini', model: chosen.model };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Ejecuta la petición de un subagente con su modelo enrutado + 1 reintento ante 429/5xx. */
export async function executeSubagentRequest(
  settings: ApiKeySettings,
  subagentKey: string,
  opts: AIRequestOptions,
): Promise<AIResponse> {
  const { model } = resolveAssignmentForSubagent(settings, subagentKey);
  const effective: ApiKeySettings = {
    ...settings,
    selectedModels: { ...settings.selectedModels, gemini: model },
  };
  try {
    return await executeAIRequest(effective, opts);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/429|error 5\d\d/i.test(msg)) {
      await delay(3000);
      return executeAIRequest(effective, opts);
    }
    throw err;
  }
}

/** Descubridor de modelos: lista los IDs REALES disponibles con la key (anti-404). */
export async function listAvailableModels(apiKey: string): Promise<string[]> {
  const res = await fetch(`${GEMINI_BASE}/v1beta/models?pageSize=200&key=${encodeURIComponent(apiKey)}`);
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const data = await res.json() as { models?: { name?: string }[] };
  return (data.models ?? [])
    .map((m) => (m.name ?? '').replace(/^models\//, ''))
    .filter(Boolean);
}

// ─── Connection test ───────────────────────────────────────────────────────────

export async function testConnection(settings: ApiKeySettings): Promise<string> {
  const result = await executeAIRequest(settings, {
    prompt: 'Responde únicamente con "OK" en una sola palabra.',
    systemInstruction: 'Eres un asistente de prueba de conexión.',
  });
  return result.text;
}