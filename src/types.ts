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
