import { MovieProject, ProjectMemory, ProjectMemoryRevision, AuditLog, TelemetryMetric } from './types';

const STORAGE_KEYS = {
  PROJECTS: 'cine_ai_projects',
  MEMORIES: 'cine_ai_memories',
  REVISIONS: 'cine_ai_revisions',
  AUDIT_LOGS: 'cine_ai_audit_logs',
  METRICS: 'cine_ai_metrics',
  CREDITS: 'cine_ai_credits',
  IS_PREMIUM: 'cine_ai_is_premium',
};

// Seed initial project so user immediately has realistic data if starting fresh
const INITIAL_PROJECTS: MovieProject[] = [
  {
    id: 1,
    title: 'El Último Operador',
    genre: 'Drama / Ciencia Ficción',
    artStyle: 'Ciencia Ficción Brutalista',
    description: 'En una megaciudad vertical perpetuamente sumergida en niebla y lluvia ácida, Kael, un operario de mantenimiento de paneles holográficos a 120 metros de altura, descubre una señal encriptada transmitida desde el interior de una torre clausurada hace décadas.',
    targetAudience: 'Adulto / Cinéfilo',
    duration: '3 minutos',
    createdAt: Date.now() - 3600000,
  },
];

const INITIAL_MEMORIES: ProjectMemory[] = [
  {
    id: 1,
    projectId: 1,
    key: 'SHOWRUNNER',
    title: 'Director Ejecutivo / Showrunner IA (Capa 0 – Orquestador General)',
    content: `=======================================================
PROYECTO: "EL ÚLTIMO OPERADOR"
BIBLIA DEL SHOWRUNNER & DIRECTIVA GENERAL DE PRODUCCIÓN (CAPA 0)
=======================================================
1. VISIÓN CREATIVA & TONO:
   - Género: Drama / Ciencia Ficción Brutalista
   - Tono Narrativo: Sombrío, reflexivo y de ritmo pausado con tensión latente.
   - Target de Audiencia: Adulto / Cinéfilo.

2. PREMISA & LOGLINE:
   Un operario en las alturas de una megaciudad brutalista intercepta una transmisión prohibida mientras repara un panel holográfico al anochecer.

3. PILARES ESTÉTICOS & REGLAS DE MUNDO:
   - Arquitectura: Hormigón crudo, acero corroído, cables colgantes en el abismo.
   - Luz: Contraste severo con neones cian 7000K y destellos ámbar 2800K.
   - Puntuación: Silencio opresivo roto únicamente por el viento y la estática de radio.`,
    updatedAt: Date.now() - 3500000,
  },
  {
    id: 2,
    projectId: 1,
    key: 'GUIONISTA',
    title: 'Guionista Principal (Capa 1 – Narrativa)',
    content: `=======================================================
GUION LITERARIO - ESCENA 1: LA CIMA DEL ANDAMIO
=======================================================
EXT. TORRE 09 - ANDAMIO VOLADIZO - ANOCHECER

Lluvia ácida persistente sobre el hormigón. El viento silba a través de los cables tensores.

KAEL (38), con gabardina impermeable descolorida y visor HUD reflectante, empuña un multímetro mientras sujeta un cable con dedos temblorosos.

CONTROL (OFF, POR AURICULAR)
(estática densa)
Kael, tu cuota de tiempo de altura expiró hace veinte minutos. Desciende.

KAEL
(mirando el indicador de datos oscilando en verde)
Tengo una señal en el bus de alimentación. Alguien está transmitiendo desde el nivel cero.

Silencio prolongado en la frecuencia. Solo el goteo metálico.`,
    updatedAt: Date.now() - 3400000,
  },
  {
    id: 3,
    projectId: 1,
    key: 'DIRECTOR_ARTE',
    title: 'Director de Arte (Capa 2 – Visual)',
    content: `=======================================================
ART BIBLE & PALETA CROMÁTICA
=======================================================
Paleta oficial:
- Negro Abisal: #090D16
- Hormigón Mojado: #1E293B
- Neón Turquesa: #06B6D4
- Ámbar Alerta: #F59E0B

Materialidad: Encofrados de hormigón con escorrentías de sal y humedad reflectante.`,
    updatedAt: Date.now() - 3300000,
  },
  {
    id: 4,
    projectId: 1,
    key: 'CHARACTER_DESIGNER',
    title: 'Diseñador de Personajes (Capa 2 – Visual)',
    content: `=======================================================
CHARACTER SHEET: KAEL
=======================================================
Edad 38 años. Piel curtida por radiación ultravioleta de gran altitud, cicatriz fina en el puente nasal.
Traje de trabajo térmico de capas modulares, arnés de seguridad de cinco puntos con marcas de uso severo.`,
    updatedAt: Date.now() - 3200000,
  },
  {
    id: 5,
    projectId: 1,
    key: 'PRODUCTION_DESIGNER',
    title: 'Diseñador de Producción (Capa 2 – Visual)',
    content: `=======================================================
ENVIRONMENT BLUEPRINT: PLATAFORMA DE TORRE 09
=======================================================
Andamio suspendido a 120m del suelo. Rejillas metálicas con charcos de condensación, barandilla de seguridad con tensores oxidados. Visor de panel de 4x2 metros con micro-chispas.`,
    updatedAt: Date.now() - 3100000,
  },
  {
    id: 6,
    projectId: 1,
    key: 'COMPOSER',
    title: 'Compositor Musical (Capa 4 – Sonido)',
    content: `=======================================================
SCORE DIRECTIVES: LEITMOTIV DEL VACÍO
=======================================================
Tempo: 60 BPM.
Instrumentación: Sintetizador analógico monofónico sub-grave con filtro paso bajo barriendo lentamente entre 80Hz y 200Hz, acoplado a un chelo acústico con sordina en compás 4/4.`,
    updatedAt: Date.now() - 3000000,
  },
  {
    id: 7,
    projectId: 1,
    key: 'SOUND_DESIGNER',
    title: 'Diseñador de Sonido (Capa 4 – Sonido)',
    content: `=======================================================
SOUND FX CUE SHEET
=======================================================
- Viento silbante de altitud con componente subsónico a 30Hz.
- Goteo de agua ácida sobre chapa galvanizada.
- Zumbido eléctrico de 120Hz con distorsión de arco voltaico en el terminal averiado.`,
    updatedAt: Date.now() - 2900000,
  },
  {
    id: 8,
    projectId: 1,
    key: 'VEO_VIDEO_STATUS',
    title: 'Estado del Motor de Storyboard',
    content: 'SUCCESS',
    updatedAt: Date.now() - 2800000,
  },
];

export class StorageService {
  static getProjects(): MovieProject[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(INITIAL_PROJECTS));
      localStorage.setItem(STORAGE_KEYS.MEMORIES, JSON.stringify(INITIAL_MEMORIES));
      return INITIAL_PROJECTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_PROJECTS;
    }
  }

  static saveProjects(projects: MovieProject[]) {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  }

  static getProject(id: number): MovieProject | null {
    return this.getProjects().find((p) => p.id === id) || null;
  }

  static insertProject(project: Omit<MovieProject, 'id' | 'createdAt'> & { id?: number }): MovieProject {
    const projects = this.getProjects();
    const newId = project.id && project.id > 0 ? project.id : (projects.length > 0 ? Math.max(...projects.map((p) => p.id)) + 1 : 1);
    const existingIndex = projects.findIndex((p) => p.id === newId);

    const fullProject: MovieProject = {
      ...project,
      id: newId,
      createdAt: existingIndex !== -1 ? projects[existingIndex].createdAt : Date.now(),
    };

    if (existingIndex !== -1) {
      projects[existingIndex] = fullProject;
    } else {
      projects.unshift(fullProject);
    }

    this.saveProjects(projects);
    return fullProject;
  }

  static deleteProject(id: number) {
    const projects = this.getProjects().filter((p) => p.id !== id);
    this.saveProjects(projects);

    // Also clean up memories, revisions, logs
    const memories = this.getMemories(id).filter((m) => m.projectId !== id);
    localStorage.setItem(STORAGE_KEYS.MEMORIES, JSON.stringify(memories));
  }

  static getMemories(projectId: number): ProjectMemory[] {
    const raw = localStorage.getItem(STORAGE_KEYS.MEMORIES);
    if (!raw) return [];
    try {
      const all: ProjectMemory[] = JSON.parse(raw);
      return all.filter((m) => m.projectId === projectId);
    } catch {
      return [];
    }
  }

  static getMemoryByKey(projectId: number, key: string): ProjectMemory | null {
    return this.getMemories(projectId).find((m) => m.key === key) || null;
  }

  static insertMemory(memory: Omit<ProjectMemory, 'id' | 'updatedAt'>): ProjectMemory {
    const raw = localStorage.getItem(STORAGE_KEYS.MEMORIES);
    const all: ProjectMemory[] = raw ? JSON.parse(raw) : [];

    const existingIdx = all.findIndex((m) => m.projectId === memory.projectId && m.key === memory.key);
    const updatedMem: ProjectMemory = {
      ...memory,
      id: existingIdx !== -1 ? all[existingIdx].id : Date.now() + Math.floor(Math.random() * 1000),
      updatedAt: Date.now(),
    };

    if (existingIdx !== -1) {
      all[existingIdx] = updatedMem;
    } else {
      all.push(updatedMem);
    }

    localStorage.setItem(STORAGE_KEYS.MEMORIES, JSON.stringify(all));
    return updatedMem;
  }

  static clearMemories(projectId: number) {
    const raw = localStorage.getItem(STORAGE_KEYS.MEMORIES);
    if (!raw) return;
    const all: ProjectMemory[] = JSON.parse(raw);
    const remaining = all.filter((m) => m.projectId !== projectId);
    localStorage.setItem(STORAGE_KEYS.MEMORIES, JSON.stringify(remaining));
  }

  // Revisions
  static getRevisions(projectId: number): ProjectMemoryRevision[] {
    const raw = localStorage.getItem(STORAGE_KEYS.REVISIONS);
    if (!raw) return [];
    try {
      const all: ProjectMemoryRevision[] = JSON.parse(raw);
      return all.filter((r) => r.projectId === projectId).sort((a, b) => b.createdAt - a.createdAt);
    } catch {
      return [];
    }
  }

  static insertRevision(rev: Omit<ProjectMemoryRevision, 'id' | 'createdAt'>) {
    const raw = localStorage.getItem(STORAGE_KEYS.REVISIONS);
    const all: ProjectMemoryRevision[] = raw ? JSON.parse(raw) : [];
    all.unshift({
      ...rev,
      id: Date.now() + Math.floor(Math.random() * 1000),
      createdAt: Date.now(),
    });
    localStorage.setItem(STORAGE_KEYS.REVISIONS, JSON.stringify(all));
  }

  // Audit Logs
  static getAuditLogs(projectId: number): AuditLog[] {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    if (!raw) return [];
    try {
      const all: AuditLog[] = JSON.parse(raw);
      return all.filter((l) => l.projectId === projectId).sort((a, b) => b.timestamp - a.timestamp);
    } catch {
      return [];
    }
  }

  static insertAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>) {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    const all: AuditLog[] = raw ? JSON.parse(raw) : [];
    all.unshift({
      ...log,
      id: Date.now() + Math.floor(Math.random() * 1000),
      timestamp: Date.now(),
    });
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(all));
  }

  // Telemetry Metrics
  static getMetrics(projectId: number): TelemetryMetric[] {
    const raw = localStorage.getItem(STORAGE_KEYS.METRICS);
    if (!raw) return [];
    try {
      const all: TelemetryMetric[] = JSON.parse(raw);
      return all.filter((m) => m.projectId === projectId).sort((a, b) => b.timestamp - a.timestamp);
    } catch {
      return [];
    }
  }

  static insertMetric(metric: Omit<TelemetryMetric, 'id' | 'timestamp'>) {
    const raw = localStorage.getItem(STORAGE_KEYS.METRICS);
    const all: TelemetryMetric[] = raw ? JSON.parse(raw) : [];
    all.unshift({
      ...metric,
      id: Date.now() + Math.floor(Math.random() * 1000),
      timestamp: Date.now(),
    });
    localStorage.setItem(STORAGE_KEYS.METRICS, JSON.stringify(all));
  }

  // Credits & Premium
  static getCredits(): number {
    const raw = localStorage.getItem(STORAGE_KEYS.CREDITS);
    return raw ? Number(raw) : 100;
  }

  static setCredits(amount: number) {
    localStorage.setItem(STORAGE_KEYS.CREDITS, String(amount));
  }

  static consumeCredits(amount: number): boolean {
    const current = this.getCredits();
    if (current >= amount) {
      this.setCredits(current - amount);
      return true;
    }
    return false;
  }

  static addCredits(amount: number) {
    this.setCredits(this.getCredits() + amount);
  }

  static getIsPremium(): boolean {
    return localStorage.getItem(STORAGE_KEYS.IS_PREMIUM) === 'true';
  }

  static setIsPremium(isPremium: boolean) {
    localStorage.setItem(STORAGE_KEYS.IS_PREMIUM, isPremium ? 'true' : 'false');
  }
}
