import { state, navigateTo, updateWizard, deleteProject, openProject } from '../store';
import { DURATION_OPTIONS, ART_STYLE_OPTIONS, API_PROVIDERS } from '../constants';
import type { MovieProject } from '../types';

// ─── Home screen ──────────────────────────────────────────────────────────────

export function renderHome(): string {
  const provider = API_PROVIDERS.find((p) => p.id === state.apiSettings.selectedProvider)!;
  const hasKey = !provider.requiresKey || !!state.apiSettings.apiKeys[state.apiSettings.selectedProvider];

  return `
<div class="page" style="display:flex;flex-direction:column;justify-content:center;min-height:100dvh;">
  <div class="col gap-24 slide-up text-center">
    <!-- Logo -->
    <div style="display:flex;justify-content:center">
      <div style="width:88px;height:88px;border-radius:22px;background:var(--primary-dim);border:2px solid var(--primary);display:flex;align-items:center;justify-content:center;font-size:2.4rem">
        🎬
      </div>
    </div>

    <div class="col gap-8">
      <h1 style="color:var(--pale-white)">CINE AI STUDIO</h1>
      <p style="font-size:0.95rem;max-width:480px;margin:0 auto;line-height:1.7">
        Escribe tus ideas cinematográficas. Deja que los orquestadores de IA se encarguen de la preproducción.
      </p>
    </div>

    <!-- API Key status banner -->
    <div id="api-status-banner" style="max-width:520px;margin:0 auto;width:100%">
      ${renderApiStatusBanner(provider.name, hasKey)}
    </div>

    <!-- Action cards -->
    <div class="col gap-16" style="max-width:520px;margin:0 auto;width:100%">
      <div class="card card-primary" id="btn-create" role="button" tabindex="0"
           style="text-align:center;padding:28px">
        <div style="font-size:2rem;margin-bottom:12px">✨</div>
        <h3 style="color:var(--primary);font-size:1.1rem;margin-bottom:8px">Crear nuevo proyecto</h3>
        <p class="text-sm">Configura título, estilo e idea base para generación automatizada.</p>
      </div>

      <div class="card" id="btn-open" role="button" tabindex="0"
           style="text-align:center;padding:28px;cursor:pointer">
        <div style="font-size:2rem;margin-bottom:12px">📂</div>
        <h3 style="color:var(--pale-white);font-size:1.1rem;margin-bottom:8px">Abrir proyecto existente</h3>
        <p class="text-sm">Modifica y consulta el pipeline de tus proyectos generados.</p>
        ${state.projects.length > 0 ? `<span class="badge badge-primary" style="margin-top:10px">${state.projects.length} proyecto${state.projects.length !== 1 ? 's' : ''}</span>` : ''}
      </div>

      <div class="card" id="btn-apikey" role="button" tabindex="0"
           style="text-align:center;padding:20px;cursor:pointer;border-style:dashed">
        <div style="display:flex;align-items:center;justify-content:center;gap:10px">
          <span style="font-size:1.3rem">🔑</span>
          <div style="text-align:left">
            <div style="font-weight:700;font-size:0.9rem;color:var(--pale-white)">Cambiar proveedor de IA</div>
            <div class="text-xs text-muted">Activo: <strong style="color:var(--primary)">${provider.name}</strong> · ${provider.priceInfo}</div>
          </div>
          <span class="badge ${hasKey ? 'badge-green' : 'badge-red'}" style="margin-left:auto">${hasKey ? '● Listo' : '● Sin key'}</span>
        </div>
      </div>

      <div class="card" id="btn-video" role="button" tabindex="0"
           style="text-align:center;padding:20px;cursor:pointer;border-style:dashed">
        <div style="display:flex;align-items:center;justify-content:center;gap:10px">
          <span style="font-size:1.3rem">🎞</span>
          <div style="text-align:left">
            <div style="font-weight:700;font-size:0.9rem;color:var(--pale-white)">Configurar video local</div>
            <div class="text-xs text-muted">Elige AnimateDiff, Wan, LTX o modo local sencillo</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Credits -->
    <p class="text-sm text-muted">
      💰 Créditos disponibles: <strong style="color:var(--yellow)">${state.credits}</strong>
    </p>
  </div>
</div>`;
}

function renderApiStatusBanner(providerName: string, hasKey: boolean): string {
  if (hasKey) {
    return `<div style="background:rgba(74,222,128,.08);border:1px solid rgba(74,222,128,.3);border-radius:var(--radius-md);padding:10px 16px;display:flex;align-items:center;gap:10px">
      <span class="pulse-dot"></span>
      <span class="text-sm" style="color:var(--green)">Conectado · ${providerName}</span>
    </div>`;
  }
  return `<div style="background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.3);border-radius:var(--radius-md);padding:10px 16px;display:flex;align-items:center;gap:10px">
    <span style="color:var(--red)">⚠</span>
    <span class="text-sm" style="color:var(--red)">Configura una API Key para comenzar</span>
  </div>`;
}

export function bindHome() {
  document.getElementById('btn-create')?.addEventListener('click', () => navigateTo('CREATE_WIZARD_STEP1'));
  document.getElementById('btn-open')?.addEventListener('click', () => navigateTo('PROJECT_LIST'));
  document.getElementById('btn-apikey')?.addEventListener('click', () => showApiKeyModal());
  document.getElementById('btn-video')?.addEventListener('click', () => navigateTo('VIDEO_HUB'));
}

// ─── Wizard Step 1 ────────────────────────────────────────────────────────────

export function renderWizardStep1(): string {
  const { title, duration, artStyle } = state.wizard;
  return `
<div class="topbar">
  <button class="btn btn-ghost btn-icon" id="wiz1-back">←</button>
  <span class="topbar-title">Nuevo Proyecto · Paso 1/2</span>
</div>
<div class="page slide-up">
  <div class="col gap-24">
    <div>
      <h2>Datos del proyecto</h2>
      <p class="text-sm" style="margin-top:4px">Define el nombre, duración y estilo visual.</p>
    </div>
    <div class="col gap-16">
      <div class="input-group">
        <label>Título del proyecto</label>
        <input class="input" id="wiz-title" placeholder="Ej: La Torre Olvidada" value="${escapeAttr(title)}">
      </div>
      <div class="input-group">
        <label>Duración objetivo</label>
        <select class="select" id="wiz-duration">
          ${DURATION_OPTIONS.map((d) => `<option ${d === duration ? 'selected' : ''}>${d}</option>`).join('')}
        </select>
      </div>
      <div class="input-group">
        <label>Estilo artístico</label>
        <div class="chip-list" id="wiz-artstyle">
          ${ART_STYLE_OPTIONS.map((s) =>
            `<button class="chip ${s === artStyle ? 'active' : ''}" data-style="${escapeAttr(s)}">${s}</button>`
          ).join('')}
        </div>
      </div>
    </div>
    <button class="btn btn-primary" id="wiz1-next" style="align-self:flex-end">
      Siguiente →
    </button>
  </div>
</div>`;
}

export function bindWizardStep1() {
  document.getElementById('wiz1-back')?.addEventListener('click', () => navigateTo('HOME'));
  document.getElementById('wiz-title')?.addEventListener('input', (e) =>
    updateWizard('title', (e.target as HTMLInputElement).value));
  document.getElementById('wiz-duration')?.addEventListener('change', (e) =>
    updateWizard('duration', (e.target as HTMLSelectElement).value));
  document.querySelectorAll<HTMLButtonElement>('#wiz-artstyle .chip').forEach((btn) =>
    btn.addEventListener('click', () => updateWizard('artStyle', btn.dataset.style!)));
  document.getElementById('wiz1-next')?.addEventListener('click', () => {
    if (!state.wizard.title.trim()) { alert('Por favor ingresa un título para el proyecto.'); return; }
    navigateTo('CREATE_WIZARD_STEP2');
  });
}

// ─── Wizard Step 2 ────────────────────────────────────────────────────────────

export function renderWizardStep2(): string {
  const { idea } = state.wizard;
  const provider = API_PROVIDERS.find((p) => p.id === state.apiSettings.selectedProvider)!;
  return `
<div class="topbar">
  <button class="btn btn-ghost btn-icon" id="wiz2-back">←</button>
  <span class="topbar-title">Nuevo Proyecto · Paso 2/2</span>
</div>
<div class="page slide-up">
  <div class="col gap-24">
    <div>
      <h2>Idea cinematográfica</h2>
      <p class="text-sm" style="margin-top:4px">Describe tu idea. Los subagentes de IA la desarrollarán.</p>
    </div>
    <div class="input-group">
      <label>Sinopsis / Idea base</label>
      <textarea class="textarea" id="wiz-idea" rows="6"
        placeholder="Ej: Un ingeniero de mantenimiento descubre señales de una civilización perdida mientras repara paneles solares en una megaestructura orbital..."
      >${escapeHtml(idea)}</textarea>
    </div>

    <div class="card" style="padding:16px">
      <div class="row-between" style="margin-bottom:8px">
        <span class="text-sm fw-bold">Proveedor IA activo</span>
        <button class="btn btn-outline btn-sm" id="wiz2-change-api">Cambiar</button>
      </div>
      <div class="row gap-8">
        <span class="pulse-dot pulse-dot-primary"></span>
        <span class="text-sm" style="color:var(--primary)">${provider.name}</span>
        <span class="text-xs text-muted">· ${provider.priceInfo}</span>
      </div>
    </div>

    <div class="row-between">
      <span class="text-sm text-muted">💡 Generará ${5} entregables de preproducción</span>
      <button class="btn btn-primary" id="wiz2-start">
        🚀 Iniciar generación
      </button>
    </div>
  </div>
</div>`;
}

export function bindWizardStep2() {
  document.getElementById('wiz2-back')?.addEventListener('click', () => navigateTo('CREATE_WIZARD_STEP1'));
  document.getElementById('wiz-idea')?.addEventListener('input', (e) =>
    updateWizard('idea', (e.target as HTMLTextAreaElement).value));
  document.getElementById('wiz2-change-api')?.addEventListener('click', () => showApiKeyModal());
  document.getElementById('wiz2-start')?.addEventListener('click', () => {
    if (!state.wizard.idea.trim()) { alert('Por favor describe tu idea cinematográfica.'); return; }
    import('../store').then(({ createProject, startAutomaticSequence }) => {
      const p = createProject({
        title: state.wizard.title,
        genre: state.wizard.duration,
        artStyle: state.wizard.artStyle,
        description: state.wizard.idea,
        targetAudience: 'Audiencia general',
      });
      void startAutomaticSequence(p.id);
    });
  });
}

// ─── Project list ─────────────────────────────────────────────────────────────

export function renderProjectList(): string {
  return `
<div class="topbar">
  <button class="btn btn-ghost btn-icon" id="pl-back">←</button>
  <span class="topbar-title">Mis Proyectos</span>
  <button class="btn btn-primary btn-sm" id="pl-new" style="margin-left:auto">+ Nuevo</button>
</div>
<div class="page slide-up">
  ${state.projects.length === 0
    ? `<div class="text-center col gap-16" style="padding:60px 0">
        <div style="font-size:3rem">🎬</div>
        <h3>Sin proyectos aún</h3>
        <p class="text-sm">Crea tu primer proyecto cinematográfico.</p>
        <button class="btn btn-primary" id="pl-first">Crear proyecto</button>
      </div>`
    : `<div class="col gap-16">
        ${state.projects.map((p) => renderProjectCard(p)).join('')}
      </div>`
  }
</div>`;
}

function renderProjectCard(p: MovieProject): string {
  const date = new Date(p.createdAt).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' });
  return `
<div class="card" style="cursor:pointer" data-project-id="${p.id}">
  <div class="row-between" style="margin-bottom:10px">
    <div>
      <h3 style="color:var(--pale-white)">${escapeHtml(p.title)}</h3>
      <p class="text-xs text-muted">${escapeHtml(p.artStyle)} · ${escapeHtml(p.genre)}</p>
    </div>
    <button class="btn btn-danger btn-sm btn-delete" data-pid="${p.id}" style="flex-shrink:0">🗑</button>
  </div>
  <p class="text-sm" style="margin-bottom:10px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">
    ${escapeHtml(p.description)}
  </p>
  <p class="text-xs text-muted">${date}</p>
</div>`;
}

export function bindProjectList() {
  document.getElementById('pl-back')?.addEventListener('click', () => navigateTo('HOME'));
  document.getElementById('pl-new')?.addEventListener('click', () => navigateTo('CREATE_WIZARD_STEP1'));
  document.getElementById('pl-first')?.addEventListener('click', () => navigateTo('CREATE_WIZARD_STEP1'));

  document.querySelectorAll<HTMLElement>('[data-project-id]').forEach((el) => {
    el.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).classList.contains('btn-delete')) return;
      const id = parseInt(el.dataset.projectId!);
      const project = state.projects.find((p) => p.id === id);
      if (project) { openProject(project); navigateTo('PROJECT_DETAILS'); }
    });
  });

  document.querySelectorAll<HTMLButtonElement>('.btn-delete').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = parseInt(btn.dataset.pid!);
      if (confirm('¿Eliminar este proyecto? Esta acción no se puede deshacer.')) {
        deleteProject(id);
      }
    });
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function escapeAttr(s: string): string {
  return s.replace(/"/g, '&quot;');
}

// ─── API Key Modal (multi-rol, ver screens/apiModal.ts) ─────────────────────

import { showApiKeyModal } from './apiModal';
export { showApiKeyModal };

// (bindApiModal eliminado en el Plan multi-rol: la lógica vive en screens/apiModal.ts)
