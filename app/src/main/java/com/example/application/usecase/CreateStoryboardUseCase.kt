package com.example.application.usecase

import com.example.data.database.*
import com.example.domain.gateway.CinemaGateway
import com.example.domain.gateway.GatewayResponse
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import java.util.UUID

class CreateStoryboardUseCase(
    private val repository: MovieProjectRepository,
    private val gateway: CinemaGateway
) {

    suspend fun execute(
        projectId: Int,
        artStyle: String,
        idea: String,
        duration: String,
        onProgressUpdate: (String) -> Unit
    ): StoryboardResult = withContext(Dispatchers.IO) {
        val correlationId = "corr_" + UUID.randomUUID().toString().take(12)
        logAudit(projectId, correlationId, "SYSTEM", "WORKFLOW_INIT", "Se inicia el planificador de preproducción. Idea de corto: $idea. Duración: $duration.")

        // 1. Obtener o Generar una ejecución persistente de workflow
        val existingExecution = repository.getLatestWorkflowExecution(projectId)
        val executionId = if (existingExecution != null && existingExecution.state == "ERROR") {
            // Reanudamos sobre un estado de error anterior para aplicar checkpoints
            logAudit(projectId, correlationId, "SYSTEM", "WORKFLOW_RECOVER", "Reanudando ejecución fallida previa ID ${existingExecution.id} con checkpointing activo.")
            val resumedExec = existingExecution.copy(
                state = "GENERATING",
                correlationId = correlationId,
                updatedAt = System.currentTimeMillis()
            )
            repository.insertWorkflowExecution(resumedExec)
            existingExecution.id
        } else {
            // Creamos una nueva ejecución fresca
            val newExecution = WorkflowExecution(
                projectId = projectId,
                state = "GENERATING",
                correlationId = correlationId
            )
            repository.insertWorkflowExecution(newExecution).toInt()
        }

        // Recuperar u orquestar los pasos secuenciales de forma idéntica e idempotente
        var actsResult = ""
        var storyboardResult = ""
        var consistencyResult = ""

        try {
            // STEP 1: ACTS GENERATION
            val actsStep = getOrCreateStep(executionId, "ACTS")
            if (actsStep.status == "COMPLETED") {
                actsResult = actsStep.payload
                logAudit(projectId, correlationId, "SYSTEM", "STEP_SKIPPED", "Paso 'ACTS' recuperado desde checkpoint persistente local.")
                onProgressUpdate("Paso 1/3 (Recuperado de Checkpoint): Análisis de 3 Hechos terminado.")
            } else {
                onProgressUpdate("Paso 1/3: Estructurando propuesta dramática formal en 3 Hechos...")
                updateStepStatus(actsStep, "RUNNING")
                
                val actsPrompt = """
                    Idea Base del Cortometraje: "$idea"
                    Pautas: Estructura una propuesta de desarrollo cinematográfico formal dividida estrictamente en 3 actos:
                    1. ACTO I: PRESENTACIÓN (Planteamiento e incidente incitador).
                    2. ACTO II: DESARROLLO (Confrontación, obstáculos progresivos, punto de no retorno).
                    3. ACTO III: FINAL (Clímax tenso y resolución/desenlace dramático).
                    
                    Escribe esto en un formato detallado, con lenguaje cinematográfico y directo, sin saludos ni introducciones genéricas.
                """.trimIndent()

                val apiStart = System.currentTimeMillis()
                val apiResponse = gateway.executeAIRequest(
                    projectId = projectId,
                    correlationId = correlationId,
                    model = "gemini-3.5-flash",
                    prompt = actsPrompt,
                    systemInstruction = "Eres el Showrunner y Diseñador Narrativo Principal del estudio cinematográfico IA. Estructuras ideas brutas en estructuras clásicas de 3 actos de increíble fuerza dramática.",
                    actorName = "SHOWRUNNER"
                )
                val latency = System.currentTimeMillis() - apiStart

                when (apiResponse) {
                    is GatewayResponse.Success -> {
                        actsResult = apiResponse.content
                        updateStepSuccess(actsStep, actsResult)
                        saveMetrics(projectId, correlationId, "STAGE_TIME", "ACTS", latency.toDouble())
                        saveMetrics(projectId, correlationId, "ESTIMATED_COST", "ACTS", apiResponse.estimatedCost)
                        logAudit(projectId, correlationId, "SHOWRUNNER", "STEP_COMPLETED", "Paso 'ACTS' completado. Latencia: ${latency}ms, Costo: ${apiResponse.estimatedCost}")
                    }
                    is GatewayResponse.Error -> {
                        updateStepFailure(actsStep, apiResponse.errorMessage)
                        throw Exception("Fallo en Acto I (Showrunner): ${apiResponse.errorMessage}")
                    }
                }
            }

            // STEP 2: STORYBOARD GENERATION
            val storyboardStep = getOrCreateStep(executionId, "STORYBOARD")
            if (storyboardStep.status == "COMPLETED") {
                storyboardResult = storyboardStep.payload
                logAudit(projectId, correlationId, "SYSTEM", "STEP_SKIPPED", "Paso 'STORYBOARD' recuperado desde checkpoint persistente local.")
                onProgressUpdate("Paso 2/3 (Recuperado de Checkpoint): Guion técnico y desglose fílmico listo.")
            } else {
                onProgressUpdate("Paso 2/3: Guionista redactando Storyboard Técnico de tomas para $duration...")
                updateStepStatus(storyboardStep, "RUNNING")

                val storyboardPrompt = """
                    Idea Base del Cortometraje: "$idea"
                    Estilo Visual del Proyecto: "$artStyle"
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
                    
                    Garantiza que la progresión de tomas explique de forma impecable de principio a fin los tres actos establecidos previamente.
                """.trimIndent()

                val apiStart = System.currentTimeMillis()
                val apiResponse = gateway.executeAIRequest(
                    projectId = projectId,
                    correlationId = correlationId,
                    model = "gemini-3.5-flash",
                    prompt = storyboardPrompt,
                    systemInstruction = "Eres el Guionista Cinematográfico y Diseñador de Storyboard Técnico. Dominas la sintaxis cinematográfica, encuadres, tipos de lentes, ritmo y continuidad.",
                    actorName = "GUIONISTA"
                )
                val latency = System.currentTimeMillis() - apiStart

                when (apiResponse) {
                    is GatewayResponse.Success -> {
                        storyboardResult = apiResponse.content
                        updateStepSuccess(storyboardStep, storyboardResult)
                        saveMetrics(projectId, correlationId, "STAGE_TIME", "STORYBOARD", latency.toDouble())
                        saveMetrics(projectId, correlationId, "ESTIMATED_COST", "STORYBOARD", apiResponse.estimatedCost)
                        logAudit(projectId, correlationId, "GUIONISTA", "STEP_COMPLETED", "Paso 'STORYBOARD' completado. Latencia: ${latency}ms")
                    }
                    is GatewayResponse.Error -> {
                        updateStepFailure(storyboardStep, apiResponse.errorMessage)
                        throw Exception("Fallo en Redacción de Storyboard: ${apiResponse.errorMessage}")
                    }
                }
            }

            // STEP 3: SCENE DIRECTOR CONSISTENCY AUDITING
            val consistencyStep = getOrCreateStep(executionId, "CONSISTENCY")
            if (consistencyStep.status == "COMPLETED") {
                consistencyResult = consistencyStep.payload
                logAudit(projectId, correlationId, "SYSTEM", "STEP_SKIPPED", "Paso 'CONSISTENCY' recuperado desde checkpoint persistente.")
                onProgressUpdate("Paso 3/3 (Recuperado de Checkpoint): Auditoría de continuidad y raccord de cámara completada.")
            } else {
                onProgressUpdate("Paso 3/3: Director Técnico examinando continuidad, sonido y raccord de tomas...")
                updateStepStatus(consistencyStep, "RUNNING")

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

                val apiStart = System.currentTimeMillis()
                val apiResponse = gateway.executeAIRequest(
                    projectId = projectId,
                    correlationId = correlationId,
                    model = "gemini-3.5-flash",
                    prompt = consistencyPrompt,
                    systemInstruction = "Eres el Director Técnico y Supervisor de Continuidad (Script Supervisor). Tu única obsesión es la consistencia férrea, la ausencia total de errores de raccord (salto óptico) y la justificación de cada toma.",
                    actorName = "DIRECTOR_ESCENA"
                )
                val latency = System.currentTimeMillis() - apiStart

                when (apiResponse) {
                    is GatewayResponse.Success -> {
                        consistencyResult = apiResponse.content
                        updateStepSuccess(consistencyStep, consistencyResult)
                        saveMetrics(projectId, correlationId, "STAGE_TIME", "CONSISTENCY", latency.toDouble())
                        saveMetrics(projectId, correlationId, "ESTIMATED_COST", "CONSISTENCY", apiResponse.estimatedCost)
                        logAudit(projectId, correlationId, "DIRECTOR_ESCENA", "STEP_COMPLETED", "Paso 'CONSISTENCY' completado. Latencia: ${latency}ms")
                    }
                    is GatewayResponse.Error -> {
                        updateStepFailure(consistencyStep, apiResponse.errorMessage)
                        throw Exception("Fallo en Auditoría de Consistencia (Director): ${apiResponse.errorMessage}")
                    }
                }
            }

            // TODO EL PIPELINE HA EXITADO EN VERDE
            val currentExec = repository.getLatestWorkflowExecution(projectId) ?: throw Exception("Ejecución desaparecida")
            repository.insertWorkflowExecution(currentExec.copy(
                state = "AWAITING_APPROVAL",
                updatedAt = System.currentTimeMillis()
            ))

            logAudit(projectId, correlationId, "SYSTEM", "WORKFLOW_SUCCESS", "Pipeline de Storyboard terminado con éxito. Esperando aprobación manual de producción.")
            return@withContext StoryboardResult.Success(actsResult, storyboardResult, consistencyResult)

        } catch (e: Exception) {
            val currentExec = repository.getLatestWorkflowExecution(projectId)
            if (currentExec != null) {
                repository.insertWorkflowExecution(currentExec.copy(
                    state = "ERROR",
                    updatedAt = System.currentTimeMillis()
                ))
            }
            logAudit(projectId, correlationId, "SYSTEM", "WORKFLOW_FAILED", "Workflow de Storyboard falló catastróficamente: ${e.localizedMessage}")
            saveMetrics(projectId, correlationId, "AI_ERROR_RATE", "STORYBOARD_WORKFLOW", 1.0)
            return@withContext StoryboardResult.Error(e.localizedMessage ?: "Error de compilación en cascada")
        }
    }

    private suspend fun getOrCreateStep(executionId: Int, stepName: String): WorkflowStepExecution {
        val step = repository.getStepExecutionByName(executionId, stepName)
        if (step != null) return step
        val newStep = WorkflowStepExecution(
            executionId = executionId,
            stepName = stepName,
            status = "PENDING"
        )
        val newId = repository.insertWorkflowStepExecution(newStep).toInt()
        return newStep.copy(id = newId)
    }

    private suspend fun updateStepStatus(step: WorkflowStepExecution, status: String) {
        repository.insertWorkflowStepExecution(step.copy(
            status = status,
            updatedAt = System.currentTimeMillis()
        ))
    }

    private suspend fun updateStepSuccess(step: WorkflowStepExecution, payload: String) {
        repository.insertWorkflowStepExecution(step.copy(
            status = "COMPLETED",
            payload = payload,
            updatedAt = System.currentTimeMillis()
        ))
    }

    private suspend fun updateStepFailure(step: WorkflowStepExecution, error: String) {
        repository.insertWorkflowStepExecution(step.copy(
            status = "FAILED",
            lastError = error,
            retryCount = step.retryCount + 1,
            updatedAt = System.currentTimeMillis()
        ))
    }

    private suspend fun logAudit(projectId: Int, correlationId: String, actor: String, action: String, details: String) {
        repository.insertAuditLog(AuditLog(
            projectId = projectId,
            correlationId = correlationId,
            actor = actor,
            action = action,
            details = details
        ))
    }

    private suspend fun saveMetrics(projectId: Int, correlationId: String, name: String, stage: String, value: Double) {
        repository.insertTelemetryMetric(TelemetryMetric(
            projectId = projectId,
            correlationId = correlationId,
            metricName = name,
            keyIdentifier = stage,
            metricValue = value
        ))
    }
}

sealed class StoryboardResult {
    data class Success(
        val acts: String,
        val storyboard: String,
        val consistency: String
    ) : StoryboardResult()

    data class Error(val message: String) : StoryboardResult()
}
