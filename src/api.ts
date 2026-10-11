import { MovieProject, CinemaSubagent, ProjectMemory, ProviderSettings, VideoJob, GeneratedImage, MediaAsset } from './types';
import { StorageService } from './storage';

export interface ServerConfigResponse {
  success: boolean;
  config: any;
  availability: {
    google: boolean;
    openai: boolean;
    anthropic: boolean;
  };
}

export interface OrchestrationResponse {
  success: boolean;
  content: string;
  latencyMs: number;
  estimatedCost: number;
  mode?: string;
  provider?: string;
  model?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  error?: string;
  warning?: string;
}

export async function fetchServerConfigApi(): Promise<ServerConfigResponse> {
  const res = await fetch('/api/config');
  if (!res.ok) {
    throw new Error('Error al obtener la configuración del servidor');
  }
  return await res.json();
}

export async function orchestrateSubagentApi(
  project: MovieProject,
  subagent: CinemaSubagent,
  prompt: string,
  accumulatedMemories: ProjectMemory[],
  _useSimulation?: boolean,
  providerSettings?: ProviderSettings
): Promise<OrchestrationResponse> {
  try {
    const res = await fetch('/api/orchestrate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        project,
        subagent,
        prompt,
        accumulatedMemories,
        providerSettings,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: 'Error del servidor' }));
      throw new Error(errData.error || `HTTP ${res.status}`);
    }

    return await res.json();
  } catch (error: any) {
    console.error('[API orchestrateSubagentApi] Error:', error);
    throw error;
  }
}

export async function compilePromptsApi(
  project: MovieProject,
  memories: ProjectMemory[]
): Promise<{ success: boolean; compiled: any }> {
  const res = await fetch('/api/prompts/compile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project, memories }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al compilar prompts' }));
    throw new Error(err.error || 'Fallo al compilar prompts');
  }
  return await res.json();
}

export async function generateImageApi(
  projectId: number,
  subagentKey: string,
  title: string,
  prompt: string,
  providerSettings: ProviderSettings,
  options?: { role?: string; style?: string }
): Promise<{ success: boolean; image: GeneratedImage; error?: string }> {
  const stored = StorageService.getProviderSettings();
  const effectiveGeminiKey = (providerSettings.geminiApiKey || stored.geminiApiKey || '').trim();
  const effectiveOpenaiKey = (providerSettings.openaiApiKey || stored.openaiApiKey || '').trim();

  const chosenKey =
    providerSettings.imageProvider === 'openai-dalle'
      ? effectiveOpenaiKey
      : effectiveGeminiKey;

  const res = await fetch('/api/generate-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      projectId,
      subagentKey,
      title,
      prompt,
      provider: providerSettings.imageProvider === 'openai-dalle' ? 'openai' : 'google',
      model: providerSettings.imageModel,
      role: options?.role,
      style: options?.style,
      apiKey: chosenKey,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al generar imagen' }));
    throw new Error(err.error || 'Error al generar imagen');
  }

  const data = await res.json();
  // Also register in persistent assets
  if (data.image) {
    StorageService.saveAsset({
      id: data.image.id,
      projectId,
      type: 'image',
      role: options?.role || subagentKey,
      title: title || 'Imagen de Producción',
      url: data.image.url || data.image.imageUrl,
      prompt,
      provider: data.image.provider || 'Google Imagen',
      model: data.image.model || 'imagen-3.0-generate-002',
      createdAt: data.image.createdAt || Date.now(),
    });
  }

  return data;
}

export async function generateAudioApi(
  projectId: number,
  text: string,
  voice: string,
  providerSettings: ProviderSettings
): Promise<{ success: boolean; audio: any }> {
  const res = await fetch('/api/generate-audio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectId,
      text,
      voice,
      provider: providerSettings.textProvider === 'openai' ? 'openai' : 'google',
      apiKey: providerSettings.textProvider === 'openai' ? providerSettings.openaiApiKey : providerSettings.geminiApiKey,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al sintetizar audio' }));
    throw new Error(err.error || 'Error al sintetizar audio');
  }

  const data = await res.json();
  if (data.audio) {
    StorageService.saveAsset({
      id: data.audio.id,
      projectId,
      type: 'audio',
      title: 'Pista de Diálogo / Foley',
      url: data.audio.url,
      prompt: text,
      provider: data.audio.provider,
      model: data.audio.model,
      createdAt: data.audio.createdAt,
    });
  }
  return data;
}

export async function generateMusicApi(
  projectId: number,
  prompt: string,
  providerSettings: ProviderSettings
): Promise<{ success: boolean; music: any }> {
  const res = await fetch('/api/generate-music', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectId,
      prompt,
      apiKey: providerSettings.geminiApiKey,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al generar música' }));
    throw new Error(err.error || 'Error al generar música');
  }

  const data = await res.json();
  if (data.music) {
    StorageService.saveAsset({
      id: data.music.id,
      projectId,
      type: 'music',
      title: 'Tema Musical Principal',
      url: data.music.url,
      prompt,
      provider: data.music.provider,
      model: data.music.model,
      createdAt: data.music.createdAt,
    });
  }
  return data;
}

export async function startVideoJobApi(
  projectId: number,
  sceneNumber: number,
  title: string,
  prompt: string,
  durationSec: number,
  providerSettings: ProviderSettings
): Promise<{ success: boolean; job: VideoJob }> {
  const res = await fetch('/api/video/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectId,
      sceneNumber,
      title,
      prompt,
      durationSec,
      apiKey: providerSettings.geminiApiKey,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al iniciar render de video' }));
    throw new Error(err.error || 'Error al iniciar render de video');
  }

  return await res.json();
}

export async function checkVideoJobStatusApi(jobId: string): Promise<{ success: boolean; job: VideoJob }> {
  const res = await fetch(`/api/video/status/${encodeURIComponent(jobId)}`);
  if (!res.ok) {
    throw new Error('Error al consultar estado del video');
  }
  return await res.json();
}

export async function synthesizeImagePromptApi(params: {
  project: MovieProject;
  role: string;
  characterDirectives: string;
  environmentDirectives: string;
  artDirectives: string;
  cameraDirectives: string;
  scriptDirectives?: string;
}): Promise<{ success: boolean; prompt: string; error?: string }> {
  const res = await fetch('/api/prompts/compile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project: params.project }),
  });
  if (!res.ok) {
    return {
      success: true,
      prompt: `Retrato cinematográfico fotorrealista para "${params.project.title}". Sujeto: ${params.characterDirectives}. Entorno: ${params.environmentDirectives}. Estilo: ${params.artDirectives}. Óptica: ${params.cameraDirectives}.`,
    };
  }
  const data = await res.json();
  return {
    success: true,
    prompt: data.compiled?.imagePrompt || `${params.project.title} - ${params.characterDirectives}`,
  };
}

export async function synthesizePromptWithEngineerApi(params: {
  project: MovieProject;
  modality: 'image' | 'video' | 'audio' | 'music';
  subType?: string;
  characterDirectives?: string;
  environmentDirectives?: string;
  artDirectives?: string;
  cameraDirectives?: string;
  soundDirectives?: string;
  musicDirectives?: string;
  scriptDirectives?: string;
  customNotes?: string;
  providerSettings?: ProviderSettings;
}): Promise<{ success: boolean; prompt: string; modality: string; mode?: string; error?: string }> {
  const res = await fetch('/api/prompts/compile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project: params.project }),
  });
  if (res.ok) {
    const data = await res.json();
    if (params.modality === 'video') {
      return { success: true, prompt: data.compiled?.seedanceVideoPrompt || data.compiled?.veoVideoPrompt, modality: 'video' };
    }
    if (params.modality === 'audio') {
      return { success: true, prompt: data.compiled?.audioPrompt, modality: 'audio' };
    }
    if (params.modality === 'music') {
      return { success: true, prompt: data.compiled?.musicPrompt, modality: 'music' };
    }
    return { success: true, prompt: data.compiled?.imagePrompt, modality: 'image' };
  }
  return {
    success: true,
    prompt: `Master cinematographic prompt for ${params.project.title}. 8K resolution, 2.39:1 scope.`,
    modality: params.modality,
  };
}

