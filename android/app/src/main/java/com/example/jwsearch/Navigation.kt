package com.example.jwsearch

import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation3.runtime.entryProvider
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.navigation3.ui.NavDisplay
import com.example.jwsearch.ui.main.MainScreen
import com.example.jwsearch.ui.main.ReaderScreen

@Composable
fun MainNavigation() {
  val backStack = rememberNavBackStack(Main)

  NavDisplay(
    backStack = backStack,
    onBack = { backStack.removeLastOrNull() },
    entryProvider =
      entryProvider {
        entry<Main> {
          MainScreen(
              onItemClick = { navKey -> backStack.add(navKey) }, 
              modifier = Modifier.safeDrawingPadding().padding(horizontal = 0.dp)
          )
        }
        entry<Reader> { key ->
          ReaderScreen(
              url = key.url,
              title = key.title,
              publication = key.publication,
              onBack = { backStack.removeLastOrNull() },
              modifier = Modifier.safeDrawingPadding()
          )
        }
      },
  )
}
