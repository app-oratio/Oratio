#!/usr/bin/env python3
"""Gera o sistema estático do Catecismo para o Oratio a partir de um MOBI sem DRM.

O script não é executado pelo GitHub Pages. Ele deve ser executado localmente, uma vez,
e os arquivos resultantes podem ser versionados somente quando houver autorização para
publicar a edição utilizada.
"""
from __future__ import annotations
import argparse, datetime as dt, json, re, struct, unicodedata
from email import policy
from email.parser import BytesParser
from dataclasses import dataclass, field
from pathlib import Path

try:
    import yaml
    from bs4 import BeautifulSoup, NavigableString, Tag
except ImportError as exc:
    raise SystemExit("Instale as dependências: python -m pip install beautifulsoup4 lxml pyyaml") from exc

NUMBER_RE = re.compile(r"^(\d{1,4})[.\s\u00a0]+")
ROMAN_RE = re.compile(r"^(?:I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII)\.", re.I)
PART_RE = re.compile(r"^(PRIMEIRA|SEGUNDA|TERCEIRA|QUARTA)\s+PARTE\b", re.I)
SECTION_RE = re.compile(r"^(PRIMEIRA|SEGUNDA)\s+SEC(?:Ç|C)ÃO\b", re.I)
CHAPTER_RE = re.compile(r"^CAP[IÍ]TULO\b", re.I)
ARTICLE_RE = re.compile(r"^ARTIGO\b", re.I)
STRUCTURAL_PARAGRAPH_RE = re.compile(r"^PAR[ÁA]GRAFO\b", re.I)
PART_ORDER = {"PRIMEIRA": 1, "SEGUNDA": 2, "TERCEIRA": 3, "QUARTA": 4}
EXPECTED_FIRST_PARAGRAPH = 1
EXPECTED_LAST_PARAGRAPH = 2865

@dataclass
class Item:
    type: str
    text: str = ""
    html: str = ""
    number: int | None = None
    level: int = 5

@dataclass
class Unit:
    slug: str
    title: str
    part_id: str
    part_label: str
    part_title: str
    path: list[str]
    paragraph_start: int
    paragraph_end: int
    items: list[Item] = field(default_factory=list)


def palmdoc_decompress(src: bytes) -> bytes:
    out = bytearray(); i = 0
    while i < len(src):
        c = src[i]; i += 1
        if c == 0:
            out.append(0)
        elif c <= 8:
            out.extend(src[i:i + c]); i += c
        elif c <= 0x7F:
            out.append(c)
        elif c >= 0xC0:
            out.extend((0x20, c ^ 0x80))
        else:
            if i >= len(src): break
            pair = (c << 8) | src[i]; i += 1
            distance = (pair >> 3) & 0x7FF
            length = (pair & 7) + 3
            if not distance or distance > len(out):
                continue
            for _ in range(length): out.append(out[-distance])
    return bytes(out)


def extract_mobi_html(path: Path) -> str:
    data = path.read_bytes()
    if len(data) < 90:
        raise ValueError("Arquivo MOBI inválido ou incompleto.")
    record_count = struct.unpack(">H", data[76:78])[0]
    offsets = [struct.unpack(">I", data[78 + i * 8:82 + i * 8])[0] for i in range(record_count)] + [len(data)]
    record0 = data[offsets[0]:offsets[1]]
    compression, _, text_length, text_records, _, encryption, _ = struct.unpack(">HHIHHHH", record0[:16])
    if encryption:
        raise ValueError("O arquivo parece protegido. Use uma fonte sem DRM e com publicação autorizada.")
    if record0[16:20] != b"MOBI":
        raise ValueError("Cabeçalho MOBI não reconhecido.")
    encoding = struct.unpack(">I", record0[28:32])[0]
    codec = "utf-8" if encoding == 65001 else "cp1252"
    chunks = []
    for index in range(1, min(1 + text_records, record_count)):
        record = data[offsets[index]:offsets[index + 1]]
        if compression == 1: chunks.append(record)
        elif compression == 2: chunks.append(palmdoc_decompress(record))
        else: raise ValueError(f"Compressão MOBI não suportada: {compression}.")
    return b"".join(chunks)[:text_length].decode(codec, errors="replace")




def extract_mhtml_html(path: Path) -> str:
    """Extrai o documento HTML principal de um arquivo MHTML salvo pelo navegador."""
    message = BytesParser(policy=policy.default).parsebytes(path.read_bytes())
    candidates: list[tuple[int, str]] = []
    for part in message.walk():
        if part.get_content_type() != "text/html":
            continue
        payload = part.get_payload(decode=True) or b""
        charset = part.get_content_charset() or "utf-8"
        try:
            decoded = payload.decode(charset, errors="replace")
        except LookupError:
            decoded = payload.decode("utf-8", errors="replace")
        candidates.append((len(decoded), decoded))
    if not candidates:
        raise ValueError("O suplemento não contém uma parte HTML reconhecível.")
    return max(candidates, key=lambda item: item[0])[1]

def clean_text(value: str) -> str:
    value = value.replace("\ufffd", "").replace("\u00a0", " ")
    value = unicodedata.normalize("NFC", value)
    return re.sub(r"\s+", " ", value).strip()


def marker_from_prefix(value: str, limit: int = 52) -> int | None:
    prefix = clean_text(value)[:limit]
    dot = prefix.find(".")
    if dot < 0:
        return None
    marker = prefix[:dot]
    groups = re.findall(r"\d+", marker)
    if not groups:
        return None
    if len(groups) > 1:
        combined = "".join(groups)
        if 1 <= len(combined) <= 4:
            number = int(combined)
            if EXPECTED_FIRST_PARAGRAPH <= number <= EXPECTED_LAST_PARAGRAPH:
                return number
    for group in groups:
        number = int(group)
        if EXPECTED_FIRST_PARAGRAPH <= number <= EXPECTED_LAST_PARAGRAPH:
            return number
    return None


def numbered_marker(tag: Tag) -> tuple[int | None, bool]:
    bold = tag.find("b")
    if bold is not None:
        bold_text = clean_text(bold.get_text(" ", strip=True)).rstrip(".")
        if bold_text.isdigit():
            number = int(bold_text)
            if EXPECTED_FIRST_PARAGRAPH <= number <= EXPECTED_LAST_PARAGRAPH:
                return number, True
        number = marker_from_prefix(bold.get_text(" ", strip=True))
        if number is not None:
            return number, True
        raw_bold = str(bold)[:900]
        match = re.search(r"(?<!\d)(\d{1,4})\s*\.", raw_bold)
        if match:
            number = int(match.group(1))
            if EXPECTED_FIRST_PARAGRAPH <= number <= EXPECTED_LAST_PARAGRAPH:
                return number, True
    number = marker_from_prefix(tag.get_text(" ", strip=True))
    if number is not None:
        return number, True
    return None, False


def remove_leading_number_marker(node: Tag) -> None:
    for _ in range(2):
        text_nodes = [item for item in node.descendants if isinstance(item, NavigableString)]
        prefix = ""
        for item in text_nodes:
            prefix += str(item)
            if "." in prefix or len(prefix) >= 96:
                break
        dot = prefix.find(".")
        if dot < 0:
            return
        marker = prefix[:dot]
        if not any(character.isdigit() for character in marker) or len(marker.strip()) > 48:
            return
        if _ == 1 and not re.fullmatch(r"\s*\d{1,4}\s*", marker):
            return
        remaining = dot + 1
        for item in text_nodes:
            value = str(item)
            if remaining >= len(value):
                remaining -= len(value)
                item.extract()
                continue
            cleaned = value[remaining:].lstrip(" \t\r\n\u00a0")
            item.replace_with(cleaned)
            remaining = 0
            break
        if remaining:
            return


def paragraph_inner_html(tag: Tag, number: int) -> str:
    node = BeautifulSoup(str(tag), "lxml").find("p")
    if node is None:
        return ""
    remove_leading_number_marker(node)
    for removable in node.find_all(["script", "style", "img"]):
        removable.decompose()
    for wrapper in node.find_all(["font", "a", "span"]):
        wrapper.unwrap()
    for old, new_name in (("i", "em"), ("b", "strong")):
        for element in node.find_all(old):
            element.name = new_name
    for element in node.find_all(True):
        element.attrs = {}
        if element.name not in {"em", "strong", "u", "sup", "sub", "br"}:
            element.unwrap()
    rendered = "".join(str(child) for child in node.contents).strip()
    rendered = re.sub(r"^(?:\s|&nbsp;|\u00a0)+", "", rendered)
    return rendered


def next_plausible_marker(markers: list[tuple[int | None, bool]], index: int, last_number: int) -> int | None:
    for candidate, _ in markers[index + 1:index + 13]:
        if candidate is not None and candidate > last_number:
            return candidate
    return None


def heading_level(text: str) -> int:
    if PART_RE.match(text): return 2
    if SECTION_RE.match(text): return 2
    if CHAPTER_RE.match(text): return 3
    if ARTICLE_RE.match(text) or STRUCTURAL_PARAGRAPH_RE.match(text): return 4
    return 5


def is_heading(tag: Tag, text: str) -> bool:
    if not text or len(text) > 240 or NUMBER_RE.match(text): return False
    if any(rx.match(text) for rx in (PART_RE, SECTION_RE, CHAPTER_RE, ARTICLE_RE, STRUCTURAL_PARAGRAPH_RE, ROMAN_RE)): return True
    upper_letters = [c for c in text if c.isalpha()]
    upper_ratio = sum(c.isupper() for c in upper_letters) / max(1, len(upper_letters))
    bold = tag.find("b") is not None
    centered = str(tag.get("align", "")).lower() == "center"
    return bold and (centered or upper_ratio > 0.82) and 2 <= len(text.split()) <= 24


def extract_items(
    raw_html: str,
    expected_first: int = EXPECTED_FIRST_PARAGRAPH,
    expected_last: int = EXPECTED_LAST_PARAGRAPH,
    include_structural_prelude: bool = False,
) -> list[Item]:
    soup = BeautifulSoup(raw_html, "lxml")
    paragraphs = soup.body.find_all("p", recursive=True) if soup.body else soup.find_all("p")
    markers = [numbered_marker(paragraph) for paragraph in paragraphs]
    first_number_index = next(
        (index for index, (number, _) in enumerate(markers) if number == expected_first),
        None,
    )
    if first_number_index is None:
        raise ValueError(f"Não foi encontrado o parágrafo inicial {expected_first}.")

    start = first_number_index
    if include_structural_prelude:
        for index in range(first_number_index - 1, max(-1, first_number_index - 80), -1):
            text = clean_text(paragraphs[index].get_text(" ", strip=True))
            if PART_RE.match(text):
                start = index
                break

    last_number = expected_first - 1
    items: list[Item] = []
    seen: set[int] = set()
    for index in range(start, len(paragraphs)):
        tag = paragraphs[index]
        text = clean_text(tag.get_text(" ", strip=True))
        detected, marker_evidence = markers[index]
        number: int | None = None
        expected = last_number + 1
        if detected is not None and detected not in seen and detected > last_number and detected <= last_number + 10:
            number = detected
        elif last_number >= expected_first and detected is not None and marker_evidence and next_plausible_marker(markers, index, last_number) == expected + 1:
            number = expected
        if number is not None and expected_first <= number <= expected_last:
            seen.add(number)
            last_number = number
            body_html = paragraph_inner_html(tag, number)
            plain = clean_text(BeautifulSoup(body_html, "lxml").get_text(" ", strip=True))
            items.append(Item(type="paragraph", number=number, text=plain, html=body_html))
            if last_number >= expected_last:
                break
        elif last_number >= expected_first - 1 and is_heading(tag, text):
            if not items or items[-1].type != "heading" or items[-1].text != text:
                items.append(Item(type="heading", text=text, level=heading_level(text)))
    if not seen:
        raise ValueError(f"Nenhum parágrafo entre {expected_first} e {expected_last} foi extraído.")
    return items


def current_path_update(path: dict[int, str], heading: Item) -> None:
    level = heading.level
    path[level] = heading.text
    for key in list(path):
        if key > level: path.pop(key, None)


def split_units(items: list[Item], target: int = 24, maximum: int = 32) -> list[Unit]:
    units: list[Unit] = []; pending: list[Item] = []; paragraph_count = 0
    part_id = "prologo"; part_label = "Prólogo"; part_title = "Prólogo"
    path: dict[int, str] = {}
    last_paragraph_number = 0

    def flush() -> None:
        nonlocal pending, paragraph_count
        numbered = [i.number for i in pending if i.type == "paragraph" and i.number is not None]
        if not numbered: return
        first, last = min(numbered), max(numbered)
        meaningful = [i.text for i in pending if i.type == "heading" and i.level <= 4]
        title = "Prólogo" if part_id == "prologo" and first == 1 else (meaningful[-1] if meaningful else f"Parágrafos {first}–{last}")
        slug = f"paragrafos-{first}-{last}"
        units.append(Unit(slug, title, part_id, part_label, part_title, [path[k] for k in sorted(path)], first, last, list(pending)))
        pending = []; paragraph_count = 0

    for item in items:
        if item.type == "heading":
            match = PART_RE.match(item.text)
            if match and last_paragraph_number >= 25:
                if paragraph_count >= max(8, target // 2): flush()
                order = PART_ORDER.get(match.group(1).upper(), len(units) + 1)
                part_id = f"parte-{order}"; part_label = f"{match.group(1).title()} parte"; part_title = item.text
                path.clear()
            should_break = paragraph_count >= target and item.level <= 4
            if should_break: flush()
            current_path_update(path, item)
            pending.append(item)
        else:
            pending.append(item); paragraph_count += 1
            if item.number is not None:
                last_paragraph_number = item.number
            if paragraph_count >= maximum: flush()
    flush()
    return units


def safe_yaml(value: object) -> str:
    class NoAliasSafeDumper(yaml.SafeDumper):
        def ignore_aliases(self, data: object) -> bool:
            return True

    return yaml.dump(
        value,
        Dumper=NoAliasSafeDumper,
        allow_unicode=True,
        sort_keys=False,
        width=120,
    )


def compact_ranges(numbers: list[int]) -> list[str]:
    if not numbers:
        return []
    ranges: list[str] = []
    start = previous = numbers[0]
    for number in numbers[1:]:
        if number == previous + 1:
            previous = number
            continue
        ranges.append(str(start) if start == previous else f"{start}-{previous}")
        start = previous = number
    ranges.append(str(start) if start == previous else f"{start}-{previous}")
    return ranges


def write_outputs(repo: Path, units: list[Unit], sources: list[Path], clean: bool) -> None:
    data_dir = repo / "_data" / "catechism_units"; collection_dir = repo / "_catecismo"
    data_dir.mkdir(parents=True, exist_ok=True); collection_dir.mkdir(parents=True, exist_ok=True)
    if clean:
        for folder, pattern in ((data_dir, "*.json"), (collection_dir, "*.md")):
            for file in folder.glob(pattern): file.unlink()
    part_map: dict[str, dict] = {}; compact_units = []
    for index, unit in enumerate(units):
        previous = units[index - 1] if index else None; following = units[index + 1] if index + 1 < len(units) else None
        unit_data = {
            "slug": unit.slug, "title": unit.title, "part_id": unit.part_id, "part_label": unit.part_label,
            "part_title": unit.part_title, "path": unit.path, "paragraph_start": unit.paragraph_start,
            "paragraph_end": unit.paragraph_end, "plainText": " ".join(i.text for i in unit.items),
            "items": [{k: v for k, v in {"type": i.type, "text": i.text, "html": i.html, "number": i.number, "level": i.level}.items() if v not in (None, "")} for i in unit.items]
        }
        (data_dir / f"{unit.slug}.json").write_text(json.dumps(unit_data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        fm = {
            "layout": "catechism-reader", "title": unit.title,
            "description": f"Leia os parágrafos {unit.paragraph_start} a {unit.paragraph_end} do Catecismo da Igreja Católica.",
            "slug": unit.slug, "permalink": f"/catecismo/{unit.slug}/", "catechism_page": True,
            "catechism_unit": unit.slug, "part_id": unit.part_id, "part_label": unit.part_label,
            "part_title": unit.part_title, "structure_path": unit.path, "paragraph_start": unit.paragraph_start,
            "paragraph_end": unit.paragraph_end, "previous_url": f"/catecismo/{previous.slug}/" if previous else None,
            "previous_title": previous.title if previous else None, "next_url": f"/catecismo/{following.slug}/" if following else None,
            "next_title": following.title if following else None, "search": True, "search_type": "Catecismo · Unidade", "sitemap": True,
            "image": "/assets/images/social/og-default.webp"
        }
        fm = {k: v for k, v in fm.items() if v is not None}
        (collection_dir / f"{unit.slug}.md").write_text("---\n" + safe_yaml(fm) + "---\n", encoding="utf-8")
        compact = {"slug": unit.slug, "title": unit.title, "url": f"/catecismo/{unit.slug}/", "paragraph_start": unit.paragraph_start, "paragraph_end": unit.paragraph_end, "paragraphs": [i.number for i in unit.items if i.type == "paragraph" and i.number is not None], "path": unit.path, "part_id": unit.part_id}
        compact_units.append(compact)
        if unit.part_id not in part_map:
            part_map[unit.part_id] = {"id": unit.part_id, "label": unit.part_label, "title": unit.part_title, "units": []}
        part_map[unit.part_id]["units"].append(compact)
    numbers = sorted({i.number for u in units for i in u.items if i.type == "paragraph" and i.number is not None})
    expected = set(range(EXPECTED_FIRST_PARAGRAPH, EXPECTED_LAST_PARAGRAPH + 1))
    missing = sorted(expected.difference(numbers))
    missing_ranges = compact_ranges(missing)
    manifest = {
        "version": 1, "generated": True, "complete": not missing, "title": "Catecismo da Igreja Católica",
        "description": "Leitura organizada do Catecismo da Igreja Católica por partes e parágrafos.",
        "source_files": [source.name for source in sources], "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "paragraph_count": len(numbers), "paragraph_max": max(numbers), "expected_paragraph_max": EXPECTED_LAST_PARAGRAPH,
        "missing_paragraph_count": len(missing), "missing_ranges": missing_ranges, "unit_count": len(units),
        "parts": list(part_map.values()), "units": compact_units
    }
    (repo / "_data" / "catechism.yml").write_text(safe_yaml(manifest), encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Gera as páginas do Catecismo para o portal Oratio.")
    parser.add_argument("mobi", type=Path, help="Caminho do arquivo MOBI sem DRM com os parágrafos 1 a 2557.")
    parser.add_argument(
        "--supplement",
        type=Path,
        help="Arquivo MHTML/HTML complementar com a quarta parte, dos parágrafos 2558 a 2865.",
    )
    parser.add_argument("--repo", type=Path, default=Path.cwd(), help="Raiz do repositório Oratio.")
    parser.add_argument("--paragraphs-per-unit", type=int, default=24, help="Tamanho aproximado de cada unidade.")
    parser.add_argument("--confirm-publication-rights", action="store_true", help="Confirma que há autorização para publicar esta edição.")
    parser.add_argument("--allow-incomplete-source", action="store_true", help="Permite gerar uma edição incompleta, mantendo um aviso público no índice.")
    parser.add_argument("--no-clean", action="store_true", help="Não remove unidades geradas anteriormente.")
    args = parser.parse_args()
    if not args.confirm_publication_rights:
        parser.error("Use --confirm-publication-rights somente após confirmar que esta edição pode ser publicada no site.")
    if not args.mobi.is_file():
        parser.error(f"Arquivo não encontrado: {args.mobi}")
    if args.supplement and not args.supplement.is_file():
        parser.error(f"Suplemento não encontrado: {args.supplement}")
    repo = args.repo.resolve()
    if not (repo / "_config.yml").exists():
        parser.error("A pasta indicada em --repo não parece ser a raiz do Oratio.")

    primary_raw = extract_mobi_html(args.mobi)
    items = extract_items(primary_raw, 1, 2557)
    sources = [args.mobi]
    if args.supplement:
        supplement_raw = extract_mhtml_html(args.supplement)
        supplement_items = extract_items(
            supplement_raw,
            2558,
            EXPECTED_LAST_PARAGRAPH,
            include_structural_prelude=True,
        )
        items.extend(supplement_items)
        sources.append(args.supplement)

    extracted_numbers = sorted({item.number for item in items if item.type == "paragraph" and item.number is not None})
    expected = set(range(EXPECTED_FIRST_PARAGRAPH, EXPECTED_LAST_PARAGRAPH + 1))
    missing = sorted(expected.difference(extracted_numbers))
    if missing and not args.allow_incomplete_source:
        ranges = ", ".join(compact_ranges(missing)[:8])
        suffix = "…" if len(compact_ranges(missing)) > 8 else ""
        parser.error(
            f"A fonte está incompleta: faltam {len(missing)} parágrafos oficiais ({ranges}{suffix}). "
            "Forneça o suplemento da quarta parte ou acrescente --allow-incomplete-source apenas para publicar conscientemente uma versão parcial."
        )
    units = split_units(items, max(10, args.paragraphs_per_unit), max(16, args.paragraphs_per_unit + 8))
    write_outputs(repo, units, sources, clean=not args.no_clean)
    paragraphs = {i.number for u in units for i in u.items if i.type == "paragraph"}
    print(f"Catecismo gerado: {len(paragraphs)} parágrafos em {len(units)} unidades.")
    if missing:
        print(f"AVISO: fonte incompleta; faltam {len(missing)} parágrafos. O índice exibirá esta condição.")
    print("Revise o conteúdo e execute bundle exec jekyll build antes de publicar.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
