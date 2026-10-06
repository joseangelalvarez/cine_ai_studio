import { VIDEO_MODEL_CATALOG } from './constants';
import { state, registerInstalledVideoModel, setVideoWorkflow, setHuggingFaceToken } from './store';
import type { VideoModelConfig, VideoWorkflowKind } from './types';

export function getVideoModelsForWorkflow(workflow: VideoWorkflowKind): VideoModelConfig[] {
  return VIDEO_MODEL_CATALOG.filter((model) => model.provider === workflow);
}

export function getReadyVideoModels(): VideoModelConfig[] {
  return VIDEO_MODEL_CATALOG.filter((model) => model.availability === 'ready');
}

export function getDownloadableVideoModels(): VideoModelConfig[] {
  return VIDEO_MODEL_CATALOG.filter((model) => model.availability !== 'ready');
}

export function isVideoModelInstalled(modelId: string): boolean {
  return state.videoWorkflows.installedModels.some((model) => model.modelId === modelId && model.installed);
}

export function chooseVideoWorkflow(workflow: VideoWorkflowKind): void {
  setVideoWorkflow(workflow);
}

export function saveVideoProviderToken(token: string): void {
  setHuggingFaceToken(token);
}

export async function downloadVideoModel(model: VideoModelConfig): Promise<void> {
  registerInstalledVideoModel(model.id, model.provider, 'latest');
}

export function describeVideoWorkflow(workflow: VideoWorkflowKind): string {
  switch (workflow) {
    case 'animatediff':
      return 'Animación local con control de movimiento y continuidad';
    case 'wan':
      return 'Modelos de video de Wan-AI con descarga automática';
    case 'ltx':
      return 'Modelos Lightricks/LTX con estilo cinematográfico';
    case 'ollama':
      return 'Modo local simple para usuarios no técnicos';
    case 'veo':
      return 'Google Veo 3.1 en la nube: clips de 8s con audio nativo, hasta 4K';
    case 'omni-flash':
      return 'Gemini Omni Flash en la nube (key de Gemini, ID vía descubridor)';
  }
}
