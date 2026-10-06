import type { MovieProject, ProjectMemory, ApiKeySettings, VideoWorkflowSettings, VideoWorkflowKind, VideoModelInventoryItem } from './types';
import { API_PROVIDERS, DEFAULT_ROLES } from './constants';

const DB_PREFIX = 'cineai_';

// ─── Projects (IndexedDB-like via JSON in localStorage) ──────────────────────

export function loadProjects(): MovieProject[] {
  try {
    return JSON.parse(localStorage.getItem(`${DB_PREFIX}projects`) ?? '[]');
  } catch {
    return [];
  }
}

export function saveProjects(projects: MovieProject[]): void {
  localStorage.setItem(`${DB_PREFIX}projects`, JSON.stringify(projects));
}

export function nextProjectId(projects: MovieProject[]): number {
  return projects.length === 0 ? 1 : Math.max(...projects.map((p) => p.id)) + 1;
}

// ─── Memories ────────────────────────────────────────────────────────────────

export function loadMemories(): ProjectMemory[] {
  try {
    return JSON.parse(localStorage.getItem(`${DB_PREFIX}memories`) ?? '[]');
  } catch {
    return [];
  }
}

export function saveMemories(memories: ProjectMemory[]): void {
  localStorage.setItem(`${DB_PREFIX}memories`, JSON.stringify(memories));
}

export function nextMemoryId(memories: ProjectMemory[]): number {
  return memories.length === 0 ? 1 : Math.max(...memories.map((m) => m.id)) + 1;
}

// ─── API Key settings ─────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: ApiKeySettings = {
  selectedProvider: 'gemini',
  apiKeys: {},
  useSecureBackend: false,
  selectedModels: {},
  roles: DEFAULT_ROLES,
  roleOverrides: {},
};

const DEFAULT_VIDEO_WORKFLOWS: VideoWorkflowSettings = {
  selectedWorkflow: 'animatediff',
  selectedModelByWorkflow: {},
  installedModels: [],
  huggingFace: { token: '' },
};

export function loadApiSettings(): ApiKeySettings {
  try {
    const stored = localStorage.getItem(`${DB_PREFIX}api_settings`);
    if (!stored) return DEFAULT_SETTINGS;
    const parsed = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } as ApiKeySettings;

    // Migración multi-rol: sembrar defaults si venían de una versión anterior
    // y hacer merge profundo para conservar lo que el usuario personalizó.
    parsed.roles = {
      orchestrator: { ...DEFAULT_ROLES.orchestrator, ...(parsed.roles?.orchestrator ?? {}) },
      videoRender: parsed.roles?.videoRender ?? DEFAULT_ROLES.videoRender,
      characterRender: parsed.roles?.characterRender ?? DEFAULT_ROLES.characterRender,
      visualQA: parsed.roles?.visualQA ?? DEFAULT_ROLES.visualQA,
    };
    parsed.roleOverrides = parsed.roleOverrides ?? {};

    // Sanitizar modelos persistidos que ya no existen en el catálogo (p. ej. IDs de Gemini
    // retirados como 'gemini-3.5-flash-latest') para no heredar errores 404 de la API.
    const validModels = new Map(API_PROVIDERS.map((p) => [p.id, new Set(p.models)]));
    for (const [providerId, model] of Object.entries(parsed.selectedModels ?? {})) {
      const allowed = validModels.get(providerId as ApiKeySettings['selectedProvider']);
      if (typeof model === 'string' && allowed && !allowed.has(model)) {
        delete parsed.selectedModels[providerId as keyof typeof parsed.selectedModels];
      }
    }
    return parsed;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveApiSettings(settings: ApiKeySettings): void {
  localStorage.setItem(`${DB_PREFIX}api_settings`, JSON.stringify(settings));
}

export function loadVideoWorkflowSettings(): VideoWorkflowSettings {
  try {
    const stored = localStorage.getItem(`${DB_PREFIX}video_workflows`);
    if (!stored) return DEFAULT_VIDEO_WORKFLOWS;
    const parsed = JSON.parse(stored) as Partial<VideoWorkflowSettings>;
    return {
      ...DEFAULT_VIDEO_WORKFLOWS,
      ...parsed,
      huggingFace: { ...DEFAULT_VIDEO_WORKFLOWS.huggingFace, ...parsed.huggingFace },
    };
  } catch {
    return DEFAULT_VIDEO_WORKFLOWS;
  }
}

export function saveVideoWorkflowSettings(settings: VideoWorkflowSettings): void {
  localStorage.setItem(`${DB_PREFIX}video_workflows`, JSON.stringify(settings));
}

export function saveHuggingFaceToken(token: string, username?: string): void {
  const current = loadVideoWorkflowSettings();
  current.huggingFace = { token, username, lastValidatedAt: Date.now() };
  saveVideoWorkflowSettings(current);
}

export function upsertVideoInventoryItem(item: VideoModelInventoryItem): void {
  const current = loadVideoWorkflowSettings();
  const index = current.installedModels.findIndex((existing) => existing.modelId === item.modelId && existing.provider === item.provider);
  if (index >= 0) current.installedModels[index] = item;
  else current.installedModels.push(item);
  saveVideoWorkflowSettings(current);
}

export function setSelectedVideoWorkflow(workflow: VideoWorkflowKind): void {
  const current = loadVideoWorkflowSettings();
  current.selectedWorkflow = workflow;
  saveVideoWorkflowSettings(current);
}

// ─── Per-project video settings ───────────────────────────────────────────────

export function loadProjectVideoSettings(projectId: number): import('./types').VideoGenerationSettings {
  const defaults: import('./types').VideoGenerationSettings = { width: 768, height: 432, steps: 20, guidance: 7.5, negativePrompt: 'blurry, low quality, watermark' };
  try {
    const raw = localStorage.getItem(`${DB_PREFIX}video_settings_${projectId}`);
    return raw ? { ...defaults, ...JSON.parse(raw) } : { ...defaults };
  } catch {
    return { ...defaults };
  }
}

export function saveProjectVideoSettings(projectId: number, settings: import('./types').VideoGenerationSettings): void {
  localStorage.setItem(`${DB_PREFIX}video_settings_${projectId}`, JSON.stringify({ ...settings, savedAt: Date.now() }));
}

// ─── Per-project generated shots ─────────────────────────────────────────────

export interface GeneratedShot {
  shotIndex: number;
  prompt: string;
  outputUrl: string;
  workflow: string;
  generatedAt: number;
}

export function loadGeneratedShots(projectId: number): GeneratedShot[] {
  try {
    const raw = localStorage.getItem(`${DB_PREFIX}shots_${projectId}`);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveGeneratedShot(projectId: number, shot: GeneratedShot): void {
  const shots = loadGeneratedShots(projectId).filter((s) => s.shotIndex !== shot.shotIndex);
  shots.push(shot);
  localStorage.setItem(`${DB_PREFIX}shots_${projectId}`, JSON.stringify(shots));
}

// ─── Credits ──────────────────────────────────────────────────────────────────

export function loadCredits(): number {
  return parseInt(localStorage.getItem(`${DB_PREFIX}credits`) ?? '100', 10);
}

export function saveCredits(credits: number): void {
  localStorage.setItem(`${DB_PREFIX}credits`, String(credits));
}
