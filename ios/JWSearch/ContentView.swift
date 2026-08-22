import SwiftUI

struct ContentView: View {
    @StateObject private var client = SearchClient.shared
    @State private var query: String = ""
    @State private var includeExternal: Bool = false
    @State private var selectedLanguage: String = "pt"
    
    @State private var aiResponse: String = ""
    @State private var results: [SearchResult] = []
    @State private var isLoading: Bool = false
    @State private var errorMessage: String? = nil
    
    @State private var showSettingsSheet: Bool = false
    @State private var selectedUrlToRead: String? = nil
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 16) {
                    // First-Time Setup Card if no API Key is configured
                    if client.apiKey.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                        VStack(alignment: .leading, spacing: 10) {
                            HStack {
                                Image(systemName: "key.fill")
                                    .foregroundColor(.orange)
                                Text("Configuração da Chave de IA")
                                    .font(.headline)
                                    .foregroundColor(.orange)
                            }
                            
                            Text("Este aplicativo roda 100% autônomo no seu iPhone. Para começar, obtenha sua chave gratuita do Google Gemini:")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            
                            Button(action: {
                                if let url = URL(string: "https://aistudio.google.com/app/apikey") {
                                    UIApplication.shared.open(url)
                                }
                            }) {
                                HStack {
                                    Text("1. Obter Chave no Google AI Studio")
                                    Image(systemName: "arrow.up.right.square")
                                }
                                .font(.caption.bold())
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 8)
                                .background(Color.blue)
                                .foregroundColor(.white)
                                .cornerRadius(8)
                            }
                            
                            HStack {
                                SecureField("Cole sua chave AIzaSy...", text: .apiKey)
                                    .textFieldStyle(RoundedBorderTextFieldStyle())
                                    .font(.caption)
                            }
                        }
                        .padding()
                        .background(Color(UIColor.secondarySystemBackground))
                        .cornerRadius(12)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color.orange.opacity(0.4), lineWidth: 1)
                        )
                    }
                    
                    // Search Bar Card
                    VStack(spacing: 12) {
                        HStack {
                            Image(systemName: "magnifyingglass")
                                .foregroundColor(.gray)
                            TextField("Digite o assuntou ou dúvida", text: )
                                .submitLabel(.search)
                                .onSubmit {
                                    performSearch()
                                }
                            
                            if !query.isEmpty {
                                Button(action: { query = "" }) {
                                    Image(systemName: "xmark.circle.fill")
                                        .foregroundColor(.gray)
                                }
                            }
                        }
                        .padding(12)
                        .background(Color(UIColor.secondarySystemBackground))
                        .cornerRadius(10)
                        
                        // Filters and Language Row
                        HStack {
                            Picker("Idioma", selection: ) {
                                Text("Português").tag("pt")
                                Text("English").tag("en")
                                Text("Español").tag("es")
                            }
                            .pickerStyle(MenuPickerStyle())
                            
                            Spacer()
                            
                            Button(action: performSearch) {
                                HStack {
                                    if isLoading {
                                        ProgressView()
                                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                            .scaleEffect(0.8)
                                    } else {
                                        Text("Buscar")
                                            .font(.subheadline.bold())
                                    }
                                }
                                .padding(.horizontal, 20)
                                .padding(.vertical, 8)
                                .background(query.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || isLoading ? Color.gray : Color.blue)
                                .foregroundColor(.white)
                                .cornerRadius(8)
                            }
                            .disabled(query.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || isLoading)
                        }
                        
                        Toggle("Incluir fontes externas da internet", isOn: )
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .padding()
                    .background(Color(UIColor.systemBackground))
                    .cornerRadius(12)
                    .shadow(color: Color.black.opacity(0.05), radius: 4, x: 0, y: 2)
                    
                    // Error Message
                    if let error = errorMessage {
                        HStack {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .foregroundColor(.red)
                            Text(error)
                                .font(.caption)
                                .foregroundColor(.red)
                        }
                        .padding()
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color.red.opacity(0.1))
                        .cornerRadius(8)
                    }
                    
                    // AI Response Card
                    if !aiResponse.isEmpty {
                        VStack(alignment: .leading, spacing: 12) {
                            HStack {
                                Image(systemName: "sparkles")
                                    .foregroundColor(.blue)
                                Text("Síntese Teocrática Personalizada")
                                    .font(.headline)
                            }
                            
                            Text(LocalizedStringKey(aiResponse))
                                .font(.body)
                                .lineSpacing(4)
                        }
                        .padding()
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color(UIColor.systemBackground))
                        .cornerRadius(12)
                        .shadow(color: Color.black.opacity(0.05), radius: 4, x: 0, y: 2)
                    }
                    
                    // Reference Results
                    if !results.isEmpty {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Fontes e Publicações Citadas (\(results.count))")
                                .font(.headline)
                            
                            ForEach(results) { item in
                                VStack(alignment: .leading, spacing: 6) {
                                    HStack {
                                        Text(item.publication)
                                            .font(.caption2.bold())
                                            .padding(.horizontal, 6)
                                            .padding(.vertical, 2)
                                            .background(item.isExternal ? Color.orange.opacity(0.2) : Color.blue.opacity(0.1))
                                            .foregroundColor(item.isExternal ? .orange : .blue)
                                            .cornerRadius(4)
                                        
                                        Spacer()
                                        
                                        if !item.isExternal {
                                            Text("FONTE OFICIAL")
                                                .font(.system(size: 9, weight: .bold))
                                                .foregroundColor(.blue)
                                        }
                                    }
                                    
                                    Text(item.title)
                                        .font(.subheadline.bold())
                                        .foregroundColor(.primary)
                                    
                                    Text(item.snippet)
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                    
                                    HStack {
                                        Button("Acessar Link") {
                                            if let url = URL(string: item.link) {
                                                UIApplication.shared.open(url)
                                            }
                                        }
                                        .font(.caption.bold())
                                        
                                        Spacer()
                                        
                                        if item.link.contains("wol.jw.org") {
                                            Button("Ler no App") {
                                                selectedUrlToRead = item.link
                                            }
                                            .font(.caption.bold())
                                            .foregroundColor(.blue)
                                        }
                                    }
                                    .padding(.top, 4)
                                }
                                .padding()
                                .background(Color(UIColor.secondarySystemBackground))
                                .cornerRadius(10)
                            }
                        }
                    }
                }
                .padding()
            }
            .navigationTitle("JW Search")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showSettingsSheet = true }) {
                        Image(systemName: "key.fill")
                            .foregroundColor(client.apiKey.isEmpty ? .orange : .blue)
                    }
                }
            }
            .sheet(isPresented: ) {
                SettingsSheetView()
            }
            .sheet(item: Binding(
                get: { selectedUrlToRead.map { IdentifiableURL(url: ) } },
                set: { selectedUrlToRead = .url }
            )) { item in
                ReaderModalView(url: item.url)
            }
        }
    }
    
    private func performSearch() {
        let q = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !q.isEmpty else { return }
        
        isLoading = true
        errorMessage = nil
        aiResponse = ""
        results = []
        
        Task {
            do {
                let response = try await client.search(
                    query: q,
                    includeExternal: includeExternal,
                    lang: selectedLanguage
                )
                await MainActor.run {
                    self.aiResponse = response.aiResponse
                    self.results = response.results
                    self.isLoading = false
                }
            } catch {
                await MainActor.run {
                    self.errorMessage = error.localizedDescription
                    self.isLoading = false
                }
            }
        }
    }
}

struct IdentifiableURL: Identifiable {
    let id = UUID()
    let url: String
}

struct SettingsSheetView: View {
    @Environment(\.dismiss) var dismiss
    @StateObject private var client = SearchClient.shared
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Chave de API do Google Gemini")) {
                    Text("O JW Search utiliza a inteligência artificial do Google Gemini com busca em tempo real.")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Button("Abrir Google AI Studio (Obter Chave Gratuita)") {
                        if let url = URL(string: "https://aistudio.google.com/app/apikey") {
                            UIApplication.shared.open(url)
                        }
                    }
                    
                    SecureField("Cole sua GEMINI_API_KEY aqui", text: .apiKey)
                }
                
                Section(header: Text("Sobre o Aplicativo")) {
                    HStack {
                        Text("Versão")
                        Spacer()
                        Text("1.2.0 (iOS Standalone)")
                            .foregroundColor(.secondary)
                    }
                    HStack {
                        Text("Fontes Primárias")
                        Spacer()
                        Text("jw.org & wol.jw.org")
                            .foregroundColor(.secondary)
                    }
                }
            }
            .navigationTitle("Configurações")
            .navigationBarItems(trailing: Button("Concluir") { dismiss() })
        }
    }
}

struct ReaderModalView: View {
    let url: String
    @Environment(\.dismiss) var dismiss
    @State private var content: String = "Carregando artigo..."
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Text(url)
                        .font(.caption)
                        .foregroundColor(.blue)
                    
                    Text(content)
                        .font(.body)
                        .padding(.top)
                }
                .padding()
            }
            .navigationTitle("Leitor de Artigo")
            .navigationBarItems(trailing: Button("Fechar") { dismiss() })
            .task {
                do {
                    let doc = try await SearchClient.shared.readDocument(url: url)
                    self.content = doc
                } catch {
                    self.content = "Erro ao carregar artigo: \(error.localizedDescription)"
                }
            }
        }
    }
}
