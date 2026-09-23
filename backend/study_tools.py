"""Typed configuration for the four study tools (editorial aids, not official outlines)."""

from typing import Literal
from pydantic import BaseModel, Field

DURATIONS = (3, 5, 10, 15, 30, 45, 60)
PROFILES = (
    "children_3_5",
    "children_6_9",
    "children_10_12",
    "teens",
    "adults",
    "couple",
    "seniors",
)

PROFILE_LABELS = {
    "children_3_5": "crianças de 3 a 5 anos",
    "children_6_9": "crianças de 6 a 9 anos",
    "children_10_12": "crianças de 10 a 12 anos",
    "teens": "adolescentes",
    "adults": "adultos",
    "couple": "casal (marido e mulher)",
    "seniors": "idosos",
}


class ToolOptions(BaseModel):
    kind: Literal["comparison", "family", "scriptures", "outline"]
    duration_minutes: Literal[3, 5, 10, 15, 30, 45, 60] = 30
    profiles: list[
        Literal[
            "children_3_5",
            "children_6_9",
            "children_10_12",
            "teens",
            "adults",
            "couple",
            "seniors",
        ]
    ] = Field(default_factory=lambda: ["adults"], max_length=7)
    selected_references: list[str] = Field(default_factory=list, max_length=20)


def outline_schedule(minutes):
    times = {
        3: (20, 130, 20, 10),
        5: (30, 220, 30, 20),
        10: (60, 450, 60, 30),
        15: (90, 690, 90, 30),
        30: (180, 1380, 180, 60),
        45: (240, 2100, 240, 120),
        60: (300, 2820, 300, 180),
    }
    return [
        dict(label=label, seconds=seconds)
        for label, seconds in zip(
            (
                "Introdução",
                "Desenvolvimento, leituras e aplicações",
                "Conclusão",
                "Transições e pausas",
            ),
            times[minutes],
        )
    ]


def tool_instruction(options):
    if not options:
        return ""
    references = (
        "\nTextos selecionados pelo usuário (validar nas fontes): "
        + ", ".join(options.selected_references)
        if options.selected_references
        else ""
    )
    common = (
        "\nMATERIAL DERIVADO: use o assunto da conversa e somente as evidências coletadas nesta execução. "
        "Não trate a resposta anterior como fonte. Identifique sugestões de aplicação e lacunas. "
    )
    profile_labels = [PROFILE_LABELS[profile] for profile in options.profiles]
    prompts = {
        "comparison": "Crie uma tabela comparativa dos ASSUNTOS, argumentos, relatos e textos avaliados na pesquisa. Para cada linha, mostre: assunto ou ponto analisado; o que cada texto ou publicação expressa; como as evidências se complementam ou se distinguem; princípio bíblico; pérola espiritual ou detalhe relevante; aplicação possível; e fontes oficiais. A comparação deve ajudar a perceber relações e nuances do tema, sem inventar oposições. Quando houver apenas uma evidência para um ponto, deixe isso claro. Se faltar suporte, declare a lacuna.",
        "scriptures": "Produza uma LISTA TEMÁTICA centrada principalmente no que a Bíblia diz sobre o assunto, sem comparar os textos entre si. Para cada texto bíblico, apresente referência, transcrição integral quando estiver nas evidências, contexto, o que ele ensina sobre o tema, princípio e aplicação possível. Organize primeiro os textos principais e depois os complementares. Use as publicações para esclarecer o contexto e a aplicação, identificando-as pelo nome. Não use tabela e não invente transcrição nem URL.",
        "family": f"Prepare um estudo em família com objetivo, sequência de leituras, perguntas abertas, atividade, aplicação na semana e recapitulação. Perfis escolhidos: {', '.join(profile_labels)}. Crie uma subseção com sugestão concreta para CADA perfil escolhido, usando exatamente esses nomes em português e sem omitir nenhum. Para crianças de 3 a 5 anos, use linguagem simples e atividade curta sem exigir leitura. Para casal, inclua reflexão individual de marido e mulher e conversa conjunta, sem estereótipos. Para idosos, permita leitura ampliada e participação oral. Separe roteiro comum de notas do facilitador. Não imponha duração nem distribua minutos. Não peça nomes ou datas de nascimento.",
        "outline": f"Prepare um esboço para discurso de {options.duration_minutes} minutos, com tema, objetivo, introdução, pontos principais, textos para ler, explicação, aplicações, transições e conclusão. Use esta distribuição em segundos: {outline_schedule(options.duration_minutes)}. Leituras estão incluídas no desenvolvimento. Apresente tópicos para o orador, não só um texto corrido. A distribuição é sugestão editorial, não esboço oficial. O tempo de fala depende de ensaio.",
    }
    return common + prompts[options.kind] + references
