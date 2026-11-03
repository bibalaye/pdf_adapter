/**
 * AI Service — Free-tier providers and user-defined OpenAI-compatible models.
 * Catalog checked against each provider's documentation on 2026-11-02.
 */
import {
  PROMPT_VERSION,
  buildAdaptCVPrompt,
  buildAdaptCVMessage,
  buildCoverLetterPrompt,
  buildCoverLetterMessage,
} from './prompts.js';

export const PROVIDERS = {
  groq: {
    name: 'Groq',
    tagline: 'Rapide, gratuit sans carte',
    format: 'openai',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    modelsUrl: 'https://api.groq.com/openai/v1/models',
    keyUrl: 'https://console.groq.com/keys',
    keyLabel: 'Créer une clé Groq',
    dataNote: 'Groq indique ne pas conserver par défaut les données des requêtes, sauf besoin de fiabilité ou enquête sur un abus (30 jours au plus). Les données sont hébergées aux États-Unis.',
    // Groq asks reasoning models to receive all instructions in the user message
    mergeSystemPrompt: true,
    maxTokensParam: 'max_completion_tokens',
    extraBody: { include_reasoning: false },
    models: [
      { id: 'openai/gpt-oss-120b', label: 'GPT-OSS 120B', hint: 'recommandé', extraBody: { reasoning_effort: 'low' } },
      { id: 'qwen/qwen3.8-27b', label: 'Qwen 3.8 27B', hint: 'en aperçu' },
      { id: 'openai/gpt-oss-20b', label: 'GPT-OSS 20B', hint: 'plus rapide', extraBody: { reasoning_effort: 'low' } },
    ],
  },
  gemini: {
    name: 'Google Gemini',
    tagline: 'Modèles Flash récents',
    format: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
    modelsUrl: 'https://generativelanguage.googleapis.com/v1beta/models?pageSize=200',
    keyUrl: 'https://aistudio.google.com/apikey',
    keyLabel: 'Créer une clé Gemini',
    dataNote: 'Offre gratuite : Google peut utiliser le contenu pour améliorer ses produits et le faire lire par des relecteurs humains, et demande de ne pas y envoyer de données personnelles. Dans l’EEE, en Suisse et au Royaume-Uni, ses conditions payantes s’appliquent aussi à cette offre.',
    tokenFactor: 3,
    models: [
      { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash', hint: 'recommandé' },
      { id: 'gemini-3.6-flash', label: 'Gemini 3.6 Flash' },
      { id: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash-Lite', hint: 'plus rapide' },
    ],
  },
  mistral: {
    name: 'Mistral AI',
    tagline: 'Fournisseur européen',
    format: 'openai',
    url: 'https://api.mistral.ai/v1/chat/completions',
    modelsUrl: 'https://api.mistral.ai/v1/models',
    keyUrl: 'https://console.mistral.ai/api-keys',
    keyLabel: 'Créer une clé Mistral',
    dataNote: 'En mode gratuit, Mistral peut utiliser vos données pour entraîner ses modèles. Désactivez « Anonymous improvement data » dans le menu Privacy de son panneau d’administration.',
    models: [
      { id: 'mistral-small-2603', label: 'Mistral Small 4', hint: 'recommandé' },
      { id: 'mistral-small-latest', label: 'Mistral Small', hint: 'dernière version' },
    ],
  },
  openrouter: {
    name: 'OpenRouter',
    tagline: 'Un accès à de nombreux modèles gratuits',
    format: 'openai',
    url: 'https://openrouter.ai/api/v1/chat/completions',
    modelsUrl: 'https://openrouter.ai/api/v1/models',
    modelsArePublic: true,
    keyUrl: 'https://openrouter.ai/settings/keys',
    keyLabel: 'Créer une clé OpenRouter',
    dataNote: 'Sans crédit : 50 requêtes par jour, soit une dizaine de candidatures. OpenRouter dit ne pas journaliser les requêtes par défaut, mais chaque hébergeur de modèle applique sa propre politique.',
    tokenFactor: 2,
    extraHeaders: { 'HTTP-Referer': 'https://adaptacv.app', 'X-Title': 'AdaptaCV' },
    models: [
      { id: 'nvidia/nemotron-3.5-super-vl:free', label: 'Nemotron 3.5 Super VL', hint: 'recommandé' },
      { id: 'google/gemma-4-31b-it:free', label: 'Gemma 4 31B' },
      { id: 'dots-studio/dots-3-note-preview:free', label: 'Dots3-Note', hint: 'en aperçu' },
      { id: 'nvidia/nemotron-3-ultra-550b-a55b:free', label: 'Nemotron 3 Ultra' },
    ],
  },
};

const DEFAULT_PROVIDER = 'groq';
const CUSTOM_PREFIX = 'custom:';
const CUSTOM_MODELS_KEY = 'cv_adapter_custom_models';
const LEGACY_API_KEY = 'cv_adapter_api_key';
const LIVE_MODELS_PREFIX = 'cv_adapter_live_models_';
const OPENROUTER_COLLECTION_KEY = 'cv_adapter_openrouter_allow_collection';

const MAX_ATTEMPTS = 3;
const MAX_WAIT_SECONDS = 65;

// ============================================================
// Status events (rate-limit waits, model fallbacks)
// ============================================================
let statusListener = null;
let lastModelUsed = null;

export function onAIStatus(listener) {
  statusListener = listener;
}

export function getLastModelUsed() {
  return lastModelUsed;
}

function emitStatus(status) {
  statusListener?.(status);
}

// ============================================================
// Settings
// ============================================================

/**
 * Each provider keeps its own key, so switching never sends one to the wrong service.
 * Moves a key saved by an earlier version to the provider it was entered for.
 */
function migrateLegacyApiKey() {
  const legacyKey = localStorage.getItem(LEGACY_API_KEY);
  if (legacyKey === null) return;
  const provider = localStorage.getItem('cv_adapter_provider') || DEFAULT_PROVIDER;
  if (legacyKey) localStorage.setItem(`${LEGACY_API_KEY}_${provider}`, legacyKey);
  localStorage.removeItem(LEGACY_API_KEY);
}

function isCustomProvider(providerId) {
  return String(providerId).startsWith(CUSTOM_PREFIX);
}

function findCustomModel(providerId) {
  const id = String(providerId).slice(CUSTOM_PREFIX.length);
  return getCustomModels().find((model) => model.id === id) || null;
}

export function getCustomModels() {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_MODELS_KEY) || '[]');
  } catch {
    return [];
  }
}

function writeCustomModels(models) {
  localStorage.setItem(CUSTOM_MODELS_KEY, JSON.stringify(models));
}

/**
 * Accepts a base URL or a full endpoint. HTTPS everywhere, plain HTTP on local addresses only,
 * because the CV and the key travel in this request.
 */
export function normalizeEndpoint(raw) {
  let parsed;
  try {
    const value = String(raw || '').trim();
    parsed = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    return { error: 'Cette adresse n’est pas valide.' };
  }
  const isLocal = /^(localhost|127\.0\.0\.1|\[::1\]|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)$/.test(parsed.hostname);
  if (parsed.protocol !== 'https:' && !isLocal) {
    return { error: 'Utilisez une adresse en https : votre CV et votre clé transitent par cette requête.' };
  }
  let path = parsed.pathname.replace(/\/+$/, '');
  if (!path.endsWith('/chat/completions')) path = `${path}/chat/completions`;
  return { url: `${parsed.origin}${path}` };
}

export function saveCustomModel({ id, name, baseUrl, model, apiKey }) {
  const models = getCustomModels();
  const record = { id: id || String(Date.now()), name, baseUrl, model, apiKey: apiKey || '' };
  const position = models.findIndex((item) => item.id === record.id);
  if (position >= 0) models[position] = record;
  else models.push(record);
  writeCustomModels(models);
  return { ...record, providerId: `${CUSTOM_PREFIX}${record.id}` };
}

export function getCustomModel(providerId) {
  return findCustomModel(providerId);
}

export function deleteCustomModel(providerId) {
  const id = String(providerId).slice(CUSTOM_PREFIX.length);
  writeCustomModels(getCustomModels().filter((model) => model.id !== id));
  if (localStorage.getItem('cv_adapter_provider') === providerId) {
    localStorage.setItem('cv_adapter_provider', DEFAULT_PROVIDER);
  }
}

export function getApiKey(providerId) {
  migrateLegacyApiKey();
  if (isCustomProvider(providerId)) return findCustomModel(providerId)?.apiKey || '';
  return localStorage.getItem(`${LEGACY_API_KEY}_${providerId}`) || '';
}

export function getSelectedModel(providerId) {
  if (isCustomProvider(providerId)) return findCustomModel(providerId)?.model || '';
  return localStorage.getItem(`cv_adapter_model_${providerId}`) || PROVIDERS[providerId]?.models[0]?.id || '';
}

export function getProviderChoices() {
  const builtIn = Object.entries(PROVIDERS).map(([id, provider]) => ({
    id,
    name: provider.name,
    tagline: provider.tagline,
    hasKey: Boolean(getApiKey(id)),
    custom: false,
  }));
  const custom = getCustomModels().map((model) => ({
    id: `${CUSTOM_PREFIX}${model.id}`,
    name: model.name,
    tagline: model.model,
    hasKey: Boolean(model.apiKey),
    custom: true,
  }));
  return [...builtIn, ...custom];
}

/**
 * Get saved settings from localStorage
 */
export function getSettings() {
  migrateLegacyApiKey();
  let provider = localStorage.getItem('cv_adapter_provider') || DEFAULT_PROVIDER;
  if (isCustomProvider(provider) ? !findCustomModel(provider) : !PROVIDERS[provider]) provider = DEFAULT_PROVIDER;
  return {
    provider,
    model: getSelectedModel(provider),
    apiKey: getApiKey(provider),
    language: localStorage.getItem('cv_adapter_language') || 'fr',
  };
}

/**
 * Save settings to localStorage
 */
export function saveSettings(provider, apiKey, language, model) {
  migrateLegacyApiKey();
  localStorage.setItem('cv_adapter_provider', provider);
  localStorage.setItem('cv_adapter_language', language);
  if (isCustomProvider(provider)) {
    const record = findCustomModel(provider);
    if (record) saveCustomModel({ ...record, apiKey });
    return;
  }
  if (apiKey) localStorage.setItem(`${LEGACY_API_KEY}_${provider}`, apiKey);
  else localStorage.removeItem(`${LEGACY_API_KEY}_${provider}`);
  if (model) localStorage.setItem(`cv_adapter_model_${provider}`, model);
}

/**
 * A custom model may run without a key (Ollama, LM Studio).
 */
export function isAIReady(settings = getSettings()) {
  return isCustomProvider(settings.provider) || Boolean(settings.apiKey);
}

export function isCustomProviderId(providerId) {
  return isCustomProvider(providerId);
}

export function getOpenRouterAllowsCollection() {
  return localStorage.getItem(OPENROUTER_COLLECTION_KEY) === 'true';
}

export function setOpenRouterAllowsCollection(allowed) {
  localStorage.setItem(OPENROUTER_COLLECTION_KEY, String(Boolean(allowed)));
}

function modelLabel(providerId, modelId) {
  const entry = PROVIDERS[providerId]?.models.find((model) => model.id === modelId);
  return entry?.label || modelId;
}

/**
 * Get the short name of the current provider
 */
export function getProviderName() {
  const { provider } = getSettings();
  if (isCustomProvider(provider)) return findCustomModel(provider)?.name || 'Modèle personnel';
  return PROVIDERS[provider]?.name || 'Non configuré';
}

/**
 * Get the display name for the current provider
 */
export function getProviderDisplayName() {
  const { provider, model } = getSettings();
  return `${getProviderName()} · ${modelLabel(provider, model)}`;
}

export function getProviderInfo(providerId) {
  return PROVIDERS[providerId] || null;
}

// ============================================================
// Model lists
// ============================================================
const NON_CHAT_MODEL = /whisper|tts|orpheus|guard|safeguard|embed|moderation|rerank|transcribe|lyria|imagen|veo|ocr|live|audio|content-safety/i;

export function getLiveModels(providerId) {
  try {
    return JSON.parse(localStorage.getItem(`${LIVE_MODELS_PREFIX}${providerId}`) || '[]');
  } catch {
    return [];
  }
}

/**
 * Asks the provider which models this account can use, so the list cannot go stale.
 * OpenRouter's list is public and is limited here to its free models.
 */
export async function fetchAvailableModels(providerId, apiKey) {
  const provider = PROVIDERS[providerId];
  if (!provider?.modelsUrl) return [];

  const headers = {};
  if (provider.format === 'gemini') headers['x-goog-api-key'] = apiKey;
  else if (apiKey && !provider.modelsArePublic) headers.Authorization = `Bearer ${apiKey}`;

  const response = await fetch(provider.modelsUrl, { headers });
  if (!response.ok) throw createAPIError(provider.name, response.statusText, response.status);
  const data = await response.json();

  let ids;
  if (provider.format === 'gemini') {
    ids = (data.models || [])
      .filter((model) => (model.supportedGenerationMethods || []).includes('generateContent'))
      .map((model) => String(model.name).replace(/^models\//, ''));
  } else {
    ids = (data.data || []).map((model) => model.id);
    if (providerId === 'openrouter') ids = ids.filter((id) => id.endsWith(':free') || id === 'openrouter/free');
  }

  const models = ids.filter((id) => !NON_CHAT_MODEL.test(id)).sort();
  localStorage.setItem(`${LIVE_MODELS_PREFIX}${providerId}`, JSON.stringify(models));
  return models;
}

// ============================================================
// Requests
// ============================================================
function resolveTarget(settings = getSettings()) {
  if (isCustomProvider(settings.provider)) {
    const record = findCustomModel(settings.provider);
    if (!record) throw new Error('Ce modèle personnel n’existe plus. Choisissez-en un autre dans les réglages.');
    return {
      providerId: settings.provider,
      name: record.name,
      format: 'openai',
      url: record.baseUrl,
      apiKey: settings.apiKey,
      candidates: [record.model],
    };
  }

  const provider = PROVIDERS[settings.provider];
  if (!provider) throw new Error('Fournisseur IA non reconnu.');
  // A model of the catalog can fall back on the next ones when its provider retires it
  const catalog = provider.models.map((model) => model.id);
  const candidates = catalog.includes(settings.model)
    ? [settings.model, ...catalog.filter((id) => id !== settings.model)]
    : [settings.model];
  return { ...provider, providerId: settings.provider, apiKey: settings.apiKey, candidates };
}

function createAPIError(name, message, status, retryAfter = null) {
  const error = new Error(`Erreur API ${name} : ${message}`);
  error.status = status;
  error.retryAfter = retryAfter;
  return error;
}

function parseRetryDelay(response, errorData, message) {
  const header = Number(response.headers.get('retry-after'));
  if (Number.isFinite(header) && header > 0) return header;
  const details = errorData?.error?.details || [];
  const googleDelay = details.map((detail) => detail?.retryDelay).find(Boolean);
  if (googleDelay) return parseFloat(googleDelay);
  const minutes = String(message).match(/(\d+)m(\d+(?:\.\d+)?)s/);
  if (minutes) return Number(minutes[1]) * 60 + Number(minutes[2]);
  const seconds = String(message).match(/(?:try again|retry) in (\d+(?:\.\d+)?)\s*s/i);
  return seconds ? Number(seconds[1]) : null;
}

async function readFailure(response, name) {
  const errorData = await response.json().catch(() => ({}));
  const message = errorData?.error?.message || response.statusText;
  return createAPIError(name, message, response.status, parseRetryDelay(response, errorData, message));
}

async function requestOpenAI(target, model, { system, user, temperature, maxTokens, jsonMode, plain }) {
  const messages = target.mergeSystemPrompt
    ? [{ role: 'user', content: `${system}\n\n${user}` }]
    : [{ role: 'system', content: system }, { role: 'user', content: user }];
  const body = {
    model,
    messages,
    temperature,
    [target.maxTokensParam || 'max_tokens']: maxTokens,
  };
  if (jsonMode) body.response_format = { type: 'json_object' };
  if (!plain) {
    const modelEntry = target.models?.find((entry) => entry.id === model);
    Object.assign(body, target.extraBody, modelEntry?.extraBody);
    // Only hosts that keep nothing, unless the person allowed otherwise in the settings
    if (target.providerId === 'openrouter' && !getOpenRouterAllowsCollection()) {
      body.provider = { data_collection: 'deny' };
    }
  }

  const headers = { 'Content-Type': 'application/json', ...target.extraHeaders };
  if (target.apiKey) headers.Authorization = `Bearer ${target.apiKey}`;

  const response = await fetch(target.url, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!response.ok) throw await readFailure(response, target.name);

  const data = await response.json();
  const choice = data.choices?.[0];
  const text = choice?.message?.content || '';
  if (!text && choice?.finish_reason === 'length') {
    const error = new Error('Réponse tronquée par la limite de longueur.');
    error.code = 'truncated';
    throw error;
  }
  return text;
}

async function requestGemini(target, model, { system, user, maxTokens, jsonMode }) {
  // Sampling parameters are ignored on Gemini 3.6+ and deprecated by Google, so none is sent
  const generationConfig = { maxOutputTokens: maxTokens };
  if (jsonMode) generationConfig.responseMimeType = 'application/json';

  const response = await fetch(`${target.baseUrl}/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': target.apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig,
    }),
  });
  if (!response.ok) throw await readFailure(response, target.name);

  const data = await response.json();
  const candidate = data.candidates?.[0];
  const text = (candidate?.content?.parts || []).map((part) => part.text || '').join('');
  if (!text && candidate?.finishReason === 'MAX_TOKENS') {
    const error = new Error('Réponse tronquée par la limite de longueur.');
    error.code = 'truncated';
    throw error;
  }
  return text;
}

function isUnsupportedParameter(error) {
  return error.status === 400 && /response_format|json|temperature|reasoning|include_reasoning|data_collection|unsupported|unknown|unrecognized|not supported/i.test(error.message);
}

function isModelUnavailable(error) {
  if (error.status === 404 || error.status === 410) return true;
  return error.status === 400 && /decommission|deprecated|model.*(not found|does not exist|not available)|no endpoints/i.test(error.message);
}

async function requestWithRetries(target, model, options) {
  const scaledTokens = Math.round(options.maxTokens * (target.tokenFactor || 1));
  let current = { ...options, maxTokens: scaledTokens };
  let lastError = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const request = target.format === 'gemini' ? requestGemini : requestOpenAI;
      return await request(target, model, current);
    } catch (error) {
      lastError = error;
      if (error.status === 429 || error.status === 503) {
        const delay = error.retryAfter ?? 2 ** (attempt + 1);
        if (delay > MAX_WAIT_SECONDS || attempt === MAX_ATTEMPTS - 1) throw error;
        emitStatus({ type: 'waiting', seconds: Math.ceil(delay), provider: target.name });
        await new Promise((resolve) => setTimeout(resolve, delay * 1000));
        emitStatus({ type: 'resumed' });
        continue;
      }
      if (isUnsupportedParameter(error) && !current.plain) {
        current = { ...current, jsonMode: false, plain: true };
        continue;
      }
      if (error.status === 413 && current.maxTokens > 1500) {
        current = { ...current, maxTokens: Math.round(current.maxTokens / 2) };
        continue;
      }
      if (error.code === 'truncated' && current.maxTokens < 16000) {
        current = { ...current, maxTokens: current.maxTokens * 2 };
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

/**
 * Sends a prompt and returns the text, moving to the next model of the catalog if one is gone.
 */
export async function callAI({ system, user, temperature = 0.2, maxTokens = 4096, jsonMode = true }) {
  const target = resolveTarget();
  let lastError = null;

  for (const model of target.candidates) {
    try {
      const text = await requestWithRetries(target, model, { system, user, temperature, maxTokens, jsonMode });
      if (model !== target.candidates[0]) {
        emitStatus({ type: 'model-fallback', from: modelLabel(target.providerId, target.candidates[0]), to: modelLabel(target.providerId, model) });
      }
      lastModelUsed = `${target.name} · ${modelLabel(target.providerId, model)}`;
      return text;
    } catch (error) {
      lastError = error;
      if (!isModelUnavailable(error)) throw error;
      console.warn(`Model ${model} unavailable`, error);
    }
  }
  throw lastError;
}

/**
 * Parse a JSON response from the AI, handling potential formatting issues
 */
export function parseJSONResponse(raw) {
  const cleaned = String(raw || '')
    .replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/gi, '')
    .replace(/```(?:json)?/gi, '')
    .trim();

  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end <= start) {
    throw new Error('La réponse de l’IA n’est pas au format attendu. Réessayez.');
  }
  const candidate = cleaned.slice(start, end + 1);

  try {
    return JSON.parse(candidate);
  } catch {
    try {
      return JSON.parse(candidate.replace(/,\s*([}\]])/g, '$1'));
    } catch {
      throw new Error('La réponse de l’IA n’est pas au format attendu. Réessayez.');
    }
  }
}

/**
 * Sends a prompt and parses its JSON, asking once more if the model answered with something else.
 */
export async function callAIForJSON(options) {
  const text = await callAI(options);
  try {
    return parseJSONResponse(text);
  } catch {
    const retry = await callAI({
      ...options,
      user: `${options.user}\n\nTa réponse précédente n'était pas un JSON valide. Réponds uniquement avec l'objet JSON demandé.`,
    });
    return parseJSONResponse(retry);
  }
}

/**
 * A cheap request that carries no personal data, to check a key and a model before relying on them.
 */
export async function testConnection({ provider, model, apiKey }) {
  const settings = { provider, model, apiKey };
  const target = resolveTarget(settings);
  const started = performance.now();
  const reply = await requestWithRetries(target, target.candidates[0], {
    system: 'Tu vérifies une connexion.',
    user: 'Réponds uniquement par OK.',
    temperature: 0,
    maxTokens: 200,
    jsonMode: false,
  });
  return { ok: Boolean(reply), elapsedMs: Math.round(performance.now() - started) };
}

// ============================================================
// Session cache
// ============================================================
const CACHE_PREFIX = `adaptacv_cache_v${PROMPT_VERSION}_`;

function hashCode(str) {
  let hash = 0;
  for (let i = 0, len = str.length; i < len; i++) {
    const chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Keeps each step's result for the session: a retry after a quota error resumes
 * where it stopped instead of spending the free quota again.
 */
export async function cachedJSON(type, parts, produce) {
  const { provider, model } = getSettings();
  const key = `${CACHE_PREFIX}${type}_${hashCode([provider, model, ...parts].join('|'))}`;
  try {
    const cached = sessionStorage.getItem(key);
    if (cached) return JSON.parse(cached);
  } catch (error) {
    console.warn('Cache read error', error);
  }
  const result = await produce();
  try {
    sessionStorage.setItem(key, JSON.stringify(result));
  } catch (error) {
    console.warn('Cache write error', error);
  }
  return result;
}

// ============================================================
// Documents
// ============================================================

/**
 * Call the AI API to adapt the CV
 */
export async function adaptCV(cvText, jobDescription, jobTitle, companyName, onProgress) {
  const settings = getSettings();
  if (!isAIReady(settings)) {
    throw new Error('Clé API non configurée. Ajoutez votre clé dans les réglages.');
  }

  onProgress?.('adapt-start');
  const result = await cachedJSON('cv', [cvText, jobDescription, jobTitle, companyName, settings.language], () => callAIForJSON({
    system: buildAdaptCVPrompt(settings.language),
    user: buildAdaptCVMessage({ cvText, jobDescription, jobTitle, companyName }),
    temperature: 0.2,
    maxTokens: 4096,
  }));
  onProgress?.('adapt-done');
  return result;
}

/**
 * Call the AI API to generate a cover letter
 */
export async function generateCoverLetter(cvText, jobDescription, jobTitle, companyName, onProgress) {
  const settings = getSettings();

  onProgress?.('letter-start');
  const result = await cachedJSON('letter', [cvText, jobDescription, jobTitle, companyName, settings.language], () => callAIForJSON({
    system: buildCoverLetterPrompt(settings.language),
    user: buildCoverLetterMessage({ cvText, jobDescription, jobTitle, companyName }),
    temperature: 0.4,
    maxTokens: 1200,
  }));
  onProgress?.('letter-done');
  return normalizeCoverLetter(result);
}

function normalizeCoverLetter(letter) {
  const greetingPattern = /^\s*(?:(?:bonjour\s+)?madame\s*[,/&-]?\s*monsieur|(?:bonjour\s+)?monsieur\s*[,/&-]?\s*madame|madame|monsieur|dear\s+(?:sir(?:\s+or\s+madam)?|madam|hiring manager))[\s,:-]*/i;
  const signoffPattern = /\s*(?:(?:bien\s+)?cordialement|sincerely|kind regards|best regards)[,.]?\s*(?:\n\s*[^\n]{2,80})?\s*$/i;
  const cleanPart = (value) => String(value || '')
    .replace(greetingPattern, '')
    .replace(signoffPattern, '')
    .trim();

  const rawGreeting = String(letter.greeting || '').trim();
  const greeting = /(?:madame|monsieur).*(?:madame|monsieur)/i.test(rawGreeting)
    ? 'Madame, Monsieur,'
    : rawGreeting.split('\n')[0] || 'Madame, Monsieur,';

  return {
    candidateName: String(letter.candidateName || '').trim(),
    subject: String(letter.subject || '').trim(),
    greeting,
    opening: cleanPart(letter.opening),
    body: cleanPart(letter.body),
    closing: cleanPart(letter.closing),
    signoff: String(letter.signoff || '').trim(),
  };
}
