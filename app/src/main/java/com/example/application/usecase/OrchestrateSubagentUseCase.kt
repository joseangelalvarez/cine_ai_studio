package com.example.application.usecase

import com.example.data.database.*
import com.example.data.model.CinemaSubagent
import com.example.domain.gateway.CinemaGateway
import com.example.domain.gateway.GatewayResponse
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.withContext
import java.util.UUID

class OrchestrateSubagentUseCase(
    private val repository: MovieProjectRepository,
    private val gateway: CinemaGateway
) {

    suspend fun execute(
        project: MovieProject,
        subagent: CinemaSubagent,
        promptInput: String
    ): OrchestrationResult = withContext(Dispatchers.IO) {
        val correlationId = "corr_" + UUID.randomUUID().toString().take(12)
        logAudit(
            projectId = project.id,
            correlationId = correlationId,
            actor = "USER",
            action = "ORCHESTRATE_REQUEST",
            details = "Solicitud manual/cascada de orquestación para subagente ${subagent.key}."
        )

        try {
            // 1. Recopilar memoria compartida acumulada en Room
            val accumulatedMemories = repository.getMemories(project.id).firstOrNull() ?: emptyList()
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

            // 2. Construir sistema de instrucciones estructurado
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

            val apiStart = System.currentTimeMillis()
            val apiResponse = gateway.executeAIRequest(
                projectId = project.id,
                correlationId = correlationId,
                model = "gemini-3.5-flash",
                prompt = promptInput,
                systemInstruction = systemInstruction,
                actorName = subagent.key
            )
            val latency = System.currentTimeMillis() - apiStart

            when (apiResponse) {
                is GatewayResponse.Success -> {
                    val contentOutput = apiResponse.content

                    // Guardar memoria convencional (compatibilidad UI)
                    val memoryToSave = ProjectMemory(
                        projectId = project.id,
                        key = subagent.key,
                        title = "${subagent.name} (${subagent.layer})",
                        content = contentOutput,
                        updatedAt = System.currentTimeMillis()
                    )
                    repository.insertMemory(memoryToSave)

                    // REGISTRAR REVISIÓN DE MEMORIA VERSIONADA (Fase 1 - Memoria versionada)
                    saveVersionedMemory(
                        projectId = project.id,
                        key = subagent.key,
                        title = "${subagent.name} (${subagent.layer})",
                        content = contentOutput,
                        author = subagent.key,
                        correlationId = correlationId
                    )

                    // REGISTRAR MÉTRICAS DE TELEMETRÍA (Fase 2 - Observabilidad de extremo a extremo)
                    saveMetrics(project.id, correlationId, "STAGE_TIME", subagent.key, latency.toDouble())
                    saveMetrics(project.id, correlationId, "ESTIMATED_COST", subagent.key, apiResponse.estimatedCost)

                    logAudit(
                        projectId = project.id,
                        correlationId = correlationId,
                        actor = subagent.key,
                        action = "ORCHESTRATE_COMPLETED",
                        details = "Entrega de folio guardado exitosamente. Latencia: ${latency}ms, Costo: ${apiResponse.estimatedCost} USD."
                    )

                    return@withContext OrchestrationResult.Success(contentOutput)
                }

                is GatewayResponse.Error -> {
                    logAudit(
                        projectId = project.id,
                        correlationId = correlationId,
                        actor = subagent.key,
                        action = "ORCHESTRATE_FAILED",
                        details = "Error de orquestación en el agente: ${apiResponse.errorMessage}"
                    )
                    saveMetrics(project.id, correlationId, "AI_ERROR_RATE", subagent.key, 1.0)
                    return@withContext OrchestrationResult.Error(apiResponse.errorMessage)
                }
            }

        } catch (e: Exception) {
            val errMessage = e.localizedMessage ?: "Excepción de orquestación"
            logAudit(
                projectId = project.id,
                correlationId = correlationId,
                actor = "SYSTEM",
                action = "ORCHESTRATE_EXCEPTION",
                details = "Excepción en el Use Case: $errMessage"
            )
            return@withContext OrchestrationResult.Error(errMessage)
        }
    }

    private suspend fun saveVersionedMemory(
        projectId: Int,
        key: String,
        title: String,
        content: String,
        author: String,
        correlationId: String
    ) {
        val existingRevisions = repository.getRevisionsForKey(projectId, key)
        val nextVersion = (existingRevisions.firstOrNull()?.version ?: 0) + 1
        
        repository.insertProjectMemoryRevision(ProjectMemoryRevision(
            projectId = projectId,
            key = key,
            title = title,
            content = content,
            version = nextVersion,
            author = author,
            correlationId = correlationId
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

sealed class OrchestrationResult {
    data class Success(val content: String) : OrchestrationResult()
    data class Error(val message: String) : OrchestrationResult()
}
