/**
 * Fidelity guard — checks generated documents against the source CV, without any AI.
 * A model under pressure from a hiring panel tends to invent numbers and skills:
 * whatever cannot be traced back to the source is removed and reported.
 */

const SENIORITY_WORDS = ['senior', 'expert', 'experte', 'lead', 'principal', 'principale', 'manager', 'specialiste', 'confirme', 'confirmee', 'directeur', 'directrice'];
const STOPWORDS = new Set(['de', 'du', 'des', 'la', 'le', 'les', 'et', 'en', 'd', 'l', 'a', 'au', 'aux', 'of', 'and', 'the', 'in', 'for', 'with', 'to']);
const MAX_SUMMARY_WORDS = 90;
const PLACEHOLDER = /\[\s*(add|ajout|à compl|a compl|todo)|à compléter|a completer|\bxx+\b/i;

export function normalizeText(value) {
  return String(value || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function words(value) {
  return (normalizeText(value).match(/[a-z0-9+#]+(?:\.[a-z0-9]+)*/g) || []);
}

function numberTokens(value) {
  // Digits inside a word (B2B, 3D, M365) are not figures; 10k or 3x are
  const pattern = /(?<![\p{L}\d])(\d{1,3}(?:[\s  .,]\d{3})+|\d+(?:[.,]\d+)?)(?:[kKmMxX](?![\p{L}\d])|(?![\p{L}\d]))/gu;
  const matches = [...String(value || '').matchAll(pattern)].map((match) => match[1]);
  return matches.map((token) => {
    const grouped = /^\d{1,3}(?:[\s  .,]\d{3})+$/.test(token);
    const clean = grouped ? token.replace(/[\s  .,]/g, '') : token.replace(',', '.');
    return clean.replace(/^0+(?=\d)/, '');
  });
}

function detectLanguage(text) {
  const french = (String(text).match(/\b(le|la|les|des|du|et|avec|pour|sur|dans|une)\b/gi) || []).length;
  const english = (String(text).match(/\b(the|and|with|for|of|on|to|at|an)\b/gi) || []).length;
  return french >= english ? 'fr' : 'en';
}

function buildIndex(sourceText) {
  return {
    text: normalizeText(sourceText),
    digits: String(sourceText || '').replace(/\D/g, ''),
    words: new Set(words(sourceText)),
    numbers: new Set(numberTokens(sourceText)),
  };
}

function unattestedNumbers(value, index) {
  return numberTokens(value).filter((token) => !index.numbers.has(token));
}

function wordAttested(word, index) {
  return index.words.has(word) || index.words.has(`${word}s`) || (word.endsWith('s') && index.words.has(word.slice(0, -1)));
}

function phraseAttested(phrase, index) {
  const normalized = normalizeText(phrase).trim();
  if (!normalized) return true;
  if (index.text.includes(normalized)) return true;
  const significant = words(phrase).filter((word) => !STOPWORDS.has(word));
  return significant.length > 0 && significant.every((word) => wordAttested(word, index));
}

function unattestedSeniority(value, index) {
  return words(value).filter((word) => SENIORITY_WORDS.includes(word) && !wordAttested(word, index));
}

function contactAttested(field, value, index) {
  if (field === 'phone') {
    const digits = String(value).replace(/\D/g, '');
    return digits.length >= 8 && index.digits.includes(digits.slice(-8));
  }
  const normalized = normalizeText(value).replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/+$/, '');
  if (index.text.includes(normalized)) return true;
  const lastSegment = normalized.split('/').pop();
  return field !== 'email' && lastSegment.length >= 3 && index.text.includes(lastSegment);
}

function splitSentences(text) {
  return String(text || '').match(/[^.!?]+(?:[.!?]+(?=\s|$)|$)/g)?.map((sentence) => sentence.trim()).filter(Boolean) || [];
}

/**
 * Removes from a generated CV whatever the source does not support.
 * Returns the clean CV, what was removed, and what a person should double-check.
 */
export function enforceFidelity(cv, sourceText, { language = 'fr' } = {}) {
  const result = structuredClone(cv || {});
  const index = buildIndex(sourceText);
  const translated = detectLanguage(sourceText) !== language;
  const removed = [];
  const warnings = [];
  const remove = (text, reason) => removed.push({ text: String(text), reason });

  const info = result.personalInfo || (result.personalInfo = {});
  for (const field of ['email', 'phone', 'linkedin', 'website', 'github']) {
    if (info[field] && !contactAttested(field, info[field], index)) {
      remove(info[field], 'Coordonnée absente de votre CV');
      info[field] = '';
    }
  }

  const seniorityInTitle = unattestedSeniority(info.title, index);
  if (seniorityInTitle.length) {
    const cleaned = String(info.title)
      .split(/\s+/)
      .filter((word) => !seniorityInTitle.includes(normalizeText(word).replace(/[^a-z]/g, '')))
      .join(' ')
      .trim();
    remove(info.title, 'Niveau de séniorité absent de votre CV');
    info.title = cleaned;
  }

  const keptSentences = splitSentences(result.summary).filter((sentence) => {
    const numbers = unattestedNumbers(sentence, index);
    if (numbers.length) {
      remove(sentence, `Chiffre absent de votre CV : ${numbers.join(', ')}`);
      return false;
    }
    if (unattestedSeniority(sentence, index).length) {
      remove(sentence, 'Niveau de séniorité absent de votre CV');
      return false;
    }
    return true;
  });
  result.summary = keptSentences.join(' ');

  result.keySkills = (result.keySkills || []).filter((skill) => {
    if (!skill) return false;
    if (translated || phraseAttested(skill, index)) return true;
    remove(skill, 'Compétence absente de votre CV');
    return false;
  });

  const cleanLines = (lines) => (lines || []).filter((line) => {
    if (!line) return false;
    if (PLACEHOLDER.test(line)) {
      remove(line, 'Texte à compléter');
      return false;
    }
    const numbers = unattestedNumbers(line, index);
    if (numbers.length) {
      remove(line, `Chiffre absent de votre CV : ${numbers.join(', ')}`);
      return false;
    }
    return true;
  });

  const cleanText = (value) => {
    if (!value) return '';
    return cleanLines([value])[0] || '';
  };

  for (const experience of result.experience || []) {
    experience.bullets = cleanLines(experience.bullets);
    experience.description = cleanText(experience.description);
    if (experience.company && !phraseAttested(experience.company, index)) {
      warnings.push(`Employeur à vérifier : ${experience.company}`);
    }
    if (unattestedNumbers(experience.period, index).length) {
      warnings.push(`Dates à vérifier : ${experience.company || experience.title} (${experience.period})`);
    }
  }

  for (const education of result.education || []) {
    education.description = cleanText(education.description);
    if (education.school && !phraseAttested(education.school, index)) {
      warnings.push(`Établissement à vérifier : ${education.school}`);
    }
    if (unattestedNumbers(education.period, index).length) {
      warnings.push(`Dates à vérifier : ${education.school || education.degree} (${education.period})`);
    }
  }

  for (const project of result.projects || []) {
    project.description = cleanText(project.description);
  }

  if (!translated) {
    result.certifications = (result.certifications || []).filter((certification) => {
      if (!certification) return false;
      if (phraseAttested(certification, index)) return true;
      remove(certification, 'Certification absente de votre CV');
      return false;
    });
  }

  return { cv: result, removed, warnings };
}

/**
 * Lists the numbers of a generated text found neither in the CV nor in the offer.
 */
export function findUnattestedNumbers(text, ...sources) {
  const index = buildIndex(sources.join('\n'));
  return [...new Set(unattestedNumbers(text, index))];
}

/**
 * Applies the fields a rebuild may change. Employers, dates, diplomas and
 * contact details stay those of the base CV by construction.
 */
export function applyRewrite(base, rewrite) {
  const cv = structuredClone(base);
  if (!rewrite) return cv;
  if (rewrite.title) (cv.personalInfo || (cv.personalInfo = {})).title = rewrite.title;
  // A summary this long is a recap of the CV, which the panel flags, not an improvement
  if (rewrite.summary && rewrite.summary.split(/\s+/).length <= MAX_SUMMARY_WORDS) cv.summary = rewrite.summary;
  if (Array.isArray(rewrite.keySkills) && rewrite.keySkills.length) cv.keySkills = rewrite.keySkills;
  for (const item of rewrite.experience || []) {
    const target = cv.experience?.[Number(item.index)];
    if (!target) continue;
    if (Array.isArray(item.bullets) && item.bullets.length) target.bullets = item.bullets;
  }
  return cv;
}

/**
 * A rebuild must not lose what the adapted CV had already matched with the offer.
 */
export function losesOfferTerms(base, rewritten, keywords) {
  const before = keywordCoverage(cvToText(base), keywords).found.length;
  const after = keywordCoverage(cvToText(rewritten), keywords).found.length;
  return after < before;
}

/**
 * Measures which offer keywords appear in a text.
 */
export function keywordCoverage(text, keywords) {
  const index = buildIndex(text);
  const unique = [...new Map((keywords || []).filter(Boolean).map((keyword) => [normalizeText(keyword), keyword])).values()];
  const found = unique.filter((keyword) => phraseAttested(keyword, index));
  return { found, missing: unique.filter((keyword) => !found.includes(keyword)), total: unique.length };
}

/**
 * Plain text version of a CV: what a reader sees, at a fraction of the tokens of its JSON.
 */
export function cvToText(cv, { numbered = false } = {}) {
  const info = cv?.personalInfo || {};
  const lines = [
    info.fullName,
    info.title,
    [info.email, info.phone, info.location, info.linkedin, info.website, info.github].filter(Boolean).join(' | '),
    '',
    'PROFIL',
    cv?.summary,
    '',
    'EXPÉRIENCE',
  ];
  (cv?.experience || []).forEach((experience, position) => {
    const prefix = numbered ? `[${position}] ` : '';
    lines.push(`${prefix}${experience.title || ''}, ${experience.company || ''} (${experience.period || ''})`);
    if (experience.description) lines.push(experience.description);
    (experience.bullets || []).forEach((bullet) => lines.push(`- ${bullet}`));
  });
  if (cv?.education?.length) {
    lines.push('', 'FORMATION');
    cv.education.forEach((education) => {
      lines.push(`${education.degree || ''}, ${education.school || ''} (${education.period || ''})`);
      if (education.description) lines.push(education.description);
    });
  }
  if (cv?.keySkills?.length) lines.push('', 'COMPÉTENCES', cv.keySkills.join(', '));
  if (cv?.projects?.length) {
    lines.push('', 'PROJETS');
    cv.projects.forEach((project) => lines.push(`${project.name || ''} : ${project.description || ''}`));
  }
  if (cv?.certifications?.length) lines.push('', 'CERTIFICATIONS', cv.certifications.join(', '));
  if (cv?.languages?.length) lines.push('', 'LANGUES', cv.languages.join(', '));
  return lines.filter((line) => line !== undefined && line !== null).join('\n').trim();
}
