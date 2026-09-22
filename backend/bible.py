"""Parse complete references and extract only explicit verse markers."""

import re
from bs4 import BeautifulSoup


def parse_bible_ref(ref_str):
    from scraper import BIBLE_BOOKS_MAP

    match = re.fullmatch(
        r"(?:(1|2|3)\s*)?([a-zA-ZÀ-ÿ\s]+?)\.?\s+(\d+)[:.]\s*(\d+(?:\s*-\s*(?:\d+:)?\d+)?(?:\s*,\s*\d+(?:\s*-\s*\d+)?)*)",
        ref_str.strip(),
    )
    if not match:
        return None
    prefix, name, chapter_s, expression = match.groups()
    book_name = ((prefix + " ") if prefix else "") + name.strip()
    book_num = BIBLE_BOOKS_MAP.get(book_name.lower())
    chapter = int(chapter_s)
    if not book_num or not 1 <= chapter <= 150:
        return None
    spans = []
    for segment in expression.replace(" ", "").split(","):
        bounds = segment.split("-")
        start = int(bounds[0])
        end_chapter = chapter
        if len(bounds) == 2 and ":" in bounds[1]:
            end_chapter, end = map(int, bounds[1].split(":"))
        else:
            end = int(bounds[-1])
        if (
            not 1 <= start <= 176
            or not 1 <= end <= 176
            or not chapter <= end_chapter <= min(150, chapter + 2)
        ):
            return None
        if chapter == end_chapter and end < start:
            return None
        spans.append((chapter, start, end_chapter, end))
    return {
        "book_num": book_num,
        "book_name": book_name.title(),
        "chapter": chapter,
        "v_start": spans[0][1],
        "v_end": spans[-1][3],
        "spans": spans,
        "reference": f"{book_name.title()} {chapter}:{expression.replace(' ', '')}",
    }


def fetch_verse_content(ref_str, lang="pt"):
    from scraper import fetch_url

    parsed = parse_bible_ref(ref_str)
    if not parsed or lang not in ("pt", "en", "es"):
        return None
    region = {"pt": "r5/lp-t", "en": "r1/lp-e", "es": "r4/lp-s"}[lang]
    chapters, picked = {}, {}
    for chapter, start, end_chapter, end in parsed["spans"]:
        for current in range(chapter, end_chapter + 1):
            if current not in chapters:
                url = f"https://wol.jw.org/{lang}/wol/b/{region}/nwt/{parsed['book_num']}/{current}"
                html = fetch_url(url)
                if not html:
                    return None
                soup = BeautifulSoup(html, "html.parser")
                verses = {}
                pattern = re.compile(rf"^v{parsed['book_num']}-{current}-(\d+)-\d+$")
                for span in soup.find_all(id=pattern):
                    number = int(pattern.fullmatch(span["id"])[1])
                    for link in span.select("a.b, a.fn, a.vl"):
                        link.decompose()
                    verses.setdefault(number, []).append(span.get_text(" ", strip=True))
                chapters[current] = (url, verses)
            url, verses = chapters[current]
            first = start if current == chapter else 1
            last = end if current == end_chapter else max(verses, default=0)
            if last < first or any(n not in verses for n in range(first, last + 1)):
                return None
            for n in range(first, last + 1):
                picked[(current, n)] = " ".join(verses[n])
    if not picked or len(picked) > 100:
        return None
    return {
        "reference": parsed["reference"],
        "verse_text": " ".join(
            f"{c}:{v} {text}" for (c, v), text in sorted(picked.items())
        ),
        "chapter_url": chapters[parsed["chapter"]][0],
        "book_num": parsed["book_num"],
        "chapter": parsed["chapter"],
        "publication": "Bíblia Sagrada (Tradução do Novo Mundo)",
    }
