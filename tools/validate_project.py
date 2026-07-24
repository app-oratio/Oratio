#!/usr/bin/env python3
"""Valida a estrutura editorial do portal sem substituir uma compilação Jekyll."""

from __future__ import annotations

import re
import sys
from datetime import date
from pathlib import Path

import yaml


ROOT = Path(__file__).resolve().parents[1]
ERRORS: list[str] = []
WARNINGS: list[str] = []

REQUIRED = [
    "_config.yml",
    "Gemfile",
    "Gemfile.lock",
    "index.html",
    "404.html",
    "_layouts/default.html",
    "_includes/toolbar.html",
    "_includes/drawer.html",
    "_includes/footer.html",
    "assets/css/main.css",
    "assets/js/theme.js",
    "assets/js/drawer.js",
    "assets/js/search.js",
    "search/index.json",
    "_data/common_prayers.yml",
    "_includes/devotional-cover.html",
    "_includes/devotional-prayer-unit.html",
    "_includes/devotional-sequence.html",
    "_includes/search-devotional-text.html",
    "GUIA_DE_IMPLEMENTACAO.md",
    ".github/workflows/jekyll.yml",
]


def error(message: str) -> None:
    ERRORS.append(message)


def load_yaml(path: Path, text: str) -> object:
    try:
        return yaml.safe_load(text)
    except yaml.YAMLError as exc:
        error(f"YAML inválido em {path.relative_to(ROOT)}: {exc}")
        return None


def front_matter(path: Path) -> dict:
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---\n"):
        return {}
    end = text.find("\n---\n", 4)
    if end < 0:
        error(f"Front matter sem fechamento em {path.relative_to(ROOT)}")
        return {}
    data = load_yaml(path, text[4:end])
    if data is None:
        return {}
    if not isinstance(data, dict):
        error(f"Front matter deve ser um mapa em {path.relative_to(ROOT)}")
        return {}
    return data


def validate_language(value: object, path: Path, context: str) -> None:
    if value is not None and value not in {"pt", "la"}:
        error(
            f"{context} usa idioma padrão inválido em "
            f"{path.relative_to(ROOT)}: {value!r}"
        )


def validate_text_variants(value: object, path: Path, context: str) -> None:
    if value is None:
        return
    if not isinstance(value, dict):
        error(f"{context} deve usar texts como mapa em {path.relative_to(ROOT)}")
        return
    if not value:
        error(f"{context} possui texts vazio em {path.relative_to(ROOT)}")
        return
    for language, text in value.items():
        if language not in {"pt", "la"}:
            error(
                f"{context} usa idioma não suportado em "
                f"{path.relative_to(ROOT)}: {language!r}"
            )
        if not isinstance(text, str) or not text.strip():
            error(
                f"{context} possui texto vazio ou inválido para {language} "
                f"em {path.relative_to(ROOT)}"
            )


def validate_prayer_structure(
    data: dict,
    path: Path,
    common_prayers: dict,
    *,
    require_sections: bool = False,
) -> None:
    validate_language(data.get("default_language"), path, "Documento")
    validate_text_variants(data.get("texts"), path, "Documento")

    common_key = data.get("common_prayer")
    if common_key and common_key not in common_prayers:
        error(
            f"Oração comum inexistente em {path.relative_to(ROOT)}: "
            f"{common_key}"
        )
    if "count" in data and (
        not isinstance(data["count"], int)
        or isinstance(data["count"], bool)
        or data["count"] < 1
    ):
        error(f"Campo count deve ser inteiro positivo: {path.relative_to(ROOT)}")

    sections = data.get("sections")
    if sections is None:
        if require_sections:
            error(f"Conteúdo contável sem sections: {path.relative_to(ROOT)}")
        return
    if not isinstance(sections, list) or not sections:
        error(f"Campo sections deve ser uma lista não vazia: {path.relative_to(ROOT)}")
        return

    used_sections: set[str] = set()
    for section_index, section in enumerate(sections, start=1):
        if not isinstance(section, dict):
            error(
                f"Seção {section_index} deve ser um mapa em "
                f"{path.relative_to(ROOT)}"
            )
            continue
        section_id = str(section.get("id", section_index))
        if section_id in used_sections:
            error(f"Seção com id duplicado em {path.relative_to(ROOT)}: {section_id}")
        used_sections.add(section_id)
        if not section.get("title"):
            error(
                f"Seção {section_id} sem title em "
                f"{path.relative_to(ROOT)}"
            )

        prayers = section.get("prayers")
        legacy_groups = section.get("groups")
        if prayers is not None and legacy_groups is not None:
            error(
                f"Seção {section_id} mistura prayers e groups em "
                f"{path.relative_to(ROOT)}"
            )
        items = prayers if prayers is not None else legacy_groups
        if items is None:
            if require_sections:
                error(
                    f"Seção {section_id} sem prayers em "
                    f"{path.relative_to(ROOT)}"
                )
            continue
        if not isinstance(items, list) or not items:
            error(
                f"Seção {section_id} deve possuir uma lista de prayers "
                f"em {path.relative_to(ROOT)}"
            )
            continue

        used_items: set[str] = set()
        for item_index, item in enumerate(items, start=1):
            if not isinstance(item, dict):
                error(
                    f"Oração {item_index} da seção {section_id} deve ser um mapa "
                    f"em {path.relative_to(ROOT)}"
                )
                continue
            item_id = str(item.get("id", item_index))
            if item_id in used_items:
                error(
                    f"Oração com id duplicado na seção {section_id} "
                    f"em {path.relative_to(ROOT)}: {item_id}"
                )
            used_items.add(item_id)

            prayer_key = item.get("prayer") or item.get("common_prayer")
            if prayer_key and prayer_key not in common_prayers:
                error(
                    f"Oração comum inexistente na seção {section_id} "
                    f"em {path.relative_to(ROOT)}: {prayer_key}"
                )
            validate_language(
                item.get("default_language"),
                path,
                f"Oração {item_id} da seção {section_id}",
            )
            validate_text_variants(
                item.get("texts"),
                path,
                f"Oração {item_id} da seção {section_id}",
            )
            if "count" in item and (
                not isinstance(item["count"], int)
                or isinstance(item["count"], bool)
                or item["count"] < 1
            ):
                error(
                    f"Oração {item_id} possui count inválido na seção "
                    f"{section_id} em {path.relative_to(ROOT)}"
                )
            has_text = bool(
                prayer_key
                or item.get("texts")
                or item.get("text")
                or item.get("prayer_url")
            )
            if not item.get("label") and not prayer_key:
                error(
                    f"Oração {item_id} sem label nem referência comum "
                    f"em {path.relative_to(ROOT)}"
                )
            if not has_text:
                WARNINGS.append(
                    f"Oração {item_id} sem texto incorporado na seção "
                    f"{section_id} em {path.relative_to(ROOT)}"
                )


def validate_required_files() -> None:
    for relative in REQUIRED:
        if not (ROOT / relative).is_file():
            error(f"Arquivo obrigatório ausente: {relative}")


def validate_yaml() -> None:
    load_yaml(ROOT / "_config.yml", (ROOT / "_config.yml").read_text(encoding="utf-8"))
    for path in sorted((ROOT / "_data").glob("*.yml")):
        load_yaml(path, path.read_text(encoding="utf-8"))
    load_yaml(ROOT / ".github/workflows/jekyll.yml", (ROOT / ".github/workflows/jekyll.yml").read_text(encoding="utf-8"))


def validate_documents() -> None:
    common_path = ROOT / "_data/common_prayers.yml"
    common_value = load_yaml(common_path, common_path.read_text(encoding="utf-8"))
    common_prayers = common_value if isinstance(common_value, dict) else {}
    if not common_prayers:
        error("_data/common_prayers.yml deve possuir ao menos uma oração.")
    for common_key, common_prayer in common_prayers.items():
        if not isinstance(common_key, str) or not re.fullmatch(r"[a-z0-9-]+", common_key):
            error(f"Chave inválida no catálogo de orações comuns: {common_key!r}")
        if not isinstance(common_prayer, dict):
            error(f"Oração comum deve ser um mapa: {common_key}")
            continue
        if not common_prayer.get("title"):
            error(f"Oração comum sem title: {common_key}")
        validate_language(
            common_prayer.get("default_language"),
            common_path,
            f"Oração comum {common_key}",
        )
        validate_text_variants(
            common_prayer.get("texts"),
            common_path,
            f"Oração comum {common_key}",
        )
        texts = common_prayer.get("texts")
        if isinstance(texts, dict) and not texts.get("pt"):
            error(f"Oração comum sem texto em português: {common_key}")

    content_roots = [
        "_posts",
        "_oracoes",
        "_novenas",
        "_quaresmas",
        "_trintenas",
        "_devocoes_mensais",
        "_trezenas",
        "_triduos",
        "_dias_novena",
        "_dias_devocao",
        "_tercos",
        "_rosarios",
        "_coroas",
        "_devocionarios",
        "_santos",
        "_formacoes",
        "pages",
    ]
    for folder in content_roots:
        for path in sorted((ROOT / folder).glob("*.md")):
            data = front_matter(path)
            if not data:
                error(f"Documento sem front matter: {path.relative_to(ROOT)}")
                continue
            if not data.get("title"):
                error(f"Documento sem title: {path.relative_to(ROOT)}")
            if folder not in {"_dias_novena", "_dias_devocao"} and not data.get("description"):
                WARNINGS.append(f"Documento sem description: {path.relative_to(ROOT)}")
            if folder in {
                "_oracoes",
                "_tercos",
                "_rosarios",
                "_coroas",
                "_devocionarios",
            }:
                if not data.get("image"):
                    error(f"Conteúdo sem imagem de capa: {path.relative_to(ROOT)}")
                elif not data.get("image_alt"):
                    WARNINGS.append(
                        f"Imagem de capa sem image_alt: {path.relative_to(ROOT)}"
                    )
            validate_prayer_structure(
                data,
                path,
                common_prayers,
                require_sections=folder in {"_tercos", "_rosarios", "_coroas"},
            )

    series_folders = [
        "_novenas",
        "_quaresmas",
        "_trintenas",
        "_devocoes_mensais",
        "_trezenas",
        "_triduos",
    ]
    series: dict[str, dict] = {}
    valid_weekdays = {
        "domingo",
        "sunday",
        "segunda",
        "segunda-feira",
        "monday",
        "terça",
        "terca",
        "terça-feira",
        "terca-feira",
        "tuesday",
        "quarta",
        "quarta-feira",
        "wednesday",
        "quinta",
        "quinta-feira",
        "thursday",
        "sexta",
        "sexta-feira",
        "friday",
        "sábado",
        "sabado",
        "saturday",
    }
    for folder in series_folders:
        for path in (ROOT / folder).glob("*.md"):
            data = front_matter(path)
            slug = data.get("slug")
            if not slug:
                error(f"Itinerário sem slug: {path.relative_to(ROOT)}")
                continue
            if slug in series:
                error(f"Slug de itinerário duplicado: {slug}")
            series[slug] = data
            if not isinstance(data.get("days"), int) or data["days"] < 1:
                error(f"Campo days deve ser inteiro positivo: {path.relative_to(ROOT)}")
            calendar = data.get("calendar")
            if not isinstance(calendar, dict):
                error(f"Itinerário sem bloco calendar: {path.relative_to(ROOT)}")
                continue
            month = calendar.get("base_month")
            day = calendar.get("base_day")
            if not isinstance(month, int) or not 1 <= month <= 12:
                error(f"calendar.base_month deve estar entre 1 e 12: {path.relative_to(ROOT)}")
            if not isinstance(day, int) or not 1 <= day <= 31:
                error(f"calendar.base_day deve estar entre 1 e 31: {path.relative_to(ROOT)}")
            elif isinstance(month, int) and 1 <= month <= 12:
                try:
                    date(2024, month, day)
                except ValueError:
                    error(f"Data-base impossível: {path.relative_to(ROOT)}")
            skipped = calendar.get("skip_weekdays", [])
            if not isinstance(skipped, list):
                error(f"calendar.skip_weekdays deve ser uma lista: {path.relative_to(ROOT)}")
            else:
                for value in skipped:
                    if isinstance(value, int) and not 0 <= value <= 6:
                        error(f"calendar.skip_weekdays aceita números de 0 a 6: {path.relative_to(ROOT)}")
                    elif isinstance(value, str) and value.strip().lower() not in valid_weekdays:
                        error(f"Dia da semana desconhecido em {path.relative_to(ROOT)}: {value}")
                    elif not isinstance(value, (int, str)):
                        error(f"Dia da semana inválido em {path.relative_to(ROOT)}: {value!r}")

    day_numbers: dict[str, list[int]] = {slug: [] for slug in series}
    for path in (ROOT / "_dias_novena").glob("*.md"):
        data = front_matter(path)
        if data.get("novena") not in series:
            error(f"Dia aponta para novena inexistente: {path.relative_to(ROOT)}")
        if not isinstance(data.get("day"), int):
            error(f"Campo day deve ser inteiro: {path.relative_to(ROOT)}")
        elif data.get("novena") in day_numbers:
            day_numbers[data["novena"]].append(data["day"])
    for path in (ROOT / "_dias_devocao").glob("*.md"):
        data = front_matter(path)
        if data.get("devotion") not in series:
            error(f"Dia aponta para itinerário inexistente: {path.relative_to(ROOT)}")
        if not isinstance(data.get("day"), int):
            error(f"Campo day deve ser inteiro: {path.relative_to(ROOT)}")
        elif data.get("devotion") in day_numbers:
            day_numbers[data["devotion"]].append(data["day"])
        if not data.get("permalink"):
            error(f"Dia devocional sem permalink explícito: {path.relative_to(ROOT)}")

    for slug, data in series.items():
        expected = list(range(1, data["days"] + 1))
        actual = sorted(day_numbers.get(slug, []))
        if actual != expected:
            error(
                f"Dias incompletos ou duplicados em {slug}: "
                f"esperado {expected}, encontrado {actual}"
            )

def validate_liquid_balance() -> None:
    pairs = {"if": "endif", "unless": "endunless", "for": "endfor", "case": "endcase", "capture": "endcapture"}
    template_paths = list((ROOT / "_includes").glob("*.html")) + list((ROOT / "_layouts").glob("*.html")) + [ROOT / "index.html", ROOT / "search/index.json", ROOT / "sitemap.xml"]
    tag_pattern = re.compile(r"{%\s*([a-z_]+)\b")
    for path in template_paths:
        tags = tag_pattern.findall(path.read_text(encoding="utf-8"))
        for opening, closing in pairs.items():
            if tags.count(opening) != tags.count(closing):
                error(f"Blocos Liquid desequilibrados ({opening}/{closing}) em {path.relative_to(ROOT)}")


def validate_assets() -> None:
    extensions = r"(?:webp|avif|png|jpg|jpeg|svg|ico|css|js|woff2?)"
    pattern = re.compile(r"/assets/[A-Za-z0-9_./-]+\." + extensions)
    source_extensions = {".html", ".md", ".yml", ".css", ".js", ".json", ".xml", ".txt"}
    for path in ROOT.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in source_extensions or "_site" in path.parts:
            continue
        if path.name == "GUIA_DE_IMPLEMENTACAO.md" or path.name == "README.md":
            continue
        text = path.read_text(encoding="utf-8")
        for reference in pattern.findall(text):
            target = ROOT / reference.lstrip("/")
            if not target.exists():
                error(f"Asset referenciado e ausente: {reference} em {path.relative_to(ROOT)}")


def validate_default_layout() -> None:
    text = (ROOT / "_layouts/default.html").read_text(encoding="utf-8")
    required_fragments = ["{% include toolbar.html %}", '<main id="main-content"', "{{ content }}", "{% include footer.html %}"]
    positions = [text.find(fragment) for fragment in required_fragments]
    if any(position < 0 for position in positions) or positions != sorted(positions):
        error("O layout default não contém toolbar, main, content e footer na ordem esperada.")


def main() -> int:
    validate_required_files()
    validate_yaml()
    validate_documents()
    validate_liquid_balance()
    validate_assets()
    validate_default_layout()

    for warning in WARNINGS:
        print(f"AVISO: {warning}")
    if ERRORS:
        for message in ERRORS:
            print(f"ERRO: {message}", file=sys.stderr)
        print(f"Falha: {len(ERRORS)} erro(s) e {len(WARNINGS)} aviso(s).", file=sys.stderr)
        return 1
    print(f"Validação estrutural concluída: {len(WARNINGS)} aviso(s), nenhum erro.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
