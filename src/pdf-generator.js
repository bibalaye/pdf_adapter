/**
 * LaTeX Source Generator - Standard TeX Live compatible
 * This file orchestrates the generation by delegating to the template catalog
 */
import { saveAs } from 'file-saver';
import {
    escapeLatex,
    needsUnicodeEngine,
    generateCVTemplate,
    generateCoverLetterTemplate,
    TEMPLATE_CATALOG,
    DEFAULT_TEMPLATE,
} from './cv-templates.js';

// Re-export escape utility for convenience in other files
export { escapeLatex };

/**
 * Generate adapted CV in LaTeX format
 */
export function generateAdaptedCVPDF(cvData, candidateName = '', profilePhotoDataURL = '', template = DEFAULT_TEMPLATE, language = 'fr') {
    return generateCVTemplate(cvData, candidateName, profilePhotoDataURL, template, language);
}

/**
 * Puts a template's class file inside the document, so one .tex file is enough
 * to compile it, on TeXLive.net as in any LaTeX editor.
 */
export function embedCompanionClass(texSource, fileName, classSource) {
    return `\\begin{filecontents*}[overwrite]{${fileName}}\n${classSource.trim()}\n\\end{filecontents*}\n${texSource}`;
}

/**
 * Complete LaTeX document of a CV, ready to compile
 */
export async function buildCVDocument(cvData, candidateName = '', profilePhotoDataURL = '', template = DEFAULT_TEMPLATE, language = 'fr') {
    const texSource = generateAdaptedCVPDF(cvData, candidateName, profilePhotoDataURL, template, language);
    const companion = TEMPLATE_CATALOG[template]?.companion;
    if (!companion) return texSource;

    const response = await fetch(`/${companion}`);
    if (!response.ok) throw new Error(`${companion} introuvable (HTTP ${response.status})`);
    return embedCompanionClass(texSource, companion, await response.text());
}

/**
 * Generate cover letter in LaTeX format
 */
export function generateCoverLetterPDF(letterData, candidateName = '', jobTitle = '', companyName = '', language = 'fr') {
    return generateCoverLetterTemplate(letterData, candidateName, jobTitle, companyName, language);
}

/**
 * Download a LaTeX document (.tex)
 */
export function downloadPDF(texContent, filename) {
    const texFilename = filename.replace(/\.pdf$/, '.tex');
    const blob = new Blob([texContent], { type: "text/plain;charset=utf-8" });
    saveAs(blob, texFilename);
}

/**
 * Returns the appropriate LaTeX engine for a document.
 * A photo is decoded by Lua, and letters outside the T1 fonts would stop pdfLaTeX with an error.
 */
export function getEngineForTemplate(template, { hasPhoto = false, text = '' } = {}) {
    const usesPhoto = hasPhoto && TEMPLATE_CATALOG[template]?.photo;
    return usesPhoto || needsUnicodeEngine(text) ? 'lualatex' : 'pdflatex';
}
