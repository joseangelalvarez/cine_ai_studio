package com.example.ui.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.example.application.usecase.*
import com.example.data.database.*
import com.example.data.model.CinemaSubagent
import com.example.data.model.CinemaSubagentsCatalog
import com.example.infrastructure.gateway.SecureCinemaGatewayImpl
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
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

    // --- SECURE GATEWAY ADAPTER AND USE CASES (CLEAN ARCHITECTURE) ---
    private val gateway = SecureCinemaGatewayImpl()

    private val createStoryboardUseCase = CreateStoryboardUseCase(repository, gateway)
    private val approveStoryboardUseCase = ApproveStoryboardUseCase(repository)
    private val orchestrateSubagentUseCase = OrchestrateSubagentUseCase(repository, gateway)

    // Toggle de Pasarela de Seguridad de Orquestador Central (Fase 0)
    private val _useSecureGateway = MutableStateFlow(false)
    val useSecureGateway: StateFlow<Boolean> = _useSecureGateway.asStateFlow()

    fun toggleSecureGateway(enabled: Boolean) {
        _useSecureGateway.value = enabled
        gateway.useSecureBackendEndpoint = enabled
    }

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

    // --- OBSERBILIDAD REACTIVA DEL PRODUCTO (Fases 1 y 2) ---
    val projectRevisions: StateFlow<List<ProjectMemoryRevision>> = _selectedProject
        .flatMapLatest { project ->
            if (project != null) {
                repository.getRevisionsForProject(project.id)
            } else {
                flowOf(emptyList())
            }
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val auditLogs: StateFlow<List<AuditLog>> = _selectedProject
        .flatMapLatest { project ->
            if (project != null) {
                repository.getAuditLogsForProject(project.id)
            } else {
                flowOf(emptyList())
            }
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val telemetryMetrics: StateFlow<List<TelemetryMetric>> = _selectedProject
        .flatMapLatest { project ->
            if (project != null) {
                repository.getTelemetryMetricsForProject(project.id)
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
    private var cascadeJob: Job? = null

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
            val result = createStoryboardUseCase.execute(
                projectId = project.id,
                artStyle = project.artStyle,
                idea = idea,
                duration = duration,
                onProgressUpdate = { progressText ->
                    // Forzar reactividad del mensaje en el State del flujo temporal de errores de UI
                    viewModelScope.launch(Dispatchers.Main) {
                        _storyboardWorkflowError.value = progressText
                    }
                }
            )

            withContext(Dispatchers.Main) {
                when (result) {
                    is StoryboardResult.Success -> {
                        _actsStructure.value = result.acts
                        _generatedStoryboard.value = result.storyboard
                        _directorConsistencyReport.value = result.consistency
                        _storyboardWorkflowState.value = "AWAITING_APPROVAL"
                        _storyboardWorkflowError.value = ""

                        // Guardamos estados persistentes convencionales para mantener compatibilidad con lecturas
                        saveConventionalWorkflowMemories(project.id, "AWAITING_APPROVAL", result.acts, result.storyboard, result.consistency)
                    }
                    is StoryboardResult.Error -> {
                        _storyboardWorkflowState.value = "ERROR"
                        _storyboardWorkflowError.value = result.message
                        saveConventionalWorkflowMemories(project.id, "ERROR", "", "", "")
                    }
                }
            }
        }
    }

    private suspend fun saveConventionalWorkflowMemories(
        projectId: Int,
        state: String,
        acts: String,
        storyboard: String,
        consistency: String
    ) {
        repository.insertMemory(
            ProjectMemory(
                projectId = projectId,
                key = "STORYBOARD_WORKFLOW_STATE",
                title = "Estado del Flujo",
                content = state
            )
        )
        repository.insertMemory(
            ProjectMemory(
                projectId = projectId,
                key = "STORYBOARD_WORKFLOW_ACTS",
                title = "3 Actos",
                content = acts
            )
        )
        repository.insertMemory(
            ProjectMemory(
                projectId = projectId,
                key = "STORYBOARD_WORKFLOW_STORYBOARD",
                title = "Storyboard Técnico",
                content = storyboard
            )
        )
        repository.insertMemory(
            ProjectMemory(
                projectId = projectId,
                key = "STORYBOARD_WORKFLOW_CONSISTENCY",
                title = "Análisis de Consistencia del Director",
                content = consistency
            )
        )
    }

    /**
     * Aprueba la propuesta dramática y el Storyboard. Integra el resultado técnico
     * en la memoria oficial y arranca los orquestadores automáticos subsiguientes del estudio.
     */
    fun approveStoryboardAndLaunchProduction() {
        val project = _selectedProject.value ?: return
        val idea = _videoIdeaState.value
        val duration = _shortFilmDuration.value
        val acts = _actsStructure.value
        val storyboard = _generatedStoryboard.value
        val consistency = _directorConsistencyReport.value

        _storyboardWorkflowState.value = "APPROVED"

        viewModelScope.launch(Dispatchers.IO) {
            val success = approveStoryboardUseCase.execute(
                projectId = project.id,
                idea = idea,
                duration = duration,
                acts = acts,
                storyboard = storyboard,
                consistency = consistency
            )

            if (success) {
                // Actualizamos la sinopsis extendida en el registro del proyecto real para reflejar la idea del video en UI
                val updatedProject = project.copy(description = idea)
                repository.insertProject(updatedProject)
                _selectedProject.value = updatedProject

                withContext(Dispatchers.Main) {
                    // Activamos la cascada desde la siguiente capa lógica: DIRECTOR_ARTE para que cree el moodboard estético, hasta el final.
                    runCascadeOrchestration("DIRECTOR_ARTE")
                }
            }
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
        _storyboardWorkflowError.value = ""

        val project = _selectedProject.value ?: return
        viewModelScope.launch(Dispatchers.IO) {
            saveConventionalWorkflowMemories(project.id, "IDLE", "", "", "")
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
            val showrunnerBible = """
                PROYECTO: "$title"
                GÉNERO: $genre
                ESTILO VISUAL: $artStyle
                AUDIENCIA OBJETIVO: $targetAudience
                
                SINOPSIS / IDEA CENTRAL DEL VIDEO:
                $description
                
                ESTADO DE LA DIRECTIVA:
                Este documento actúa como la Directiva General (Showrunner Bible) para guiar de manera centralizada a todos los subagentes del estudio IA. Todos los entregables posteriores se están re-orquestando de manera automática en base a esta dirección estética de producción.
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

                    // LLAMADA DESACOPLADA AL CONTRATO USE CASE (CLEAN ARCHITECTURE)
                    val result = orchestrateSubagentUseCase.execute(project, agent, promptToUse)

                    val finalStates = _subagentStates.value.toMutableMap()
                    when (result) {
                        is OrchestrationResult.Success -> {
                            finalStates[agent.key] = "COMPLETED"
                            
                            // Si era el seleccionado, mostramos éxito en la consola actual
                            if (_selectedSubagent.value?.key == agent.key) {
                                _generationState.value = GenerationState.Success(result.content)
                            }
                        }
                        is OrchestrationResult.Error -> {
                            finalStates[agent.key] = "ERROR"
                            _subagentStates.value = finalStates
                            
                            if (_selectedSubagent.value?.key == agent.key) {
                                _generationState.value = GenerationState.Error("Fallo al orquestar el departamento ${agent.name}: ${result.message}")
                            }
                            break // Aborta la cascada si algún nodo falla
                        }
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
            withContext(Dispatchers.Main) {
                runCascadeOrchestration("GUIONISTA")
            }
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
