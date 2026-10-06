# 📑 Índice de Documentación – Cine AI Studio Web

## 🚀 Para Empezar Ahora Mismo

👉 **[QUICK_START.md](QUICK_START.md)** — 5 minutos y tienes todo corriendo
- Requisitos mínimos
- Instalación paso a paso
- Obtener API key (8 opciones)
- Crear primer proyecto

---

## 📚 Documentación Completa

### Para Usuarios Finales

| Documento | Contenido | Leer si... |
|-----------|----------|-----------|
| **[QUICK_START.md](QUICK_START.md)** | Setup en 5 min + primer proyecto | Es tu primera vez |
| **[README.md](README.md)** | Características, instalación, troubleshooting | Quieres detalles técnicos |
| **[API_KEYS_GUIDE.md](API_KEYS_GUIDE.md)** | Paso a paso para obtener API keys de 8 proveedores | Necesitas cambiar de proveedor |

### Para Desarrolladores

| Documento | Contenido | Leer si... |
|-----------|----------|-----------|
| **[DEPLOYMENT.md](DEPLOYMENT.md)** | Deploy a producción (Vercel + Railway + Express) | Quieres desplegar |
| **[STATUS.md](STATUS.md)** | Estado actual, métricas, checklist | Quieres revisar completitud |

---

## 🎬 Flujo de Uso

### 1️⃣ Primero: Obtener API Key
Ver **[QUICK_START.md](QUICK_START.md) → Paso 3**

**Opciones rápidas**:
- **LocalAI** (GRATIS 🎁) → [API_KEYS_GUIDE.md](API_KEYS_GUIDE.md#opción-1-localai-gratis-sin-internet)
- **Mistral** (🏆 recomendado) → [API_KEYS_GUIDE.md](API_KEYS_GUIDE.md#opción-2-mistral-ai-recomendado)

### 2️⃣ Segundo: Lanzar la App
Ver **[QUICK_START.md](QUICK_START.md) → Paso 2**

```bash
cd web
npm install
npm run dev
```

### 3️⃣ Tercero: Crear Proyecto
Ver **[QUICK_START.md](QUICK_START.md) → Paso 4**

1. Wizard paso 1: Título + duración + estilo
2. Wizard paso 2: Idea + generar

### 4️⃣ Cuarto (Opcional): Desplegar
Ver **[DEPLOYMENT.md](DEPLOYMENT.md)**

---

## 🏗️ Estructura de Archivos

```
web/
├── 📄 QUICK_START.md       ← EMPIEZA AQUÍ (5 minutos)
├── 📄 README.md            ← Características y setup detallado
├── 📄 API_KEYS_GUIDE.md    ← Cómo obtener API keys
├── 📄 DEPLOYMENT.md        ← Desplegar a producción
├── 📄 STATUS.md            ← Estado del proyecto
├── 📄 ARQUITECTURA.md      ← Este archivo (índice)
│
├── 📂 src/
│   ├── main.ts             (Enrutador principal)
│   ├── store.ts            (Estado global + lógica)
│   ├── gateway.ts          (Llamadas a 8 APIs)
│   ├── storage.ts          (localStorage)
│   ├── types.ts            (Interfaces TypeScript)
│   ├── constants.ts        (Catálogo de proveedores)
│   ├── subagents.ts        (24 subagentes)
│   ├── style.css           (Tema oscuro)
│   └── 📂 screens/
│       ├── home.ts         (Home, wizard, modal API)
│       ├── progress.ts     (Generación en tiempo real)
│       └── project.ts      (Detalles del proyecto)
│
├── 📂 dist/                (Build optimizado)
│   ├── index.html
│   └── assets/
│       ├── index-*.js      (14.62 KB gzip)
│       └── index-*.css     (2.35 KB gzip)
│
├── 📄 index.html
├── 📄 package.json
├── 📄 tsconfig.json
└── 📄 vite.config.ts
```

---

## 🔍 Componentes Principales

### Capas de Aplicación

```
┌─────────────────────────────────────┐
│  main.ts (Router)                   │ ← Punto de entrada
│  Mapea pantalla → render/bind()     │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  screens/ (Vistas)                  │ ← 5 pantallas
│  home.ts, progress.ts, project.ts   │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  store.ts (Estado)                  │ ← Subscribe pattern
│  Observable global de la app        │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  gateway.ts (APIs)                  │ ← 8 proveedores
│  Llamadas unificadas                │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  storage.ts (Persistencia)          │ ← localStorage
│  Salva/carga proyectos              │
└─────────────────────────────────────┘
```

### Módulos de Datos

- **types.ts** → Interfaces TS (MovieProject, SubagentState, etc.)
- **constants.ts** → Catálogo de 8 proveedores + opciones UI
- **subagents.ts** → Definición de 24 agentes + capas

### Generación de Contenido

```
Usuario crea proyecto
    ↓
store.startAutomaticSequence()
    ↓
Loop: Para cada subagente en capas 0-2
    ├─ SHOWRUNNER (capa 0)
    ├─ GUIONISTA (capa 1)
    ├─ DIRECTOR_ESCENA (capa 1)
    ├─ DIRECTOR_ARTE (capa 2)
    └─ CHARACTER_DESIGNER (capa 2)
    ↓
Para cada agente:
    ├─ Obtener contexto previo (accumulated prompt)
    ├─ Llamar a gateway.executeAIRequest()
    ├─ Guardar resultado en storage (memory)
    └─ Actualizar UI (progress bar)
    ↓
Proyecto completado
    (Usuario puede re-generar agentes individuales)
```

---

## 💡 Casos de Uso

### Caso 1: Soy Usuario Final
1. Abre [QUICK_START.md](QUICK_START.md)
2. Sigue los 6 pasos
3. ¡Listo! Crea tu primer proyecto

### Caso 2: Quiero Cambiar de Proveedor
1. En cualquier pantalla, click "🔑 Cambiar proveedor"
2. Selecciona proveedor
3. Ver [API_KEYS_GUIDE.md](API_KEYS_GUIDE.md) para obtener key
4. Pega key y prueba conexión
5. El próximo proyecto usará ese proveedor

### Caso 3: Necesito Desplegar a Producción
1. Lee [DEPLOYMENT.md](DEPLOYMENT.md)
2. Deploy frontend a Vercel
3. (Opcional) Deploy backend a Railway
4. Configura variables de entorno

### Caso 4: Quiero Entender la Arquitectura
1. Lee [STATUS.md](STATUS.md) → "Stack Técnico"
2. Lee [README.md](README.md) → "Estructura de Archivos"
3. Lee este archivo → "Componentes Principales"

---

## 🛠️ Comandos Útiles

```bash
# Desarrollo
npm run dev          # Lanza servidor local (http://localhost:5173)

# Producción
npm run build        # Compila para producción
npm run preview      # Previsualiza build

# Limpieza
npm cache clean --force
rm -rf node_modules && npm install
```

---

## ❓ Preguntas Frecuentes

### "¿Cuál es el mejor proveedor?"
→ **Mistral** ($0.14/1M) es la opción recomendada
→ **LocalAI** es gratis si tu PC aguanta

### "¿Mis proyectos se guardan en la nube?"
→ No, se guardan localmente en tu navegador (localStorage)
→ Ver DEPLOYMENT.md para agregar sincronización en la nube

### "¿Puedo usar sin API key?"
→ Sí, con **LocalAI/Ollama** (descarga desde ollama.ai)
→ Corre completamente local, sin costos

### "¿Es seguro guardar mi API key?"
→ En desarrollo: se guarda en localStorage (seguridad básica)
→ En producción: usar backend (ver DEPLOYMENT.md)

### "¿Funciona en móvil?"
→ Sí, es responsive
→ Para mejor UX, considera versión nativa (React Native)

---

## 📞 Ayuda

| Problema | Solución |
|----------|----------|
| "API Key error" | Ver [QUICK_START.md](QUICK_START.md) → Problemas Comunes |
| "Network error" | Ver [README.md](README.md) → Troubleshooting |
| "¿Cómo cambiar provider?" | Ver [API_KEYS_GUIDE.md](API_KEYS_GUIDE.md) |
| "Quiero desplegar" | Ver [DEPLOYMENT.md](DEPLOYMENT.md) |
| "El código es lento" | Normal si usas LocalAI; prueba Mistral en la nube |

---

## 🤖 Control de Calidad Visual (Visual QA) — Plan v3.1

El orquestador incorpora el **subagente VISUAL_QA** (Capa 5 – Postproducción) que audita los clips generados con un **juez multimodal Gemini** (video input nativo vía Files API) y relanza el render con prompts refinados hasta `maxAttempts` (default 3).

### Flujo
```
POST /workflows/generate { qa: { enabled, provider:'gemini', model, maxAttempts } }
   → render AnimateDiff → subida MP4 (resumable, 2 pasos) → poll hasta ACTIVE
   → generateContent (part de video primero + prompt JSON al final)
   → approved ? ✓ : fusionar refinamientos + negativos acumulados (dedupe) y reintentar
   → qa.json junto al clip · GET /workflows/progress expone { attempt, qaStatus, qaCriticism }
```

### Estado de aprobación (tri-estado)
| qaStatus | Significado |
|----------|-------------|
| `approved` | El juez validó el clip |
| `rejected` | Conservado con observaciones tras agotar intentos |
| `skipped` | Auditoría no disponible (error de API o bloqueo de seguridad) — **nunca** cuenta como aprobado |

### Archivos clave
- `helper/visual-qa.mjs` — juez Gemini (zero-dependency, fetch nativo): `loadGeminiKey`, `uploadVideoToGemini` (resumable + poll), `geminiVisualQA` (try/finally con `files.delete`), `composePrompt` (fusión con dedupe, nunca reemplaza el prompt base).
- `helper/video-helper.mjs` — `runGenerationPipeline` (bucle con reintentos y salida segura), `renderAnimatediffClip` compartido, `POST /qa/analyze` (re-auditar clips existentes), CLI `qa-visual` y `save-gemini-key`.
- `src/screens/video.ts` — toggle de QA, progreso por intento y persistencia en la memoria del proyecto (clave `VISUAL_QA`).

### API key del juez (solo server-side)
```bash
# Opción A: .env de la raíz del proyecto
GEMINI_API_KEY=...

# Opción B: archivo gestionado por el helper
node helper/video-helper.mjs save-gemini-key '{"key":"..."}'
```

### Proveedores (oct 2026 — decisión del usuario)
- **Solo Google Gemini**: una única API key cubre orquestadores (texto), Veo 3.1 (video), Nano Banana (personajes) y el juez QA. El resto de proveedores (GLM, OpenAI, Mistral, Claude, Cohere, HF, Perplexity, Ollama) fue eliminado del catálogo.
- El QA usa `mediaResolution: 'low'` solo en modelos Gemini 3 (para video, low ≡ medium a 70 tokens/frame).
- **MP4 de prueba**: `.cineai/video-models/sample_qa_test.mp4` (Big Buck Bunny 10s) para auditar con `POST /qa/analyze` o `qa-visual` sin generar video.

---

## 🎛️ Configurador Multi-Rol (Plan multi-rol)

El usuario asigna **un modelo de IA distinto a cada parte de la producción** desde el modal 🎛️ (antes 🔑 Cambiar proveedor):

| Pestaña | Rol | Opciones (todas Google, decisión del usuario) |
|---------|-----|---------------------|
| 🧠 Orquestadores | Texto por **tier** (premium/estándar/económico) + overrides individuales | Solo Gemini: `gemini-3.8-flash` · `gemini-3.7-flash` · `gemini-3.6-flash` · `gemini-flash-latest` |
| 🎬 Video | `videoRender` | **Veo 3.1** (`veo-3.1-generate-preview`, 8s+audio, hasta 4K) · Gemini Omni Flash (ID vía descubridor) · motores locales (AnimateDiff/Wan/LTX/Ollama) |
| 👤 Personajes | `characterRender` | **Nano Banana** (`gemini-3.1-flash-image`) |
| 🔍 QA | `visualQA` | Gemini (video input nativo) |

### Enrutamiento de 3 niveles
```
Subagente → override individual → tier heredado → DEFAULT_ROLES
         → reintento automático ante 429/5xx (3s de espera)
```
- Tiers por defecto: `SUBAGENT_TIERS` en `subagents.ts` (premium: Showrunner/Guionista/ScriptDoctor · economy: Producer/QA/Marketing · resto estándar).
- `gateway.executeSubagentRequest()` implementa la cadena; `startAutomaticSequence` la usa para los 24 agentes.
- **Descubridor anti-404**: botón «🔎 Descubrir modelos Gemini» → `GET /v1beta/models` con tu key (lista IDs reales de Veo/Nano Banana/Omni Flash).

### Motores en la nube (helper, zero-dependency)
- `helper/cloud-render.mjs` → `renderWithVeo` (predictLongRunning → poll 10s → descarga MP4 a `/output/`) y `generateCharacterImageGemini` (responseModalities IMAGE → PNG en `characters/`).
- `POST /workflows/generate` acepta `model` (rol videoRender); `POST /images/generate` sirve el rol characterRender.
- Migración automática en `loadApiSettings()`: siembra `roles`/`roleOverrides` desde defaults sin perder keys.

---

## 📊 Versión & Status

| Aspecto | Estado |
|--------|--------|
| **Funcionalidad** | ✅ Completa |
| **Testing** | ✅ Build OK, compilación OK |
| **Documentación** | ✅ Exhaustiva (4 docs) |
| **Performance** | ✅ 14.62 KB gzip |
| **Production Ready** | ✅ SÍ |

---

## 🎬 Siguiente Paso

👉 **[QUICK_START.md](QUICK_START.md)** ← Empieza aquí en 5 minutos

---

*Cine AI Studio – Web Edition v1.0.0*  
*Production Ready* ✅
