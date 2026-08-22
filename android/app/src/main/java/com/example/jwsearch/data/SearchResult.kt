package com.example.jwsearch.data

data class SearchResult(
    val title: String,
    val snippet: String,
    val link: String,
    val publication: String,
    val isExternal: Boolean,
    val sourceSite: String
)

data class SearchResponse(
    val aiResponse: String,
    val results: List<SearchResult>
)
