#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { books, totalChapters } from './books.mjs';

const root = process.cwd();
const errors = [];
const exists = async (relative) => fs.access(path.join(root, relative)).then(() => true).catch(() => false);
const read = async (relative) => fs.readFile(path.join(root, relative), 'utf8').catch(() => '');
const required = [
  '_data/bible_books.yml', '_layouts/bible-index.html', '_layouts/bible-book.html', '_layouts/bible-chapter.html',
  'pages/biblia.md', 'assets/css/bible.css', 'assets/js/bible.js', 'assets/data/bible/index.json'
];
for (const file of required) if (!(await exists(file))) errors.push(`Arquivo obrigatório ausente: ${file}`);

let chapterFiles = 0;
for (const book of books) {
  if (!(await exists(path.join('_biblia', book.slug, 'index.md')))) errors.push(`Página do livro ausente: ${book.slug}`);
  for (let chapter = 1; chapter <= book.chapters; chapter += 1) {
    const relative = path.join('_biblia', book.slug, `${chapter}.md`);
    const content = await read(relative);
    if (!content) { errors.push(`Capítulo ausente: ${book.name} ${chapter}`); continue; }
    chapterFiles += 1;
    if (!content.includes(`permalink: /biblia/${book.slug}/${chapter}/`)) errors.push(`Permalink incorreto: ${relative}`);
    if (!content.includes(`chapter: ${chapter}\n`)) errors.push(`Número de capítulo incorreto: ${relative}`);
  }
}
if (chapterFiles !== totalChapters) errors.push(`Esperados ${totalChapters} capítulos, encontrados ${chapterFiles}.`);

const config = await read('_config.yml');
if (!/\n  biblia:\n\s+output: true/.test(config)) errors.push('A collection biblia não está registrada em _config.yml.');
const navigation = await read('_data/navigation.yml');
if (!navigation.includes('url: "/biblia/"')) errors.push('O menu não contém /biblia/.');
const head = await read('_includes/head.html');
if (!head.includes("page.bible_page") || !head.includes('bible.css')) errors.push('O CSS bíblico não está condicionado em head.html.');
const scripts = await read('_includes/scripts.html');
if (!scripts.includes("page.bible_page") || !scripts.includes('bible.js')) errors.push('O JavaScript bíblico não está condicionado em scripts.html.');
const sitemap = await read('sitemap.xml');
if (!sitemap.includes('concat: site.biblia')) errors.push('A collection biblia não está no sitemap.');

const localDataFiles = await fs.readdir(path.join(root, '_data', 'bible')).catch(() => []);
const localJson = localDataFiles.filter((file) => file.endsWith('.json'));
if (localJson.length && localJson.length !== books.length) errors.push(`Importação local incompleta: ${localJson.length}/${books.length} livros.`);
if (localJson.length === books.length) {
  for (const book of books) {
    const payload = JSON.parse(await read(path.join('_data', 'bible', `${book.slug}.json`)));
    if (!Array.isArray(payload.chapters) || payload.chapters.length !== book.chapters) errors.push(`Dados locais inválidos: ${book.name}.`);
  }
}

if (errors.length) {
  console.error(`Verificação falhou com ${errors.length} problema(s):`);
  errors.slice(0, 100).forEach((error) => console.error(`- ${error}`));
  if (errors.length > 100) console.error(`- … e mais ${errors.length - 100}.`);
  process.exit(1);
}
console.log(`Implementação válida: ${books.length} livros, ${totalChapters} capítulos, páginas de livros, layouts, menu, assets e sitemap.`);
