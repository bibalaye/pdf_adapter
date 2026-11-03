/**
 * CV templates — each one turns the same CV data into a LaTeX document.
 * Third-party sources and their licences: see THIRD_PARTY_NOTICES.md
 */
const tex = String.raw;

const MODERNCV = { name: 'moderncv', license: 'LPPL 1.3c', url: 'https://ctan.org/pkg/moderncv' };
const JAKE = { name: 'Jake’s Resume', license: 'MIT', url: 'https://github.com/jakegut/resume' };
const ALTACV = { name: 'AltaCV', license: 'LPPL 1.3', url: 'https://github.com/liantze/AltaCV' };

export const TEMPLATE_CATEGORIES = {
  sober: 'Sobres',
  classic: 'Classiques',
  modern: 'Modernes',
  creative: 'Créatifs',
};

export const DEFAULT_TEMPLATE = 'classic';

/**
 * columns and photo are facts about the rendered document, shown in the gallery.
 * preview drives the HTML approximation; the PDF is the reference.
 */
export const TEMPLATE_CATALOG = {
  classic: {
    name: 'Clair', category: 'sober', columns: 1, photo: true,
    description: 'Une colonne sobre, le choix sûr pour la plupart des candidatures.',
    preview: { layout: 'centered', accent: '#2E6B4F' },
  },
  minimal: {
    name: 'Minimal', category: 'sober', columns: 1, photo: true,
    description: 'En-tête centré, sans couleur, tout pour le texte.',
    preview: { layout: 'plain', accent: '#39403B' },
  },
  compact: {
    name: 'Compact', category: 'sober', columns: 1, photo: false, source: JAKE,
    description: 'Très dense, pour tenir sur une page. Sans photo.',
    preview: { layout: 'compact', accent: '#17201B', serif: true },
  },
  banking: {
    name: 'Banque', category: 'sober', columns: 1, photo: true, source: MODERNCV,
    description: 'En-tête centré et filets discrets, pour la finance et le conseil.',
    preview: { layout: 'banking', accent: '#17201B' },
  },
  heritage: {
    name: 'Héritage', category: 'classic', columns: 1, photo: true, source: MODERNCV,
    description: 'Dates en marge et nom en tête, un classique très répandu.',
    preview: { layout: 'margin', accent: '#3873B3' },
  },
  editorial: {
    name: 'Éditorial', category: 'classic', columns: 1, photo: true, source: MODERNCV,
    description: 'Caractères à empattements et grandes marges, pour un ton posé.',
    preview: { layout: 'margin', accent: '#595959', serif: true },
  },
  executive: {
    name: 'Exécutif', category: 'classic', columns: 1, photo: true,
    description: 'Bandeau sombre, pour les postes à responsabilités.',
    preview: { layout: 'banner', accent: '#2C533F', dark: '#18221C' },
    labels: { fr: { experience: 'Parcours professionnel', skills: 'Expertises' }, en: { experience: 'Career history', skills: 'Expertise' } },
  },
  academic: {
    name: 'Académique', category: 'classic', columns: 1, photo: true,
    description: 'Sobre et à empattements, pour la recherche et l’enseignement.',
    preview: { layout: 'academic', accent: '#17201B', serif: true },
  },
  modern: {
    name: 'Moderne', category: 'modern', columns: 2, photo: true,
    description: 'Colonne sombre pour les contacts et les compétences.',
    preview: { layout: 'sidebar', accent: '#234B39', dark: '#1D3026' },
  },
  panel: {
    name: 'Panneau', category: 'modern', columns: 2, photo: true,
    description: 'Colonne claire et accent bleu, plus légère à l’impression.',
    preview: { layout: 'sidebar', accent: '#2B5C8A', soft: '#EEF2F6', light: true },
  },
  contemporary: {
    name: 'Contemporain', category: 'modern', columns: 1, photo: true, source: MODERNCV,
    description: 'Grand nom et filets colorés, un style actuel et lisible.',
    preview: { layout: 'margin', accent: '#980000', nameLeft: true },
  },
  refined: {
    name: 'Raffiné', category: 'modern', columns: 1, photo: true, source: MODERNCV,
    description: 'Nom aligné à droite et titres encadrés de filets.',
    preview: { layout: 'margin', accent: '#8054CC', nameRight: true },
  },
  impact: {
    name: 'Impact', category: 'modern', columns: 1, photo: true,
    description: 'Nom en deux tons et titres marqués, pour se démarquer sans excès.',
    preview: { layout: 'impact', accent: '#B5322B' },
  },
  alta: {
    name: 'Alta', category: 'creative', columns: 2, photo: true, source: ALTACV, companion: 'altacv.cls',
    description: 'Deux colonnes, compétences en étiquettes, très visuel.',
    preview: { layout: 'alta', accent: '#3E0097' },
    labels: { fr: { skills: 'Compétences' }, en: { skills: 'Skills' } },
  },
  bold: {
    name: 'Créatif', category: 'creative', columns: 1, photo: true,
    description: 'Compétences en tête et accent terracotta.',
    preview: { layout: 'bar', accent: '#B2533D', soft: '#F7E9E3' },
    labels: { fr: { experience: 'Expériences sélectionnées', skills: 'Compétences clés' }, en: { experience: 'Selected experience', skills: 'Key skills' } },
  },
};

const LABELS = {
  fr: {
    profile: 'Profil', experience: 'Expérience', education: 'Formation', skills: 'Compétences', projects: 'Projets',
    certifications: 'Certifications', languages: 'Langues', interests: 'Centres d’intérêt', contact: 'Contact', link: 'lien',
    location: 'Lieu', date: 'Date',
  },
  en: {
    profile: 'Profile', experience: 'Experience', education: 'Education', skills: 'Skills', projects: 'Projects',
    certifications: 'Certifications', languages: 'Languages', interests: 'Interests', contact: 'Contact', link: 'link',
    location: 'Location', date: 'Date',
  },
};

export function getTemplateLabels(language = 'fr', templateId = DEFAULT_TEMPLATE) {
  const lang = language === 'en' ? 'en' : 'fr';
  return { ...LABELS[lang], ...TEMPLATE_CATALOG[templateId]?.labels?.[lang] };
}

/**
 * Fictional CV for the gallery previews, its sample PDF and the template checks.
 */
export const SAMPLE_CV = {
  personalInfo: {
    fullName: 'Camille Martin',
    title: 'Designer produit',
    email: 'camille.martin@example.com',
    phone: '+33 6 00 00 00 00',
    location: 'Lyon, France',
    linkedin: 'linkedin.com/in/camille-martin',
  },
  summary: 'Designer produit spécialisée dans les interfaces web, la recherche utilisateur et les design systems, habituée à travailler avec les équipes de développement.',
  keySkills: ['Figma', 'Prototypage', 'Recherche utilisateur', 'Accessibilité', 'Design system', 'HTML et CSS'],
  experience: [
    {
      title: 'Designer produit', company: 'Atelier Numérique', period: '2021 – 2024', description: '',
      bullets: ['Conception des parcours web d’un portail client', 'Tests utilisateurs et synthèse des enseignements', 'Évolution du design system avec les développeurs'],
    },
    {
      title: 'Designer UX/UI', company: 'Studio Pixel', period: '2019 – 2021', description: '',
      bullets: ['Création de maquettes pour des clients variés', 'Préparation des présentations aux clients'],
    },
  ],
  education: [{ degree: 'Master Design d’interaction', school: 'Université de Lyon', period: '2019', description: '' }],
  projects: [{ name: 'Refonte du portail client', description: 'Parcours simplifié et bibliothèque de composants.' }],
  certifications: ['Certification accessibilité numérique'],
  languages: ['Français - Natif', 'Anglais - Courant'],
  interests: [],
};

// ============================================================
// Text
// ============================================================
const LATEX_SPECIALS = {
  '\\': '\\textbackslash{}',
  '{': '\\{',
  '}': '\\}',
  $: '\\$',
  '&': '\\&',
  '#': '\\#',
  '^': '\\textasciicircum{}',
  _: '\\_',
  '~': '\\textasciitilde{}',
  '%': '\\%',
};

const UNICODE_REPLACEMENTS = [
  [/[‘’ʼ]/g, "'"],
  [/[“”]/g, '"'],
  [/…/g, '...'],
  [/[→⇒➡]/g, '->'],
  [/[•●▪‣]/g, '-'],
  [/[   ]/g, ' '],
  [/[​-‍﻿️]/g, ''],
  // Emoji and pictographs have no glyph in a CV font, and stop pdfLaTeX with an error
  [/(?![©®™])\p{Extended_Pictographic}/gu, ''],
];

function normalizeUnicode(value) {
  return UNICODE_REPLACEMENTS.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), String(value ?? ''));
}

export function escapeLatex(str) {
  if (str === null || str === undefined || str === '') return '';
  return normalizeUnicode(str)
    .replace(/\s*\n\s*/g, ' ')
    .replace(/[\\{}$&#^_~%]/g, (char) => LATEX_SPECIALS[char])
    .trim();
}

/**
 * True when the text holds letters that pdfLaTeX cannot typeset with T1 fonts (Greek, Cyrillic, Arabic, CJK...).
 */
export function needsUnicodeEngine(text) {
  return /[^\u0000-ɏ‐-‧‰-⁞€™]/.test(normalizeUnicode(text));
}

function latexUrl(raw) {
  const value = String(raw ?? '').trim();
  if (!value) return '';
  const url = /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`;
  if (!/^(https?:|mailto:)/i.test(url)) return '';
  return url.replace(/[\s{}\\^~`"<>|]/g, '').replace(/[%#&_]/g, (char) => `\\${char}`);
}

function displayLink(raw) {
  return escapeLatex(String(raw ?? '').trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/+$/, ''));
}

function handle(raw, pattern) {
  return escapeLatex(String(raw ?? '').trim().replace(pattern, '').replace(/\/+$/, ''));
}

/**
 * Everything a template needs, already escaped.
 */
function prepare(cvData, candidateName, language, templateId) {
  const pi = cvData?.personalInfo || {};
  const fullName = String(pi.fullName || candidateName || (language === 'en' ? 'Candidate' : 'Candidat')).trim();
  const parts = fullName.split(/\s+/);
  const list = (items) => (Array.isArray(items) ? items : []).filter(Boolean).map(escapeLatex).filter(Boolean);

  const contactItems = [];
  if (pi.email) contactItems.push(tex`\href{mailto:${latexUrl(pi.email).replace(/^https:\/\//, '')}}{${escapeLatex(pi.email)}}`);
  if (pi.phone) contactItems.push(escapeLatex(pi.phone));
  if (pi.location) contactItems.push(escapeLatex(pi.location));
  [pi.linkedin, pi.github, pi.website].filter((link) => latexUrl(link)).forEach((link) => {
    contactItems.push(tex`\href{${latexUrl(link)}}{${displayLink(link)}}`);
  });

  return {
    L: getTemplateLabels(language, templateId),
    language: language === 'en' ? 'en' : 'fr',
    name: escapeLatex(fullName),
    first: escapeLatex(parts.length > 1 ? parts.slice(0, -1).join(' ') : parts[0]),
    last: escapeLatex(parts.length > 1 ? parts.at(-1) : ''),
    title: escapeLatex(pi.title),
    email: escapeLatex(pi.email),
    phone: escapeLatex(pi.phone),
    location: escapeLatex(pi.location),
    website: latexUrl(pi.website) ? displayLink(pi.website) : '',
    linkedin: handle(pi.linkedin, /^(https?:\/\/)?(www\.)?linkedin\.com\/in\//i),
    github: handle(pi.github, /^(https?:\/\/)?(www\.)?github\.com\//i),
    contactItems,
    summary: escapeLatex(cvData?.summary),
    skills: list(cvData?.keySkills),
    experience: (cvData?.experience || []).map((exp) => ({
      title: escapeLatex(exp.title),
      company: escapeLatex(exp.company),
      period: escapeLatex(exp.period),
      description: escapeLatex(exp.description),
      bullets: list(exp.bullets),
    })),
    education: (cvData?.education || []).map((edu) => ({
      title: escapeLatex(edu.degree),
      company: escapeLatex(edu.school),
      period: escapeLatex(edu.period),
      description: escapeLatex(edu.description),
      bullets: [],
    })),
    projects: (cvData?.projects || []).filter((project) => project?.name || project?.description).map((project) => ({
      name: escapeLatex(project.name),
      description: escapeLatex(project.description),
      url: latexUrl(project.link),
    })),
    certifications: list(cvData?.certifications),
    languages: list(cvData?.languages),
    interests: list(cvData?.interests),
  };
}

// ============================================================
// Photo
// ============================================================

/**
 * LuaLaTeX writes the photo to a file while reading the preamble.
 * \directlua expands its argument, so this Lua must avoid the characters
 * TeX treats as active or special (a tilde would break the document).
 */
function photoSetup(photoData) {
  const base64 = photoData.includes(',') ? photoData.split(',')[1] : '';
  if (!base64) return '';
  const extension = photoData.startsWith('data:image/png') ? 'png' : 'jpg';
  return {
    extension,
    file: `profile-photo.${extension}`,
    preamble: tex`\directlua{
local data = [[${base64}]]
local chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
local output = {}
for index = 1, string.len(data), 4 do
  local c1, c2, c3, c4 = data:sub(index, index), data:sub(index + 1, index + 1), data:sub(index + 2, index + 2), data:sub(index + 3, index + 3)
  local a = chars:find(c1, 1, true) - 1
  local b = chars:find(c2, 1, true) - 1
  local has3 = not (c3 == '=')
  local has4 = not (c4 == '=')
  local c = has3 and (chars:find(c3, 1, true) - 1) or 0
  local d = has4 and (chars:find(c4, 1, true) - 1) or 0
  local value = a * 262144 + b * 4096 + c * 64 + d
  table.insert(output, string.char(math.floor(value / 65536)))
  if has3 then table.insert(output, string.char(math.fmod(math.floor(value / 256), 256))) end
  if has4 then table.insert(output, string.char(math.fmod(value, 256))) end
end
local file = assert(io.open('profile-photo.${extension}', 'wb'))
file:write(table.concat(output))
file:close()
}`,
  };
}

// ============================================================
// Shared LaTeX pieces for AdaptaCV's own templates
// ============================================================
const FONTS = {
  heros: tex`\usepackage{tgheros}
\renewcommand{\familydefault}{\sfdefault}`,
  adventor: tex`\usepackage{tgadventor}
\renewcommand{\familydefault}{\sfdefault}`,
  termes: tex`\usepackage{tgtermes}`,
  pagella: tex`\usepackage{tgpagella}`,
  latin: tex`\usepackage{lmodern}
\renewcommand{\familydefault}{\sfdefault}`,
};

function articleDocument(d, { font, margins, colors, size = '10pt', preamble = '', photo, body }) {
  const colorLines = Object.entries(colors).map(([name, value]) => tex`\definecolor{${name}}{HTML}{${value}}`).join('\n');
  return tex`\documentclass[${size},a4paper]{article}
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
${FONTS[font]}
\usepackage{microtype}
\usepackage[${margins}]{geometry}
\usepackage{xcolor}
\usepackage{titlesec}
\usepackage{enumitem}
\usepackage{graphicx}
\usepackage{parskip}
\usepackage[hidelinks]{hyperref}
${colorLines}
${photo?.preamble || ''}
\hypersetup{pdftitle={CV - ${d.name}},pdfauthor={${d.name}}}
\setlist[itemize]{leftmargin=1.1em,nosep,topsep=2pt}
${preamble}
\begin{document}
\pagestyle{empty}
\color{textdark}
${body}
\end{document}
`;
}

function itemize(items) {
  if (!items.length) return '';
  return `\\begin{itemize}\n${items.map((item) => `  \\item ${item}`).join('\n')}\n\\end{itemize}`;
}

function datedEntry(entry, { subtitleColor = 'primary' } = {}) {
  const head = tex`\noindent\begin{minipage}[t]{0.72\linewidth}
\raggedright\textbf{${entry.title}}\par
{\color{${subtitleColor}}\textbf{${entry.company}}}
\end{minipage}\hfill
\begin{minipage}[t]{0.25\linewidth}
\raggedleft{\small\textit{${entry.period}}}
\end{minipage}\par`;
  const description = entry.description ? tex`
\smallskip
\noindent ${entry.description}\par` : '';
  const bullets = entry.bullets.length ? `\n${itemize(entry.bullets)}` : '';
  return `${head}${description}${bullets}\n\\par`;
}

function entries(list, options) {
  return list.map((entry) => datedEntry(entry, options)).join('\n\\medskip\n');
}

function projectEntries(d) {
  return d.projects.map((project) => {
    const link = project.url ? tex` -- \href{${project.url}}{${d.L.link}}` : '';
    const name = project.name ? tex`\textbf{${project.name}}${link}\par` : '';
    return `\\noindent ${name}\n${project.description}`;
  }).join('\n\\medskip\n');
}

function section(title, content) {
  return content ? tex`\section*{${title}}
${content}
` : '';
}

function bulletLine(items) {
  return items.join(tex` \enspace\textbullet\enspace `);
}

function contactLine(d, separator = tex` \enspace|\enspace `) {
  return d.contactItems.join(separator);
}

function includePhoto(photo, width = '2.6cm', height = '3.1cm') {
  return photo ? tex`\includegraphics[width=${width},height=${height},keepaspectratio]{${photo.file}}` : '';
}

/**
 * The sections shared by most layouts, in the order a template asks for.
 */
function sections(d, order, options = {}) {
  const content = {
    summary: () => section(d.L.profile, d.summary),
    skills: () => section(d.L.skills, bulletLine(d.skills)),
    experience: () => section(d.L.experience, entries(d.experience, options)),
    education: () => section(d.L.education, entries(d.education, options)),
    projects: () => section(d.L.projects, projectEntries(d)),
    certifications: () => section(d.L.certifications, bulletLine(d.certifications)),
    languages: () => section(d.L.languages, bulletLine(d.languages)),
    interests: () => section(d.L.interests, bulletLine(d.interests)),
  };
  return order.map((key) => content[key]()).join('');
}

const FULL_ORDER = ['summary', 'skills', 'experience', 'education', 'projects', 'certifications', 'languages', 'interests'];
const SKILLS_LATE = ['summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'languages', 'interests'];

function ruledSections(color) {
  return tex`\titleformat{\section}{\large\bfseries\color{${color}}}{}{0em}{}[\titlerule]
\titlespacing{\section}{0pt}{11pt}{5pt}`;
}

// ============================================================
// AdaptaCV templates
// ============================================================
function renderClassic(d, photo) {
  return articleDocument(d, {
    font: 'heros',
    margins: 'left=1.7cm,right=1.7cm,top=1.6cm,bottom=1.6cm',
    colors: { primary: '2E6B4F', textdark: '26302B' },
    photo,
    preamble: ruledSections('primary'),
    body: tex`\begin{center}
${photo ? tex`${includePhoto(photo, '2.8cm', '3.4cm')}\par\smallskip` : ''}
{\LARGE\bfseries ${d.name}}\par
${d.title ? tex`{\large\color{primary} ${d.title}}\par` : ''}
\smallskip
{\small ${contactLine(d)}}
\end{center}
${sections(d, FULL_ORDER)}`,
  });
}

function renderMinimal(d, photo) {
  return articleDocument(d, {
    font: 'latin',
    margins: 'left=2.2cm,right=2.2cm,top=1.8cm,bottom=1.8cm',
    colors: { primary: '39403B', textdark: '202522' },
    photo,
    preamble: tex`\titleformat{\section}{\normalsize\bfseries\MakeUppercase}{}{0em}{}
\titlespacing{\section}{0pt}{13pt}{4pt}`,
    body: tex`\begin{center}
${photo ? tex`${includePhoto(photo)}\par\smallskip` : ''}
{\huge\bfseries ${d.name}}\par
${d.title ? tex`{\large ${d.title}}\par` : ''}
\smallskip
{\small ${contactLine(d)}}
\end{center}
${sections(d, SKILLS_LATE)}`,
  });
}

function renderExecutive(d, photo) {
  const details = photo ? tex`\hfill\begin{minipage}{0.21\textwidth}\raggedleft ${includePhoto(photo)}\end{minipage}` : '';
  return articleDocument(d, {
    font: 'heros',
    margins: 'left=1.5cm,right=1.5cm,top=1.3cm,bottom=1.5cm',
    colors: { primary: '2C533F', textdark: '1F2722', header: '18221C' },
    photo,
    preamble: ruledSections('primary'),
    body: tex`\noindent\colorbox{header}{\parbox{\dimexpr\textwidth-2\fboxsep}{\color{white}\vspace{0.35cm}\hspace{0.2cm}\begin{minipage}{0.67\textwidth}{\Huge\bfseries ${d.name}}\par
\vspace{4pt}{\large ${d.title}}\end{minipage}${details}\vspace{0.3cm}}}
\vspace{0.25cm}
\begin{center}{\small ${contactLine(d)}}\end{center}
${sections(d, SKILLS_LATE)}`,
  });
}

function renderAcademic(d, photo) {
  return articleDocument(d, {
    font: 'termes',
    size: '11pt',
    margins: 'left=2.3cm,right=2.3cm,top=2cm,bottom=2cm',
    colors: { primary: '17201B', textdark: '17201B' },
    photo,
    preamble: tex`\titleformat{\section}{\large\scshape}{}{0em}{}[\titlerule]
\titlespacing{\section}{0pt}{12pt}{5pt}`,
    body: tex`\begin{center}
${photo ? tex`${includePhoto(photo)}\par\smallskip` : ''}
{\LARGE\scshape ${d.name}}\par
${d.title ? tex`{\itshape ${d.title}}\par` : ''}
\smallskip
{\small ${contactLine(d)}}
\end{center}
${sections(d, ['summary', 'education', 'experience', 'projects', 'certifications', 'skills', 'languages', 'interests'], { subtitleColor: 'textdark' })}`,
  });
}

/**
 * Left column painted with eso-pic, without TikZ overlays: it lands right on the first compilation pass.
 */
function renderSidebar(d, photo, { colors, textColor, headingColor }) {
  const heading = (title) => tex`{\large\bfseries\color{${headingColor}} ${title}}\par\smallskip`;
  const block = (items) => items.map((item) => tex`\noindent ${item}\par\smallskip`).join('\n');
  const group = (title, items) => (items.length ? tex`\medskip
${heading(title)}
{\footnotesize\raggedright
${block(items)}
}` : '');
  return articleDocument(d, {
    font: 'heros',
    margins: 'left=1.25cm,right=1.45cm,top=1.3cm,bottom=1.3cm',
    colors,
    photo,
    preamble: tex`\usepackage{paracol}
\usepackage{eso-pic}
\AddToShipoutPictureBG{\AtPageLowerLeft{\color{sidebar}\rule{0.36\paperwidth}{\paperheight}}}
${ruledSections('primary')}`,
    body: tex`\columnratio{0.31}
\setlength{\columnsep}{1.15cm}
\begin{paracol}{2}
\color{${textColor}}\raggedright
${photo ? tex`\begin{center}${includePhoto(photo)}\end{center}\medskip` : ''}
${heading(d.L.contact)}
{\footnotesize\raggedright
${block(d.contactItems)}
}
${group(d.L.skills, d.skills)}
${group(d.L.languages, d.languages)}
${group(d.L.certifications, d.certifications)}
${group(d.L.interests, d.interests)}
\switchcolumn
\color{textdark}
{\huge\bfseries ${d.name}}\par
${d.title ? tex`{\large\color{primary} ${d.title}}\par` : ''}
\vspace{0.25cm}
${sections(d, ['summary', 'experience', 'education', 'projects'])}
\end{paracol}`,
  });
}

function renderImpact(d, photo) {
  // Its signature: the first three letters of each section title in colour
  const accentTitle = (title) => {
    const letters = [...title];
    return tex`{\color{primary}${letters.slice(0, 3).join('')}}${letters.slice(3).join('')}`;
  };
  const accented = { ...d, L: Object.fromEntries(Object.entries(d.L).map(([key, value]) => [key, accentTitle(value)])) };
  accented.L.link = d.L.link;
  return articleDocument(d, {
    font: 'heros',
    margins: 'left=1.6cm,right=1.6cm,top=1.3cm,bottom=1.5cm',
    colors: { primary: 'B5322B', textdark: '2B2B2B', softtext: '6B6B6B' },
    photo,
    preamble: tex`\titleformat{\section}{\Large\bfseries}{}{0em}{}[\color{softtext}\titlerule]
\titlespacing{\section}{0pt}{10pt}{5pt}`,
    body: tex`\begin{center}
${photo ? tex`${includePhoto(photo, '2.4cm', '2.9cm')}\par\smallskip` : ''}
{\fontsize{27}{31}\selectfont {\color{softtext}${d.first}} \textbf{${d.last}}}\par
${d.title ? tex`\vspace{3pt}{\small\scshape\color{primary} ${d.title}}\par` : ''}
\vspace{3pt}
{\small\color{softtext} ${contactLine(d)}}
\end{center}
${sections(accented, FULL_ORDER)}`,
  });
}

function renderBold(d, photo) {
  const photoBox = photo ? tex`\hfill\begin{minipage}[t]{0.22\textwidth}\raggedleft ${includePhoto(photo)}\end{minipage}` : '';
  const skills = d.skills.length
    ? tex`\vspace{0.2cm}
\noindent\colorbox{soft}{\parbox{\dimexpr\textwidth-2\fboxsep}{\textbf{${d.L.skills}}\quad ${bulletLine(d.skills)}}}
\vspace{0.2cm}
`
    : '';
  return articleDocument(d, {
    font: 'adventor',
    margins: 'left=1.5cm,right=1.5cm,top=1.2cm,bottom=1.4cm',
    colors: { primary: 'B2533D', textdark: '2F2A28', soft: 'F7E9E3' },
    photo,
    preamble: ruledSections('primary'),
    body: tex`\noindent{\color{primary}\rule{\textwidth}{7pt}}\par\vspace{0.3cm}
\noindent\begin{minipage}[t]{0.72\textwidth}\raggedright
{\fontsize{26}{30}\selectfont\bfseries ${d.name}}\par
\vspace{3pt}{\large\color{primary} ${d.title}}\par
\vspace{5pt}{\small ${contactLine(d)}}
\end{minipage}${photoBox}\par
${skills}${sections(d, ['summary', 'experience', 'education', 'projects', 'certifications', 'languages', 'interests'])}`,
  });
}

// ============================================================
// moderncv — LPPL, part of TeX Live
// ============================================================
function renderModerncv(d, photo, { style, color, family = 'sans' }) {
  const entry = (item) => {
    const description = item.description && item.bullets.length ? tex`${item.description}\newline{}` : item.description;
    return tex`\cventry{${item.period}}{${item.title}}{${item.company}}{}{}{${description}${itemize(item.bullets)}}`;
  };
  const textSection = (title, items) => (items.length ? tex`\section{${title}}
\cvitem{}{${items.join(', ')}}
` : '');
  const entrySection = (title, list) => (list.length ? tex`\section{${title}}
${list.map(entry).join('\n')}
` : '');
  const projects = d.projects.map((project) => tex`\cventry{}{${project.name}}{}{}{}{${project.description}}`).join('\n');

  const identity = [
    tex`\name{${d.first}}{${d.last}}`,
    d.title && tex`\title{${d.title}}`,
    d.location && tex`\address{${d.location}}{}{}`,
    d.phone && tex`\phone[mobile]{${d.phone}}`,
    d.email && tex`\email{${d.email}}`,
    d.website && tex`\homepage{${d.website}}`,
    d.linkedin && tex`\social[linkedin]{${d.linkedin}}`,
    d.github && tex`\social[github]{${d.github}}`,
    photo && tex`\photo[64pt][0.4pt]{profile-photo}`,
  ].filter(Boolean).join('\n');

  return tex`\documentclass[11pt,a4paper,${family}]{moderncv}
\moderncvstyle{${style}}
\moderncvcolor{${color}}
\ifxetexorluatex
  \usepackage{fontspec}
  \defaultfontfeatures{Ligatures=TeX}
\else
  \usepackage[utf8]{inputenc}
  \usepackage[T1]{fontenc}
  \usepackage{lmodern}
\fi
\usepackage[scale=0.82]{geometry}
${photo?.preamble || ''}
${identity}
\begin{document}
\makecvtitle
${d.summary ? tex`\section{${d.L.profile}}
\cvitem{}{${d.summary}}
` : ''}${entrySection(d.L.experience, d.experience)}${entrySection(d.L.education, d.education)}${textSection(d.L.skills, d.skills)}${projects ? tex`\section{${d.L.projects}}
${projects}
` : ''}${textSection(d.L.certifications, d.certifications)}${textSection(d.L.languages, d.languages)}${textSection(d.L.interests, d.interests)}
\end{document}
`;
}

// ============================================================
// Jake's Resume — MIT, adapted (A4, T1, wrapping titles, no babel)
// ============================================================
function renderCompact(d) {
  const contacts = d.contactItems.join(tex` $|$ `);
  const bullets = (items) => (items.length ? tex`
      \resumeItemListStart
${items.map((item) => tex`        \resumeItem{${item}}`).join('\n')}
      \resumeItemListEnd` : '');
  const heading = (entry) => tex`    \resumeSubheading
      {${entry.title}}{${entry.period}}
      {${entry.company}}{}${entry.description ? tex`
      \resumeItemListStart
        \resumeItem{${entry.description}}
      \resumeItemListEnd` : ''}${bullets(entry.bullets)}`;
  const list = (title, items) => (items.length ? tex`\section{${title}}
  \resumeSubHeadingListStart
${items.join('\n')}
  \resumeSubHeadingListEnd
` : '');
  const plain = (title, items) => (items.length ? tex`\section{${title}}
${items.join(', ')}
` : '');
  const projects = d.projects.map((project) => tex`    \resumeProjectHeading{\textbf{${project.name}}}{}${project.description ? tex`
      \resumeItemListStart
        \resumeItem{${project.description}}
      \resumeItemListEnd` : ''}`);

  return tex`%-------------------------
% Resume in LaTeX
% Adapted from Jake's Resume, Copyright (c) 2020 Jake Gutierrez, MIT License
% https://github.com/jakegut/resume - licence text in THIRD_PARTY_NOTICES.md
%-------------------------
\documentclass[a4paper,11pt]{article}
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage{lmodern}
\usepackage{latexsym}
\usepackage[empty]{fullpage}
\usepackage{titlesec}
\usepackage[usenames,dvipsnames]{color}
\usepackage{enumitem}
\usepackage[hidelinks]{hyperref}
\usepackage{fancyhdr}
\usepackage{tabularx}
\ifdefined\pdfgentounicode
  \input{glyphtounicode}
  \pdfgentounicode=1
\fi
\pagestyle{fancy}
\fancyhf{}
\fancyfoot{}
\renewcommand{\headrulewidth}{0pt}
\renewcommand{\footrulewidth}{0pt}
\addtolength{\oddsidemargin}{-0.5in}
\addtolength{\evensidemargin}{-0.5in}
\addtolength{\textwidth}{1in}
\addtolength{\topmargin}{-.5in}
\addtolength{\textheight}{1.0in}
\urlstyle{same}
\raggedbottom
\raggedright
\setlength{\tabcolsep}{0in}
\titleformat{\section}{\vspace{-4pt}\scshape\raggedright\large}{}{0em}{}[\color{black}\titlerule \vspace{-5pt}]
\newcommand{\resumeItem}[1]{\item\small{{#1 \vspace{-2pt}}}}
\newcommand{\resumeSubheading}[4]{
  \vspace{-2pt}\item
    \begin{tabular*}{0.97\textwidth}[t]{p{0.74\textwidth}@{\extracolsep{\fill}}r}
      \textbf{#1} & #2 \\
      \textit{\small#3} & \textit{\small #4} \\
    \end{tabular*}\vspace{-7pt}
}
\newcommand{\resumeProjectHeading}[2]{
  \item
    \begin{tabular*}{0.97\textwidth}{p{0.74\textwidth}@{\extracolsep{\fill}}r}
      \small#1 & #2 \\
    \end{tabular*}\vspace{-7pt}
}
\newcommand{\resumeSubHeadingListStart}{\begin{itemize}[leftmargin=0.15in, label={}]}
\newcommand{\resumeSubHeadingListEnd}{\end{itemize}}
\newcommand{\resumeItemListStart}{\begin{itemize}}
\newcommand{\resumeItemListEnd}{\end{itemize}\vspace{-5pt}}
\begin{document}
\begin{center}
    \textbf{\Huge \scshape ${d.name}} \\ \vspace{1pt}
    ${d.title ? tex`\textit{${d.title}} \\ \vspace{1pt}` : ''}
    \small ${contacts}
\end{center}
${d.summary ? tex`\section{${d.L.profile}}
{\small ${d.summary}}
` : ''}${list(d.L.experience, d.experience.map(heading))}${list(d.L.education, d.education.map(heading))}${list(d.L.projects, projects)}${plain(d.L.skills, d.skills)}${plain(d.L.certifications, d.certifications)}${plain(d.L.languages, d.languages)}${plain(d.L.interests, d.interests)}
\end{document}
`;
}

// ============================================================
// AltaCV — LPPL, class shipped in public/altacv.cls
// ============================================================
function renderAlta(d, photo, tagline) {
  const event = (entry) => tex`\cvevent{${entry.title}}{${entry.company}}{${entry.period}}{}
${entry.description}
${itemize(entry.bullets)}`;
  const events = (list) => list.map(event).join('\n\\divider\n');
  const tags = (items) => items.map((item) => tex`\cvtag{${item}}`).join('\n');
  const rows = (items) => items.map((item) => tex`\noindent ${item}\par`).join('\n');
  const info = [
    d.email && tex`\email{${d.email}}`,
    d.phone && tex`\phone{${d.phone}}`,
    d.location && tex`\location{${d.location}}`,
    d.website && tex`\homepage{${d.website}}`,
    d.linkedin && tex`\linkedin{${d.linkedin}}`,
    d.github && tex`\github{${d.github}}`,
  ].filter(Boolean).join('\n  ');
  const side = (title, content) => (content ? tex`\cvsection{${title}}
${content}
\medskip
` : '');
  const main = (title, content) => (content ? tex`\cvsection{${title}}
${content}
\medskip
` : '');
  const projects = d.projects.map((project) => tex`\cvevent{${project.name}}{}{}{}
${project.description}`).join('\n\\divider\n');

  return tex`\documentclass[10pt,a4paper,withhyper]{altacv}
\geometry{left=1.25cm,right=1.25cm,top=1.5cm,bottom=1.5cm,columnsep=1.2cm}
\usepackage{paracol}
\iftutex
  \setsansfont{Lato}
  \renewcommand{\familydefault}{\sfdefault}
\else
  \usepackage[defaultsans]{lato}
  \renewcommand{\familydefault}{\sfdefault}
\fi
\definecolor{VividPurple}{HTML}{3E0097}
\definecolor{SlateGrey}{HTML}{2E2E2E}
\definecolor{LightGrey}{HTML}{666666}
\colorlet{name}{black}
\colorlet{tagline}{VividPurple}
\colorlet{heading}{VividPurple}
\colorlet{headingrule}{VividPurple}
\colorlet{subheading}{VividPurple}
\colorlet{accent}{VividPurple}
\colorlet{emphasis}{SlateGrey}
\colorlet{body}{LightGrey}
\renewcommand{\cvItemMarker}{{\small\textbullet}}
\renewcommand{\locationname}{${d.L.location}}
\renewcommand{\datename}{${d.L.date}}
${photo?.preamble || ''}
\begin{document}
\name{${d.name}}
\tagline{${tagline}}
${photo ? tex`\photoR{2.8cm}{profile-photo}` : ''}
\personalinfo{%
  ${info}
}
\makecvheader
\columnratio{0.62}
\begin{paracol}{2}
${main(d.L.profile, d.summary)}${main(d.L.experience, events(d.experience))}${main(d.L.education, events(d.education))}${main(d.L.projects, projects)}
\switchcolumn
${side(d.L.skills, tags(d.skills))}${side(d.L.languages, rows(d.languages))}${side(d.L.certifications, rows(d.certifications))}${side(d.L.interests, tags(d.interests))}
\end{paracol}
\end{document}
`;
}

// ============================================================
// Entry points
// ============================================================

/**
 * Returns the LaTeX source of a CV. A template's companion class is added by pdf-generator.js.
 */
export function generateCVTemplate(cvData, candidateName = '', profilePhotoDataURL = '', templateId = DEFAULT_TEMPLATE, language = 'fr') {
  const id = TEMPLATE_CATALOG[templateId] ? templateId : DEFAULT_TEMPLATE;
  const d = prepare(cvData, candidateName, language, id);
  const photo = TEMPLATE_CATALOG[id].photo && typeof profilePhotoDataURL === 'string' && profilePhotoDataURL
    ? photoSetup(profilePhotoDataURL)
    : null;

  switch (id) {
    case 'minimal': return renderMinimal(d, photo);
    case 'compact': return renderCompact(d);
    case 'banking': return renderModerncv(d, photo, { style: 'banking', color: 'black' });
    case 'heritage': return renderModerncv(d, photo, { style: 'classic', color: 'blue' });
    case 'editorial': return renderModerncv(d, photo, { style: 'oldstyle', color: 'grey', family: 'roman' });
    case 'contemporary': return renderModerncv(d, photo, { style: 'casual', color: 'burgundy' });
    case 'refined': return renderModerncv(d, photo, { style: 'fancy', color: 'purple' });
    case 'executive': return renderExecutive(d, photo);
    case 'academic': return renderAcademic(d, photo);
    case 'modern':
      return renderSidebar(d, photo, {
        colors: { primary: '234B39', textdark: '1F2722', sidebar: '1D3026' },
        textColor: 'white',
        headingColor: 'white',
      });
    case 'panel':
      return renderSidebar(d, photo, {
        colors: { primary: '2B5C8A', textdark: '22272C', sidebar: 'EEF2F6' },
        textColor: 'textdark',
        headingColor: 'primary',
      });
    case 'impact': return renderImpact(d, photo);
    case 'alta': return renderAlta(d, photo, d.title);
    case 'bold': return renderBold(d, photo);
    default: return renderClassic(d, photo);
  }
}

/**
 * Cover Letter Template
 */
export function generateCoverLetterTemplate(letterData, candidateName, jobTitle, companyName, language = 'fr') {
  const english = language === 'en';
  const name = letterData.candidateName || candidateName || '';
  const date = new Date().toLocaleDateString(english ? 'en-GB' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const subject = letterData.subject || (jobTitle ? `${english ? 'Application for the position of' : 'Candidature au poste de'} ${jobTitle}` : '');
  const defaultGreeting = english ? 'Dear Sir or Madam,' : 'Madame, Monsieur,';

  const greetingPattern = /^\s*(?:(?:bonjour\s+)?madame\s*[,/&-]?\s*monsieur|(?:bonjour\s+)?monsieur\s*[,/&-]?\s*madame|madame|monsieur)[\s,:-]*/i;
  const signoffPattern = /\s*(?:bien\s+)?cordialement[,.]?\s*(?:\n\s*[^\n]{2,80})?\s*$/i;
  const cleanPart = (value) => String(value || '').replace(greetingPattern, '').replace(signoffPattern, '').trim();
  const rawGreeting = String(letterData.greeting || '').trim();
  const greeting = /(?:madame|monsieur).*(?:madame|monsieur)/i.test(rawGreeting)
    ? 'Madame, Monsieur,'
    : rawGreeting.split('\n')[0] || defaultGreeting;
  const paragraphs = [letterData.opening, letterData.body, letterData.closing]
    .map(cleanPart)
    .filter(Boolean)
    .map(escapeLatex)
    .join('\n\n');

  return tex`\documentclass[11pt,a4paper]{letter}
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage[${english ? 'english' : 'french'}]{babel}
\usepackage{lmodern}
\usepackage[left=2.5cm,right=2.5cm,top=2.5cm,bottom=2.5cm]{geometry}
\address{${escapeLatex(name)}}
\signature{${escapeLatex(name)}}
\date{${escapeLatex(date)}}
\begin{document}
\begin{letter}{${escapeLatex(companyName)}}
${subject ? tex`\textbf{${english ? 'Subject:' : 'Objet :'}} ${escapeLatex(subject)}

` : ''}\opening{${escapeLatex(greeting)}}

${paragraphs}

\closing{${escapeLatex(letterData.signoff || (english ? 'Sincerely,' : 'Cordialement,'))}}
\end{letter}
\end{document}
`;
}
