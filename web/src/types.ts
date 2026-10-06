// ─── Domain types (mirrors Android Entities.kt) ───────────────────────────────

export interface MovieProject {
  id: number;
  title: string;
  genre: string;
  artStyle: string;
  description: string;
  targetAudience: string;
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

// ─── Subagent catalog ─────────────────────────────────────────────────────────

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
}

// ─── API Key config ───────────────────────────────────────────────────────────

/** Proveedor único de texto: Google Gemini (decisión del usuario). */
export type ApiProvider = 'gemini';

export interface ApiProviderConfig {
  id: ApiProvider;
  name: string;
  description: string;
  priceInfo: string;
  baseUrl: string;
  defaultModel: string;
  models: string[];
  requiresKey: boolean;
  badge?: string;
}

// ─── Multi-rol: asignación de modelos por parte de la producción ─────────────

export type ProductionRole = 'orchestrator' | 'videoRender' | 'characterRender' | 'visualQA';

/** Nivel de calidad/coste para el enrutador de subagentes de texto. */
export type ModelTier = 'premium' | 'standard' | 'economy';

/** Proveedor + modelo concretos asignados a un rol o tier. */
export interface RoleAssignment {
  provider: string;
  model: string;
}

export interface OrchestratorRoleConfig {
  premium: RoleAssignment;
  standard: RoleAssignment;
  economy: RoleAssignment;
}

export interface RoleConfig {
  orchestrator: OrchestratorRoleConfig;
  videoRender: RoleAssignment;
  characterRender: RoleAssignment;
  visualQA: RoleAssignment;
}

export type VideoWorkflowKind = 'animatediff' | 'wan' | 'ltx' | 'ollama' | 'veo' | 'omni-flash';

export type VideoModelAvailability = 'ready' | 'downloadable' | 'requires-credentials' | 'missing';

export interface VideoModelConfig {
  id: string;
  provider: VideoWorkflowKind;
  name: string;
  description: string;
  sourceUrl: string;
  defaultModel: string;
  modelTags: string[];
  availability: VideoModelAvailability;
  requiresCredentials: boolean;
  estimatedSize?: string;
}

export interface HuggingFaceSettings {
  token: string;
  username?: string;
  lastValidatedAt?: number;
}

export interface VideoModelInventoryItem {
  modelId: string;
  provider: VideoWorkflowKind;
  installed: boolean;
  version?: string;
  localPath?: string;
  downloadedAt?: number;
}

export interface VideoGenerationSettings {
  width: number;
  height: number;
  steps: number;
  guidance: number;
  seed?: number;
  negativePrompt: string;
}

export const DEFAULT_VIDEO_SETTINGS: VideoGenerationSettings = {
  width: 768,
  height: 432,
  steps: 20,
  guidance: 7.5,
  negativePrompt: 'blurry, low quality, watermark',
};

// ─── Visual QA (Plan v3.1) ────────────────────────────────────────────────────

/** Tri-estado de aprobación: true | false | null (sin auditar / omitido). */
export type QATriState = boolean | null;

export interface QAVerdict {
  approved: QATriState;
  criticism: string;
  suggestedPromptRefinement?: string;
  suggestedNegativeTerms?: string[];
}

export interface QARequestConfig {
  enabled: boolean;
  /** Por ahora solo 'gemini' (juez con video input nativo). */
  provider?: 'gemini';
  model?: string;
  maxAttempts?: number;
}

export interface QALogEntry {
  prompt: string;
  attempts: number;
  approved: QATriState;
  finalCriticism: string;
  videoUrl?: string | null;
  createdAt: number;
}

export interface VideoWorkflowSettings {
  selectedWorkflow: VideoWorkflowKind;
  selectedModelByWorkflow: Partial<Record<VideoWorkflowKind, string>>;
  installedModels: VideoModelInventoryItem[];
  huggingFace: HuggingFaceSettings;
}

export interface ApiKeySettings {
  selectedProvider: ApiProvider;
  apiKeys: Partial<Record<ApiProvider, string>>;
  useSecureBackend: boolean;
  selectedModels: Partial<Record<ApiProvider, string>>;
  /** Asignación de modelos por rol de producción (Plan multi-rol). */
  roles: RoleConfig;
  /** Overrides individuales por subagente (clave = SUBAGENTS[].key). */
  roleOverrides: Partial<Record<string, RoleAssignment>>;
}

// ─── App navigation states ────────────────────────────────────────────────────

export type Screen =
  | 'HOME'
  | 'CREATE_WIZARD_STEP1'
  | 'CREATE_WIZARD_STEP2'
  | 'CREATION_PROGRESS'
  | 'VIDEO_HUB'
  | 'PROJECT_LIST'
  | 'PROJECT_DETAILS';

// ─── Generation state ─────────────────────────────────────────────────────────

export type GenerationStatus = 'idle' | 'loading' | 'success' | 'error';

export interface GenerationState {
  status: GenerationStatus;
  response?: string;
  error?: string;
}

// ─── Store state ──────────────────────────────────────────────────────────────

export interface AppState {
  screen: Screen;
  projects: MovieProject[];
  selectedProject: MovieProject | null;
  memories: ProjectMemory[];
  apiSettings: ApiKeySettings;
  videoWorkflows: VideoWorkflowSettings;
  credits: number;
  wizard: {
    title: string;
    duration: string;
    artStyle: string;
    idea: string;
  };
  generation: {
    stepIndex: number;
    message: string;
    error: string | null;
    renderingStatus: '' | 'GENERATING' | 'COMPLETED';
  };
  subagentStates: Record<string, 'PENDING' | 'RUNNING' | 'COMPLETED' | 'ERROR'>;
  activeSubagentKey: string | null;
}
