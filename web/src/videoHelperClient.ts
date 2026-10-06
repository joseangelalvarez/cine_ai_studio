import { VIDEO_MODEL_CATALOG } from './constants';
import { registerInstalledVideoModel, setHuggingFaceToken, setVideoWorkflow } from './store';
import type { VideoModelConfig, VideoWorkflowKind } from './types';

const HELPER_BASE_URL = 'http://127.0.0.1:8787';

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${HELPER_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });
  if (!response.ok) throw new Error(`Helper error ${response.status}`);
  return response.json() as Promise<T>;
}

async function helperAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${HELPER_BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

export async function getHelperState() {
  if (!(await helperAvailable())) return null;
  return requestJson('/state');
}

export async function getHelperModels() {
  if (!(await helperAvailable())) return VIDEO_MODEL_CATALOG;
  return requestJson('/models');
}

export async function saveHelperToken(token: string): Promise<void> {
  if (await helperAvailable()) {
    await requestJson('/token', { method: 'POST', body: JSON.stringify({ token }) });
  }
  setHuggingFaceToken(token);
}

export async function chooseHelperWorkflow(workflow: VideoWorkflowKind): Promise<void> {
  if (await helperAvailable()) {
    await requestJson('/workflow', { method: 'POST', body: JSON.stringify({ workflow }) });
  }
  setVideoWorkflow(workflow);
}

export async function downloadHelperModel(model: VideoModelConfig): Promise<void> {
  if (await helperAvailable()) {
    await requestJson('/download', { method: 'POST', body: JSON.stringify({ modelId: model.id, label: model.name }) });
  }
  registerInstalledVideoModel(model.id, model.provider, 'latest');
}

export async function syncHelperInventory(): Promise<void> {
  if (!(await helperAvailable())) return;
  const models = await requestJson<Array<{ id: string; provider: VideoWorkflowKind; installed: boolean; localPath?: string | null; tokenAvailable?: boolean }>>('/models');
  for (const model of models) {
    if (model.installed) {
      registerInstalledVideoModel(model.id, model.provider, 'latest');
    }
  }
}

export async function validateHelperToken(): Promise<{ valid: boolean; error?: string }> {
  if (!(await helperAvailable())) return { valid: false, error: 'Helper offline' };
  return requestJson('/validate-token');
}

export async function getHelperModelInfo(modelId: string): Promise<{ id: string; name: string; url: string; files?: Array<{ name: string; size: number }>; error?: string }> {
  if (!(await helperAvailable())) return { id: modelId, name: modelId, url: '', error: 'Helper offline' };
  return requestJson('/model-info', { method: 'POST', body: JSON.stringify({ modelId }) });
}
