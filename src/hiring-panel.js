/**
 * Hiring panel — seven reviewers try to reject the CV, then it is rebuilt.
 * Method taken from /hiring-panel by Alex Chen (@nocodealex · chen.media).
 *
 * Express mode asks one request to play all seven reviewers, to fit free-tier quotas.
 * Isolated mode sends one request per reviewer: closer to the method, heavier on quota.
 */
import { callAIForJSON, cachedJSON } from './ai-service.js';
import {
  REVIEWERS,
  buildPanelPrompt,
  buildPanelMessage,
  buildReviewerPrompt,
  buildRebuildPrompt,
  buildRebuildMessage,
  buildRescreenPrompt,
} from './prompts.js';
import { applyRewrite, cvToText, enforceFidelity, losesOfferTerms } from './fidelity.js';

const MIN_REVIEWS = 4;

function normalizeVerdict(value) {
  const verdict = String(value || '').toLowerCase();
  return ['yes', 'maybe', 'no'].includes(verdict) ? verdict : 'maybe';
}

function normalizeReview(reviewer, raw) {
  return {
    id: reviewer.id,
    label: reviewer.label,
    verdict: normalizeVerdict(raw?.verdict),
    worstLine: String(raw?.worstLine || ''),
    problems: (raw?.problems || []).filter(Boolean).map(String).slice(0, 3),
  };
}

async function reviewExpress(input, language) {
  const cvDocument = cvToText(input.adaptedCV);
  const result = await cachedJSON('panel', [input.cvText, cvDocument, input.jobDescription, language], () => callAIForJSON({
    system: buildPanelPrompt(language),
    user: buildPanelMessage({ ...input, cvDocument }),
    temperature: 0.3,
    maxTokens: 1800,
  }));
  const byId = new Map((result.reviews || []).map((review) => [review.id, review]));
  const reviews = REVIEWERS.filter((reviewer) => byId.has(reviewer.id))
    .map((reviewer) => normalizeReview(reviewer, byId.get(reviewer.id)));
  if (reviews.length < MIN_REVIEWS) throw new Error('Le panel n’a pas rendu assez d’avis.');
  return reviews;
}

async function reviewIsolated(input, language) {
  const cvDocument = cvToText(input.adaptedCV);
  const reviews = [];
  let lastError = null;
  for (const reviewer of REVIEWERS) {
    try {
      const result = await cachedJSON(`review-${reviewer.id}`, [input.cvText, cvDocument, input.jobDescription, language], () => callAIForJSON({
        system: buildReviewerPrompt(reviewer, language),
        user: buildPanelMessage({ ...input, cvDocument }),
        temperature: 0.3,
        maxTokens: 500,
      }));
      reviews.push(normalizeReview(reviewer, result));
    } catch (error) {
      console.warn(`Reviewer ${reviewer.id} failed`, error);
      lastError = error;
    }
  }
  if (reviews.length < MIN_REVIEWS) throw lastError || new Error('Le panel n’a pas rendu assez d’avis.');
  return reviews;
}

function normalizeMistakes(mistakes) {
  const labels = new Map(REVIEWERS.map((reviewer) => [reviewer.id, reviewer.label]));
  return (mistakes || [])
    .filter((mistake) => mistake?.line || mistake?.why)
    .map((mistake) => ({
      line: String(mistake.line || ''),
      why: String(mistake.why || ''),
      flaggedBy: (mistake.flaggedBy || []).map((id) => labels.get(id)).filter(Boolean),
    }));
}

/**
 * Runs the panel and returns the rebuilt CV with everything the interface shows.
 * The final screen is a bonus: its failure does not lose the corrections.
 */
export async function runHiringPanel({ cvText, adaptedCV, jobDescription, jobTitle, companyName, isolated, language, onProgress }) {
  const input = { cvText, adaptedCV, jobDescription, jobTitle, companyName };

  onProgress?.('review-start');
  const reviews = isolated ? await reviewIsolated(input, language) : await reviewExpress(input, language);
  onProgress?.('review-done');

  onProgress?.('rebuild-start');
  const cvDocument = cvToText(adaptedCV, { numbered: true });
  const rewrite = await cachedJSON('rebuild', [cvText, cvDocument, JSON.stringify(reviews), jobDescription, language], () => callAIForJSON({
    system: buildRebuildPrompt(language),
    user: buildRebuildMessage({ ...input, cvDocument, reviews }),
    temperature: 0.2,
    maxTokens: 3000,
  }));
  const rewritten = applyRewrite(adaptedCV, rewrite);
  // Models tend to fall back on the source wording: keep the adapted CV if the rebuild made it worse
  const rewriteKept = !losesOfferTerms(adaptedCV, rewritten, adaptedCV.offerAnalysis?.keywords);
  const cv = rewriteKept ? rewritten : adaptedCV;
  onProgress?.('rebuild-done');

  let screenAfter = null;
  try {
    // The second screen must judge the facts that will really stay in the CV
    const finalDocument = cvToText(enforceFidelity(cv, cvText, { language }).cv);
    const result = await cachedJSON('rescreen', [finalDocument, jobDescription, language], () => callAIForJSON({
      system: buildRescreenPrompt(language),
      user: buildPanelMessage({ ...input, cvDocument: finalDocument }),
      temperature: 0.2,
      maxTokens: 400,
    }));
    screenAfter = { verdict: normalizeVerdict(result.verdict), reasons: (result.reasons || []).filter(Boolean).map(String).slice(0, 3) };
  } catch (error) {
    console.warn('Second screen failed', error);
  }

  return {
    cv,
    panel: {
      isolated: Boolean(isolated),
      rewriteKept,
      reviews,
      mistakes: normalizeMistakes(rewrite.mistakes),
      questions: (rewrite.questions || []).filter(Boolean).map(String).slice(0, 6),
      screenBefore: reviews.find((review) => review.id === 'screen')?.verdict || null,
      screenAfter,
    },
  };
}
