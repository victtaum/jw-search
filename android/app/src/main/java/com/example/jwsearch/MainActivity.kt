package com.example.jwsearch

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.example.jwsearch.theme.JWSearchTheme

import android.content.Context
import com.example.jwsearch.data.SearchApiClient

class MainActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    // Load persisted API Key for standalone autonomous mobile operation
    val prefs = getSharedPreferences("jw_search_prefs", Context.MODE_PRIVATE)
    SearchApiClient.apiKey = prefs.getString("gemini_api_key", "") ?: ""

    enableEdgeToEdge()
    setContent {
      JWSearchTheme { Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) { MainNavigation() } }
    }
  }
}

