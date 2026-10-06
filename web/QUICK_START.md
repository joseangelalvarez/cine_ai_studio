# ⚡ Inicio Rápido – Cine AI Studio Web

**5 minutos y tienes la app corriendo.**

## 🔧 Requisitos Previos

- ✅ Node.js 18+ (instala desde https://nodejs.org/)
- ✅ Git (ya tienes)
- ✅ Una API key (te muestro cómo obtenerla)

## 📝 Paso 1: Abre la Terminal

1. Abre PowerShell (Windows) o Terminal (Mac/Linux)
2. Navega al proyecto:
   ```bash
   cd c:\Users\tu_usuario\Desktop\Cine_ai\web
   ```

## 🚀 Paso 2: Instala & Lanza

```bash
npm install
npm run dev
```

**Listo.** El navegador abre automáticamente en http://localhost:5173

## 🔑 Paso 3: Obtén una API Key (Elige UNA opción)

### Opción A: LocalAI (GRATIS, sin costo) 🎁

```bash
# 1. Descarga Ollama desde https://ollama.ai/download
# 2. Instala (next, next, finish)
# 3. Abre PowerShell y ejecuta:
ollama pull mistral
ollama serve
```

En otra terminal (sin cerrar la anterior):
```bash
cd web
npm run dev
```

En la app:
- Haz clic **"🔑 Cambiar proveedor"**
- Selecciona **"LocalAI / Ollama"**
- **No necesita API key**
- Click "Guardar"
- ¡Listo!

### Opción B: Mistral AI (RECOMENDADO) 🏆

Precio: $0.14/1M tokens (la más barata, buena calidad)

1. Ve a https://console.mistral.ai/
2. **Sign up** (crea cuenta)
3. Click **"API Keys"** → **"Create New Key"**
4. Copia tu key (empieza con `sk-...`)
5. En la app:
   - Haz clic **"🔑 Cambiar proveedor"**
   - Selecciona **"Mistral AI"**
   - Pega tu key en el campo "API Key"
   - Click **"Probar conexión"**
   - Si sale ✓ verde, click **"Guardar"**

### Opción C: Google Gemini (Gratis, con límite)

1. Ve a https://ai.google.dev/
2. Click **"Get API Key"**
3. Sigue pasos, obtén tu key
4. En la app, selecciona "Google Gemini" y pega la key

## 🎬 Paso 4: Crea tu Primer Proyecto

1. **Pantalla de inicio** → Click **"➕ Crear nuevo proyecto"**

2. **Paso 1: Detalles básicos**
   - Título: `Mi primera película`
   - Duración: `5 minutos`
   - Estilo: `Cinemático`
   - Click **"Siguiente"**

3. **Paso 2: Tu idea**
   - Idea: `Un detective investiga un crimen en una estación de trenes. Descubre que el culpable es alguien cercano.`
   - Proveedor: Debe mostrar tu proveedor elegido (Mistral, Gemini, etc.)
   - Click **"🚀 Generar preproducción"**

## ⏳ Paso 5: Observa la Magia ✨

Verás en tiempo real cómo 5 subagentes de IA trabajan:

1. **🎬 Showrunner** - Estructura general
2. **📝 Guionista** - Guión inicial
3. **🎭 Director de Escena** - Escenas y acción
4. **🎨 Director de Arte** - Atmósfera y locaciones
5. **👥 Character Designer** - Personajes

Cada uno genera contenido basado en el anterior. Espera ~30-60 segundos (depende del proveedor).

## 📂 Paso 6: Accede a tu Proyecto

Cuando termina:
- Click **"Abrir proyecto"** o
- Desde HOME → "Mis proyectos" → Tu proyecto

Aquí puedes:
- **Ver** entregables de cada agente
- **Re-generar** un agente específico
- **Editar** contenido manualmente
- **Exportar** (ver el menú)

## 🎛️ Cambiar de Proveedor en Cualquier Momento

1. Click **"🔑 Cambiar proveedor"** (disponible en cualquier pantalla)
2. Selecciona otro proveedor
3. Pega su API key
4. El próximo proyecto usará ese proveedor

## 💡 Tips

### Para Ahorrar Dinero
1. Usa **LocalAI** primero (es gratis, solo lento)
2. Cuando domines el flujo, cambia a **Mistral** (barato y rápido)
3. Prueba **OpenAI GPT-3.5** si necesitas scripts largos

### Problemas Comunes

**"Error: API Key no configurada"**
- ✅ Abre el panel 🔑, pega tu key, click "Probar conexión"

**"Network Error"**
- ✅ Revisa conexión a internet
- ✅ Si usas LocalAI: asegúrate que `ollama serve` está corriendo en otra terminal

**La app va lenta**
- ✅ Es normal (no es un problema)
- ✅ LocalAI más lento (tu PC hace el trabajo)
- ✅ Mistral/OpenAI más rápido (en la nube)

**Perdí mis proyectos**
- ⚠️ Se guardan en localStorage (navegador)
- ⚠️ Si limpias caché del navegador, se borran
- ✅ Próximas versiones: respaldo en la nube

## 📚 Documentación Completa

Si quieres más detalles:
- **[README.md](README.md)** - Características, instalación, estructura
- **[API_KEYS_GUIDE.md](API_KEYS_GUIDE.md)** - Paso a paso para cada proveedor
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Desplegar a producción

## 🛑 Detener la App

```bash
Ctrl + C  (en la terminal donde corre "npm run dev")
```

## 🎉 ¡Ya está!

Ahora tienes **Cine AI Studio** corriendo localmente con soporte para múltiples proveedores de IA.

¿Problemas? Abre DevTools (F12) y copia el error en la consola.

---

**Siguiente paso recomendado:**
1. Crea 2-3 proyectos diferentes
2. Prueba cambiar entre proveedores
3. Cuando quieras desplegar: mira [DEPLOYMENT.md](DEPLOYMENT.md)

¡Que disfrutes creando películas con IA! 🎬🤖✨
