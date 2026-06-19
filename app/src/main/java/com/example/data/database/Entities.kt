package com.example.data.database

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(tableName = "movie_projects")
data class MovieProject(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val title: String,
    val genre: String,
    val artStyle: String,
    val description: String,
    val targetAudience: String,
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(
    tableName = "project_memories",
    foreignKeys = [
        ForeignKey(
            entity = MovieProject::class,
            parentColumns = ["id"],
            childColumns = ["projectId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index(value = ["projectId"])]
)
data class ProjectMemory(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val projectId: Int,
    val key: String, // Identificador único de agente/rol o sección de biblia
    val title: String,
    val content: String,
    val updatedAt: Long = System.currentTimeMillis()
)
