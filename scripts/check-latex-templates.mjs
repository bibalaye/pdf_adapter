/**
 * Compiles every CV template on TeXLive.net with a fictional CV, and saves the results in latex-check/.
 * Only fictional data is sent. Run it after changing a template:
 *
 *   npm run check:latex            all templates, without a photo
 *   npm run check:latex -- --photo all templates, with a small test photo
 *   npm run check:latex -- alta    one template
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { SAMPLE_CV, TEMPLATE_CATALOG, generateCVTemplate, needsUnicodeEngine } from '../src/cv-templates.js';

const ENDPOINT = 'https://texlive.net/cgi-bin/latexcgi';
const OUTPUT = new URL('../latex-check/', import.meta.url);
const TEST_PHOTO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

const args = process.argv.slice(2);
const withPhoto = args.includes('--photo');
const requested = args.filter((arg) => !arg.startsWith('--'));
const ids = requested.length ? requested : Object.keys(TEMPLATE_CATALOG);

async function buildDocument(id) {
  const source = generateCVTemplate(SAMPLE_CV, '', withPhoto ? TEST_PHOTO : '', id, 'fr');
  const { companion } = TEMPLATE_CATALOG[id];
  if (!companion) return source;
  const classSource = await readFile(new URL(`../public/${companion}`, import.meta.url), 'utf8');
  return `\\begin{filecontents*}[overwrite]{${companion}}\n${classSource.trim()}\n\\end{filecontents*}\n${source}`;
}

async function compile(id) {
  const template = TEMPLATE_CATALOG[id];
  const engine = (withPhoto && template.photo) || needsUnicodeEngine(JSON.stringify(SAMPLE_CV)) ? 'lualatex' : 'pdflatex';
  const form = new FormData();
  form.append('filecontents[]', await buildDocument(id));
  form.append('filename[]', 'document.tex');
  form.append('engine', engine);
  form.append('return', 'pdf');

  const response = await fetch(ENDPOINT, { method: 'POST', body: form });
  const bytes = Buffer.from(await response.arrayBuffer());
  const isPDF = bytes.subarray(0, 5).toString('latin1') === '%PDF-';
  const suffix = withPhoto ? '-photo' : '';
  await writeFile(new URL(`${id}${suffix}.${isPDF ? 'pdf' : 'log'}`, OUTPUT), bytes);
  return { id, engine, isPDF, size: bytes.length };
}

await mkdir(OUTPUT, { recursive: true });

const failures = [];
for (const id of ids) {
  if (!TEMPLATE_CATALOG[id]) {
    console.log(`?     ${id} : modèle inconnu`);
    failures.push(id);
    continue;
  }
  try {
    const result = await compile(id);
    console.log(`${result.isPDF ? 'OK   ' : 'ÉCHEC'} ${id.padEnd(14)} ${result.engine.padEnd(9)} ${Math.round(result.size / 1024)} Ko`);
    if (!result.isPDF) failures.push(id);
  } catch (error) {
    console.log(`ÉCHEC ${id.padEnd(14)} ${error.message}`);
    failures.push(id);
  }
}

console.log(`\n${ids.length - failures.length}/${ids.length} modèles compilés. PDF et journaux : latex-check/`);
if (failures.length) {
  console.log(`À corriger : ${failures.join(', ')}`);
  process.exitCode = 1;
}
