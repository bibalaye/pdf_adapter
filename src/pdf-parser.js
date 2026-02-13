/**
 * PDF Parser — Extracts text from PDF files
 *
 * Strategy:
 *   1. Try standard text extraction with pdfjs-dist (spatial-aware layout)
 *   2. If that fails (image-based PDF), fall back to OCR via Tesseract.js
 *      → Renders each page at high resolution, applies image preprocessing,
 *        then runs OCR with optimized settings
 *   3. Post-process all extracted text to clean formatting
 */
import * as pdfjsLib from 'pdfjs-dist';
import { createWorker } from 'tesseract.js';

// Configure pdfjs worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url
).toString();

// Minimum characters for "valid" extraction (below = likely image-based)
const MIN_TEXT_THRESHOLD = 80;

/**
 * Extract text content from a PDF file.
 * Automatically falls back to OCR for image-based PDFs.
 *
 * @param {File} file
 * @param {(status: {phase: string, progress: number, page?: number, totalPages?: number}) => void} [onProgress]
 * @returns {Promise<{text: string, numPages: number, method: 'text'|'ocr'}>}
 */
export async function extractTextFromPDF(file, onProgress) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;

    // --- Phase 1: Standard text extraction ---
    if (onProgress) onProgress({ phase: 'text', progress: 0 });

    let standardText = await extractWithStandardMethod(pdf, numPages);

    if (onProgress) onProgress({ phase: 'text', progress: 100 });

    // If we got enough text, clean and use it
    if (standardText.trim().length >= MIN_TEXT_THRESHOLD) {
        return {
            text: postProcessText(standardText),
            numPages,
            method: 'text',
        };
    }

    // --- Phase 2: OCR fallback ---
    if (onProgress) {
        onProgress({
            phase: 'ocr-init',
            progress: 0,
            page: 0,
            totalPages: numPages,
        });
    }

    const ocrText = await extractWithOCR(pdf, numPages, onProgress);

    return {
        text: postProcessText(ocrText),
        numPages,
        method: 'ocr',
    };
}

// ============================================================
// Strategy 1: Spatial-aware text extraction (pdfjs-dist)
// ============================================================
async function extractWithStandardMethod(pdf, numPages) {
    let fullText = '';

    for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.0 });
        const pageWidth = viewport.width;

        const textContent = await page.getTextContent({
            normalizeWhitespace: true,
            disableCombineTextItems: false,
        });

        if (!textContent.items || textContent.items.length === 0) continue;

        // Filter out empty items
        const items = textContent.items.filter(
            (item) => item.str && item.str.trim()
        );

        if (items.length === 0) continue;

        // -------------------------------------------------------
        // Build a spatial map: group items into lines by Y-position
        // Use dynamic threshold based on average font size
        // -------------------------------------------------------
        const fontSizes = items.map((item) => Math.abs(item.transform[3] || item.height || 10));
        const avgFontSize = fontSizes.reduce((a, b) => a + b, 0) / fontSizes.length;
        // Items within 40% of average font size are on the same line
        const lineThreshold = Math.max(avgFontSize * 0.4, 2);

        // Sort top-to-bottom, then left-to-right
        const sortedItems = [...items].sort((a, b) => {
            const yA = a.transform[5];
            const yB = b.transform[5];
            const yDiff = yB - yA; // PDF Y is bottom-up, so reverse
            if (Math.abs(yDiff) > lineThreshold) return yDiff;
            return a.transform[4] - b.transform[4]; // left to right
        });

        // Group into lines
        const lines = [];
        let currentLine = { y: null, items: [], fontSize: 0 };

        for (const item of sortedItems) {
            const y = item.transform[5];
            const fontSize = Math.abs(item.transform[3] || item.height || 10);

            if (currentLine.y === null || Math.abs(currentLine.y - y) > lineThreshold) {
                if (currentLine.items.length > 0) {
                    lines.push(currentLine);
                }
                currentLine = { y, items: [], fontSize };
            }

            currentLine.items.push({
                x: item.transform[4],
                text: item.str,
                width: item.width || 0,
                fontSize,
            });

            // Update line fontSize to the max
            if (fontSize > currentLine.fontSize) {
                currentLine.fontSize = fontSize;
            }
        }
        if (currentLine.items.length > 0) {
            lines.push(currentLine);
        }

        // -------------------------------------------------------
        // Detect columns: if there are items consistently at
        // two different X regions, it's a 2-column layout
        // -------------------------------------------------------
        const midPage = pageWidth / 2;
        let leftCount = 0;
        let rightCount = 0;
        for (const line of lines) {
            const avgX = line.items.reduce((s, it) => s + it.x, 0) / line.items.length;
            if (avgX < midPage * 0.6) leftCount++;
            else if (avgX > midPage * 0.8) rightCount++;
        }
        const isTwoColumn = leftCount > 3 && rightCount > 3 &&
            Math.min(leftCount, rightCount) / Math.max(leftCount, rightCount) > 0.25;

        // -------------------------------------------------------
        // Build text from lines with smart spacing
        // -------------------------------------------------------
        let pageText = '';

        if (isTwoColumn) {
            // Separate lines into left and right columns, then merge
            const leftLines = [];
            const rightLines = [];

            for (const line of lines) {
                line.items.sort((a, b) => a.x - b.x);
                const avgX = line.items.reduce((s, it) => s + it.x, 0) / line.items.length;

                // If items span across both halves, it's a full-width line
                const minX = Math.min(...line.items.map(it => it.x));
                const maxX = Math.max(...line.items.map(it => it.x + it.width));
                const span = maxX - minX;

                if (span > pageWidth * 0.6) {
                    // Full-width line — add to both (will be deduplicated)
                    const lineText = buildLineText(line.items, avgFontSize);
                    leftLines.push({ y: line.y, text: lineText, fontSize: line.fontSize, fullWidth: true });
                } else if (avgX < midPage * 0.7) {
                    leftLines.push({ y: line.y, text: buildLineText(line.items, avgFontSize), fontSize: line.fontSize });
                } else {
                    rightLines.push({ y: line.y, text: buildLineText(line.items, avgFontSize), fontSize: line.fontSize });
                }
            }

            // Output: left column first, then right column
            // But full-width lines (headers, name) come first
            const fullWidthLines = leftLines.filter(l => l.fullWidth);
            const pureLeftLines = leftLines.filter(l => !l.fullWidth);

            for (const line of fullWidthLines) {
                if (line.text.trim()) pageText += line.text.trim() + '\n';
            }
            if (fullWidthLines.length > 0 && (pureLeftLines.length > 0 || rightLines.length > 0)) {
                pageText += '\n';
            }

            // Left column
            for (const line of pureLeftLines) {
                if (line.text.trim()) pageText += line.text.trim() + '\n';
            }
            if (pureLeftLines.length > 0 && rightLines.length > 0) {
                pageText += '\n';
            }

            // Right column
            for (const line of rightLines) {
                if (line.text.trim()) pageText += line.text.trim() + '\n';
            }
        } else {
            // Single column: straightforward
            for (const line of lines) {
                line.items.sort((a, b) => a.x - b.x);
                const lineText = buildLineText(line.items, avgFontSize);
                if (lineText.trim()) {
                    pageText += lineText.trim() + '\n';
                }
            }
        }

        fullText += pageText;

        if (i < numPages) fullText += '\n---\n';
    }

    return fullText;
}

/**
 * Build a single line of text from sorted items with intelligent spacing
 */
function buildLineText(items, avgFontSize) {
    let lineText = '';
    for (let j = 0; j < items.length; j++) {
        const item = items[j];
        if (j > 0) {
            const prevItem = items[j - 1];
            const gap = item.x - (prevItem.x + prevItem.width);
            const spaceWidth = avgFontSize * 0.3; // Approximate space character width

            if (gap > spaceWidth * 6) {
                // Large gap = likely column separator or tab
                lineText += '    ';
            } else if (gap > spaceWidth * 0.5) {
                // Normal word gap
                lineText += ' ';
            }
            // Very small/negative gap = characters in the same word, no space needed
        }
        lineText += item.text;
    }
    return lineText;
}

// ============================================================
// Strategy 2: OCR via Tesseract.js (for image-based PDFs)
// ============================================================

/**
 * Render a PDF page to a high-quality canvas with preprocessing
 */
async function renderPageToImage(page, scale = 3.0) {
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');

    // White background (essential for OCR accuracy)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
        canvasContext: ctx,
        viewport,
    }).promise;

    return canvas;
}

/**
 * Apply image preprocessing to improve OCR accuracy:
 * - Grayscale conversion
 * - Contrast enhancement
 * - Slight sharpening
 */
function preprocessCanvasForOCR(sourceCanvas) {
    const w = sourceCanvas.width;
    const h = sourceCanvas.height;
    const srcCtx = sourceCanvas.getContext('2d');
    const imageData = srcCtx.getImageData(0, 0, w, h);
    const data = imageData.data;

    // Step 1: Convert to grayscale and enhance contrast
    // Calculate histogram for adaptive thresholding
    const histogram = new Array(256).fill(0);
    for (let i = 0; i < data.length; i += 4) {
        const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
        histogram[gray]++;
    }

    // Find 5th and 95th percentile for contrast stretching
    const totalPixels = w * h;
    let cumulative = 0;
    let lowVal = 0;
    let highVal = 255;
    for (let i = 0; i < 256; i++) {
        cumulative += histogram[i];
        if (cumulative >= totalPixels * 0.02 && lowVal === 0) lowVal = i;
        if (cumulative >= totalPixels * 0.98) {
            highVal = i;
            break;
        }
    }

    const range = highVal - lowVal || 1;

    // Step 2: Apply contrast stretching + grayscale
    for (let i = 0; i < data.length; i += 4) {
        let gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);

        // Contrast stretch
        gray = Math.round(((gray - lowVal) / range) * 255);
        gray = Math.max(0, Math.min(255, gray));

        // Slight gamma correction for better text contrast
        gray = Math.round(255 * Math.pow(gray / 255, 0.85));

        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
        // Keep alpha unchanged
    }

    srcCtx.putImageData(imageData, 0, 0);
    return sourceCanvas;
}

/**
 * Run OCR on all pages of a PDF with optimized settings
 */
async function extractWithOCR(pdf, numPages, onProgress) {
    let fullText = '';
    let currentPage = 0;

    // Create and initialize a Tesseract worker for French + English
    const worker = await createWorker('fra+eng', 1, {
        logger: (info) => {
            if (info.status === 'recognizing text' && onProgress) {
                onProgress({
                    phase: 'ocr-recognize',
                    progress: Math.round(info.progress * 100),
                    page: currentPage,
                    totalPages: numPages,
                });
            }
        },
    });

    // Configure Tesseract parameters for better CV extraction
    await worker.setParameters({
        // PSM 3 = Fully automatic page segmentation (best for mixed layouts)
        tessedit_pageseg_mode: '3',
        // Preserve interword spaces
        preserve_interword_spaces: '1',
        // Higher quality output
        tessedit_char_whitelist: '',
    });

    try {
        for (let i = 1; i <= numPages; i++) {
            currentPage = i;

            if (onProgress) {
                onProgress({
                    phase: 'ocr-page',
                    progress: Math.round(((i - 1) / numPages) * 100),
                    page: i,
                    totalPages: numPages,
                });
            }

            // Render page at high resolution (3x for clear text)
            const page = await pdf.getPage(i);
            const canvas = await renderPageToImage(page, 3.0);

            // Preprocess: grayscale + contrast enhancement
            preprocessCanvasForOCR(canvas);

            // Run OCR on the preprocessed image
            const { data } = await worker.recognize(canvas);

            if (data.text && data.text.trim()) {
                // Use paragraph-aware reconstruction from blocks/lines
                const pageText = reconstructTextFromOCRData(data);
                fullText += pageText;
            }

            if (i < numPages) {
                fullText += '\n---\n';
            }

            // Cleanup canvas to free memory
            canvas.width = 0;
            canvas.height = 0;
        }
    } finally {
        await worker.terminate();
    }

    if (onProgress) {
        onProgress({
            phase: 'ocr-done',
            progress: 100,
            page: numPages,
            totalPages: numPages,
        });
    }

    return fullText;
}

/**
 * Reconstruct readable text from Tesseract OCR data using
 * block/paragraph/line structure for better formatting
 */
function reconstructTextFromOCRData(data) {
    // If we have structured blocks, use them for better layout
    if (data.blocks && data.blocks.length > 0) {
        let result = '';

        for (const block of data.blocks) {
            if (!block.paragraphs) continue;

            for (const paragraph of block.paragraphs) {
                if (!paragraph.lines) continue;

                let paraText = '';
                for (const line of paragraph.lines) {
                    if (!line.words) continue;

                    let lineText = '';
                    for (const word of line.words) {
                        // Only keep words with reasonable confidence (> 30%)
                        if (word.confidence > 30 && word.text && word.text.trim()) {
                            if (lineText) lineText += ' ';
                            lineText += word.text.trim();
                        }
                    }

                    if (lineText.trim()) {
                        paraText += lineText.trim() + '\n';
                    }
                }

                if (paraText.trim()) {
                    result += paraText.trim() + '\n\n';
                }
            }
        }

        return result || data.text || '';
    }

    // Fallback: use raw text but clean it
    return data.text || '';
}

// ============================================================
// Post-processing: Clean and normalize extracted text
// ============================================================

/**
 * Post-process extracted text to fix common issues
 */
function postProcessText(text) {
    if (!text) return '';

    let cleaned = text;

    // 1. Fix common OCR/extraction artifacts
    // Remove isolated single characters that are likely noise (except 'I', 'a', etc.)
    cleaned = cleaned.replace(/^[^a-zA-ZÀ-ÿ0-9]{1,2}$/gm, '');

    // 2. Fix broken lines: lines ending with a hyphen should be joined
    cleaned = cleaned.replace(/(\w)-\n(\w)/g, '$1$2');

    // 3. Collapse multiple blank lines to maximum 2
    cleaned = cleaned.replace(/\n{4,}/g, '\n\n\n');

    // 4. Remove excessive spaces within lines
    cleaned = cleaned.replace(/[ \t]{3,}/g, '    '); // Keep tab-like spaces for columns
    cleaned = cleaned.replace(/ {2}(?! )/g, ' '); // Collapse double spaces (not triple+)

    // 5. Fix common OCR misreads
    cleaned = cleaned.replace(/[|]/g, 'l'); // pipe → l
    cleaned = cleaned.replace(/\{/g, '(');   // curly braces → parens
    cleaned = cleaned.replace(/\}/g, ')');

    // 6. Remove lines that are just dots, dashes, or underscores (decorative)
    cleaned = cleaned.replace(/^[.\-_=•·]{3,}$/gm, '');

    // 7. Trim each line
    cleaned = cleaned
        .split('\n')
        .map((line) => line.trim())
        .join('\n');

    // 8. Collapse leading/trailing blank lines
    cleaned = cleaned.replace(/^\n+/, '').replace(/\n+$/, '');

    // 9. Ensure section headers are properly separated
    // Common CV section headers:
    const sectionHeaders = /^(expérience|experience|formation|education|compétences|skills|langues|languages|certifications|projets|projects|profil|profile|résumé|summary|contact|références|references|objectif|objective|centres d'intérêt|hobbies|informations?\s*personnelles?|personal\s*info)/im;
    cleaned = cleaned.replace(
        new RegExp(`(\\S)\\n(${sectionHeaders.source})`, 'gim'),
        '$1\n\n$2'
    );

    return cleaned;
}

// ============================================================
// Preview / Utility Functions
// ============================================================

/**
 * Get the raw bytes of a PDF file
 * @param {File} file
 * @returns {Promise<ArrayBuffer>}
 */
export async function getPDFBytes(file) {
    return await file.arrayBuffer();
}

/**
 * Render each page of a PDF as canvas elements for visual preview
 * @param {File} file
 * @param {number} scale - Render scale (1.0 = 72dpi, 1.5 = decent quality)
 * @returns {Promise<HTMLCanvasElement[]>}
 */
export async function renderPDFPagesToImages(file, scale = 1.2) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const canvases = [];

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const canvas = await renderPageToImage(page, scale);
        canvases.push(canvas);
    }

    return canvases;
}
