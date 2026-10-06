import type { VideoWorkflowKind, QARequestConfig } from './types';

export interface WorkflowDetection {
  animatediff?: { installed: boolean; version: string | null; command?: string };
  ollama?: { installed: boolean; version: string | null; command?: string };
  wan?: { installed: boolean; version: string | null; note?: string };
  ltx?: { installed: boolean; version: string | null; note?: string };
}

export interface GenerateVideoRequest {
  workflow: VideoWorkflowKind;
  prompt: string;
  negativePrompt?: string;
  qa?: QARequestConfig;
  /** Modelo concreto para motores cloud (rol videoRender). */
  model?: string;
  settings?: {
    width?: number;
    height?: number;
    steps?: number;
    guidance?: number;
    seed?: number;
  };
}

export interface GenerateVideoResult {
  success: boolean;
  outputPath?: string;
  stdout?: string;
  error?: string;
}

export interface GenerationProgress {
  active: boolean;
  workflow?: string;
  prompt?: string;
  status: 'idle' | 'starting' | 'generating' | 'auditing' | 'completed' | 'error';
  percent: number;
  startedAt?: number;
  message?: string;
  outputPath?: string | null;
  // ── Visual QA (Plan v3.1) ──
  attempt?: number;
  maxAttempts?: number;
  qaStatus?: 'disabled' | 'pending' | 'approved' | 'rejected' | 'skipped';
  qaCriticism?: string;
}

async function requestJson<T = any>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const url = new URL(`http://127.0.0.1:8787${endpoint}`);
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Helper error: ${response.status} ${text}`);
  }
  return response.json();
}

export async function detectWorkflows(): Promise<WorkflowDetection> {
  try {
    return await requestJson('/workflows/detect');
  } catch {
    return {};
  }
}

export async function generateVideo(req: GenerateVideoRequest): Promise<GenerateVideoResult> {
  try {
    const response = await fetch('http://127.0.0.1:8787/workflows/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    if (!response.ok) {
      const text = await response.text();
      return { success: false, error: `Helper error: ${response.status} ${text}` };
    }
    const data = await response.json();
    return { success: data.ok ?? false, error: data.error };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function getGenerationProgress(): Promise<GenerationProgress> {
  try {
    const response = await fetch('http://127.0.0.1:8787/workflows/progress');
    if (!response.ok) return { active: false, status: 'error', percent: 0 };
    return response.json();
  } catch {
    return { active: false, status: 'error', percent: 0 };
  }
}

export async function getDownloadProgress(modelId?: string): Promise<Record<string, { status: string; percent: number; bytesDownloaded: number; totalBytes: number }>> {
  try {
    const url = modelId
      ? `http://127.0.0.1:8787/download/progress/${encodeURIComponent(modelId)}`
      : 'http://127.0.0.1:8787/download/progress';
    const response = await fetch(url);
    if (!response.ok) return {};
    const data = await response.json();
    return modelId ? { [modelId]: data } : data;
  } catch {
    return {};
  }
}

export async function assembleShots(outputUrls: string[], outputFile?: string): Promise<{ ok: boolean; outputPath?: string; error?: string }> {
  try {
    const response = await fetch('http://127.0.0.1:8787/workflows/assemble', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outputPaths: outputUrls, outputFile }),
    });
    return response.json();
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Helper offline' };
  }
}

export async function detectFfmpeg(): Promise<boolean> {
  try {
    const response = await fetch('http://127.0.0.1:8787/workflows/detect');
    if (!response.ok) return false;
    const data = await response.json();
    return data.ffmpeg?.installed === true;
  } catch {
    return false;
  }
}
