export interface MovieProject {
  id: number;
  title: string;
  genre: string;
  artStyle: string;
  description: string;
  targetAudience: string;
  duration?: string;
  createdAt: number;
}

export interface ProjectMemory {
  id: number;
  projectId: number;
  key: string;
  title: string;
  content: string;
  updatedAt: number;
}

export interface ProjectMemoryRevision {
  id: number;
  projectId: number;
  key: string;
  title: string;
  content: string;
  version: number;
  author: string;
  correlationId: string;
  createdAt: number;
}

export interface AuditLog {
  id: number;
  projectId: number;
  correlationId: string;
  actor: string;
  action: string;
  details: string;
  timestamp: number;
}

export interface TelemetryMetric {
  id: number;
  projectId: number;
  correlationId: string;
  metricName: string;
  keyIdentifier: string;
  metricValue: number;
  timestamp: number;
}

export interface CinemaSubagent {
  key: string;
  name: string;
  role: string;
  layer: string;
  layerId: number;
  duties: string[];
  inputDescription: string;
  outputDescription: string;
  suggestedPrompt: string;
  iconName: string;
  tier?: 'premium' | 'standard' | 'economic';
  kind?: 'text' | 'media';
}

export type GenerationState = 
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; response: string }
  | { status: 'error'; message: string };

export type AppScreen =
  | 'HOME'
  | 'CREATE_WIZARD_STEP1'
  | 'CREATE_WIZARD_STEP2'
  | 'CREATION_PROGRESS'
  | 'PROJECT_LIST'
  | 'PROJECT_DETAILS';

export type TextProviderId = 'google' | 'openai' | 'anthropic';
export type ImageProviderId = 'google-imagen' | 'fal-flux' | 'openai-dalle';
export type VideoProviderId = 'google-veo' | 'bytedance-seedance' | 'runway-gen3' | 'luma' | 'kling';

export interface ProviderSettings {
  textProvider: TextProviderId;
  textModel: string;
  imageProvider: ImageProviderId;
  imageModel: string;
  videoProvider: VideoProviderId;
  videoModel: string;
  geminiApiKey?: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  runwayApiKey?: string;
  falApiKey?: string;
}

export interface VideoJob {
  id: string;
  projectId: number;
  sceneNumber: number;
  title: string;
  prompt: string;
  provider: VideoProviderId;
  model: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progressPercent: number;
  videoUrl?: string;
  thumbnailUrl?: string;
  durationSec: number;
  createdAt: number;
  error?: string;
}

export interface GeneratedImage {
  id: string;
  projectId: number;
  subagentKey: string;
  title: string;
  prompt: string;
  provider: ImageProviderId;
  model?: string;
  imageUrl: string;
  createdAt: number;
}

export interface MediaAsset {
  id: string;
  projectId: number;
  type: 'image' | 'video' | 'audio' | 'music';
  role?: string;
  title: string;
  url: string;
  prompt: string;
  provider: string;
  model: string;
  createdAt: number;
}
