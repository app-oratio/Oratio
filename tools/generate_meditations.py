#!/usr/bin/env python3
"""Gera a coleção de meditações de Santo Afonso a partir dos JSONs originais.

Uso:
    python tools/generate_meditations.py --source-dir /caminho/dos/json --output-root .

O script ignora registros de capa sem texto, preserva meditações adicionais do
mesmo dia e cria páginas Markdown com URLs estáveis para o Jekyll.
"""

from __future__ import annotations

import argparse
import html
import json
import re
import shutil
import unicodedata
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable

import yaml

AUTHOR_SLUG = "santo-afonso"
AUTHOR_NAME = "Santo Afonso Maria de Ligório"


@dataclass(frozen=True)
class PeriodSource:
    slug: str
    title: str
    source_name: str
    order: int
    short_description: str


PERIODS: tuple[PeriodSource, ...] = (
    PeriodSource(
        "advento",
        "Advento",
        "meditacao-advento-st-afonso-2024.json",
        1,
        "Prepare o coração para a vinda do Salvador com as meditações de Santo Afonso.",
    ),
    PeriodSource(
        "natal",
        "Natal",
        "meditacoes-santo-afonso-natal.json",
        2,
        "Contemple a Encarnação, a infância de Jesus e as festas do Tempo do Natal.",
    ),
    PeriodSource(
        "tempo-comum-i",
        "Tempo Comum I",
        "meditacoes_stafonso_tempocomum_1.json",
        3,
        "Meditações para o período entre o Tempo do Natal e o início da Quaresma.",
    ),
    PeriodSource(
        "quaresma",
        "Quaresma",
        "meditacoes-st-afonso-quaresma.json",
        4,
        "Um itinerário de penitência, conversão e contemplação da Paixão de Cristo.",
    ),
    PeriodSource(
        "pascoa",
        "Páscoa",
        "meditacoes-pascoa-st-afonso.json",
        5,
        "Viva a alegria da Ressurreição e os frutos espirituais do Tempo Pascal.",
    ),
    PeriodSource(
        "tempo-comum-ii",
        "Tempo Comum II",
        "meditacoes_stafonso_tempocomum_2.json",
        6,
        "Meditações para perseverar na vida cristã depois de Pentecostes.",
    ),
    PeriodSource(
        "tempo-comum-iii",
        "Tempo Comum III",
        "meditacoes_stafonso_tempocomum_3.json",
        7,
        "Meditações para o amadurecimento espiritual na etapa final do Tempo Comum.",
    ),
)

NATAL_INTRO = """O Tempo do Natal é o período em que a Igreja contempla com alegria o mistério da Encarnação do Verbo, desde o nascimento de Nosso Senhor até as manifestações de sua glória na infância. As meditações de Santo Afonso Maria de Ligório conduzem a alma à gruta de Belém, à companhia da Sagrada Família e às festas que cercam o nascimento do Salvador.

Ao longo destas reflexões, o fiel é convidado a considerar a humildade, a pobreza e o amor de Jesus Menino, a ternura de Maria Santíssima e a fidelidade de São José. As meditações também ajudam a viver cristãmente a passagem do ano, a Epifania e os acontecimentos que revelam a missão redentora de Cristo.

Que estas páginas despertem um amor mais profundo por Jesus, que se fez pequeno por nossa salvação, e ajudem cada leitor a acolhê-lo com fé, gratidão e desejo sincero de conversão."""


def slugify(value: str) -> str:
    value = html.unescape(re.sub(r"<[^>]+>", " ", value or ""))
    value = unicodedata.normalize("NFKD", value)
    value = "".join(ch for ch in value if not unicodedata.combining(ch))
    value = value.lower().replace("’", "").replace("'", "")
    value = re.sub(r"[^a-z0-9]+", "-", value).strip("-")
    return value or "meditacao"


def plain(value: str) -> str:
    value = html.unescape(re.sub(r"<[^>]+>", " ", value or ""))
    return re.sub(r"\s+", " ", value).strip()


def truncate(value: str, limit: int = 260) -> str:
    value = plain(value)
    if len(value) <= limit:
        return value
    cut = value[: limit + 1].rsplit(" ", 1)[0].rstrip(" ,;:.-")
    return f"{cut}…"


def extract_summary(text: str) -> str:
    match = re.search(r"Sum[áa]rio\.\s*(.*?)(?:\n\s*\n|$)", text, flags=re.IGNORECASE | re.DOTALL)
    if match:
        return truncate(match.group(1))
    paragraphs = [plain(p) for p in re.split(r"\n\s*\n", text) if plain(p)]
    if len(paragraphs) > 1:
        return truncate(paragraphs[1])
    return truncate(paragraphs[0] if paragraphs else "Meditação espiritual de Santo Afonso Maria de Ligório.")


def render_inline(block: str) -> str:
    lines = [html.escape(line.strip(), quote=False) for line in block.splitlines()]
    return "<br>\n".join(line for line in lines if line)


def render_text(text: str) -> str:
    text = text.replace("\r\n", "\n").replace("\r", "\n").strip()
    blocks = [block.strip() for block in re.split(r"\n\s*\n", text) if block.strip()]
    rendered: list[str] = []
    index = 0

    while index < len(blocks):
        block = blocks[index]
        normalized = plain(block)
        if not normalized:
            index += 1
            continue

        if normalized.upper() == "OUTRA MEDITAÇÃO PARA O MESMO DIA":
            rendered.append('<h2 class="meditation-secondary-title">Outra meditação para o mesmo dia</h2>')
            index += 1
            continue

        if re.match(r"^Referências\s*:", normalized, flags=re.IGNORECASE):
            raw = re.sub(r"^Referências\s*:\s*", "", block, flags=re.IGNORECASE).strip()
            reference_blocks: list[str] = [raw] if raw else []
            cursor = index + 1
            while cursor < len(blocks):
                candidate = blocks[cursor].strip()
                candidate_plain = plain(candidate)
                if re.match(r"^(OBS|Observação)\s*:", candidate_plain, flags=re.IGNORECASE):
                    break
                if not re.match(r"^\(\d+(?:\s*(?:e|,|-)\s*\d+)*\)", candidate_plain):
                    break
                reference_blocks.append(candidate)
                cursor += 1

            references: list[str] = []
            for reference_block in reference_blocks:
                references.extend(plain(line) for line in reference_block.splitlines() if plain(line))

            if references:
                rendered.append('<section class="meditation-references" aria-label="Referências"><h2>Referências</h2>')
                rendered.extend(f"<p>{html.escape(reference, quote=False)}</p>" for reference in references)
                rendered.append("</section>")
            index = cursor
            continue

        if re.match(r"^(OBS|Observação)\s*:", normalized, flags=re.IGNORECASE):
            note = re.sub(r"^(OBS|Observação)\s*:\s*", "", normalized, flags=re.IGNORECASE)
            rendered.append(f'<aside class="meditation-note"><strong>Observação.</strong> {html.escape(note, quote=False)}</aside>')
            index += 1
            continue

        summary_match = re.match(r"^Sum[áa]rio\.\s*(.*)$", block, flags=re.IGNORECASE | re.DOTALL)
        if summary_match:
            rendered.append(
                '<aside class="meditation-summary"><p><strong>Sumário.</strong> '
                + render_inline(summary_match.group(1))
                + "</p></aside>"
            )
            index += 1
            continue

        section_match = re.match(r"^(I{1,4}|V)\.\s*(.*)$", block, flags=re.DOTALL)
        if section_match:
            numeral, rest = section_match.groups()
            rendered.append(
                f'<section class="meditation-section"><h2>{numeral}</h2><p>{render_inline(rest)}</p></section>'
            )
            index += 1
            continue

        css_class = "meditation-epigraph" if index == 0 else ""
        class_attr = f' class="{css_class}"' if css_class else ""
        rendered.append(f"<p{class_attr}>{render_inline(block)}</p>")
        index += 1

    return "\n\n".join(rendered) + "\n"


def yaml_front_matter(data: dict[str, Any]) -> str:
    dumped = yaml.safe_dump(
        data,
        allow_unicode=True,
        sort_keys=False,
        default_flow_style=False,
        width=120,
    ).strip()
    return f"---\n{dumped}\n---\n\n"


def load_json(path: Path) -> list[dict[str, Any]]:
    with path.open("r", encoding="utf-8-sig") as handle:
        payload = json.load(handle)
    if not isinstance(payload, list):
        raise ValueError(f"{path.name}: a raiz do JSON deve ser uma lista")
    return payload


def unique_slug(base: str, used: set[str]) -> str:
    candidate = base
    counter = 2
    while candidate in used:
        candidate = f"{base}-{counter}"
        counter += 1
    used.add(candidate)
    return candidate


def prepare_period(period: PeriodSource, source_dir: Path) -> tuple[str, list[dict[str, Any]], list[str]]:
    source_path = source_dir / period.source_name
    records = load_json(source_path)
    warnings: list[str] = []

    intro_record = next((record for record in records if int(record.get("Dia", -1)) == 0), None)
    if intro_record is None:
        raise ValueError(f"{period.source_name}: registro introdutório Dia 0 não encontrado")

    intro = str(intro_record.get("Texto") or "").strip()
    if period.slug == "natal":
        warnings.append("A introdução original do Natal descrevia o Tempo Comum e foi substituída por uma introdução coerente.")
        intro = NATAL_INTRO
    if period.slug == "tempo-comum-iii" and plain(str(intro_record.get("Título") or "")).endswith("II"):
        warnings.append("O título introdutório dizia Tempo Comum II e foi normalizado para Tempo Comum III.")

    covers_by_day: dict[int, list[dict[str, Any]]] = {}
    meditations: list[dict[str, Any]] = []
    for record in records:
        day = int(record.get("Dia", -1))
        if day == 0:
            continue
        text = str(record.get("Texto") or "").strip()
        if not text:
            covers_by_day.setdefault(day, []).append(record)
            continue
        meditations.append(dict(record))

    used_slugs: set[str] = set()
    for sequence, item in enumerate(meditations, start=1):
        day = int(item.get("Dia", sequence))
        title = plain(str(item.get("Título") or f"Meditação {sequence}"))
        subtitle = plain(str(item.get("Subtítulo") or title))
        text = str(item.get("Texto") or "").strip()
        image = str(item.get("Imagem") or "").strip()
        notes = plain(str(item.get("Notas") or ""))

        if not image and covers_by_day.get(day):
            image = str(covers_by_day[day][0].get("Imagem") or "").strip()

        base_slug = slugify(subtitle)
        if "tarde" in slugify(title) and not base_slug.endswith("tarde"):
            base_slug = f"{base_slug}-tarde"
        meditation_slug = unique_slug(base_slug, used_slugs)
        url = f"/meditacoes/{AUTHOR_SLUG}/{period.slug}/{meditation_slug}/"

        item.update(
            {
                "_sequence": sequence,
                "_title": subtitle,
                "_liturgical_title": title,
                "_description": extract_summary(text),
                "_image": image,
                "_notes": notes,
                "_slug": meditation_slug,
                "_url": url,
                "_body": render_text(text),
                "_day": day,
            }
        )

    total = len(meditations)
    for index, item in enumerate(meditations):
        item["_previous"] = meditations[index - 1] if index > 0 else None
        item["_next"] = meditations[index + 1] if index + 1 < total else None

    return intro, meditations, warnings


def clean_generated(output_root: Path) -> None:
    collection_dir = output_root / "_meditacoes" / AUTHOR_SLUG
    pages_dir = output_root / "pages" / "meditacoes"
    if collection_dir.exists():
        shutil.rmtree(collection_dir)
    if pages_dir.exists():
        shutil.rmtree(pages_dir)


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8", newline="\n")


def generate(source_dir: Path, output_root: Path) -> None:
    clean_generated(output_root)
    period_rows: list[dict[str, Any]] = []
    report_lines = ["# Relatório da importação das meditações", ""]

    for period in PERIODS:
        intro, meditations, warnings = prepare_period(period, source_dir)
        if not meditations:
            raise ValueError(f"{period.source_name}: nenhuma meditação com texto foi encontrada")

        for item in meditations:
            front_matter: dict[str, Any] = {
                "layout": "meditation",
                "title": item["_title"],
                "description": item["_description"],
                "permalink": item["_url"],
                "slug": item["_slug"],
                "author_name": AUTHOR_NAME,
                "author_slug": AUTHOR_SLUG,
                "liturgical_time": period.title,
                "liturgical_time_slug": period.slug,
                "liturgical_title": item["_liturgical_title"],
                "meditation_order": item["_sequence"],
                "source_day": item["_day"],
                "total_in_period": len(meditations),
                "meditation_id": f"{AUTHOR_SLUG}/{period.slug}/{item['_slug']}",
                "category": period.title,
                "search_type": "Meditação",
                "tags": ["Meditações", AUTHOR_NAME, period.title],
                "aliases": [item["_liturgical_title"], item["_title"]],
                "meditation_page": True,
                "image": item["_image"],
                "image_alt": f"{item['_title']} — meditação de {AUTHOR_NAME}",
            }
            if item["_notes"]:
                front_matter["notes"] = item["_notes"]
            if item["_previous"]:
                front_matter["previous_url"] = item["_previous"]["_url"]
                front_matter["previous_title"] = item["_previous"]["_title"]
            if item["_next"]:
                front_matter["next_url"] = item["_next"]["_url"]
                front_matter["next_title"] = item["_next"]["_title"]

            path = output_root / "_meditacoes" / AUTHOR_SLUG / period.slug / f"{item['_slug']}.md"
            write_text(path, yaml_front_matter(front_matter) + item["_body"])

        first_image = meditations[0]["_image"]
        period_page_titles = {
            "advento": "Meditações de Santo Afonso para o Advento",
            "natal": "Meditações de Santo Afonso para o Tempo do Natal",
            "tempo-comum-i": "Meditações de Santo Afonso para o Tempo Comum I",
            "quaresma": "Meditações de Santo Afonso para a Quaresma",
            "pascoa": "Meditações de Santo Afonso para o Tempo da Páscoa",
            "tempo-comum-ii": "Meditações de Santo Afonso para o Tempo Comum II",
            "tempo-comum-iii": "Meditações de Santo Afonso para o Tempo Comum III",
        }
        period_page_data = {
            "layout": "meditation-period",
            "title": period_page_titles[period.slug],
            "description": period.short_description,
            "permalink": f"/meditacoes/{AUTHOR_SLUG}/{period.slug}/",
            "author_name": AUTHOR_NAME,
            "author_slug": AUTHOR_SLUG,
            "liturgical_time": period.title,
            "liturgical_time_slug": period.slug,
            "period_order": period.order,
            "meditation_page": True,
            "search_type": "Coleção de meditações",
            "image": first_image,
            "image_alt": f"Meditações de {AUTHOR_NAME} — {period.title}",
        }
        period_page_path = output_root / "pages" / "meditacoes" / AUTHOR_SLUG / f"{period.slug}.md"
        write_text(period_page_path, yaml_front_matter(period_page_data) + render_text(intro))

        period_rows.append(
            {
                "slug": period.slug,
                "title": period.title,
                "url": f"/meditacoes/{AUTHOR_SLUG}/{period.slug}/",
                "order": period.order,
                "count": len(meditations),
                "description": period.short_description,
                "image": first_image,
            }
        )

        report_lines.append(f"## {period.title}")
        report_lines.append("")
        report_lines.append(f"- Fonte: `{period.source_name}`")
        report_lines.append(f"- Meditações geradas: **{len(meditations)}**")
        report_lines.append(f"- URL-base: `/meditacoes/{AUTHOR_SLUG}/{period.slug}/`")
        for warning in warnings:
            report_lines.append(f"- Normalização: {warning}")
        report_lines.append("")

    authors_data = [
        {
            "slug": AUTHOR_SLUG,
            "name": AUTHOR_NAME,
            "short_name": "Santo Afonso",
            "url": f"/meditacoes/{AUTHOR_SLUG}/",
            "description": "Bispo, Doutor da Igreja e mestre da vida espiritual, cujas meditações conduzem à oração, à conversão e ao amor de Jesus Cristo.",
            "periods": [period.slug for period in PERIODS],
        }
    ]
    write_text(
        output_root / "_data" / "meditation_authors.yml",
        yaml.safe_dump(authors_data, allow_unicode=True, sort_keys=False, width=120),
    )
    write_text(
        output_root / "_data" / "meditation_periods.yml",
        yaml.safe_dump(period_rows, allow_unicode=True, sort_keys=False, width=120),
    )

    main_page = {
        "layout": "meditations-index",
        "title": "Meditações diárias",
        "description": "Meditações católicas organizadas por autor e tempo litúrgico para acompanhar a oração diária.",
        "permalink": "/meditacoes/",
        "meditation_page": True,
        "search_type": "Meditações",
    }
    write_text(output_root / "pages" / "meditacoes.md", yaml_front_matter(main_page).rstrip() + "\n")

    author_page = {
        "layout": "meditation-author",
        "title": f"Meditações de {AUTHOR_NAME}",
        "description": "Percorra as meditações de Santo Afonso organizadas segundo os tempos do ano litúrgico.",
        "permalink": f"/meditacoes/{AUTHOR_SLUG}/",
        "author_name": AUTHOR_NAME,
        "author_slug": AUTHOR_SLUG,
        "meditation_page": True,
        "search_type": "Autor de meditações",
    }
    author_body = (
        "<p>Santo Afonso Maria de Ligório, bispo e Doutor da Igreja, deixou um vasto patrimônio de espiritualidade "
        "voltado à oração, à conversão e ao amor de Jesus Cristo. Nesta seção, suas meditações estão organizadas "
        "de acordo com os tempos litúrgicos para facilitar uma leitura contínua ao longo do ano.</p>\n"
    )
    write_text(output_root / "pages" / "meditacoes" / f"{AUTHOR_SLUG}.md", yaml_front_matter(author_page) + author_body)

    report_lines.append("## Total")
    report_lines.append("")
    report_lines.append(f"- Páginas individuais: **{sum(row['count'] for row in period_rows)}**")
    report_lines.append("- Páginas de tempo litúrgico: **7**")
    report_lines.append("- Página de autor: **1**")
    report_lines.append("- Página principal: **1**")
    report_lines.append("")
    write_text(output_root / "tools" / "meditacoes" / "RELATORIO_IMPORTACAO.md", "\n".join(report_lines))



def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-dir", type=Path, required=True, help="Pasta que contém os sete arquivos JSON")
    parser.add_argument("--output-root", type=Path, default=Path.cwd(), help="Raiz do repositório Oratio")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    generate(args.source_dir.resolve(), args.output_root.resolve())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
