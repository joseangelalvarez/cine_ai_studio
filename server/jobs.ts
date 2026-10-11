import fs from 'fs';
import path from 'path';

export interface AsyncJob {
  id: string;
  projectId: number;
  type: 'image' | 'video' | 'audio' | 'music';
  title: string;
  prompt: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progressPercent: number;
  provider: string;
  model: string;
  outputUrl?: string;
  thumbnailUrl?: string;
  error?: string;
  createdAt: number;
  updatedAt: number;
}

export class JobsManager {
  private static storePath = path.resolve(process.cwd(), '.cineai', 'jobs.json');

  private static ensureDir(): void {
    const dir = path.dirname(this.storePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  public static getAllJobs(): AsyncJob[] {
    try {
      this.ensureDir();
      if (fs.existsSync(this.storePath)) {
        const raw = fs.readFileSync(this.storePath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.warn('[JobsManager] Error loading jobs:', err);
    }
    return [];
  }

  public static getJobsForProject(projectId: number): AsyncJob[] {
    return this.getAllJobs().filter((j) => j.projectId === projectId);
  }

  public static getJob(id: string): AsyncJob | undefined {
    return this.getAllJobs().find((j) => j.id === id);
  }

  public static saveJob(job: AsyncJob): void {
    this.ensureDir();
    const jobs = this.getAllJobs();
    const idx = jobs.findIndex((j) => j.id === job.id);
    if (idx >= 0) {
      jobs[idx] = { ...job, updatedAt: Date.now() };
    } else {
      jobs.push({ ...job, createdAt: Date.now(), updatedAt: Date.now() });
    }
    fs.writeFileSync(this.storePath, JSON.stringify(jobs, null, 2), 'utf-8');
  }

  public static updateJob(id: string, updates: Partial<AsyncJob>): AsyncJob | undefined {
    const job = this.getJob(id);
    if (!job) return undefined;
    const updated = { ...job, ...updates, updatedAt: Date.now() };
    this.saveJob(updated);
    return updated;
  }
}
