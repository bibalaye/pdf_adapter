import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  TEMPLATE_CATALOG,
  TEMPLATE_CATEGORIES,
  SAMPLE_CV,
  escapeLatex,
  needsUnicodeEngine,
  generateCVTemplate,
  generateCoverLetterTemplate,
  getTemplateLabels,
} from '../src/cv-templates.js';

const IDS = Object.keys(TEMPLATE_CATALOG);
const PHOTO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

const HOSTILE = {
  personalInfo: {
    fullName: 'Élodie D\'Arc_Müller & Fils',
    title: 'R&D 100% {C#} ~ $x^2 \\end{document}',
    email: 'elodie_arc+cv@example.com',
    phone: '+33 (0)6 12 34 56 78',
    location: 'Saint-Étienne #42',
    linkedin: 'https://www.linkedin.com/in/elodie_arc/',
    github: 'https://github.com/elodie_arc',
    website: 'https://exemple.fr/a_b?x=1&y=2#z%20',
  },
  summary: 'Ligne 1\nLigne 2 → 50 % de plus 🚀 “citation” – fin…',
  keySkills: ['C++', 'C#', 'R&D', '100%', 'node_js', '', null],
  experience: [
    { title: 'Chef_de_projet & lead', company: 'Société #1 {SAS}', period: '01/2020 – aujourd\'hui', description: 'Contexte à 30 %', bullets: ['Budget de 10 k€', '{accolade}', '\\textbf{commande}'] },
    { title: 'Sans missions', company: '', period: '', description: '', bullets: [] },
    { title: '', company: 'Sans titre', period: '2019', description: 'Texte seul', bullets: [] },
  ],
  education: [{ degree: 'Master_2', school: 'École & Université', period: '2019', description: '' }],
  projects: [{ name: 'Projet & co', description: 'Détail 100%', link: 'https://exemple.fr/p_1?a=1&b=2' }, { name: '', description: 'Sans nom' }],
  certifications: ['ISO 27001 & co'],
  languages: ['Français - Natif'],
  interests: ['Voile & escalade'],
};

const EMPTY = { personalInfo: { fullName: 'Camille' } };
const NO_NAME = {};

/**
 * Structural checks that catch what stops a LaTeX compilation, without running LaTeX.
 */
function lint(source) {
  const problems = [];
  const body = source.replace(/\\\\/g, '').replace(/\\[{}%#&$_]/g, '');

  let depth = 0;
  for (const line of body.split('\n')) {
    const code = line.startsWith('%') ? '' : line;
    for (const char of code) {
      if (char === '{') depth += 1;
      if (char === '}') depth -= 1;
      if (depth < 0) { problems.push(`extra closing brace: ${line.slice(0, 70)}`); depth = 0; }
    }
  }
  if (depth !== 0) problems.push(`unbalanced braces: ${depth}`);

  const stack = [];
  for (const match of source.matchAll(/\\(begin|end)\{([^}]+)\}/g)) {
    const line = source.slice(source.lastIndexOf('\n', match.index) + 1, match.index);
    if (line.includes('\\newcommand') || line.includes('\\renewcommand')) continue;
    if (match[1] === 'begin') stack.push(match[2]);
    else if (stack.pop() !== match[2]) problems.push(`mismatched environment: ${match[2]}`);
  }
  if (stack.length) problems.push(`unclosed environments: ${stack.join(', ')}`);

  if (/\\begin\{itemize\}\s*\\end\{itemize\}/.test(source)) problems.push('empty itemize');
  if (/\\begin\{itemize\}(?!\s*(?:\\item|\[))/.test(source.replace(/\\newcommand\{\\resume[^\n]*/g, ''))) problems.push('itemize without item');
  if (/\b(undefined|null|NaN)\b|\[object Object\]/.test(source.replace(/\\directlua\{[\s\S]*?\n\}/, ''))) problems.push('leaked JavaScript value');
  if (!source.includes('\\begin{document}') || !source.trimEnd().endsWith('\\end{document}')) problems.push('document not closed');
  if (/\\section\*?\{\}/.test(source)) problems.push('section without a title');
  if (/\\item\s*\n/.test(source.slice(source.indexOf('\\begin{document}')))) problems.push('empty item');
  return problems;
}

/**
 * Text coming from a CV must never reach LaTeX as a command or a special character.
 */
function assertEscaped(source, id) {
  const document = source.slice(source.indexOf('\\begin{document}'));
  assert.ok(!document.includes('\\textbf{commande}'), `${id}: a command in the CV text reached LaTeX`);
  assert.ok(!/(^|[^\\])\{accolade\}/.test(document.replace(/\\\{accolade\\\}/g, '')), `${id}: unescaped braces`);
  assert.ok(!document.replace(/\\&/g, '').includes('R&D'), `${id}: unescaped ampersand`);
  assert.ok(!/[^\\]\\end\{document\}\s*[^\s]/.test(source.replace(/\\textbackslash\{\}end\\\{document\\\}/g, '')), `${id}: text after end of document`);
}

test('the catalog is complete and consistent', () => {
  assert.equal(IDS.length, 15);
  for (const id of IDS) {
    const template = TEMPLATE_CATALOG[id];
    assert.ok(template.name && template.description, id);
    assert.ok(TEMPLATE_CATEGORIES[template.category], `${id}: unknown category`);
    assert.ok([1, 2].includes(template.columns), id);
    assert.equal(typeof template.photo, 'boolean', id);
    assert.ok(template.preview?.layout && template.preview?.accent, id);
  }
  for (const category of Object.keys(TEMPLATE_CATEGORIES)) {
    assert.ok(IDS.some((id) => TEMPLATE_CATALOG[id].category === category), `${category} is empty`);
  }
});

test('every library-based template names its source and licence', () => {
  for (const id of IDS) {
    const { source } = TEMPLATE_CATALOG[id];
    if (source) assert.ok(source.name && source.license && source.url.startsWith('https://'), id);
  }
  assert.ok(IDS.filter((id) => TEMPLATE_CATALOG[id].source).length >= 7);
});

for (const id of IDS) {
  test(`${id}: a full CV gives a well-formed document`, () => {
    const source = generateCVTemplate(SAMPLE_CV, '', '', id, 'fr');
    assert.deepEqual(lint(source), []);
    for (const expected of ['Camille', 'Atelier Numérique', 'Master Design', 'Figma', 'Refonte du portail client', 'Certification accessibilité', 'Français - Natif']) {
      assert.ok(source.includes(expected), `${id} lost: ${expected}`);
    }
  });

  test(`${id}: hostile text stays text`, () => {
    const source = generateCVTemplate(HOSTILE, '', '', id, 'fr');
    assert.deepEqual(lint(source), []);
    assertEscaped(source, id);
    assert.ok(!source.includes('🚀'), `${id}: an emoji would stop pdfLaTeX`);
    assert.ok(!source.includes('→'), `${id}: an arrow would stop pdfLaTeX`);
    assert.ok(source.includes('Élodie'), `${id}: accents are lost`);
  });

  test(`${id}: empty sections disappear`, () => {
    for (const cv of [EMPTY, NO_NAME]) {
      const source = generateCVTemplate(cv, '', '', id, 'fr');
      assert.deepEqual(lint(source), []);
      const labels = getTemplateLabels('fr', id);
      for (const label of [labels.experience, labels.education, labels.projects, labels.certifications, labels.languages]) {
        assert.ok(!source.includes(`{${label}}`), `${id}: empty section ${label}`);
      }
    }
  });

  test(`${id}: section titles follow the language`, () => {
    const english = generateCVTemplate(SAMPLE_CV, '', '', id, 'en');
    assert.deepEqual(lint(english), []);
    assert.ok(!/\{Expérience\}|\{Formation\}|\{Compétences\}|\{Langues\}/.test(english), `${id} keeps French titles`);
  });

  test(`${id}: the photo is handled as the catalog says`, () => {
    const source = generateCVTemplate(SAMPLE_CV, '', PHOTO, id, 'fr');
    assert.deepEqual(lint(source), []);
    if (TEMPLATE_CATALOG[id].photo) {
      assert.ok(source.includes('\\directlua{'), `${id}: photo not decoded`);
      assert.match(source, /profile-photo/);
      const lua = source.slice(source.indexOf('\\directlua{'), source.indexOf('file:close()'));
      assert.ok(!/[~%#\\]/.test(lua.replace('\\directlua{', '')), `${id}: a TeX special character would break the Lua code`);
    } else {
      assert.ok(!source.includes('directlua') && !source.includes('profile-photo'), `${id}: should ignore the photo`);
    }
  });
}

test('special characters are escaped once, in a single pass', () => {
  assert.equal(escapeLatex('a\\b'), 'a\\textbackslash{}b');
  assert.equal(escapeLatex('{x}'), '\\{x\\}');
  assert.equal(escapeLatex('100% R&D #1 $5 a_b ^2 ~'), '100\\% R\\&D \\#1 \\$5 a\\_b \\textasciicircum{}2 \\textasciitilde{}');
  assert.equal(escapeLatex('l’été “chaud”…'), 'l\'été "chaud"...');
  assert.equal(escapeLatex('a 🚀 b → c'), 'a  b -> c');
  assert.equal(escapeLatex('© ® ™'), '© ® ™');
  assert.equal(escapeLatex(null), '');
  assert.equal(escapeLatex(0), '0');
});

test('non-Latin letters ask for the Unicode engine', () => {
  assert.equal(needsUnicodeEngine('Élodie Müller, Łódź – 10 €'), false);
  assert.equal(needsUnicodeEngine('Светлана'), true);
  assert.equal(needsUnicodeEngine('محمد'), true);
  assert.equal(needsUnicodeEngine('李明'), true);
  assert.equal(needsUnicodeEngine('fusée 🚀'), false);
});

test('links keep working with special characters', () => {
  const source = generateCVTemplate(HOSTILE, '', '', 'classic', 'fr');
  assert.ok(source.includes('\\href{mailto:elodie\\_arc+cv@example.com}'), 'mailto');
  assert.ok(source.includes('\\href{https://exemple.fr/a\\_b?x=1\\&y=2\\#z\\%20}'), 'website');
  assert.ok(source.includes('\\href{https://www.linkedin.com/in/elodie\\_arc/}{linkedin.com/in/elodie\\_arc}'), 'linkedin');
});

test('a dangerous link scheme is dropped', () => {
  const source = generateCVTemplate({ personalInfo: { fullName: 'A B', website: 'javascript:alert(1)' }, projects: [{ name: 'P', link: 'file:///etc/passwd' }] }, '', '', 'classic', 'fr');
  assert.ok(!source.includes('javascript:') && !source.includes('file:///'));
});

test('moderncv keeps the documented API and no babel', () => {
  const styles = { banking: 'banking', heritage: 'classic', editorial: 'oldstyle', contemporary: 'casual', refined: 'fancy' };
  for (const [id, style] of Object.entries(styles)) {
    const source = generateCVTemplate(SAMPLE_CV, '', PHOTO, id, 'fr');
    assert.ok(source.includes(`\\moderncvstyle{${style}}`), id);
    assert.match(source, /\\moderncvcolor\{(black|blue|burgundy|green|grey|orange|purple|red)\}/, id);
    assert.ok(source.includes('\\name{Camille}{Martin}'), id);
    assert.ok(source.includes('\\address{Lyon, France}{}{}'), id);
    assert.ok(source.includes('\\phone[mobile]{'), id);
    assert.ok(source.includes('\\social[linkedin]{camille-martin}'), id);
    assert.ok(source.includes('\\photo[64pt][0.4pt]{profile-photo}'), id);
    assert.ok(source.includes('\\makecvtitle'), id);
    // moderncv's own template warns that some babel languages break it
    assert.ok(!source.includes('babel'), id);
    for (const match of source.matchAll(/\\cventry\{/g)) {
      const rest = source.slice(match.index);
      assert.match(rest, /^\\cventry\{[^}]*\}\{[^}]*\}\{[^}]*\}\{\}\{\}\{/, `${id}: cventry takes 6 arguments`);
    }
  }
});

test('AltaCV uses only commands its class defines', () => {
  const cls = readFileSync(new URL('../public/altacv.cls', import.meta.url), 'utf8');
  const source = generateCVTemplate(SAMPLE_CV, '', PHOTO, 'alta', 'fr');
  for (const command of ['cvevent', 'cvsection', 'cvtag', 'divider', 'name', 'tagline', 'personalinfo', 'makecvheader', 'photoR', 'locationname', 'datename', 'cvItemMarker']) {
    assert.ok(source.includes(`\\${command}`), `the template should use ${command}`);
    assert.ok(new RegExp(`\\\\(newcommand|def|NewDocumentCommand)\\*?\\{?\\\\${command}\\b`).test(cls), `altacv.cls does not define ${command}`);
  }
  for (const field of ['email', 'phone', 'location', 'linkedin']) {
    assert.ok(new RegExp(`\\\\NewInfoField\\{${field}\\}`).test(cls), `altacv.cls does not define ${field}`);
  }
  assert.ok(TEMPLATE_CATALOG.alta.companion === 'altacv.cls');
});

test('the compact template keeps the MIT notice and works without pdfTeX primitives', () => {
  const source = generateCVTemplate(SAMPLE_CV, '', '', 'compact', 'fr');
  assert.ok(source.includes('Jake Gutierrez, MIT License'));
  assert.ok(source.includes('\\ifdefined\\pdfgentounicode'));
  assert.ok(source.includes('a4paper'));
});

test('own templates do not depend on a second compilation pass', () => {
  for (const id of ['modern', 'panel']) {
    const source = generateCVTemplate(SAMPLE_CV, '', '', id, 'fr');
    assert.ok(!source.includes('remember picture') && !source.includes('tikz'), id);
    assert.ok(source.includes('\\AddToShipoutPictureBG'), id);
  }
});

test('no template relies on a font found by name on the server, except AltaCV with LuaLaTeX', () => {
  for (const id of IDS) {
    const source = generateCVTemplate(SAMPLE_CV, '', '', id, 'fr');
    if (id === 'alta') continue;
    assert.ok(!/\\setmainfont|\\setsansfont|\\newfontfamily/.test(source), id);
  }
});

test('the letter follows the language', () => {
  const letter = { greeting: 'Dear Sir or Madam,', subject: 'Application', opening: 'Hello 100%', body: 'R&D', closing: 'Thanks', signoff: 'Sincerely,' };
  const english = generateCoverLetterTemplate(letter, 'Camille', '', 'Acme & Co', 'en');
  assert.ok(english.includes('[english]{babel}') && english.includes('Subject:') && english.includes('\\closing{Sincerely,}'));
  assert.ok(english.includes('Hello 100\\%') && english.includes('R\\&D') && english.includes('Acme \\& Co'));
  assert.deepEqual(lint(english), []);
  const french = generateCoverLetterTemplate({ opening: 'Bonjour', body: 'Corps', closing: 'Fin' }, 'Camille', 'Designer', '', 'fr');
  assert.ok(french.includes('[french]{babel}') && french.includes('Objet :') && french.includes('Candidature au poste de Designer') && french.includes('\\closing{Cordialement,}'));
  assert.deepEqual(lint(french), []);
});
