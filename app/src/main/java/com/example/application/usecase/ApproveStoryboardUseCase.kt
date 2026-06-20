package com.example.application.usecase

import com.example.data.database.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.UUID

class ApproveStoryboardUseCase(
    private val repository: MovieProjectRepository
) {

    suspend fun execute(
        projectId: Int,
        idea: String,
        duration: String,
        acts: String,
        storyboard: String,
        consistency: String
    ): Boolean = withContext(Dispatchers.IO) {
        val correlationId = "corr_" + UUID.randomUUID().toString().take(12)
        logAudit(projectId, correlationId, "USER", "WORKFLOW_APPROVE", "El usuario aprobó oficialmente el guion técnico y el storyboard de $duration.")

        // 1. Obtener última ejecución y marcarla como APPROVED
        val execution = repository.getLatestWorkflowExecution(projectId)
        if (execution != null) {
            repository.insertWorkflowExecution(execution.copy(
                state = "APPROVED",
                updatedAt = System.currentTimeMillis()
            ))
            
            // Log de auditoría de paso aprobado
            val step = repository.getStepExecutionByName(execution.id, "STORYBOARD")
            if (step != null) {
                repository.insertWorkflowStepExecution(step.copy(status = "COMPLETED", updatedAt = System.currentTimeMillis()))
            }
        }

        // 2. Guardar memorias convencionales (compatibilidad garantizada con la UI actual)
        val projectBibleContent = """
            PROYECTO ID: $projectId
            DURACIÓN ADOPTADA DEL CORTO: $duration
            
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

        repository.insertMemory(ProjectMemory(
            projectId = projectId,
            key = "SHOWRUNNER",
            title = "Showrunner Project Bible",
            content = projectBibleContent
        ))

        repository.insertMemory(ProjectMemory(
            projectId = projectId,
            key = "GUIONISTA",
            title = "Guionista Principal (Guion Literario)",
            content = storyboard
        ))

        // 3. REGISTRAR MEMORIA VERSIONADA (Fase 1 - Memoria versionada y auditoría)
        saveVersionedMemory(projectId, "SHOWRUNNER", "Showrunner Project Bible", projectBibleContent, "USER", correlationId)
        saveVersionedMemory(projectId, "GUIONISTA", "Guionista Principal (Guion Literario)", storyboard, "USER", correlationId)

        // 4. GENERAR MÉTRICA DE PRODUCTO (Fase 2 - Observabilidad de retrabajo)
        // Guardamos una métrica especial de aprobación en primer intento (1.0 = éxito directo)
        saveMetrics(projectId, correlationId, "STAGE_REWORK", "STORYBOARD_WORKFLOW", 0.0) // 0.0 retrabajo = Aprobación limpia

        return@withContext true
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
