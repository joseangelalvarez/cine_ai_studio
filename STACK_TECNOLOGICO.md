# 🎬 Stack Tecnológico — Cine AI Studio (v2.0 · oct 2026)

**Proyecto**: Orquestador de cine con 24 subagentes IA especializados, memoria central y **asignación de modelos por rol de producción**. Arquitectura desacoplada: Web (orquestación) + helper Node local (motores) + Android (nativa).

---

## 1️⃣ Aplicación Web (`web/`) — Núcleo de orquestación

| Capa | Tecnología | Versión | Notas |
|------|-----------|---------|-------|
| Lenguaje | TypeScript (strict) | ~6.0.2 | 0 errores, 19 módulos |
| UI | Vanilla TS + CSS propio | — | Tema oscuro cinematográfico, sin framework |
| Estado | Patrón Observer propio (`store.ts`) | — | *zustand figura en package.json pero no se usa — candidato a limpiar* |
| Build | Vite + Terser | ^8.0.12 / ^5.48 | ~22 KB gzip |
| HTTP | Fetch nativa | — | Gateway + cliente del helper |
| Persistencia | localStorage | — | Migraciones automáticas (roles, sanitización anti-404) |

### 🎛️ Configurador multi-rol (`src/screens/apiModal.ts`)
4 pestañas: 🧠 Orquestadores (tier premium/estándar/económico + overrides por agente) · 🎬 Video · 👤 Personajes · 🔍 QA. Incluye **descubridor de modelos** (`GET /v1beta/models`) que lista los IDs reales disponibles con tu key.

### 🧭 Enrutador (`src/gateway.ts`)
`Agente → override individual → tier heredado → Gemini` con reintento automático ante 429/5xx y errores accionables por código HTTP (404/401/403/429).

### 🧠 Subagentes (`src/subagents.ts`)
24 agentes en 7 capas + `SUBAGENT_TIERS`:
- **Premium** (`gemini-3.8-flash`): Showrunner, Guionista, Script Doctor
- **Estándar** (`gemini-3.7-flash`): arte, storyboard, sonido, edición…
- **Económico** (`gemini-flash-latest`): producción, QA doc, marketing

---

## 2️⃣ Capa de IA — Solo Google (1 sola API key) 🔑

| Rol | Motor | ID verificado |
|-----|-------|---------------|
| 🧠 Orquestadores | Gemini Flash | `gemini-3.8-flash` · `gemini-3.7-flash` · `gemini-3.6-flash` · `gemini-flash-latest` |
| 🎬 Render video (cloud) | **Veo 3.1** | `veo-3.1-generate-preview` — clips de 8s, audio nativo, hasta 4K, imagen→video |
| 🎬 Render video (cloud) | Gemini Omni Flash | ID resuelto en runtime por el descubridor |
| 👤 Personajes | **Nano Banana** | `gemini-3.1-flash-image` — generación/edición con consistencia |
| 🔍 Juez QA visual | Gemini | Video MP4 nativo (Files API) · `mediaResolution: 'low'` en Gemini 3 |
| 🎬 Motores locales | AnimateDiff · Wan2.2 · LTX 2.3 · Ollama | Vía helper, sin coste de API |

---

## 3️⃣ Helper local (`web/helper/`) — Node.js zero-dependency 🖥️

| Módulo | Función |
|--------|---------|
| `video-helper.mjs` | Servidor HTTP `127.0.0.1:8787`: descarga de modelos HF · `POST /workflows/generate` (render + **bucle QA** con reintentos y fusión de prompts) · `POST /qa/analyze` · `POST /images/generate` · estático `/output/` · CLI (`serve`, `qa-visual`, `save-gemini-key`, `list-models`…) |
| `visual-qa.mjs` | Juez Gemini: Files API resumable (2 pasos + poll a ACTIVE), JSON defensivo con esquema, safety-block → skipped, `try/finally` con borrado del archivo, AbortController en todas las llamadas |
| `cloud-render.mjs` | Veo 3.1 (`predictLongRunning` → poll 10s → descarga MP4) · Nano Banana (`responseModalities: IMAGE` → PNG) |
| `video-workflows.mjs` | Detección de motores locales (AnimateDiff/Ollama/ffmpeg) |

**QA visual (tri-estado)**: `approved` ✅ · `rejected` ⚠️ (conservado con observaciones tras máx. 3 intentos) · `skipped` ⏭️ (auditoría no disponible — **nunca** cuenta como aprobado). Trazabilidad en `qa.json` junto a cada clip. Clip de prueba: `.cineai/video-models/sample_qa_test.mp4`.

**Requisitos del sistema**: Node 18+ · Python + `animatediff-cli` (motores locales) · ⚠️ ffmpeg no instalado (necesario para ensamblar tomas).

---

## 4️⃣ App Android (`app/`) — interfaz nativa

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Lenguaje | Kotlin | 2.2.10 |
| UI | Jetpack Compose + Material 3 (BOM) | 2024.09.00 |
| Arquitectura | MVVM (ViewModel + Lifecycle) | 2.8.7 |
| IA | Firebase AI → Gemini API (BOM) | 34.12.0 |
| Persistencia | Room + KSP | 2.7.0 / 2.3.5 |
| Red | Retrofit + OkHttp + Moshi (codegen) | 2.12 / 4.10 / 1.15.2 |
| Imágenes | Coil Compose | 2.7.0 |
| Async | Kotlin Coroutines | 1.10.2 |
| Build | Android Gradle Plugin + Gradle KTS + Secrets (.env) | AGP 9.1.1 |
| Tests | JUnit 4 · Robolectric 4.16 · **Roborazzi** 1.59 · Espresso | — |
| SDK | minSdk 24 · target/compile 36 | — |

---

## 5️⃣ Infraestructura y seguridad

- **Deploy documentado** (`web/DEPLOYMENT.md`): frontend Vercel (HTTPS) + backend Express/Railway como proxy seguro de keys.
- **Gestión de keys**: `.env` de la raíz (`GEMINI_API_KEY`) o `node helper/video-helper.mjs save-gemini-key` — el juez QA y los motores cloud corren **siempre server-side** (el navegador nunca ve la key del helper).
- **Docs vivas**: `web/ARQUITECTURA.md` (multi-rol, QA visual, solo-Google) · `web/QUICK_START.md` · `web/API_KEYS_GUIDE.md`.

## 📊 Diagrama de flujo

```
Wizard (idea) ──▶ 24 SUBAGENTES (tiers: 3.8 / 3.7 / flash-latest, retry 429)
                        │ memoria central (localStorage)
                        ▼
        ROL 🎬 videoRender ──────────────────────────────┐
        local: AnimateDiff / Wan / LTX (helper)           │
        cloud: Veo 3.1 / Omni Flash (operación + poll) ◀──┘
                        ▼
        🔍 VISUAL_QA (Gemini, MP4 nativo) ── rechazado ──▶ fusión prompts + negativos ──▶ reintento (máx. 3)
                        │ aprobado / skipped
                        ▼
        👤 Personajes: Nano Banana (/images/generate) · Ensamblado (ffmpeg) · servicio /output/
```

## 📋 Delta respecto al stack v1 (inicio de la sesión)

| Cambio | Motivo |
|--------|--------|
| ➕ Configurador multi-rol con tiers y overrides | Una producción usa modelos distintos por tarea |
| ➕ QA visual con juez Gemini (bucle generar→auditar→refinar) | Comportamiento iterativo "estilo Astra" |
| ➕ Veo 3.1 y Nano Banana operativos en el helper | Generación cloud real (IDs verificados) |
| ➖ 8 proveedores de texto eliminados | Decisión del usuario: solo Google (GLM además sin saldo y bloqueado por CORS en navegador) |
| 🔧 Fixes: foco del wizard paso 2 · 404 por `gemini-3.5-flash-latest` (ID inexistente) | Bugs reportados y resueltos |

---

*Cine AI Studio — v2.0 · octubre 2026 · Web + Helper + Android · Solo Google Gemini*

