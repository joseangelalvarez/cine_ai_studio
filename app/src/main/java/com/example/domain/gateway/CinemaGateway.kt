package com.example.domain.gateway

interface CinemaGateway {
    suspend fun executeAIRequest(
        projectId: Int,
        correlationId: String,
        model: String,
        prompt: String,
        systemInstruction: String?,
        actorName: String
    ): GatewayResponse
}

sealed class GatewayResponse {
    data class Success(
        val content: String,
        val latencyMs: Long,
        val estimatedCost: Double
    ) : GatewayResponse()

    data class Error(
        val errorMessage: String,
        val isRetryable: Boolean,
        val latencyMs: Long
    ) : GatewayResponse()
}
