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

    // Input del usuario en la consola de orquestación
    private val _promptInput = MutableStateFlow("")
    val promptInput: StateFlow<String> = _promptInput.asStateFlow()

    // Estado de generación de entregable técnico
    private val _generationState = MutableStateFlow<GenerationState>(GenerationState.Idle)
    val generationState: StateFlow<GenerationState> = _generationState.asStateFlow()

    // Control de ventanas modales / diálogos
    var isCreatingProjectDialogVisible = MutableStateFlow(false)

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
        // Limpiamos estados de generación al cambiar de proyecto
        _generationState.value = GenerationState.Idle
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

            // Seleccionar el nuevo proyecto
            val updatedProject = project.copy(id = projectId.toInt())
            withContext(Dispatchers.Main) {
                selectProject(updatedProject)
                _selectedSubagent.value = CinemaSubagentsCatalog.list.firstOrNull { it.key == "GUIONISTA" }
                _promptInput.value = CinemaSubagentsCatalog.list.firstOrNull { it.key == "GUIONISTA" }?.suggestedPrompt ?: ""
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
     */
    fun processSubagentAction() {
        val project = _selectedProject.value ?: return
        val subagent = _selectedSubagent.value ?: return
        val currentPrompt = _promptInput.value

        if (currentPrompt.isBlank()) return

        _generationState.value = GenerationState.Loading

        viewModelScope.launch(Dispatchers.IO) {
            try {
                // 1. Conseguir todas las memorias acumuladas del proyecto para inyectar como contexto real
                val accumulatedMemories = database.movieProjectDao().getMemoriesForProject(project.id).firstOrNull() ?: emptyList()
                
                val memoriesStringBuilder = StringBuilder()
                if (accumulatedMemories.isEmpty()) {
                    memoriesStringBuilder.append("(Aún no se han generado entregables por otros departamentos. Comienza la base literaria.)\n")
                } else {
                    accumulatedMemories.forEach { memory ->
                        // Excluimos la memoria de este mismo subagente para no duplicarla si se reescribe, u opcionalmente incluimos su versión previa
                        if (memory.key != subagent.key) {
                            memoriesStringBuilder.append("📄 [${memory.title.uppercase()}]:\n")
                            memoriesStringBuilder.append("${memory.content}\n")
                            memoriesStringBuilder.append("----------------------------\n\n")
                        }
                    }
                }

                // 2. Construir la directiva del sistema altamente especializada
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
                    No agregues introducciones amables ni despedidas ("¡Hola!", "Espero que esto te sea útil"). Comienza directamente con los encabezados e informe técnico de tu entregable.
                """.trimIndent()

                // 3. Consultar a Gemini a través de Retrofit
                val generatedContent = RetrofitClient.generateTaskContent(
                    model = "gemini-3.5-flash",
                    prompt = currentPrompt,
                    systemInstructionText = systemInstruction
                )

                if (generatedContent.startsWith("API Key Error") || generatedContent.startsWith("Network Error")) {
                    _generationState.value = GenerationState.Error(generatedContent)
                } else {
                    // 4. Guardar en Room de la Memoria Compartida
                    val memoryToSave = ProjectMemory(
                        projectId = project.id,
                        key = subagent.key,
                        title = "${subagent.name} (${subagent.layer})",
                        content = generatedContent,
                        updatedAt = System.currentTimeMillis()
                    )
                    repository.insertMemory(memoryToSave)

                    _generationState.value = GenerationState.Success(generatedContent)
                }
            } catch (e: Exception) {
                _generationState.value = GenerationState.Error("Excepción del Proceso: ${e.localizedMessage ?: e.message}")
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
