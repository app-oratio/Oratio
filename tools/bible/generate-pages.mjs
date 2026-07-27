#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { books, totalChapters } from './books.mjs';

const root = process.cwd();
const checkOnly = process.argv.includes('--check');
const quote = (value) => JSON.stringify(value);
const expected = new Map();
const flat = books.flatMap((book) => Array.from({ length: book.chapters }, (_, index) => ({ book, chapter: index + 1 })));

for (const book of books) {
  expected.set(path.join('_biblia', book.slug, 'index.md'), [
    '---', 'layout: bible-book', `title: ${quote(book.name)}`,
    `description: ${quote(`Leia o livro de ${book.name} na Bíblia Sagrada, tradução do Padre Matos Soares.`)}`,
    `permalink: /biblia/${book.slug}/`, 'bible_page: true', 'bible_kind: book',
    `book_order: ${book.order}`, `book_slug: ${quote(book.slug)}`, `book_name: ${quote(book.name)}`,
    `book_short_name: ${quote(book.short_name)}`, `testament: ${quote(book.testament)}`,
    `section: ${quote(book.section)}`, `chapter_count: ${book.chapters}`, 'search: false', 'sitemap: true',
    'image: "/assets/images/social/og-default.webp"', '---', ''
  ].join('\n'));
}

flat.forEach(({ book, chapter }, index) => {
  const previous = flat[index - 1];
  const next = flat[index + 1];
  const lines = [
    '---', 'layout: bible-chapter', `title: ${quote(`${book.name} ${chapter}`)}`,
    `description: ${quote(`Leia ${book.name} ${chapter} na Bíblia Sagrada, tradução do Padre Matos Soares.`)}`,
    `permalink: /biblia/${book.slug}/${chapter}/`, 'bible_page: true', 'bible_kind: chapter',
    `book_order: ${book.order}`, `book_slug: ${quote(book.slug)}`, `book_name: ${quote(book.name)}`,
    `book_short_name: ${quote(book.short_name)}`, `testament: ${quote(book.testament)}`,
    `section: ${quote(book.section)}`, `chapter: ${chapter}`, `chapter_count: ${book.chapters}`
  ];
  if (previous) lines.push(`previous_title: ${quote(`${previous.book.name} ${previous.chapter}`)}`, `previous_url: /biblia/${previous.book.slug}/${previous.chapter}/`);
  if (next) lines.push(`next_title: ${quote(`${next.book.name} ${next.chapter}`)}`, `next_url: /biblia/${next.book.slug}/${next.chapter}/`);
  lines.push('translation: "Matos Soares"', 'search: false', 'sitemap: true', 'image: "/assets/images/social/og-default.webp"', '---', '');
  expected.set(path.join('_biblia', book.slug, `${chapter}.md`), lines.join('\n'));
});

let differences = 0;
for (const [relative, content] of expected) {
  const destination = path.join(root, relative);
  if (checkOnly) {
    const current = await fs.readFile(destination, 'utf8').catch(() => null);
    if (current !== content) { console.error(`Divergente ou ausente: ${relative}`); differences += 1; }
  } else {
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.writeFile(destination, content, 'utf8');
  }
}
if (differences) process.exitCode = 1;
else console.log(`${books.length} livros e ${totalChapters} capítulos ${checkOnly ? 'verificados' : 'gerados'} com sucesso.`);
