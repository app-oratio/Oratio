import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const CDN_ROOT = 'https://cdn.oratioapp.com.br/Liturgia/LH/calendario';
const OUTPUT_ROOT = resolve('assets/data/liturgia/calendario');
const years = (process.argv.slice(2).length ? process.argv.slice(2) : ['2026'])
  .map((value) => String(value).trim())
  .filter((value) => /^\d{4}$/.test(value));

if (!years.length) {
  throw new Error('Nenhum ano válido foi informado para a sincronização.');
}

async function fetchJson(url, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        redirect: 'follow'
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ao consultar ${url}`);
      }
      const text = await response.text();
      const payload = JSON.parse(text);
      return payload;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await new Promise((resolveDelay) => setTimeout(resolveDelay, attempt * 1500));
      }
    }
  }
  throw lastError;
}

async function saveJson(relativePath, payload) {
  const target = resolve(OUTPUT_ROOT, relativePath);
  await mkdir(resolve(target, '..'), { recursive: true });
  await writeFile(target, `${JSON.stringify(payload)}\n`, 'utf8');
  console.log(`Sincronizado: ${relativePath}`);
}

await mkdir(resolve(OUTPUT_ROOT, 'anos'), { recursive: true });

const memories = await fetchJson(`${CDN_ROOT}/memorias.json`);
await saveJson('memorias.json', memories);

for (const year of years) {
  const calendar = await fetchJson(`${CDN_ROOT}/anos/${year}.json`);
  await saveJson(`anos/${year}.json`, calendar);
}

await saveJson('manifesto.json', {
  years,
  generatedAt: new Date().toISOString(),
  source: CDN_ROOT
});
