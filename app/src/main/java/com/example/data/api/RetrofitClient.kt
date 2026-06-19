package com.example.data.api

import com.example.BuildConfig
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import java.util.concurrent.TimeUnit
import retrofit2.http.Body
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query
import retrofit2.HttpException
import java.io.IOException
import kotlinx.coroutines.delay

interface GeminiApiService {
    @POST("v1beta/models/{model}:generateContent")
    suspend fun generateContent(
        @Path("model") model: String,
        @Query("key") apiKey: String,
        @Body request: GeminiRequest
    ): GeminiResponse
}

object RetrofitClient {
    private const val BASE_URL = "https://generativelanguage.googleapis.com/"

    private val moshi = Moshi.Builder()
        .addLast(KotlinJsonAdapterFactory())
        .build()

    private val okHttpClient = OkHttpClient.Builder()
        .connectTimeout(60, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .addInterceptor(HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        })
        .build()

    private val retrofit = Retrofit.Builder()
        .baseUrl(BASE_URL)
        .client(okHttpClient)
        .addConverterFactory(MoshiConverterFactory.create(moshi))
        .build()

    val service: GeminiApiService = retrofit.create(GeminiApiService::class.java)

    suspend fun generateTaskContent(
        model: String = "gemini-3.5-flash",
        prompt: String,
        systemInstructionText: String? = null
    ): String {
        val apiKey = BuildConfig.GEMINI_API_KEY
        if (apiKey.isEmpty() || apiKey == "MY_GEMINI_API_KEY") {
            return "API Key Error: Por favor, configura tu API Key de Gemini en el panel de secretos de AI Studio para que la orquestación IA pueda realizar llamadas."
        }

        val request = GeminiRequest(
            contents = listOf(Content(parts = listOf(Part(text = prompt)))),
            generationConfig = GenerationConfig(temperature = 0.7f),
            systemInstruction = systemInstructionText?.let {
                Content(parts = listOf(Part(text = it)))
            }
        )

        var currentDelay = 1500L
        val maxAttempts = 4
        var lastException: Exception? = null

        for (attempt in 1..maxAttempts) {
            try {
                val response = service.generateContent(model, apiKey, request)
                val text = response.candidates?.firstOrNull()?.content?.parts?.firstOrNull()?.text
                if (text != null) {
                    return text
                } else {
                    return "Response Error: No se generó contenido legible de la IA. Por favor, intenta de nuevo."
                }
            } catch (e: Exception) {
                lastException = e
                val shouldRetry = when (e) {
                    is IOException -> true
                    is HttpException -> e.code() == 503 || e.code() == 429 || e.code() in 500..599
                    else -> false
                }
                if (!shouldRetry || attempt == maxAttempts) {
                    break
                }
                // Log and wait before retrying the call
                println("Gemini API call failed (attempt $attempt/$maxAttempts) with error: ${e.message}. Retrying in ${currentDelay}ms...")
                delay(currentDelay)
                currentDelay = (currentDelay * 2.0).toLong()
            }
        }

        val errorDetail = lastException?.let {
            if (it is HttpException) {
                val code = it.code()
                val message = it.message() ?: "Service Error"
                when (code) {
                    503 -> "Servidor de Gemini saturado temporalmente (HTTP 503 Service Unavailable)"
                    429 -> "Límite de peticiones de Gemini excedido (HTTP 429 Too Many Requests)"
                    else -> "Error del Servidor Gemini (HTTP $code: $message)"
                }
            } else {
                it.localizedMessage ?: it.message
            }
        } ?: "Desconocido"

        return "Network Error: $errorDetail. Los servidores de IA están ocupados en este momento. Por favor, vuelve a intentar la generación en unos instantes."
    }
}
