# Cine AI Studio · Orquestación Multi-LLM y Pipeline Multimedia Real

Transformación completa de Cine AI Studio: sustitución de todas las simulaciones y mecanismos ficticios por una suite de preproducción cinematográfica basada en modelos fundacionales reales (Google Gemini, OpenAI, Anthropic), generación multimedia genuina (imágenes de personajes y fondos con Gemini Imagen / OpenAI, video con Google Veo y especificaciones cinematográficas para ByteDance Seedance 2.0, música con Lyria y voz con TTS).

## Decisiones Críticas y Preferencias del Usuario

> [!IMPORTANT]
> Decisiones y principios rectores confirmados durante la alineación:

- **Norma de Oro: Ni Inventar ni Alucinar**: La plataforma no generará contenidos de relleno simulados ni simulará ejecuciones de renderizado falsas. Si un modelo o API no está disponible o carece de clave configurada, el sistema lo indica con honestidad técnica y deshabilita la opción hasta que el proveedor esté activo.
- **Sustitución de Sora por Seedance 2.0**: Ante la inaccesibilidad de OpenAI Sora, se integra **ByteDance Seedance 2.0** como el motor multimodal de video de referencia para la compilación y exportación de prompts cinematográficos (consistencia de personajes entre tomas, movimientos de cámara direccionales y ratios anamórficos 2.39:1), conviviendo con Google Veo (`veo-3.1-generate-preview`) para la ejecución directa disponible vía servidor.
- **Eliminación Total de Mecánicas Simuladas**: Se suprimen por completo de la interfaz los contadores de créditos ficticios, los modales de pasarela de pago / paywall y el modal de publicación simulada en redes sociales. El estudio opera con métricas reales de tokens y costes directos.
- **Controles Multimedia con Verificación de Proveedor**: Las opciones de generación multimedia (retratos de personajes, fondos de set, clips de video y audio) se bloquean visualmente con insignias explicativas cuando sus respectivas claves API no están configuradas en el servidor.
- **Ejecución Completa de Extremo a Extremo (Fases F0 a F5)**: Despliegue integral unificado que abarca desde la purga de código simulado en el backend y frontend hasta la entrega de la nueva Galería de Producción multimedia.

---

## 1. Visión General y Concepto Central

### Qué Hace la Aplicación
Cine AI Studio es un sistema de orquestación cinematográfica profesional. A partir de una premisa y un estilo visual, coordina a 24 subagentes especializados distribuidos en 7 capas de producción (Showrunner, Guionista, Director de Arte, Diseñador de Personajes, Director de Fotografía, Diseñador de Sonido, Compositor Musical, etc.) utilizando llamadas reales a modelos de lenguaje avanzados.

Las biblias técnicas generadas por cada departamento son analizadas por un Compilador de Prompts especializado, que extrae directivas visuales, sonoras y de puesta en escena para sintetizar activos reales con modelos de imagen, video y audio.

### Público Objetivo
Directores de cine, showrunners, guionistas, realizadores audiovisuales y creadores de contenido que requieren coherencia de preproducción y materiales visuales auténticos sin lidiar con prompts genéricos o desconectados.

### Valor Principal
- **Cero Simulación**: Cada biblia de producción, diálogo, fotograma de referencia y clip audiovisual es generado por APIs reales.
- **Coherencia Interdepartamental**: Los rasgos fisiológicos del personaje y las paletas cromáticas definidas en la Capa 2 se trasladan directamente a los prompts de imagen y video de las escenas.
- **Transparencia Técnica**: Eliminación de campos duplicados y telemetría inventada.

---

## 2. Experiencia de Usuario y Diseño Visual

### Flujo de Usuario Principal

```
┌─────────────────┐       ┌────────────────────────┐       ┌─────────────────────────┐
│   Paso 1 del    │  ──>  │       Paso 2 del       │  ──>  │    Cola de Producción   │
│ Asistente (Idea │       │   Asistente (Estado    │       │ 24 Agentes Reales con   │
│  y Estilo Arte) │       │ Proveedores en Tiempo) │       │ Llamadas LLM en Directo │
└─────────────────┘       └────────────────────────┘       └─────────────────────────┘
                                                                        │
                                                                        ▼
┌─────────────────┐       ┌────────────────────────┐       ┌─────────────────────────┐
│    Pestaña 2:   │  <──  │  Pestaña 1: Biblias de │  <──  │  Pestaña 0: Galería de  │
│  Taller de      │       │ Producción (Árbol de   │       │ Producción (Imágenes,   │
│ Subagentes      │       │ Agentes y Modelos)     │       │ Video, Audio y Prompts) │
└─────────────────┘       └────────────────────────┘       └─────────────────────────┘
```

1. **Paso 1 del Asistente**: Título del proyecto, duración estimada y estilo artístico de referencia.
2. **Paso 2 del Asistente**: Premisa argumental y panel en tiempo real con el estado de los proveedores configurados (Google Gemini, OpenAI, Anthropic). El inicio requiere al menos un proveedor de texto activo.
3. **Ejecución Secuencial Real**: Progreso en vivo de las 7 capas y los 24 subagentes, mostrando tiempo de respuesta, tokens consumidos y modelo ejecutado.
4. **Pestaña 0 — Galería de Producción (Sustituye al Storyboard estático)**:
   - Galería de Activos Visuales: Hojas de personaje (turnarounds) y marcos conceptuales de escenarios generados con APIs de imagen.
   - Reproductores de Medios: Reproducción nativa de pistas de audio (TTS/foley), temas musicales (Lyria) y clips de previsualización (Veo).
   - Visor de Prompts Compilados: Inspección y copia de los prompts de difusión y video calculados para Seedance 2.0 y Google Veo.
5. **Pestaña 1 — Biblias de Producción**: Visualización limpia de los 24 departamentos con insignias de su modelo asignado (`gemini-3.8-flash`, `gpt-4o`, `claude-3-5-sonnet`) y contenido técnico editable.
6. **Pestaña 2 — Taller de Subagentes**: Entorno de pruebas y re-ejecución manual para ajustar prompts específicos sin controles redundantes.

### Identidad Visual y Estilo
- **Atmósfera**: Cuarto oscuro cinematográfico en alta fidelidad (`slate-950` de fondo, acentos en ámbar `amber-400`, bordes sutiles `slate-800`).
- **Disciplina Anti-Slop (Cero Pastillas Innecesarias)**: Los metadatos estáticos (modelo, tiempo, tokens) se muestran como texto tipográfico limpio separado por puntos medios (`·`), sin bordes tipo pastilla que sobrecarguen la lectura.
- **Cifras Tabulares**: Uso estricto de `font-mono` y cifras tabulares para tiempos de renderizado, consumo de tokens y costes en dólares.
- **Profundidad de Elevación Única**: Estructura de tarjetas plana y legible sin anidamientos innecesarios.

---

## 3. Decisiones de Producto y Compensaciones Técnicas

| Decisión | Enfoque Seleccionado | Justificación y Alternativas |
| :--- | :--- | :--- |
| **Integración de Seedance 2.0** | Sustitución de Sora por Seedance 2.0 de ByteDance para la compilación y exportación de video cinematográfico. | Seedance 2.0 ofrece consistencia de personajes en tomas múltiples y transiciones secuenciales; sustituye a Sora que ha dejado de estar accesible. |
| **Purga de Proyectos Semilla** | Eliminación de "El Último Operador" en `storage.ts`. La aplicación inicia limpia con guía para crear el primer proyecto. | Evita que la primera experiencia del usuario sea contenido simulado pregrabado. |
| **Matriz de Configuración (`cineai.config.json`)** | Archivo central en la raíz que mapea roles y tiers (`premium`, `standard`, `economic`) a modelos y proveedores. | Permite reconfigurar qué modelo ejecuta cada subagente sin alterar el código fuente. |
| **Proxy de Servidor para APIs** | Todas las llamadas a Gemini, OpenAI y Anthropic se resuelven en rutas de Express con variables de entorno del servidor. | Protege las claves API, evita bloqueos de CORS/iframes y centraliza la ingeniería de prompts. |
| **Supresión de Créditos Falsos** | Sustitución del contador ficticio por métricas reales de tokens y coste en USD calculado a partir del uso real. | Fomenta la transparencia y genera confianza profesional en la plataforma. |
| **Cola Asíncrona para Video y Audio** | Registro de trabajos en `.cineai/jobs.json` con sondeo (*polling*) desde el cliente y persistencia local en `public/output/`. | Soporta tareas de renderizado pesadas (Veo y Lyria de 30-90 segundos) sin agotar el tiempo de espera del navegador. |

---

## 4. Arquitectura Técnica y Estrategia de Datos

### Diagrama de Arquitectura del Sistema

```
┌────────────────────────────────────────────────────────────────────────┐
│                      Cliente React SPA (Frontend)                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────────────┐ │
│  │ Galería de       │  │ Pestañas de      │  │ Pantalla de Progreso  │ │
│  │ Producción Tab 0 │  │ Biblias y Taller │  │ de 24 Subagentes      │ │
│  └─────────┬────────┘  └────────┬─────────┘  └───────────┬───────────┘ │
└────────────┼────────────────────┼────────────────────────┼─────────────┘
             │ Peticiones HTTP / JSON                      │
             ▼                                             ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Servidor Express (server.ts)                      │
│                                                                        │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────────────┐ │
│  │ /api/config      │  │ /api/orchestrate │  │ /api/generate/*       │ │
│  │ Estado Claves    │  │ Motor Multi-LLM  │  │ Generadores Imagen,   │ │
│  │ y Mapeo Modelos  │  │ (Gemini/GPT/Clau)│  │ Video, Audio, Música  │ │
│  └─────────┬────────┘  └────────┬─────────┘  └───────────┬───────────┘ │
│            │                    │                        │             │
│            ▼                    ▼                        ▼             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────────────┐ │
│  │ cineai.config    │  │ Compilador Real  │  │ Motor de Trabajos y   │ │
│  │ (Veo + Seedance) │  │ Prompts Difusión │  │ Archivos en /output   │ │
│  └──────────────────┘  └──────────────────┘  └───────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

### Módulos del Servidor y Responsabilidades

1. **`server/config.ts`**:
   - Carga y valida credenciales en `.env` (`GEMINI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`).
   - Lee `cineai.config.json` y resuelve el proveedor/modelo para cada agente. Configura el perfil de video para Google Veo (`veo-3.1-generate-preview`) y el perfil de exportación para Seedance 2.0.
   - Expone la disponibilidad de servicios en `GET /api/config` sin revelar las claves privadas.
2. **`server/llm.ts`**:
   - Capa unificada para `@google/genai`, `openai` y `@anthropic-ai/sdk`.
   - Devuelve `{ text, usage: { inputTokens, outputTokens }, model, provider, latencyMs, costUsd }`.
   - Implementa reintentos exponenciales para errores transitorios de cuota y red.
3. **`server/promptCompiler.ts`**:
   - Analiza las memorias de `CHARACTER_DESIGNER`, `PRODUCTION_DESIGNER`, `DOP` y `GUIONISTA`.
   - Compila prompts optimizados según la sintaxis requerida por cada motor de difusión de imágenes y por los motores de video (parámetros de movimiento de cámara, iluminación anamórfica y tokens de continuidad para **Seedance 2.0** y **Google Veo**).
4. **`server/media/`**:
   - `image.ts`: Generación con Gemini Imagen 3 / Flash Image o OpenAI Images, guardando en `public/output/<projectId>/characters/` y `backgrounds/`.
   - `audio.ts`: Síntesis de voz con TTS para diálogos y foley.
   - `music.ts`: Composición de pistas breves con Lyria.
   - `video.ts`: Gestión de trabajos asíncronos con Google Veo y descarga del archivo MP4 final.
5. **`server/jobs.ts`**:
   - Registro en disco `.cineai/jobs.json` con estados (`queued`, `processing`, `completed`, `failed`).

---

## 5. Fases de Ejecución Detalladas

- **Fase 0 — Purga de Simulación y Limpieza**:
  - Eliminar generadores simulados en `server.ts` y rama `useSimulation`.
  - Retirar proyectos ficticios pregrabados de `storage.ts`.
  - Suprimir componentes y enlaces de créditos falsos, paywall y redes sociales.
- **Fase 1 — Configuración y Motor Multi-LLM**:
  - Crear `cineai.config.json` e instalar SDKs necesarios (`@anthropic-ai/sdk`, `openai`).
  - Implementar `server/config.ts` y `server/llm.ts`.
  - Conectar los endpoints `/api/config` y `/api/orchestrate` con métricas de tokens reales.
- **Fase 2 — Compilador de Prompts y Generación de Imágenes**:
  - Desarrollar `server/promptCompiler.ts` con targets de imagen y perfiles de video para Seedance 2.0 y Veo.
  - Implementar `server/media/image.ts`.
  - Transformar la Pestaña 0 en la Galería de Producción con visualización de fotogramas e imágenes reales.
- **Fase 3 — Pipeline de Audio y Música**:
  - Implementar síntesis de voz con TTS y música con Lyria en `server/media/`.
  - Incorporar reproductores de audio en la Galería de Producción.
- **Fase 4 — Motor Asíncrono de Video con Veo y Exportación a Seedance 2.0**:
  - Implementar el ciclo de vida de trabajos asíncronos para Veo en `server/media/video.ts` y `server/jobs.ts`.
  - Incorporar compilación y exportación de tomas multi-escena con especificaciones de movimiento de cámara para Seedance 2.0.
  - Mostrar reproductores de video reales en los planos de la escena.
- **Fase 5 — Consolidación de Interfaz y Documentación**:
  - Refinar las Pestañas 1 y 2, actualizando la visualización de subagentes.
  - Sincronizar la documentación (`README.md` y `STACK_TECNOLOGICO.md`) con el estado real de la arquitectura.
