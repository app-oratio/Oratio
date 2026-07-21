#!/usr/bin/env python3
"""Valida a estrutura editorial do portal sem substituir uma compilação Jekyll."""

from __future__ import annotations

import re
import sys
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
    content_roots = ["_posts", "_oracoes", "_novenas", "_dias_novena", "_devocionarios", "_santos", "_formacoes", "pages"]
    for folder in content_roots:
        for path in sorted((ROOT / folder).glob("*.md")):
            data = front_matter(path)
            if not data:
                error(f"Documento sem front matter: {path.relative_to(ROOT)}")
                continue
            if not data.get("title"):
                error(f"Documento sem title: {path.relative_to(ROOT)}")
            if folder != "_dias_novena" and not data.get("description"):
                WARNINGS.append(f"Documento sem description: {path.relative_to(ROOT)}")

    novenas = {front_matter(path).get("slug") for path in (ROOT / "_novenas").glob("*.md")}
    for path in (ROOT / "_dias_novena").glob("*.md"):
        data = front_matter(path)
        if data.get("novena") not in novenas:
            error(f"Dia aponta para novena inexistente: {path.relative_to(ROOT)}")
        if not isinstance(data.get("day"), int):
            error(f"Campo day deve ser inteiro: {path.relative_to(ROOT)}")


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
