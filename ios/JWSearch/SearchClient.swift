import Foundation

struct SearchResult: Identifiable, Hashable {
    let id = UUID()
    let title: String
    let snippet: String
    let link: String
    let publication: String
    let isExternal: Bool
    let sourceSite: String
}

struct SearchResponse {
    let aiResponse: String
    let results: [SearchResult]
}

@MainActor
class SearchClient: ObservableObject {
    static let shared = SearchClient()
    
    @Published var apiKey: String {
        didSet {
            UserDefaults.standard.set(apiKey, forKey: "gemini_api_key")
        }
    }
    
    init() {
        self.apiKey = UserDefaults.standard.string(forKey: "gemini_api_key") ?? ""
    }
    
    func inferPublication(title: String, url: String) -> String {
        let urlLower = url.lowercased()
        if urlLower.contains("sentinela") || urlLower.contains("watchtower") || urlLower.range(of: #"/w\d{4}"#, options: .regularExpression) != nil {
            return "A Sentinela"
        } else if urlLower.contains("despertai") || urlLower.contains("awake") || urlLower.range(of: #"/g\d{4}"#, options: .regularExpression) != nil {
            return "Despertai!"
        } else if urlLower.contains("it-1") || urlLower.contains("it-2") || urlLower.contains("perspicaz") || urlLower.contains("insight") {
            return "Estudo Perspicaz das Escrituras"
        } else if urlLower.contains("nwt") || urlLower.contains("bi12") || urlLower.contains("biblia") || urlLower.contains("bible") {
            return "Bíblia Sagrada (Tradução do Novo Mundo)"
        } else if urlLower.contains("perguntas") || urlLower.contains("ijw") {
            return "Perguntas Bíblicas Respondidas"
        } else if urlLower.contains("wol.jw.org") {
            return "WOL - Biblioteca Online"
        } else if urlLower.contains("jw.org") {
            return "JW.ORG - Site Oficial"
        } else {
            return URL(string: url)?.host ?? "Fonte da Internet"
        }
    }
    
    func cleanTitle(title: String, url: String) -> String {
        let generic = ["jw.org", "WOL", "WOL - Biblioteca", "Link de Referência", "Artigo de Referência"]
        if title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || generic.contains(title) {
            if let u = URL(string: url) {
                let parts = u.pathComponents.filter { !["/", "pt", "en", "es", "wol", "d", "r5", "lp-t"].contains() }
                if let last = parts.last {
                    let decoded = last.removingPercentEncoding ?? last
                    return decoded.replacingOccurrences(of: "-", with: " ").capitalized
                }
            }
            return "Artigo da Biblioteca"
        }
        return title.removingPercentEncoding ?? title
    }
    
    func buildPrompt(query: String, includeExternal: Bool, lang: String) -> String {
        let targetLang = lang == "en" ? "English" : (lang == "es" ? "Español" : "Português (Brasil)")
        let sourceDirective = includeExternal ?
            """
            Você tem permissão para pesquisar na Internet em geral para contextualizar fatos históricos, arqueológicos ou científicos.
            No entanto, PRIORIZE E DESTAQUE SEMPRE o entendimento teocrático oficial publicado em wol.jw.org e jw.org.
            SEPARAÇÃO OBRIGATÓRIA: Qualquer informação ou fonte externa que não venha de jw.org/wol.jw.org DEVE ser categorizada exclusivamente no final sob a seção '### 🌐 Fontes Externas (Internet)'.
            """ :
            """
            ATENÇÃO: Sua pesquisa DEVE SER RESTRITA EXCLUSIVAMENTE aos sites oficiais das Testemunhas de Jeová: wol.jw.org e jw.org (incluindo todos os subdomínios).
            - NÃO utilize nenhuma fonte de terceiros, blogs, enciclopédias seculares ou opiniões não-oficiais.
            - Toda explicação doutrinária, moral ou histórica deve estar fundamentada nas publicações oficiais (A Sentinela, Despertai!, Estudo Perspicaz das Escrituras, Livros da Torre de Vigia, etc.).
            """
        
        return """
        Você é um assistente de pesquisa teocrática avançado e profundo (no estilo de um motor de busca analítico como Perplexity AI / RAG Especializado), focado no acervo da Biblioteca Online da Torre de Vigia (wol.jw.org) e do site oficial (jw.org).
        
        IDIOMA DA RESPOSTA: Responda obrigatoriamente em \(targetLang).
        
        DIRETRIZES DE ESCOPO E FONTES:
        \(sourceDirective)
        
        ESTRUTURA OBRIGATÓRIA DA RESPOSTA:
        ### 📌 Resposta Direta & Síntese
        (Apresente um resumo claro, objetivo e bíblico).
        
        ### 📖 Análise Teocrática Detalhada
        (Desenvolva os pontos com citações e links Markdown no texto).
        
        ### 📜 Textos Bíblicos Principais
        (Destaque os textos bíblicos e a aplicação de cada um).
        
        ### 📚 Publicações e Fontes Oficiais
        (Liste links das fontes consultadas no wol.jw.org / jw.org).
        
        \(includeExternal ? "### 🌐 Fontes Externas (Internet)" : "")
        
        PERGUNTA DO USUÁRIO: "\(query)"
        """
    }
    
    func search(query: String, includeExternal: Bool, lang: String) async throws -> SearchResponse {
        let key = apiKey.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !key.isEmpty else {
            throw NSError(domain: "JWSearch", code: 401, userInfo: [NSLocalizedDescriptionKey: "Chave da API do Gemini não configurada. Toque no ícone de chave no topo para configurar sua chave gratuita."])
        }
        
        guard let endpoint = URL(string: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=\(key)") else {
            throw NSError(domain: "JWSearch", code: 400, userInfo: [NSLocalizedDescriptionKey: "URL da API inválida."])
        }
        
        let prompt = buildPrompt(query: query, includeExternal: includeExternal, lang: lang)
        let requestPayload: [String: Any] = [
            "contents": [
                [
                    "role": "user",
                    "parts": [["text": prompt]]
                ]
            ],
            "tools": [
                ["googleSearch": [String: Any]()]
            ]
        ]
        
        var request = URLRequest(url: endpoint)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: requestPayload)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw NSError(domain: "JWSearch", code: 500, userInfo: [NSLocalizedDescriptionKey: "Falha na comunicação com o servidor."])
        }
        
        guard (200...299).contains(httpResponse.statusCode) else {
            if let errJson = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let errObj = errJson["error"] as? [String: Any],
               let msg = errObj["message"] as? String {
                throw NSError(domain: "JWSearch", code: httpResponse.statusCode, userInfo: [NSLocalizedDescriptionKey: msg])
            }
            throw NSError(domain: "JWSearch", code: httpResponse.statusCode, userInfo: [NSLocalizedDescriptionKey: "Erro da API do Gemini (\(httpResponse.statusCode))."])
        }
        
        guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
              let candidates = json["candidates"] as? [[String: Any]],
              let firstCandidate = candidates.first else {
            throw NSError(domain: "JWSearch", code: 404, userInfo: [NSLocalizedDescriptionKey: "Nenhuma resposta gerada pela IA."])
        }
        
        var aiResponse = ""
        if let content = firstCandidate["content"] as? [String: Any],
           let parts = content["parts"] as? [[String: Any]],
           let firstPart = parts.first,
           let text = firstPart["text"] as? String {
            aiResponse = text
        }
        
        var rawChunks: [(uri: String, title: String)] = []
        if let metadata = firstCandidate["groundingMetadata"] as? [String: Any],
           let groundingChunks = metadata["groundingChunks"] as? [[String: Any]] {
            for chunk in groundingChunks {
                if let web = chunk["web"] as? [String: Any],
                   let uri = web["uri"] as? String,
                   let title = web["title"] as? String {
                    rawChunks.append((uri, title))
                }
            }
        }
        
        // Extract Markdown Links
        let pattern = #"\((https?://[a-zA-Z0-9\.\-\/\?&\=\#\%\+\:\_]+)\)"#
        if let regex = try? NSRegularExpression(pattern: pattern) {
            let nsString = aiResponse as NSString
            let matches = regex.matches(in: aiResponse, range: NSRange(location: 0, length: nsString.length))
            for match in matches {
                if let range = Range(match.range(at: 1), in: aiResponse) {
                    let uri = String(aiResponse[range])
                    if !rawChunks.contains(where: { .uri == uri }) {
                        rawChunks.append((uri, "Link de Referência"))
                    }
                }
            }
        }
        
        var results: [SearchResult] = []
        var seenUris: Set<String> = []
        
        for (uri, title) in rawChunks {
            let cleanUri = uri.components(separatedBy: "?").first?.components(separatedBy: "#").first ?? uri
            if seenUris.contains(cleanUri) { continue }
            seenUris.insert(cleanUri)
            
            let isExternal = !(uri.contains("jw.org") || uri.contains("wol.jw.org"))
            if !includeExternal && isExternal { continue }
            
            let pub = inferPublication(title: title, url: uri)
            let cleanT = cleanTitle(title: title, url: uri)
            
            results.append(SearchResult(
                title: cleanT,
                snippet: "Publicação citada na síntese teocrática. Toque para abrir.",
                link: uri,
                publication: pub,
                isExternal: isExternal,
                sourceSite: URL(string: uri)?.host ?? ""
            ))
        }
        
        return SearchResponse(aiResponse: aiResponse, results: results)
    }
    
    func readDocument(url: String) async throws -> String {
        guard let docUrl = URL(string: url) else {
            throw NSError(domain: "JWSearch", code: 400, userInfo: [NSLocalizedDescriptionKey: "URL inválida."])
        }
        
        var request = URLRequest(url: docUrl)
        request.setValue("Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)", forHTTPHeaderField: "User-Agent")
        let (data, _) = try await URLSession.shared.data(for: request)
        let html = String(data: data, encoding: .utf8) ?? ""
        
        return html
    }
}
