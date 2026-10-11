import { MovieProject, ProjectMemory, ProjectMemoryRevision, AuditLog, TelemetryMetric, ProviderSettings, VideoJob, GeneratedImage, MediaAsset } from './types';

const STORAGE_KEYS = {
  PROJECTS: 'cine_ai_projects',
  MEMORIES: 'cine_ai_memories',
  REVISIONS: 'cine_ai_revisions',
  AUDIT_LOGS: 'cine_ai_audit_logs',
  METRICS: 'cine_ai_metrics',
  PROVIDER_SETTINGS: 'cine_ai_provider_settings',
  VIDEO_JOBS: 'cine_ai_video_jobs',
  GENERATED_IMAGES: 'cine_ai_generated_images',
  MEDIA_ASSETS: 'cine_ai_assets',
};

export const DEFAULT_PROVIDER_SETTINGS: ProviderSettings = {
  textProvider: 'google',
  textModel: 'gemini-3.8-flash',
  imageProvider: 'google-imagen',
  imageModel: 'imagen-3.0-generate-002',
  videoProvider: 'google-veo',
  videoModel: 'veo-3.1-generate-preview',
};

export class StorageService {
  // ==========================================
  // PROJECTS (Starts empty - zero simulation)
  // ==========================================
  public static getProjects(): MovieProject[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public static saveProject(project: Omit<MovieProject, 'id' | 'createdAt'> & { id?: number }): MovieProject {
    const projects = this.getProjects();
    const isNew = !project.id;
    const newProject: MovieProject = {
      ...project,
      id: project.id || (projects.length > 0 ? Math.max(...projects.map((p) => p.id)) + 1 : 1),
      createdAt: isNew ? Date.now() : (projects.find((p) => p.id === project.id)?.createdAt || Date.now()),
    };

    if (isNew) {
      projects.unshift(newProject);
    } else {
      const idx = projects.findIndex((p) => p.id === project.id);
      if (idx !== -1) projects[idx] = newProject;
      else projects.unshift(newProject);
    }

    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    return newProject;
  }

  public static deleteProject(projectId: number): void {
    const projects = this.getProjects().filter((p) => p.id !== projectId);
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));

    // Cleanup associated entities
    const memories = this.getAllMemories().filter((m) => m.projectId !== projectId);
    localStorage.setItem(STORAGE_KEYS.MEMORIES, JSON.stringify(memories));

    const assets = this.getAllAssets().filter((a) => a.projectId !== projectId);
    localStorage.setItem(STORAGE_KEYS.MEDIA_ASSETS, JSON.stringify(assets));

    const revisions = this.getAllRevisions().filter((r) => r.projectId !== projectId);
    localStorage.setItem(STORAGE_KEYS.REVISIONS, JSON.stringify(revisions));

    const metrics = this.getAllMetrics().filter((m) => m.projectId !== projectId);
    localStorage.setItem(STORAGE_KEYS.METRICS, JSON.stringify(metrics));
  }

  // ==========================================
  // MEMORIES (Real project deliverables)
  // ==========================================
  public static getAllMemories(): ProjectMemory[] {
    const raw = localStorage.getItem(STORAGE_KEYS.MEMORIES);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public static getMemories(projectId: number): ProjectMemory[] {
    return this.getAllMemories().filter((m) => m.projectId === projectId);
  }

  public static saveMemory(memory: Omit<ProjectMemory, 'id' | 'updatedAt'> & { id?: number }): ProjectMemory {
    const memories = this.getAllMemories();
    const existingIndex = memories.findIndex((m) => m.projectId === memory.projectId && m.key === memory.key);
    const id = memory.id || (memories.length > 0 ? Math.max(...memories.map((m) => m.id)) + 1 : 1);

    const savedMemory: ProjectMemory = {
      ...memory,
      id,
      updatedAt: Date.now(),
    };

    if (existingIndex !== -1) {
      memories[existingIndex] = savedMemory;
    } else {
      memories.push(savedMemory);
    }

    localStorage.setItem(STORAGE_KEYS.MEMORIES, JSON.stringify(memories));
    return savedMemory;
  }

  // ==========================================
  // REAL MEDIA ASSETS
  // ==========================================
  public static getAllAssets(): MediaAsset[] {
    const raw = localStorage.getItem(STORAGE_KEYS.MEDIA_ASSETS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public static getAssets(projectId: number): MediaAsset[] {
    return this.getAllAssets().filter((a) => a.projectId === projectId);
  }

  public static saveAsset(asset: MediaAsset): void {
    const assets = this.getAllAssets();
    const existingIndex = assets.findIndex((a) => a.id === asset.id);
    if (existingIndex >= 0) {
      assets[existingIndex] = asset;
    } else {
      assets.unshift(asset);
    }
    localStorage.setItem(STORAGE_KEYS.MEDIA_ASSETS, JSON.stringify(assets));
  }

  public static deleteAsset(assetId: string): void {
    const assets = this.getAllAssets().filter((a) => a.id !== assetId);
    localStorage.setItem(STORAGE_KEYS.MEDIA_ASSETS, JSON.stringify(assets));
  }

  // ==========================================
  // REVISIONS & AUDIT LOGS
  // ==========================================
  public static getAllRevisions(): ProjectMemoryRevision[] {
    const raw = localStorage.getItem(STORAGE_KEYS.REVISIONS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public static getRevisions(projectId: number): ProjectMemoryRevision[] {
    return this.getAllRevisions().filter((r) => r.projectId === projectId);
  }

  public static saveRevision(revision: Omit<ProjectMemoryRevision, 'id' | 'createdAt'>): ProjectMemoryRevision {
    const revisions = this.getAllRevisions();
    const id = revisions.length > 0 ? Math.max(...revisions.map((r) => r.id)) + 1 : 1;
    const newRev: ProjectMemoryRevision = {
      ...revision,
      id,
      createdAt: Date.now(),
    };
    revisions.unshift(newRev);
    localStorage.setItem(STORAGE_KEYS.REVISIONS, JSON.stringify(revisions));
    return newRev;
  }

  public static getAuditLogs(projectId: number): AuditLog[] {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    if (!raw) return [];
    try {
      const all: AuditLog[] = JSON.parse(raw);
      return all.filter((l) => l.projectId === projectId);
    } catch {
      return [];
    }
  }

  public static saveAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    const logs: AuditLog[] = raw ? JSON.parse(raw) : [];
    const id = logs.length > 0 ? Math.max(...logs.map((l) => l.id)) + 1 : 1;
    const newLog: AuditLog = {
      ...log,
      id,
      timestamp: Date.now(),
    };
    logs.unshift(newLog);
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs.slice(0, 200)));
    return newLog;
  }

  // ==========================================
  // METRICS & TELEMETRY
  // ==========================================
  public static getAllMetrics(): TelemetryMetric[] {
    const raw = localStorage.getItem(STORAGE_KEYS.METRICS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public static getMetrics(projectId: number): TelemetryMetric[] {
    return this.getAllMetrics().filter((m) => m.projectId === projectId);
  }

  public static saveMetric(metric: Omit<TelemetryMetric, 'id' | 'timestamp'>): TelemetryMetric {
    const metrics = this.getAllMetrics();
    const id = metrics.length > 0 ? Math.max(...metrics.map((m) => m.id)) + 1 : 1;
    const newMetric: TelemetryMetric = {
      ...metric,
      id,
      timestamp: Date.now(),
    };
    metrics.unshift(newMetric);
    localStorage.setItem(STORAGE_KEYS.METRICS, JSON.stringify(metrics.slice(0, 300)));
    return newMetric;
  }

  public static getRealCostUsd(projectId?: number): number {
    try {
      const allMetrics = projectId ? this.getMetrics(projectId) : this.getAllMetrics();
      const costMetrics = allMetrics.filter(
        (m) => m.metricName === 'ORCHESTRATION_COST' || m.metricName === 'REAL_COST_USD'
      );
      if (costMetrics.length > 0) {
        const total = costMetrics.reduce((sum, m) => sum + (Number(m.metricValue) || 0), 0);
        return Math.max(0, total);
      }

      // If no cost metrics were explicitly registered yet, compute based on saved deliverables
      const memories = projectId ? this.getMemories(projectId) : this.getAllMemories();
      if (memories.length === 0) return 0;

      let totalChars = 0;
      for (const m of memories) {
        totalChars += m.content?.length || 0;
      }
      const outputTokens = Math.round(totalChars / 3.8);
      const inputTokens = Math.round(outputTokens * 0.45);
      // Rates: Google Gemini Flash ($0.075 / 1M in, $0.30 / 1M out)
      const estimatedCost = (inputTokens / 1_000_000) * 0.075 + (outputTokens / 1_000_000) * 0.30;
      return Math.max(0, estimatedCost);
    } catch {
      return 0;
    }
  }

  public static getTotalTokens(projectId?: number): number {
    try {
      const allMetrics = projectId ? this.getMetrics(projectId) : this.getAllMetrics();
      const tokenMetrics = allMetrics.filter((m) => m.metricName === 'ORCHESTRATION_TOKENS');
      if (tokenMetrics.length > 0) {
        return tokenMetrics.reduce((sum, m) => sum + (Number(m.metricValue) || 0), 0);
      }
      const memories = projectId ? this.getMemories(projectId) : this.getAllMemories();
      let totalChars = 0;
      for (const m of memories) {
        totalChars += m.content?.length || 0;
      }
      return Math.round((totalChars / 3.8) * 1.45);
    } catch {
      return 0;
    }
  }

  // ==========================================
  // PROVIDER SETTINGS
  // ==========================================
  public static getProviderSettings(): ProviderSettings {
    const raw = localStorage.getItem(STORAGE_KEYS.PROVIDER_SETTINGS);
    if (!raw) return DEFAULT_PROVIDER_SETTINGS;
    try {
      return { ...DEFAULT_PROVIDER_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_PROVIDER_SETTINGS;
    }
  }

  public static saveProviderSettings(settings: ProviderSettings): void {
    localStorage.setItem(STORAGE_KEYS.PROVIDER_SETTINGS, JSON.stringify(settings));
  }

  // Legacy compatibility helpers
  public static getGeneratedImages(projectId: number): GeneratedImage[] {
    return this.getImages(projectId);
  }

  public static saveGeneratedImage(image: GeneratedImage): void {
    this.saveImage(image);
  }

  public static deleteGeneratedImage(id: string): void {
    this.deleteAsset(id);
  }

  public static resetProjectImagesToDefault(projectId: number): void {
    const assets = this.getAllAssets().filter((a) => !(a.projectId === projectId && a.type === 'image'));
    localStorage.setItem(STORAGE_KEYS.MEDIA_ASSETS, JSON.stringify(assets));
  }

  public static getImages(projectId: number): GeneratedImage[] {
    const assets = this.getAssets(projectId).filter((a) => a.type === 'image');
    return assets.map((a) => ({
      id: a.id,
      projectId: a.projectId,
      subagentKey: a.role || 'CHARACTER_DESIGNER',
      title: a.title,
      prompt: a.prompt,
      provider: a.provider as any,
      model: a.model,
      imageUrl: a.url,
      createdAt: a.createdAt,
    }));
  }

  public static saveImage(image: GeneratedImage): void {
    this.saveAsset({
      id: image.id,
      projectId: image.projectId,
      type: 'image',
      role: image.subagentKey,
      title: image.title,
      url: image.imageUrl,
      prompt: image.prompt,
      provider: image.provider,
      model: image.model || 'imagen-3.0-generate-002',
      createdAt: image.createdAt,
    });
  }

  public static getVideoJobs(projectId: number): VideoJob[] {
    const raw = localStorage.getItem(STORAGE_KEYS.VIDEO_JOBS);
    if (!raw) return [];
    try {
      const all: VideoJob[] = JSON.parse(raw);
      return all.filter((j) => j.projectId === projectId);
    } catch {
      return [];
    }
  }

  public static saveVideoJob(job: VideoJob): void {
    const raw = localStorage.getItem(STORAGE_KEYS.VIDEO_JOBS);
    const jobs: VideoJob[] = raw ? JSON.parse(raw) : [];
    const idx = jobs.findIndex((j) => j.id === job.id);
    if (idx >= 0) {
      jobs[idx] = job;
    } else {
      jobs.unshift(job);
    }
    localStorage.setItem(STORAGE_KEYS.VIDEO_JOBS, JSON.stringify(jobs));
  }

  public static insertProject(project: Omit<MovieProject, 'id' | 'createdAt'> & { id?: number }): MovieProject {
    return this.saveProject(project);
  }

  public static updateProject(project: MovieProject): MovieProject {
    return this.saveProject(project);
  }

  public static insertMemory(memory: Omit<ProjectMemory, 'id' | 'updatedAt'> & { id?: number }): ProjectMemory {
    return this.saveMemory(memory);
  }

  public static updateMemory(memory: ProjectMemory): ProjectMemory {
    return this.saveMemory(memory);
  }

  public static insertRevision(revision: Omit<ProjectMemoryRevision, 'id' | 'createdAt'>): ProjectMemoryRevision {
    return this.saveRevision(revision);
  }

  public static insertAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog {
    return this.saveAuditLog(log);
  }

  public static insertMetric(metric: Omit<TelemetryMetric, 'id' | 'timestamp'>): TelemetryMetric {
    return this.saveMetric(metric);
  }

  public static updateVeoMetadata(projectId: number, type: 'char' | 'bg' | 'sound', value: string): void {
    const keyMap = {
      char: 'VEO_CHARACTER_CUSTOM',
      bg: 'VEO_BACKGROUND_CUSTOM',
      sound: 'VEO_SOUND_CUSTOM',
    };
    this.saveMemory({
      projectId,
      key: keyMap[type],
      title: `Personalización ${type}`,
      content: value,
    });
  }

  public static updateVeoVideoStatus(projectId: number, status: string): void {
    this.saveMemory({
      projectId,
      key: 'VEO_VIDEO_STATUS',
      title: 'Estado Render Video',
      content: status,
    });
  }
}
