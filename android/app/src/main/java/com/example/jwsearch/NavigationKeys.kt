package com.example.jwsearch

import androidx.navigation3.runtime.NavKey
import kotlinx.serialization.Serializable

@Serializable data object Main : NavKey

@Serializable data class Reader(val url: String, val title: String, val publication: String) : NavKey
