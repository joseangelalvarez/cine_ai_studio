# Cine AI Studio (React & TypeScript)

Orquestador de cine con subagentes de IA especializados por departamento y memoria central compartida.

Reescrito desde la versión Android original a una aplicación web moderna en React, TypeScript y Tailwind CSS con soporte para Gemini API y modo de simulación offline resiliente (L5).

## Características principales

- **7 Capas de Producción & 24 Subagentes Especializados**:
  - **Capa 0 – Orquestador General**: Director Ejecutivo / Showrunner IA
  - **Capa 1 – Narrativa**: Guionista Principal, Script Doctor, Continuista, Director de Escena
  - **Capa 2 – Visual**: Director de Arte, Diseñador de Personajes, Supervisor de Personajes, Diseñador de Producción, DoP, Gaffer, Storyboarder, Layout Artist
  - **Capa 3 – Animación y VFX**: Animador Líder, Animador Secundario, Supervisor de Coherencia Temporal, Supervisor VFX, Director Técnico de Simulación
  - **Capa 4 – Sonido**: Compositor Musical, Diseñador de Sonido, Mezclador de Audio
  - **Capa 5 – Postproducción**: Editor/Montador, Colorista, Supervisor de Mastering
  - **Capa 6 – Producción y Control**: Jefe de Producción, Coordinador de Pipeline, Control de Calidad
- **Asistente de Creación Paso a Paso**: Configuración de título, duración aproximada, estilo visual e idea base cinematográfica.
- **Flujo de Ejecución Reactivo**: Medidor de progreso en tiempo real con indicador porcentual, gestión de errores con fallback a simulación segura y confirmación de renderizado audiovisual interactivo.
- **Storyboard & Extracción de Prompts**: Prompts optimizados para generadores externos de video (Runway Gen-3, Luma Dream Machine, Kling AI, Sora) con previsualización de encuadres y copia al portapapeles.
- **Gestión de Memoria Central & Versionado**: Auditoría de revisiones históricas de la biblia del proyecto, logs de ejecución y métricas de telemetría.
- **Edición con Actualización en Cascada**: Modificaciones a cualquier departamento propagan automáticamente la consistencia a los orquestadores dependientes posteriores.
- **Control de Créditos & Estado Pro**: Sistema integrado de créditos por ejecución y pantalla de desbloqueo premium.

## Ejecución Local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo en puerto 3000
npm run dev

# Compilar para producción
npm run build
```
