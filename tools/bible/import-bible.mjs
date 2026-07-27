#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { books } from './books.mjs';

const DEFAULT_SOURCE = 'https://tstxvak.weebly.com/uploads/1/4/4/8/144864775/biblia_matos_soares.json';
const args = Object.fromEntries(process.argv.slice(2).map((arg, index, all) => {
  if (!arg.startsWith('--')) return [arg, true];
  const [key, inline] = arg.slice(2).split('=', 2);
  const next = all[index + 1];
  return [key, inline ?? (next && !next.startsWith('--') ? next : true)];
}));
const root = process.cwd();
const source = String(args.source || DEFAULT_SOURCE);
const runtimeCopy = Boolean(args['runtime-copy']);
const dryRun = Boolean(args['dry-run']);

if (!args['confirm-publication-rights']) {
  console.error('Importação interrompida. Use --confirm-publication-rights somente depois de confirmar que o Oratio pode publicar esta edição e este arquivo.');
  process.exit(2);
}

function normalize(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[ºª.]/g, '').replace(/\b(i{1,3}|iv)\b/g, (roman) => ({ i:'1', ii:'2', iii:'3', iv:'4' })[roman] || roman).replace(/[^a-z0-9]+/g, ' ').trim();
}
function bookName(book) { return book && (book.name || book.nome || book.livro || book.book || book.title || book.titulo); }
function chaptersOf(book) { return book?.chapters || book?.capitulos || book?.['capítulos'] || []; }
function collectBooks(payload) {
  const found = []; const visited = new WeakSet();
  const walk = (value, depth = 0) => {
    if (!value || depth > 6 || typeof value !== 'object') return;
    if (visited.has(value)) return; visited.add(value);
    if (Array.isArray(value)) { value.forEach((item) => walk(item, depth + 1)); return; }
    if (bookName(value) && chaptersOf(value).length) { found.push(value); return; }
    for (const [key, child] of Object.entries(value)) if (!['verses','versiculos','versículos'].includes(key)) walk(child, depth + 1);
  };
  walk(payload); return found;
}
function chapterNumber(chapter, index) { return Number(chapter?.number || chapter?.numero || chapter?.capitulo || chapter?.chapter) || index + 1; }
function versesOf(chapter) { return chapter?.verses || chapter?.versiculos || chapter?.['versículos'] || []; }
function normalizeBook(sourceBook, metadata) {
  return {
    name: metadata.name, slug: metadata.slug, short_name: metadata.short_name, order: metadata.order,
    testament: metadata.testament, translation: 'Matos Soares',
    chapters: chaptersOf(sourceBook).map((chapter, chapterIndex) => ({
      number: chapterNumber(chapter, chapterIndex),
      verses: versesOf(chapter).map((verse, verseIndex) => {
        const number = Number(verse?.number || verse?.numero || verse?.versiculo || verse?.verse) || verseIndex + 1;
        let text = String(verse?.text || verse?.texto || verse?.content || verse?.conteudo || verse || '');
        text = text.replace(/^\s*\[\s*\d+\s*\]\s*/, '').trim();
        return { number, text };
      }).filter((verse) => verse.text)
    })).sort((a, b) => a.number - b.number)
  };
}
async function readSource(location) {
  if (/^https?:\/\//i.test(location)) {
    const response = await fetch(location, { headers: { 'User-Agent': 'Oratio-Bible-Importer/1.0' } });
    if (!response.ok) throw new Error(`Falha HTTP ${response.status} ao baixar a fonte.`);
    return response.json();
  }
  return JSON.parse(await fs.readFile(path.resolve(root, location), 'utf8'));
}

const raw = await readSource(source);
const sourceBooks = collectBooks(raw);
if (sourceBooks.length < 66) throw new Error(`A fonte contém apenas ${sourceBooks.length} livros reconhecíveis.`);
const used = new Set();
const normalized = [];
for (const metadata of books) {
  const aliases = [metadata.name, metadata.short_name, metadata.slug.replaceAll('-', ' '), ...metadata.aliases].map(normalize);
  let index = sourceBooks.findIndex((candidate, candidateIndex) => !used.has(candidateIndex) && aliases.includes(normalize(bookName(candidate))));
  if (index < 0 && sourceBooks.length === books.length) index = metadata.order - 1;
  if (index < 0) throw new Error(`Livro não encontrado: ${metadata.name}`);
  used.add(index);
  const book = normalizeBook(sourceBooks[index], metadata);
  if (book.chapters.length !== metadata.chapters) throw new Error(`${metadata.name}: esperados ${metadata.chapters} capítulos, encontrados ${book.chapters.length}.`);
  if (book.chapters.some((chapter) => !chapter.verses.length)) throw new Error(`${metadata.name}: há capítulo sem versículos.`);
  normalized.push(book);
}

if (dryRun) {
  console.log(`Fonte validada: ${normalized.length} livros e ${normalized.reduce((sum, book) => sum + book.chapters.length, 0)} capítulos.`);
  process.exit(0);
}
for (const book of normalized) {
  const dataPath = path.join(root, '_data', 'bible', `${book.slug}.json`);
  await fs.mkdir(path.dirname(dataPath), { recursive: true });
  await fs.writeFile(dataPath, JSON.stringify(book), 'utf8');
  if (runtimeCopy) {
    const runtimePath = path.join(root, 'assets', 'data', 'bible', 'books', `${book.slug}.json`);
    await fs.mkdir(path.dirname(runtimePath), { recursive: true });
    await fs.writeFile(runtimePath, JSON.stringify(book), 'utf8');
  }
}
const manifest = {
  translation: 'Matos Soares', source, generated_at: new Date().toISOString(),
  books: normalized.map((book) => ({ slug: book.slug, chapters: book.chapters.length }))
};
await fs.writeFile(path.join(root, 'assets', 'data', 'bible', 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');
console.log(`${normalized.length} livros importados. Os capítulos serão renderizados no HTML pelo Jekyll.${runtimeCopy ? ' Uma cópia para carregamento no navegador também foi criada.' : ''}`);
