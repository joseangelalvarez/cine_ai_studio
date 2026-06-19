package com.example.ui.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.example.data.api.RetrofitClient
import com.example.data.database.AppDatabase
import com.example.data.database.MovieProject
import com.example.data.database.MovieProjectRepository
import com.example.data.database.ProjectMemory
import com.example.data.model.CinemaSubagent
import com.example.data.model.CinemaSubagentsCatalog
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

sealed interface GenerationState {
    object Idle : GenerationState
    object Loading : GenerationState
    data class Success(val response: String) : GenerationState
    data class Error(val message: String) : GenerationState
}

class MovieProjectViewModel(application: Application) : AndroidViewModel(application) {

    private val database = AppDatabase.getDatabase(application)
    private val repository = MovieProjectRepository(database.movieProjectDao())

    // Proyectos de cine
    val allProjects: StateFlow<List<MovieProject>> = repository.allProjects
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Proyecto actualmente seleccionado
    private val _selectedProject = MutableStateFlow<MovieProject?>(null)
    val selectedProject: StateFlow<MovieProject?> = _selectedProject.asStateFlow()

    // Memoria central compartida (registros del proyecto seleccionado)
    val projectMemories: StateFlow<List<ProjectMemory>> = _selectedProject
        .flatMapLatest { project ->
            if (project != null) {
                repository.getMemories(project.id)
            } else {
                flowOf(emptyList())
            }
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Subagente seleccionado de los 24
    private val _selectedSubagent = MutableStateFlow<CinemaSubagent?>(CinemaSubagentsCatalog.list.firstOrNull())
    val selectedSubagent: StateFlow<CinemaSubagent?> = _selectedSubagent.asStateFlow()

    // Estados de cada subagente en la cascada actual: "PENDING", "RUNNING", "COMPLETED", "PAUSED_EXPENSIVE", "ERROR"
    private val _subagentStates = MutableStateFlow<Map<String, String>>(emptyMap())
    val subagentStates: StateFlow<Map<String, String>> = _subagentStates.asStateFlow()

    // Variable coroutine para control de la cascada
    private var cascadeJob: kotlinx.coroutines.Job? = null

    // Input del usuario en la consola de orquestación
    private val _promptInput = MutableStateFlow("")
    val promptInput: StateFlow<String> = _promptInput.asStateFlow()

    // Estado de generación de entregable técnico
    private val _generationState = MutableStateFlow<GenerationState>(GenerationState.Idle)
    val generationState: StateFlow<GenerationState> = _generationState.asStateFlow()

    // Control de ventanas modales / diálogos
    var isCreatingProjectDialogVisible = MutableStateFlow(false)

    // Tarifas y categorías de los orquestadores costosos
    fun getSubagentCostInfo(key: String): String? {
        return when (key) {
            "DIRECTOR_ARTE" -> "Costo estimado: $0.03 USD (Categoría IMAGEN/Moodboard)"
            "CHARACTER_DESIGNER" -> "Costo estimado: $0.04 USD (Categoría IMAGEN/Fichas)"
            "STORYBOARD" -> "Costo estimado: $0.08 USD (Categoría IMAGEN/Secuencia)"
            "LEAD_ANIMATOR" -> "Costo estimado: $0.25 USD (Categoría VIDEO/Mochi-1 Heavy)"
            "SEC_ANIMATOR" -> "Costo estimado: $0.15 USD (Categoría VIDEO/Physics)"
            "VFX_SUPERVISOR" -> "Costo estimado: $0.20 USD (Categoría VIDEO/VFX Particle)"
            "COMPOSER" -> "Costo estimado: $0.10 USD (Categoría MÚSICA/Score)"
            "SOUND_DESIGNER" -> "Costo estimado: $0.05 USD (Categoría AUDIO/Foley Cue)"
            "MIXER" -> "Costo estimado: $0.03 USD (Categoría AUDIO/Atmos Surround)"
            else -> null
        }
    }

    fun isSubagentExpensive(key: String): Boolean {
        return getSubagentCostInfo(key) != null
    }

    // --- FLUJO DE HISTORIAL / STORYBOARD EN CASCADA ---
    private val _videoIdeaState = MutableStateFlow("")
    val videoIdeaState: StateFlow<String> = _videoIdeaState.asStateFlow()

    private val _shortFilmDuration = MutableStateFlow("3 minutos")
    val shortFilmDuration: StateFlow<String> = _shortFilmDuration.asStateFlow()

    private val _actsStructure = MutableStateFlow("")
    val actsStructure: StateFlow<String> = _actsStructure.asStateFlow()

    private val _generatedStoryboard = MutableStateFlow("")
    val generatedStoryboard: StateFlow<String> = _generatedStoryboard.asStateFlow()

    private val _directorConsistencyReport = MutableStateFlow("")
    val directorConsistencyReport: StateFlow<String> = _directorConsistencyReport.asStateFlow()

    private val _storyboardWorkflowState = MutableStateFlow("IDLE") // IDLE, GENERATING, AWAITING_APPROVAL, APPROVED, ERROR
    val storyboardWorkflowState: StateFlow<String> = _storyboardWorkflowState.asStateFlow()

    private val _storyboardWorkflowError = MutableStateFlow("")
    val storyboardWorkflowError: StateFlow<String> = _storyboardWorkflowError.asStateFlow()

    init {
        // Al iniciar, si hay proyectos, seleccionamos el primero por defecto
        viewModelScope.launch {
            allProjects.collectLatest { list ->
                if (list.isNotEmpty() && _selectedProject.value == null) {
                    selectProject(list.first())
                }
            }
        }
    }

    fun selectProject(project: MovieProject) {
        _selectedProject.value = project
        _generationState.value = GenerationState.Idle
        loadStoryboardWorkflowData(project.id)
    }

    fun loadStoryboardWorkflowData(projectId: Int) {
        viewModelScope.launch(Dispatchers.IO) {
            val stateMem = repository.getMemoryByKey(projectId, "STORYBOARD_WORKFLOW_STATE")
            val ideaMem = repository.getMemoryByKey(projectId, "STORYBOARD_WORKFLOW_IDEA")
            val durationMem = repository.getMemoryByKey(projectId, "STORYBOARD_WORKFLOW_DURATION")
            val actsMem = repository.getMemoryByKey(projectId, "STORYBOARD_WORKFLOW_ACTS")
            val storyboardMem = repository.getMemoryByKey(projectId, "STORYBOARD_WORKFLOW_STORYBOARD")
            val consistencyMem = repository.getMemoryByKey(projectId, "STORYBOARD_WORKFLOW_CONSISTENCY")

            _storyboardWorkflowState.value = stateMem?.content ?: "IDLE"
            _videoIdeaState.value = ideaMem?.content ?: ""
            _shortFilmDuration.value = durationMem?.content ?: "3 minutos"
            _actsStructure.value = actsMem?.content ?: ""
            _generatedStoryboard.value = storyboardMem?.content ?: ""
            _directorConsistencyReport.value = consistencyMem?.content ?: ""
        }
    }

    fun updateVideoIdea(text: String) {
        _videoIdeaState.value = text
        val project = _selectedProject.value ?: return
        viewModelScope.launch(Dispatchers.IO) {
            repository.insertMemory(
                ProjectMemory(
                    projectId = project.id,
                    key = "STORYBOARD_WORKFLOW_IDEA",
                    title = "Idea",
                    content = text
                )
            )
        }
    }

    fun updateShortFilmDuration(text: String) {
        _shortFilmDuration.value = text
        val project = _selectedProject.value ?: return
        viewModelScope.launch(Dispatchers.IO) {
            repository.insertMemory(
                ProjectMemory(
                    projectId = project.id,
                    key = "STORYBOARD_WORKFLOW_DURATION",
                    title = "Duración",
                    content = text
                )
            )
        }
    }

    /**
     * Genera la propuesta en 3 actos, el Storyboard con la duración técnica y la revisión del Director.
     */
    fun startStoryboardCreation(idea: String, duration: String) {
        val project = _selectedProject.value ?: return
        if (idea.isBlank()) return

        _storyboardWorkflowState.value = "GENERATING"
        _storyboardWorkflowError.value = ""

        viewModelScope.launch(Dispatchers.IO) {
            try {
                // 1. Generar la Estructura en 3 Actos (Presentación, Desarrollo, Desenlace)
                val actsPrompt = """
                    Idea Base del Cortometraje: "$idea"
                    Pautas: Estructura una propuesta de desarrollo cinematográfico formal dividida estrictamente en 3 actos:
                    1. ACTO I: PRESENTACIÓN (Planteamiento e incidente incitador).
                    2. ACTO II: DESARROLLO (Confrontación, obstáculos progresivos, punto de no retorno).
                    3. ACTO III: FINAL (Clímax tenso y resolución/desenlace dramático).
                    
                    Escribe esto en un formato detallado, con lenguaje cinematográfico y directo, sin saludos ni introducciones genéricas.
                """.trimIndent()

                val actsResult = RetrofitClient.generateTaskContent(
                    model = "gemini-3.5-flash",
                    prompt = actsPrompt,
                    systemInstructionText = "Eres el Showrunner y Diseñador Narrativo Principal del estudio cinematográfico IA. Tu trabajo es estructurar ideas brutas en estructuras clásicas de 3 actos de increíble fuerza dramática."
                )

                if (actsResult.startsWith("Network Error") || actsResult.startsWith("API Key Error")) {
                    throw Exception(actsResult)
                }

                _actsStructure.value = actsResult
                repository.insertMemory(
                    ProjectMemory(
                        projectId = project.id,
                        key = "STORYBOARD_WORKFLOW_ACTS",
                        title = "3 Actos",
                        content = actsResult
                    )
                )

                // 2. Generar el Storyboard/Tomas correspondientes al Tiempo/Duración del Corto
                val storyboardPrompt = """
                    Idea Base del Cortometraje: "$idea"
                    Estilo Visual del Proyecto: "${project.artStyle}"
                    Duración Estimada del Corto: "$duration"
                    Estructura en 3 Actos:
                    $actsResult
                    
                    Pautas: Genera un Storyboard Técnico y Desglose de Tomas sumamente detallado que encaje de manera estricta y lógica dentro de la duración técnica de $duration.
                    Divide el storyboard en tomas secuenciales consecutivas (ej: Toma 1, Toma 2, Toma 3...).
                    Para cada toma, debes especificar de forma obligatoria:
                    - ID de la Toma (N° correlativo).
                    - Tipo de Plano (ej: Primer plano, Plano general, Plano holandés...) y Angulación.
                    - Movimiento de cámara (ej: Paneo lento, Steady-cam, Tilt...).
                    - Descripción visual detallada de la acción (acciones, posiciones del personaje en escena).
                    - Sonido / Diálogos / Efectos de audio (foley o música de fondo para cada toma).
                    
                    Garantiza que la progresión de tomas explique de forma impecable y rica de principio a fin los tres actos establecidos previamente.
                """.trimIndent()

                val storyboardResult = RetrofitClient.generateTaskContent(
                    model = "gemini-3.5-flash",
                    prompt = storyboardPrompt,
                    systemInstructionText = "Eres el Guionista Cinematográfico y Diseñador de Storyboard Técnico. Dominas la sintaxis cinematográfica, encuadres, tipos de lentes, ritmo y continuidad."
                )

                if (storyboardResult.startsWith("Network Error") || storyboardResult.startsWith("API Key Error")) {
                    throw Exception(storyboardResult)
                }

                _generatedStoryboard.value = storyboardResult
                repository.insertMemory(
                    ProjectMemory(
                        projectId = project.id,
                        key = "STORYBOARD_WORKFLOW_STORYBOARD",
                        title = "Storyboard Técnico",
                        content = storyboardResult
                    )
                )

                // 3. Generar la Verificación de Consistencia Lógica por el Director de Escena
                val consistencyPrompt = """
                    Storyboard Técnico redactado por el Guionista:
                    $storyboardResult
                    
                    Duración técnica elegida: "$duration"
                    Pautas de análisis como Director:
                    Analiza y garantiza de manera rigurosa la consistencia lógica de todo el storyboard. Debes auditar:
                    1. Coherencia narrativa: ¿Se enlazan de manera fluida y fluida las tomas, o hay cortes incoherentes?
                    2. Continuidad espacial y temporal (Raccord): Verificar posiciones de los elementos, tiempos dramáticos correspondientes a la duración de "$duration", y lógica del eje de miradas (ley de los 180 grados).
                    3. Ritmo visual: ¿El número de tomas y su duración estimada coinciden con el tiempo global de "$duration"?
                    4. Recomendaciones Directoriales de Consistencia: Si hay algún detalle menor que requiera un pulido estricto de animación o composición para evitar saltos ópticos.
                    
                    Emite tu veredicto con una estructura clara y un prestigioso "Sello de Consistencia de Dirección aprobado, listo para producción fílmica".
                """.trimIndent()

                val consistencyResult = RetrofitClient.generateTaskContent(
                    model = "gemini-3.5-flash",
                    prompt = consistencyPrompt,
                    systemInstructionText = "Eres el Director Técnico y Supervisor de Continuidad (Script Supervisor). Tu única obsesión es la consistencia férrea, la ausencia total de errores de raccord (salto óptico) y la justificación narrativa de cada lente y corte."
                )

                if (consistencyResult.startsWith("Network Error") || consistencyResult.startsWith("API Key Error")) {
                    throw Exception(consistencyResult)
                }

                _directorConsistencyReport.value = consistencyResult
                repository.insertMemory(
                    ProjectMemory(
                        projectId = project.id,
                        key = "STORYBOARD_WORKFLOW_CONSISTENCY",
                        title = "Análisis de Consistencia del Director",
                        content = consistencyResult
                    )
                )

                _storyboardWorkflowState.value = "AWAITING_APPROVAL"
                repository.insertMemory(
                    ProjectMemory(
                        projectId = project.id,
                        key = "STORYBOARD_WORKFLOW_STATE",
                        title = "Estado del Flujo",
                        content = "AWAITING_APPROVAL"
                    )
                )

            } catch (e: Exception) {
                _storyboardWorkflowState.value = "ERROR"
                _storyboardWorkflowError.value = e.localizedMessage ?: e.message ?: "Error desconocido"
                repository.insertMemory(
                    ProjectMemory(
                        projectId = project.id,
                        key = "STORYBOARD_WORKFLOW_STATE",
                        title = "Estado del Flujo",
                        content = "ERROR"
                    )
                )
            }
        }
    }

    /**
     * Aprueba la propuesta dramática y el Storyboard. Integra el resultado técnico
     * en la memoria oficial y arranca los orquestadores automáticos subsiguientes del estudio.
     */
    fun approveStoryboardAndLaunchProduction() {
        val project = _selectedProject.value ?: return
        val idea = _videoIdeaState.value
        val acts = _actsStructure.value
        val storyboard = _generatedStoryboard.value
        val consistency = _directorConsistencyReport.value

        _storyboardWorkflowState.value = "APPROVED"

        viewModelScope.launch(Dispatchers.IO) {
            repository.insertMemory(
                ProjectMemory(
                    projectId = project.id,
                    key = "STORYBOARD_WORKFLOW_STATE",
                    title = "Estado del Flujo",
                    content = "APPROVED"
                )
            )

            // Actualizamos la sinopsis extendida en el registro del proyecto real para reflejar la idea del video
            val updatedProject = project.copy(description = idea)
            repository.insertProject(updatedProject)
            _selectedProject.value = updatedProject

            // Almacenamos el libreto y el storyboard de manera oficial en la biblia del proyecto para que todos los demás subagentes lo lean
            val projectBibleContent = """
                PROYECTO: "${project.title}"
                GÉNERO: ${project.genre}
                ESTILO VISUAL GLOBAL: ${project.artStyle}
                AUDIENCIA OBJETIVO: ${project.targetAudience}
                DURACIÓN ADOPTADA DEL CORTO: ${_shortFilmDuration.value}
                
                HISTORIA CONSOLIDADA:
                $idea
                
                ESTRUCTURA DE TRES ACTOS (APROBADA POR SHOWRUNNER):
                $acts
                
                STORYBOARD Y DESGLOSE OFICIAL DE TOMAS LOGICAMENTE INTEGRADAS:
                $storyboard
                
                DIRECTIVA SÓLIDA DE CONSISTENCIA DIRECTORIAL:
                $consistency
                
                ESTADO FÍSICO DE LA PRODUCCIÓN:
                Storyboard aprobado técnicamente en todas las capas. Se ha disparado la producción de material artístico y posproducción en cascada automática.
            """.trimIndent()

            val showrunnerBibleMemory = ProjectMemory(
                projectId = project.id,
                key = "SHOWRUNNER",
                title = "Showrunner Project Bible",
                content = projectBibleContent
            )
            repository.insertMemory(showrunnerBibleMemory)

            // Inyectamos también el libreto en el departamento "GUIONISTA" para reflejar este paso formal terminado
            val guionistaMemory = ProjectMemory(
                projectId = project.id,
                key = "GUIONISTA",
                title = "Guionista Principal (Guion Literario)",
                content = storyboard
            )
            repository.insertMemory(guionistaMemory)

            // Activamos la cascada desde la siguiente capa lógica: DIRECTOR_ARTE para que cree el moodboard estético, hasta el final.
            runCascadeOrchestration("DIRECTOR_ARTE")
        }
    }

    /**
     * Reinicia el flujo si el usuario desea editar y re-lanzar una consigna drásticamente distinta en el storyboard.
     */
    fun resetStoryboardWorkflow() {
        _storyboardWorkflowState.value = "IDLE"
        _actsStructure.value = ""
        _generatedStoryboard.value = ""
        _directorConsistencyReport.value = ""
        
        val project = _selectedProject.value ?: return
        viewModelScope.launch(Dispatchers.IO) {
            repository.insertMemory(
                ProjectMemory(
                    projectId = project.id,
                    key = "STORYBOARD_WORKFLOW_STATE",
                    title = "Estado del Flujo",
                    content = "IDLE"
                )
            )
            repository.insertMemory(
                ProjectMemory(
                    projectId = project.id,
                    key = "STORYBOARD_WORKFLOW_ACTS",
                    title = "3 Actos",
                    content = ""
                )
            )
            repository.insertMemory(
                ProjectMemory(
                    projectId = project.id,
                    key = "STORYBOARD_WORKFLOW_STORYBOARD",
                    title = "Storyboard Técnico",
                    content = ""
                )
            )
            repository.insertMemory(
                ProjectMemory(
                    projectId = project.id,
                    key = "STORYBOARD_WORKFLOW_CONSISTENCY",
                    title = "Análisis de Consistencia del Director",
                    content = ""
                )
            )
        }
    }

    fun selectSubagent(subagent: CinemaSubagent) {
        _selectedSubagent.value = subagent
        _promptInput.value = subagent.suggestedPrompt
        _generationState.value = GenerationState.Idle
    }

    fun updatePromptInput(text: String) {
        _promptInput.value = text
    }

    fun createNewProject(
        title: String,
        genre: String,
        artStyle: String,
        description: String,
        targetAudience: String
    ) {
        viewModelScope.launch(Dispatchers.IO) {
            val project = MovieProject(
                title = title,
                genre = genre,
                artStyle = artStyle,
                description = description,
                targetAudience = targetAudience
            )
            val projectId = repository.insertProject(project)

            // Pre-populamos la Capa 0 automáticamente: Showrunner Project Bible
            val showrunnerAgent = CinemaSubagentsCatalog.list.first { it.key == "SHOWRUNNER" }
            val showrunnerBible = """
                PROYECTO: "$title"
                GÉNERO: $genre
                ESTILO VISUAL: $artStyle
                AUDIENCIA OBJETIVO: $targetAudience
                
                SINOPSIS GENERAL DE SINOPSIS:
                $description
                
                ESTADO DE LA DIRECTIVA:
                Este documento actúa como la Directiva General (Showrunner Bible) para guiar a todos los subagentes del estudio IA. Todos los entregables posteriores (Guion, Fotografía, Iluminación, Layout, Audio) deben amoldarse para mantener consistencia con los preceptos de esta directiva.
            """.trimIndent()

            val initialMemory = ProjectMemory(
                projectId = projectId.toInt(),
                key = "SHOWRUNNER",
                title = "Showrunner Project Bible",
                content = showrunnerBible
            )
            repository.insertMemory(initialMemory)

            // Seleccionar el nuevo proyecto e iniciar cascada automática integrada
            val updatedProject = project.copy(id = projectId.toInt())
            withContext(Dispatchers.Main) {
                selectProject(updatedProject)
                _selectedSubagent.value = CinemaSubagentsCatalog.list.firstOrNull { it.key == "GUIONISTA" }
                _promptInput.value = CinemaSubagentsCatalog.list.firstOrNull { it.key == "GUIONISTA" }?.suggestedPrompt ?: ""
                
                // Dispara automáticamente la orquestación en cascada de todos los departamentos en orden lógico
                runCascadeOrchestration("GUIONISTA")
            }
        }
    }

    fun deleteCurrentProject() {
        val current = _selectedProject.value ?: return
        viewModelScope.launch(Dispatchers.IO) {
            repository.deleteProject(current)
            withContext(Dispatchers.Main) {
                _selectedProject.value = null
                _generationState.value = GenerationState.Idle
            }
        }
    }

    /**
     * Orquesta y ejecuta la generación por subagente usando la MEMORIA COMPARTIDA del proyecto.
     * Al repasar un trabajo o solicitar una nueva versión, se activa este orquestador y
     * todos los orquestadores dependientes (posteriores) se actualizan en cascada.
     */
    fun processSubagentAction() {
        val subagent = _selectedSubagent.value ?: return
        val currentPrompt = _promptInput.value
        if (currentPrompt.isBlank()) return

        runCascadeOrchestration(subagent.key, currentPrompt)
    }

    /**
     * Lanza la orquestación en cascada para todos los orquestadores dependientes de un pivote, en orden lógico.
     */
    fun runCascadeOrchestration(pivotKey: String, overridePrompt: String? = null) {
        cascadeJob?.cancel() // Cancela cualquier cola/cascada previa activa

        val project = _selectedProject.value ?: return
        val subagentsList = CinemaSubagentsCatalog.list
        val startIndex = subagentsList.indexOfFirst { it.key == pivotKey }
        if (startIndex == -1) return

        _generationState.value = GenerationState.Loading

        cascadeJob = viewModelScope.launch(Dispatchers.IO) {
            try {
                // Sincronizar el mapa inicial de estados para el pipeline de cascada
                val currentStates = _subagentStates.value.toMutableMap()
                for (i in startIndex until subagentsList.size) {
                    val agent = subagentsList[i]
                    if (i == startIndex) {
                        currentStates[agent.key] = "RUNNING"
                    } else if (isSubagentExpensive(agent.key)) {
                        currentStates[agent.key] = "PAUSED_EXPENSIVE"
                    } else {
                        currentStates[agent.key] = "PENDING"
                    }
                }
                _subagentStates.value = currentStates

                // Ejecutamos en secuencia desde el pivote modificado hasta el final del catálogo
                for (i in startIndex until subagentsList.size) {
                    val agent = subagentsList[i]

                    // Si NO es el pivote inicial (que el usuario autorizó manualmente),
                    // y es un orquestador altamente costoso (imagen, video, audio, música),
                    // debemos pausar la cascada automática para esperar su aprobación/ejecución manual.
                    if (i > startIndex && isSubagentExpensive(agent.key)) {
                        val pausedStates = _subagentStates.value.toMutableMap()
                        pausedStates[agent.key] = "PAUSED_EXPENSIVE"
                        _subagentStates.value = pausedStates
                        
                        // Si el subagente seleccionado actualmente en la vista coincide con este filtrador,
                        // actualizamos el estado visual de la consola
                        if (_selectedSubagent.value?.key == agent.key) {
                            _generationState.value = GenerationState.Idle
                        }
                        break // Detiene el flujo automático; el usuario deberá activarlo manualmente
                    }

                    // Marcar como en ejecución activa
                    val runningStates = _subagentStates.value.toMutableMap()
                    runningStates[agent.key] = "RUNNING"
                    _subagentStates.value = runningStates

                    // Si coincide con el seleccionado, ponemos en carga la UI de la Consola
                    if (_selectedSubagent.value?.key == agent.key) {
                        _generationState.value = GenerationState.Loading
                    }

                    // Determinar el prompt a utilizar
                    val promptToUse = if (i == startIndex && overridePrompt != null) {
                        overridePrompt
                    } else {
                        agent.suggestedPrompt
                    }

                    val success = executeSingleSubagentInPipeline(project, agent, promptToUse)

                    val finalStates = _subagentStates.value.toMutableMap()
                    if (success) {
                        finalStates[agent.key] = "COMPLETED"
                        
                        // Si era el seleccionado, mostramos éxito en la consola actual
                        if (_selectedSubagent.value?.key == agent.key) {
                            val lastOutput = database.movieProjectDao()
                                .getProjectMemoryByKey(project.id, agent.key)?.content ?: ""
                            _generationState.value = GenerationState.Success(lastOutput)
                        }
                    } else {
                        finalStates[agent.key] = "ERROR"
                        _subagentStates.value = finalStates
                        
                        if (_selectedSubagent.value?.key == agent.key) {
                            _generationState.value = GenerationState.Error("Fallo al orquestar el departamento ${agent.name}")
                        }
                        break // Aborta la cascada si algún nodo falla
                    }
                    _subagentStates.value = finalStates

                    // Esperamos 1.5 segundos para dar continuidad estética visible en la interfaz
                    delay(1500)
                }
            } catch (e: Exception) {
                _generationState.value = GenerationState.Error("Excepción en cascada: ${e.localizedMessage ?: e.message}")
            }
        }
    }

    /**
     * Ejecuta e integra un único subagente de manera síncrona en el hilo IO del pipeline,
     * recolectando de manera reactiva la memoria compartida que haya acumulada en Room.
     */
    private suspend fun executeSingleSubagentInPipeline(
        project: MovieProject,
        subagent: CinemaSubagent,
        currentPrompt: String
    ): Boolean {
        return try {
            val accumulatedMemories = database.movieProjectDao().getMemoriesForProject(project.id).firstOrNull() ?: emptyList()
            val memoriesStringBuilder = StringBuilder()

            if (accumulatedMemories.isEmpty()) {
                memoriesStringBuilder.append("(Aún no se han generado entregables por otros departamentos. Comienza la base literaria.)\n")
            } else {
                accumulatedMemories.forEach { memory ->
                    if (memory.key != subagent.key) {
                        memoriesStringBuilder.append("📄 [${memory.title.uppercase()}]:\n")
                        memoriesStringBuilder.append("${memory.content}\n")
                        memoriesStringBuilder.append("----------------------------\n\n")
                    }
                }
            }

            val systemInstruction = """
                Eres un Agente de Inteligencia Artificial de Cine en el rol de: ${subagent.name} (${subagent.role}).
                Formas parte del departamento: ${subagent.layer}.
                
                Tus funciones y contrato técnico que debes cumplir de manera estricta:
                ${subagent.duties.joinToString("\n") { " - $it" }}
                
                DATOS DE PRODUCCIÓN DE LA PELÍCULA:
                - Título: "${project.title}"
                - Género: ${project.genre}
                - Estilo Visual Global: ${project.artStyle}
                - Sinopsis del Showrunner: ${project.description}
                - Target de Audiencia: ${project.targetAudience}
                
                ========================================
                MEMORIA CENTRAL COMPARTIDA DEL PROYECTO (Pre-requisitos y continuidad):
                $memoriesStringBuilder
                ========================================
                
                DESAFÍO EXIGIDO:
                - Tu Entrada esperada es: ${subagent.inputDescription}
                - Tu Salida obligatoria exigida es: ${subagent.outputDescription}
                
                INSTRUCCIÓN DE REDACCIÓN:
                Escribe obligatoriamente en ESPAÑOL, de forma sumamente técnica, detallada, estructurada y profesional, usando terminología cinematográfica nativa real.
                No agregues introducciones amables ni despedidas. Comienza directamente con los encabezados e informe técnico de tu entregable.
            """.trimIndent()

            val generatedContent = RetrofitClient.generateTaskContent(
                model = "gemini-3.5-flash",
                prompt = currentPrompt,
                systemInstructionText = systemInstruction
            )

            if (generatedContent.startsWith("API Key Error") || generatedContent.startsWith("Network Error")) {
                false
            } else {
                val memoryToSave = ProjectMemory(
                    projectId = project.id,
                    key = subagent.key,
                    title = "${subagent.name} (${subagent.layer})",
                    content = generatedContent,
                    updatedAt = System.currentTimeMillis()
                )
                repository.insertMemory(memoryToSave)
                true
            }
        } catch (e: Exception) {
            false
        }
    }

    /**
     * Actualiza la idea general de la película, reconstruye la Biblia del Showrunner
     * e inicia una orquestación automatizada en cascada para todos los demás departamentos.
     */
    fun startCascadeFromVideoIdea(videoIdeaPrompt: String) {
        val project = _selectedProject.value ?: return
        if (videoIdeaPrompt.isBlank()) return

        viewModelScope.launch(Dispatchers.IO) {
            // Actualizar la sinopsis en la entidad del proyecto
            val updatedProject = project.copy(description = videoIdeaPrompt)
            repository.insertProject(updatedProject)
            _selectedProject.value = updatedProject

            // Limpiar memorias previas
            repository.clearMemories(project.id)

            // Re-modular el Project Bible
            val showrunnerBible = """
                PROYECTO: "${project.title}"
                GÉNERO: ${project.genre}
                ESTILO VISUAL: ${project.artStyle}
                AUDIENCIA OBJETIVO: ${project.targetAudience}
                
                SINOPSIS / IDEA CENTRAL DEL VIDEO:
                $videoIdeaPrompt
                
                ESTADO DE LA DIRECTIVA:
                Este documento actúa como la Directiva General (Showrunner Bible) para guiar de manera centralizada a todos los subagentes del estudio IA. Todos los entregables posteriores se están re-orquestando de manera automática en base a esta nueva dirección estética de producción.
            """.trimIndent()

            val initialMemory = ProjectMemory(
                projectId = project.id,
                key = "SHOWRUNNER",
                title = "Showrunner Project Bible",
                content = showrunnerBible
            )
            repository.insertMemory(initialMemory)

            // Disparar cascada desde el guionista en adelante
            runCascadeOrchestration("GUIONISTA")
        }
    }

    fun clearProjectBible() {
        val current = _selectedProject.value ?: return
        viewModelScope.launch(Dispatchers.IO) {
            repository.clearMemories(current.id)
            
            // Re-populamos el Project Bible inicial
            val showrunnerBible = """
                PROYECTO: "${current.title}"
                GÉNERO: ${current.genre}
                ESTILO VISUAL: ${current.artStyle}
                AUDIENCIA OBJETIVO: ${current.targetAudience}
                
                SINOPSIS GENERAL DE SINOPSIS:
                ${current.description}
                
                ESTADO DE LA DIRECTIVA:
                La memoria del proyecto ha sido reiniciada. Este Project Bible de la Capa 0 es el único fundamento inicial activo para los demás subagentes.
            """.trimIndent()

            val initialMemory = ProjectMemory(
                projectId = current.id,
                key = "SHOWRUNNER",
                title = "Showrunner Project Bible",
                content = showrunnerBible
            )
            repository.insertMemory(initialMemory)
            _generationState.value = GenerationState.Idle
        }
    }
}

class MovieProjectViewModelFactory(private val application: Application) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(MovieProjectViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return MovieProjectViewModel(application) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
