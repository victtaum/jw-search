package com.example.jwsearch.ui.main

import junit.framework.TestCase.assertEquals
import junit.framework.TestCase.assertFalse
import junit.framework.TestCase.assertNull
import kotlinx.coroutines.test.runTest
import org.junit.Test

class MainScreenViewModelTest {
  @Test
  fun uiState_initialState() = runTest {
    val viewModel = MainScreenViewModel()
    val state = viewModel.uiState.value
    assertEquals("", state.query)
    assertFalse(state.includeExternal)
    assertEquals("pt", state.language)
    assertFalse(state.isLoading)
    assertNull(state.errorMessage)
    assertEquals(0, state.results.size)
  }

  @Test
  fun uiState_onQueryChanged() = runTest {
    val viewModel = MainScreenViewModel()
    viewModel.onQueryChanged("amor")
    assertEquals("amor", viewModel.uiState.value.query)
  }
}
