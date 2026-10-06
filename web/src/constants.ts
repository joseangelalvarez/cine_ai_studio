import type { ApiProviderConfig, VideoModelConfig } from './types';

// ─── Catálogo de proveedores — SOLO Google Gemini (decisión del usuario) ─────

export const API_PROVIDERS: ApiProviderConfig[] = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Único proveedor: orquestadores, Veo, Nano Banana y QA visual con una sola key de Google',
    priceInfo: 'Free tier disponible · ver pricing de Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com',
    defaultModel: 'gemini-3.8-flash',
    models: ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-flash-latest'],
    requiresKey: true,
    badge: 'Solo Google',
  },
];

export const VIDEO_MODEL_CATALOG: VideoModelConfig[] = [
  {
    id: 'wan-t2v',
    provider: 'wan',
    name: 'Wan2.2 T2V A14B',
    description: 'Texto a video con calidad cinematográfica',
    sourceUrl: 'https://huggingface.co/Wan-AI/Wan2.2-T2V-A14B',
    defaultModel: 'Wan-AI/Wan2.2-T2V-A14B',
    modelTags: ['text-to-video', 'cinematic'],
    availability: 'downloadable',
    requiresCredentials: true,
    estimatedSize: 'grande',
  },
  {
    id: 'wan-i2v',
    provider: 'wan',
    name: 'Wan2.2 I2V A14B',
    description: 'Imagen a video para animar storyboards',
    sourceUrl: 'https://huggingface.co/Wan-AI/Wan2.2-I2V-A14B',
    defaultModel: 'Wan-AI/Wan2.2-I2V-A14B',
    modelTags: ['image-to-video'],
    availability: 'downloadable',
    requiresCredentials: true,
    estimatedSize: 'grande',
  },
  {
    id: 'wan-animate',
    provider: 'wan',
    name: 'Wan2.2 Animate 14B',
    description: 'Video-to-video para controlar movimientos',
    sourceUrl: 'https://huggingface.co/Wan-AI/Wan2.2-Animate-14B',
    defaultModel: 'Wan-AI/Wan2.2-Animate-14B',
    modelTags: ['video-to-video'],
    availability: 'downloadable',
    requiresCredentials: true,
    estimatedSize: 'muy grande',
  },
  {
    id: 'ltx-23',
    provider: 'ltx',
    name: 'LTX 2.3',
    description: 'Image-to-video con enfoque creativo',
    sourceUrl: 'https://huggingface.co/Lightricks/LTX-2.3',
    defaultModel: 'Lightricks/LTX-2.3',
    modelTags: ['image-to-video'],
    availability: 'downloadable',
    requiresCredentials: true,
    estimatedSize: 'grande',
  },
  {
    id: 'ltx-23-diffusers',
    provider: 'ltx',
    name: 'LTX 2.3 Diffusers',
    description: 'Variante para integración diffusers',
    sourceUrl: 'https://huggingface.co/collections/Lightricks/ltx-23-diffusers',
    defaultModel: 'Lightricks/LTX-2.3-I2V-A14B-Diffusers',
    modelTags: ['diffusers', 'image-to-video'],
    availability: 'downloadable',
    requiresCredentials: true,
    estimatedSize: 'grande',
  },
  {
    id: 'animatediff-local',
    provider: 'animatediff',
    name: 'AnimateDiff Local',
    description: 'Workflow local con nodos/frames de continuidad',
    sourceUrl: 'https://github.com/guoyww/AnimateDiff',
    defaultModel: 'animatediff-local',
    modelTags: ['local', 'motion-control'],
    availability: 'ready',
    requiresCredentials: false,
    estimatedSize: 'local',
  },
  {
    id: 'ollama-local',
    provider: 'ollama',
    name: 'Ollama Local',
    description: 'Modo local para usuarios no técnicos',
    sourceUrl: 'https://ollama.com',
    defaultModel: 'mistral',
    modelTags: ['local', 'assistant'],
    availability: 'ready',
    requiresCredentials: false,
    estimatedSize: 'local',
  },
];

export const DURATION_OPTIONS = ['1 minuto', '2 minutos', '3 minutos', '5 minutos', '10 minutos', '15 minutos'];

export const ART_STYLE_OPTIONS = [
  'Cinemático Ultra-Realista',
  'Animación 2D Clásica',
  'Anime',
  'Stop Motion',
  'Pixel Art Retro',
  'Documental',
  'Experimental / Abstracto',
  'Noir Oscuro',
  'Sci-Fi Cyberpunk',
  'Fantasy Épico',
];

// ─── Catálogos por rol de producción (Plan multi-rol) ─────────────────────────

import type { RoleConfig } from './types';

export interface RenderProviderConfig {
  id: string;
  name: string;
  description: string;
  priceInfo: string;
  models: string[];
  /** Proveedor cuya API key se necesita ('gemini' | 'glm' | 'openai' | null = local, sin key). */
  keyProvider: string | null;
  cloud: boolean;
}

/** Motores de render de video (rol videoRender) — cloud de Google + locales. */
export const VIDEO_RENDER_PROVIDERS: RenderProviderConfig[] = [
  { id: 'animatediff', name: 'AnimateDiff (local)', description: 'Control fino de movimiento y continuidad, sin coste', priceInfo: 'GRATIS · local', models: ['animatediff-local'], keyProvider: null, cloud: false },
  { id: 'veo', name: 'Google Veo 3.1', description: 'Clips de 8s con audio nativo · 720p–4K · imagen→video (3 refs)', priceInfo: 'De pago por segundo de video (ver pricing Gemini)', models: ['veo-3.1-generate-preview'], keyProvider: 'gemini', cloud: true },
  { id: 'omni-flash', name: 'Gemini Omni Flash', description: 'Generación de video Gemini · ID exacto vía «Descubrir modelos»', priceInfo: 'Ver pricing Gemini', models: [], keyProvider: 'gemini', cloud: true },
  { id: 'wan', name: 'Wan2.2 (local/HF)', description: 'T2V / I2V / Animate con descarga desde Hugging Face', priceInfo: 'GRATIS · local (requiere token HF)', models: ['wan-t2v', 'wan-i2v', 'wan-animate'], keyProvider: null, cloud: false },
  { id: 'ltx', name: 'LTX 2.3 (local/HF)', description: 'Lightricks con estilo cinematográfico', priceInfo: 'GRATIS · local (requiere token HF)', models: ['ltx-23', 'ltx-23-diffusers'], keyProvider: null, cloud: false },
  { id: 'ollama', name: 'Modo local fácil', description: 'Ollama simplificado para usuarios no técnicos', priceInfo: 'GRATIS · local', models: ['ollama-local'], keyProvider: null, cloud: false },
];

/** Motores de render de personajes / imágenes (rol characterRender) — solo Google. */
export const CHARACTER_RENDER_PROVIDERS: RenderProviderConfig[] = [
  { id: 'nano-banana', name: 'Nano Banana (Gemini)', description: 'gemini-3.1-flash-image · generación y edición con consistencia de personajes', priceInfo: 'Por imagen (ver pricing Gemini)', models: ['gemini-3.1-flash-image'], keyProvider: 'gemini', cloud: true },
];

/** Juez del QA visual (rol visualQA) — multimodal, solo Google. */
export const QA_JUDGE_PROVIDERS: { id: string; name: string; models: string[] }[] = [
  { id: 'gemini', name: 'Gemini (video input nativo)', models: ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-flash-latest'] },
];

/** Asignación por defecto de los roles — todo con la API de Google (decisión del usuario). */
export const DEFAULT_ROLES: RoleConfig = {
  orchestrator: {
    premium: { provider: 'gemini', model: 'gemini-3.8-flash' },
    standard: { provider: 'gemini', model: 'gemini-3.7-flash' },
    economy: { provider: 'gemini', model: 'gemini-flash-latest' },
  },
  videoRender: { provider: 'animatediff', model: 'animatediff-local' },
  characterRender: { provider: 'nano-banana', model: 'gemini-3.1-flash-image' },
  visualQA: { provider: 'gemini', model: 'gemini-3.8-flash' },
};
