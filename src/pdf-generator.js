/**
 * LaTeX Source Generator - Standard TeX Live compatible
 * This file orchestrates the generation by delegating to specific templates
 */
import { saveAs } from 'file-saver';
import { 
    escapeLatex, 
    generateStandardTemplate, 
    generateTwentySecondTemplate, 
    generateAltaTemplate, 
    generateMaltaTemplate, 
    generateMyCVTemplate,
    generateCoverLetterTemplate 
} from './cv-templates';

// Re-export escape utility for convenience in other files
export { escapeLatex };

/**
 * Generate adapted CV in LaTeX format
 * Orchestrates calls to specific template functions
 */
export function generateAdaptedCVPDF(cvData, candidateName = '', profilePhotoDataURL = null, template = 'classic') {
    if (template === 'twentysecond') {
        return generateTwentySecondTemplate(cvData, candidateName);
    }
    if (template === 'altacv') {
        return generateAltaTemplate(cvData, candidateName);
    }
    if (template === 'maltacv') {
        return generateMaltaTemplate(cvData, candidateName);
    }
    if (template === 'mycv') {
        return generateMyCVTemplate(cvData, candidateName);
    }
    
    // Returns Classic, Modern, Executive, or Bold
    return generateStandardTemplate(cvData, candidateName, template);
}

/**
 * Generate cover letter in LaTeX format
 */
export function generateCoverLetterPDF(letterData, candidateName = '', jobTitle = '', companyName = '', template = 'formal') {
    return generateCoverLetterTemplate(letterData, candidateName, jobTitle, companyName);
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
 * Returns the appropriate LaTeX engine for a given template
 */
export function getEngineForTemplate(template) {
    if (template === 'altacv' || template === 'maltacv') return 'lualatex';
    return 'pdflatex';
}
