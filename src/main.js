/**
 * AdaptaCV — Main Application
 * Orchestrates routing, UI, PDF parsing, AI calls and document generation
 */
import '@fontsource-variable/manrope';
import './style.css';
import { extractTextFromPDF, extractTextFromImage, renderPDFPagesToImages } from './pdf-parser.js';
import {
  getSettings,
  getApiKey,
  saveSettings,
  getProviderName,
  getProviderDisplayName,
  adaptCV,
  generateCoverLetter,
} from './ai-service.js';
import {
  generateAdaptedCVPDF,
  generateCoverLetterPDF,
  downloadPDF,
  getEngineForTemplate,
} from './pdf-generator.js';
import { showToast } from './toast.js';
import { icon } from './icon.js';

// ============================================================
// Constants
// ============================================================
const SAVED_CV_KEY = 'adaptacv_source_profile';
const PHOTO_KEY = 'adaptacv_profile_photo';
const TEMPLATE_KEY = 'adaptacv_cv_template';
const OFFER_DRAFT_KEY = 'adaptacv_offer_draft';
const MIN_OFFER_LENGTH = 20;
const MIN_CV_LENGTH = 50;
const FULL_OFFER_LENGTH = 200;

const TEMPLATES = {
  classic: { name: 'Clair', description: 'Une colonne sobre, le choix sûr pour la plupart des candidatures.' },
  modern: { name: 'Moderne', description: 'Colonne latérale pour les contacts et les compétences.' },
  minimal: { name: 'Minimal', description: 'En-tête centré, sans couleur, tout pour le texte.' },
  executive: { name: 'Exécutif', description: 'Bandeau sombre, pour les postes à responsabilités.' },
  bold: { name: 'Créatif', description: 'Compétences en tête et accent terracotta.' },
};

const PROVIDER_LINKS = {
  groq: { label: 'Créer une clé Groq', url: 'https://console.groq.com/keys' },
  gemini: { label: 'Créer une clé Gemini', url: 'https://aistudio.google.com/apikey' },
  mistral: { label: 'Créer une clé Mistral', url: 'https://console.mistral.ai/api-keys' },
};

const ROUTES = {
  '#/cv-source': { view: 'new', step: 1, title: 'Nouvelle candidature' },
  '#/offre': { view: 'new', step: 2, title: 'Nouvelle candidature' },
  '#/dossier': { view: 'new', step: 3, title: 'Nouvelle candidature' },
  '#/candidatures': { view: 'applications', title: 'Candidatures' },
  '#/mon-cv': { view: 'profile', title: 'Mon CV' },
};
const STEP_ROUTES = { 1: '#/cv-source', 2: '#/offre', 3: '#/dossier' };

// ============================================================
// State
// ============================================================
const storedTemplate = localStorage.getItem(TEMPLATE_KEY);

const state = {
  extractedText: '',
  numPages: 0,
  isImageBased: false,
  currentStep: 1,
  adaptedCV: null,
  coverLetter: null,
  profilePhotoDataURL: null,
  cvTemplate: TEMPLATES[storedTemplate] ? storedTemplate : 'classic',
  letterTemplate: 'formal',
  activeDoc: 'cv',
  generating: false,
  pendingGenerate: false,
};

// ============================================================
// DOM References
// ============================================================
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// Shell
const mainEl = $('#main');
const skipLink = $('#skipLink');
const topbarTitle = $('#topbarTitle');
const stepper = $('#stepper');
const stepButtons = $$('#stepper .step');
const navLinks = $$('[data-nav]');
const newApplicationBtn = $('#newApplicationBtn');
const setupCard = $('#setupCard');
const setupCount = $('#setupCount');
const setupItemCV = $('#setupItemCV');
const setupItemAI = $('#setupItemAI');
const providerStatus = $('#providerStatus');
const providerStatusLabel = $('#providerStatusLabel');
const installBtn = $('#installBtn');
const privacyBtn = $('#privacyBtn');
const privacyDialog = $('#privacyDialog');

// Steps
const stepContents = { 1: $('#step1'), 2: $('#step2'), 3: $('#step3') };
const viewApplications = $('#viewApplications');
const viewProfile = $('#viewProfile');

// Step 1
const dropZone = $('#dropZone');
const fileInput = $('#fileInput');
const uploadError = $('#uploadError');
const pasteCvBtn = $('#pasteCvBtn');
const backToUploadBtn = $('#backToUploadBtn');
const filePreview = $('#filePreview');
const fileName = $('#fileName');
const fileSize = $('#fileSize');
const pdfPreviewContainer = $('#pdfPreviewContainer');
const pdfPreviewPages = $('#pdfPreviewPages');
const extractedTextContainer = $('#extractedTextContainer');
const extractedTextEl = $('#extractedText');
const charCount = $('#charCount');
const manualInputContainer = $('#manualInputContainer');
const manualLabel = $('#manualLabel');
const manualCVText = $('#manualCVText');
const manualCharCount = $('#manualCharCount');
const removeFileBtn = $('#removeFile');
const nextStep1Btn = $('#nextStep1');
const extractionStatus = $('#extractionStatus');

// Step 2
const profilePhotoInput = $('#profilePhotoInput');
const jobTitleInput = $('#jobTitle');
const companyNameInput = $('#companyName');
const jobDescriptionInput = $('#jobDescription');
const jobDescCount = $('#jobDescCount');
const jobDescHint = $('#jobDescHint');
const jobFileInput = $('#jobFileInput');
const jobFileLabel = $('#jobFileLabel');
const jobOfferCard = $('#jobOfferCard');
const generateBtn = $('#generateBtn');
const actionBar = $('.action-bar');
const savedCVName = $('#savedCVName');
const savedCVMeta = $('#savedCVMeta');
const includeCoverLetterInput = $('#includeCoverLetter');
const languageInputs = $$('input[name="docLanguage"]');
const checkCV = $('#checkCV');
const checkOffer = $('#checkOffer');
const checkAI = $('#checkAI');
const checkAIBtn = $('#checkAIBtn');
const generationError = $('#generationError');
const generationErrorTitle = $('#generationErrorTitle');
const generationErrorDetail = $('#generationErrorDetail');
const generationErrorRetry = $('#generationErrorRetry');
const generationErrorSettings = $('#generationErrorSettings');

// Template gallery
const templateDialog = $('#templateDialog');
const templateOptions = $('#templateOptions');
const templatePreviewContent = $('#templatePreviewContent');
const previewSelectBtn = $('#previewSelectBtn');

// Step 3
const loadingState = $('#loadingState');
const resultsState = $('#resultsState');
const loadingTitle = $('#loadingTitle');
const loadingProgressBar = $('#loadingProgressBar');
const loadingStep1 = $('#loadingStep1');
const loadingStep2 = $('#loadingStep2');
const loadingStep3 = $('#loadingStep3');
const successMark = $('#successMark');
const resultTitle = $('#resultTitle');
const resultSubtitle = $('#resultSubtitle');
const startOverBtn = $('#startOverBtn');
const docTabCV = $('#docTabCV');
const docTabLetter = $('#docTabLetter');
const docCopyBtn = $('#docCopyBtn');
const docDownloadBtn = $('#docDownloadBtn');
const docPreviewBtn = $('#docPreviewBtn');
const adaptedCVPreview = $('#adaptedCVPreview');
const coverLetterPreview = $('#coverLetterPreview');
const scoreCard = $('#scoreCard');
const scoreValue = $('#scoreValue');
const scoreLabel = $('#scoreLabel');
const scoreMeter = $('#scoreMeter');
const keywordsCard = $('#keywordsCard');
const keywordsList = $('#keywordsList');
const tipsCard = $('#tipsCard');
const tipsList = $('#tipsList');

// PDF preview
const latexDialog = $('#latexDialog');
const latexDialogTitle = $('#latexDialogTitle');
const latexOpenTabBtn = $('#latexOpenTabBtn');
const latexForm = $('#latexForm');
const latexInput = $('#latexInput');
const latexIframe = $('#latexIframe');
const latexLoading = $('#latexLoading');

// Settings
const settingsBtn = $('#settingsBtn');
const settingsDialog = $('#settingsDialog');
const settingsContext = $('#settingsContext');
const settingsContextText = $('#settingsContextText');
const providerInputs = $$('input[name="aiProvider"]');
const apiKeyInput = $('#apiKey');
const apiKeyError = $('#apiKeyError');
const apiKeyLink = $('#apiKeyLink');
const apiKeyLinkLabel = $('#apiKeyLinkLabel');
const toggleApiKeyBtn = $('#toggleApiKey');
const saveSettingsBtn = $('#saveSettings');
const clearDataBtn = $('#clearDataBtn');

// Confirmation
const confirmDialog = $('#confirmDialog');
const confirmTitle = $('#confirmTitle');
const confirmBody = $('#confirmBody');
const confirmOk = $('#confirmOk');
const confirmCancel = $('#confirmCancel');

// History
const clearHistoryBtn = $('#clearHistoryBtn');
const historyList = $('#historyList');
const historyTable = $('#historyTable');
const historyEmpty = $('#historyEmpty');
const historyNoMatch = $('#historyNoMatch');
const historyBadge = $('#historyBadge');
const historyToolbar = $('#historyToolbar');
const historySearch = $('#historySearch');
const historyStats = $('#historyStats');
const statTotal = $('#statTotal');
const statWeek = $('#statWeek');
const statScore = $('#statScore');

// Profile
const profileEmpty = $('#profileEmpty');
const profileContent = $('#profileContent');
const profileText = $('#profileText');
const profileCharCount = $('#profileCharCount');
const profileSaveStatus = $('#profileSaveStatus');
const profileName = $('#profileName');
const profileMeta = $('#profileMeta');
const replaceCVBtn = $('#replaceCVBtn');
const deleteCVBtn = $('#deleteCVBtn');

// ============================================================
// Initialization
// ============================================================
function init() {
  loadSettings();
  setupEventListeners();
  restoreProfilePhoto();
  restoreSavedCV();
  restoreOfferDraft();
  syncTemplateUI();
  updateHistoryBadge();
  updateGenerationChoice();
  refreshStatus();
  setupPWA();
  renderRoute();
}

function setupPWA() {
  let installPrompt = null;

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    installPrompt = event;
    installBtn.classList.remove('hidden');
  });

  installBtn.addEventListener('click', async () => {
    if (!installPrompt) {
      showToast('Sur iPhone, utilisez Partager puis « Sur l’écran d’accueil ».', 'info', 6000);
      return;
    }
    installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') showToast('AdaptaCV est installé.', 'success');
    installPrompt = null;
    installBtn.classList.add('hidden');
  });

  window.addEventListener('appinstalled', () => {
    installPrompt = null;
    installBtn.classList.add('hidden');
  });

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  if (isIOS && !isStandalone) installBtn.classList.remove('hidden');

  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/service-worker.js', { scope: '/' });
        registration.addEventListener('updatefound', () => {
          const worker = registration.installing;
          worker?.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              showToast('Une mise à jour sera appliquée au prochain démarrage.', 'info', 6000);
            }
          });
        });
      } catch (error) {
        console.warn('PWA registration failed:', error);
      }
    });
  }
}

function loadSettings() {
  const settings = getSettings();
  providerInputs.forEach((input) => { input.checked = input.value === settings.provider; });
  languageInputs.forEach((input) => { input.checked = input.value === settings.language; });
  apiKeyInput.value = settings.apiKey;
  updateProviderHelp(settings.provider);
  updateProviderKeys();
}

// ============================================================
// Routing
// ============================================================
function hasCV() {
  return state.extractedText.length >= 30;
}

function resolveRoute() {
  const fallback = hasCV() ? '#/offre' : '#/cv-source';
  const hash = ROUTES[location.hash] ? location.hash : fallback;
  if (hash === '#/offre' && !hasCV()) return '#/cv-source';
  if (hash === '#/dossier' && !state.generating && !state.adaptedCV) return fallback;
  return hash;
}

function navigate(hash) {
  if (location.hash !== hash) history.pushState(null, '', hash);
  renderRoute();
}

function goToStep(step) {
  navigate(STEP_ROUTES[step]);
}

let isFirstRender = true;

function renderRoute() {
  const hash = resolveRoute();
  if (hash !== location.hash) history.replaceState(null, '', hash);
  const route = ROUTES[hash];

  Object.values(stepContents).forEach((el) => el.classList.remove('active'));
  if (route.step) stepContents[route.step].classList.add('active');
  viewApplications.classList.toggle('hidden', route.view !== 'applications');
  viewProfile.classList.toggle('hidden', route.view !== 'profile');

  topbarTitle.textContent = route.title;
  stepper.classList.toggle('hidden', route.view !== 'new');
  navLinks.forEach((link) => {
    const active = link.dataset.nav === route.view;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });

  if (route.step) {
    state.currentStep = route.step;
    syncStepper();
  }
  if (route.step === 2) {
    updateGenerateButton();
    if (window.matchMedia('(pointer: fine)').matches && !jobDescriptionInput.value) {
      jobDescriptionInput.focus({ preventScroll: true });
    }
  }
  if (route.step === 3) syncGenerationView();
  if (route.view === 'applications') renderHistoryList();
  if (route.view === 'profile') renderProfile();

  // Move focus into the new page, so keyboard and screen reader users follow the navigation
  if (!isFirstRender && !mainEl.contains(document.activeElement)) mainEl.focus({ preventScroll: true });
  isFirstRender = false;

  window.scrollTo({ top: 0, behavior: 'instant' });
}

function syncStepper() {
  stepButtons.forEach((button) => {
    const step = Number(button.dataset.step);
    const isCurrent = step === state.currentStep;
    const reachable = step === 1
      || (step === 2 && hasCV())
      || (step === 3 && (state.generating || Boolean(state.adaptedCV)));
    button.classList.toggle('active', isCurrent);
    button.classList.toggle('completed', step < state.currentStep);
    button.disabled = !reachable;
    if (isCurrent) button.setAttribute('aria-current', 'step');
    else button.removeAttribute('aria-current');
  });
}

function syncGenerationView() {
  loadingState.classList.toggle('hidden', !state.generating);
  resultsState.classList.toggle('hidden', state.generating || !state.adaptedCV);
}

function refreshStatus() {
  const cvReady = hasCV();
  const keyReady = Boolean(getSettings().apiKey);

  setupItemCV.classList.toggle('done', cvReady);
  setupItemAI.classList.toggle('done', keyReady);
  setupCount.textContent = `${Number(cvReady) + Number(keyReady)}/2`;
  setupCard.classList.toggle('hidden', cvReady && keyReady);
  providerStatus.classList.toggle('hidden', !(cvReady && keyReady));
  providerStatusLabel.textContent = getProviderName();
  providerStatus.title = getProviderDisplayName();

  updateGenerateButton();
  syncStepper();
}

// ============================================================
// Event Listeners
// ============================================================
function setupEventListeners() {
  // --- Routing ---
  window.addEventListener('hashchange', renderRoute);
  skipLink.addEventListener('click', (e) => {
    e.preventDefault();
    mainEl.focus();
  });
  newApplicationBtn.addEventListener('click', (e) => {
    e.preventDefault();
    startNewApplication();
  });
  stepButtons.forEach((button) => {
    button.addEventListener('click', () => goToStep(Number(button.dataset.step)));
  });

  // --- Dialogs ---
  $$('dialog').forEach((dialog) => {
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog || e.target.closest('.js-close-dialog')) dialog.close();
    });
  });
  privacyBtn.addEventListener('click', () => privacyDialog.showModal());
  $$('.js-open-privacy').forEach((button) => button.addEventListener('click', () => privacyDialog.showModal()));

  // --- Drop Zone ---
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files.length > 0) handleFileUpload(e.dataTransfer.files[0]);
  });

  dropZone.addEventListener('click', (e) => {
    // Don't programmatically trigger file input if the click originated from
    // the <label> or the file input itself — the label already handles it
    // natively. On mobile, calling .click() from a bubbled label event
    // can be blocked by the browser, causing nothing to happen.
    const fromControl = e.target.closest('label[for="fileInput"], #pasteCvBtn');
    const fromInput = e.target === fileInput;
    if (!fromControl && !fromInput) {
      fileInput.click();
    }
  });
  fileInput.addEventListener('click', () => {
    // Reset value so selecting the same file again still triggers 'change'
    fileInput.value = '';
  });
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) handleFileUpload(e.target.files[0]);
  });

  removeFileBtn.addEventListener('click', confirmRemoveCV);
  pasteCvBtn.addEventListener('click', () => showManualInput('Collez le texte de votre CV'));
  backToUploadBtn.addEventListener('click', showDropZone);

  // --- Profile Photo ---
  $$('.js-photo-add').forEach((button) => button.addEventListener('click', () => profilePhotoInput.click()));
  $$('.js-photo-remove').forEach((button) => button.addEventListener('click', () => {
    setProfilePhoto(null);
    showToast('Photo retirée.', 'info');
  }));

  profilePhotoInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) handleProfilePhotoUpload(e.target.files[0]);
    profilePhotoInput.value = '';
  });

  // --- Manual CV text ---
  manualCVText.addEventListener('input', () => {
    const len = manualCVText.value.trim().length;
    manualCharCount.textContent = len < MIN_CV_LENGTH
      ? `Encore ${MIN_CV_LENGTH - len} caractère${MIN_CV_LENGTH - len > 1 ? 's' : ''} minimum`
      : formatCount(len, 'caractère');
    nextStep1Btn.disabled = len < MIN_CV_LENGTH;
  });

  // --- Navigation ---
  nextStep1Btn.addEventListener('click', () => {
    if (!manualInputContainer.classList.contains('hidden')) {
      state.extractedText = manualCVText.value.trim();
      state.numPages = 0;
      state.isImageBased = false;
      saveSourceProfile('CV collé', state.extractedText, 0, 'manuel');
      refreshStatus();
    }
    goToStep(2);
  });

  startOverBtn.addEventListener('click', startNewApplication);

  // --- Job Description ---
  jobDescriptionInput.addEventListener('input', () => {
    updateGenerateButton();
    saveOfferDraft();
  });
  jobTitleInput.addEventListener('input', saveOfferDraft);
  companyNameInput.addEventListener('input', saveOfferDraft);

  includeCoverLetterInput.addEventListener('change', updateGenerationChoice);
  languageInputs.forEach((input) => input.addEventListener('change', () => {
    const settings = getSettings();
    saveSettings(settings.provider, settings.apiKey, input.value);
  }));

  jobFileInput.addEventListener('change', (event) => {
    const [file] = event.target.files;
    if (file) handleJobFile(file);
  });
  jobOfferCard.addEventListener('dragover', (event) => {
    event.preventDefault();
    jobOfferCard.classList.add('drag-over');
  });
  jobOfferCard.addEventListener('dragleave', () => jobOfferCard.classList.remove('drag-over'));
  jobOfferCard.addEventListener('drop', (event) => {
    event.preventDefault();
    jobOfferCard.classList.remove('drag-over');
    const [file] = event.dataTransfer.files;
    if (file) handleJobFile(file);
  });

  // --- Template Gallery ---
  $$('.js-open-gallery').forEach((button) => button.addEventListener('click', openTemplateGallery));
  templateOptions.addEventListener('change', (e) => {
    templatePreviewContent.innerHTML = renderTemplatePreview(e.target.value);
  });
  previewSelectBtn.addEventListener('click', selectPreviewedTemplate);

  // --- Generate ---
  generateBtn.addEventListener('click', handleGenerate);
  generationErrorRetry.addEventListener('click', handleGenerate);
  generationErrorSettings.addEventListener('click', () => {
    state.pendingGenerate = true;
    openSettings();
  });
  checkAIBtn.addEventListener('click', openSettings);
  document.addEventListener('keydown', (e) => {
    const onOfferStep = stepContents[2].classList.contains('active');
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && onOfferStep && !generateBtn.disabled && !$('dialog[open]')) {
      e.preventDefault();
      handleGenerate();
    }
  });

  // --- Documents ---
  docTabCV.addEventListener('click', () => setActiveDoc('cv'));
  docTabLetter.addEventListener('click', () => setActiveDoc('letter'));
  [docTabCV, docTabLetter].forEach((tab) => tab.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    if (docTabLetter.classList.contains('hidden')) return;
    const next = state.activeDoc === 'cv' ? 'letter' : 'cv';
    setActiveDoc(next);
    (next === 'cv' ? docTabCV : docTabLetter).focus();
  }));
  docPreviewBtn.addEventListener('click', () => {
    if (state.activeDoc === 'letter') handlePreviewCoverLetter();
    else handlePreviewCV();
  });
  docDownloadBtn.addEventListener('click', () => {
    if (state.activeDoc === 'letter') handleDownloadCoverLetter();
    else handleDownloadCV();
  });
  docCopyBtn.addEventListener('click', handleCopyLetter);

  // --- PDF preview ---
  latexOpenTabBtn.addEventListener('click', () => {
    latexForm.target = '_blank';
    latexForm.submit();
    latexForm.target = 'latexIframe';
  });
  latexIframe.addEventListener('load', () => {
    if (latexIframe.dataset.pending === 'true') {
      latexLoading.classList.add('is-hidden');
      delete latexIframe.dataset.pending;
    }
  });

  // --- Settings ---
  settingsBtn.addEventListener('click', openSettings);
  setupItemAI.addEventListener('click', openSettings);
  providerStatus.addEventListener('click', openSettings);
  settingsDialog.addEventListener('close', () => {
    state.pendingGenerate = false;
  });

  providerInputs.forEach((input) => input.addEventListener('change', () => {
    apiKeyInput.value = getApiKey(input.value);
    apiKeyError.classList.add('hidden');
    updateProviderHelp(input.value);
  }));

  toggleApiKeyBtn.addEventListener('click', () => {
    const reveal = apiKeyInput.type === 'password';
    apiKeyInput.type = reveal ? 'text' : 'password';
    toggleApiKeyBtn.innerHTML = icon(reveal ? 'visibility_off' : 'visibility');
    toggleApiKeyBtn.setAttribute('aria-label', reveal ? 'Masquer la clé' : 'Afficher la clé');
  });

  apiKeyInput.addEventListener('input', () => apiKeyError.classList.add('hidden'));

  saveSettingsBtn.addEventListener('click', () => {
    const apiKey = apiKeyInput.value.trim();
    const resume = state.pendingGenerate;
    if (resume && !apiKey) {
      apiKeyError.classList.remove('hidden');
      apiKeyInput.focus();
      return;
    }
    saveSettings($('input[name="aiProvider"]:checked').value, apiKey, getSettings().language);
    settingsDialog.close();
    refreshStatus();
    if (resume) {
      handleGenerate();
    } else {
      showToast('Réglages enregistrés.', 'success');
    }
  });

  clearDataBtn.addEventListener('click', async () => {
    const confirmed = await confirmAction({
      title: 'Effacer toutes vos données ?',
      body: 'Votre CV, votre photo, vos clés API et votre historique seront supprimés de ce navigateur. Cette action est définitive.',
      confirmLabel: 'Tout effacer',
    });
    if (!confirmed) return;
    Object.keys(localStorage)
      .filter((key) => key.startsWith('adaptacv_') || key.startsWith('cv_adapter_'))
      .forEach((key) => localStorage.removeItem(key));
    sessionStorage.clear();
    location.replace(location.pathname);
  });

  // --- History ---
  historySearch.addEventListener('input', renderHistoryList);
  clearHistoryBtn.addEventListener('click', async () => {
    const confirmed = await confirmAction({
      title: 'Effacer l’historique ?',
      body: 'Tous les dossiers enregistrés sur cet appareil seront supprimés. Votre CV est conservé.',
      confirmLabel: 'Tout effacer',
    });
    if (!confirmed) return;
    clearHistory();
    renderHistoryList();
  });

  // --- Profile ---
  let profileSaveTimer = null;
  profileText.addEventListener('input', () => {
    profileCharCount.textContent = formatCount(profileText.value.length, 'caractère');
    profileSaveStatus.classList.remove('is-error');
    profileSaveStatus.textContent = 'Enregistrement...';
    clearTimeout(profileSaveTimer);
    profileSaveTimer = setTimeout(saveProfileText, 500);
  });
  profileText.addEventListener('change', () => {
    clearTimeout(profileSaveTimer);
    saveProfileText();
  });
  replaceCVBtn.addEventListener('click', () => fileInput.click());
  deleteCVBtn.addEventListener('click', confirmRemoveCV);
}

// ============================================================
// Confirmation dialog
// ============================================================
function confirmAction({ title, body, confirmLabel }) {
  confirmTitle.textContent = title;
  confirmBody.textContent = body;
  confirmOk.textContent = confirmLabel;
  confirmDialog.showModal();

  return new Promise((resolve) => {
    const finish = (value) => {
      confirmOk.onclick = null;
      confirmCancel.onclick = null;
      confirmDialog.onclose = null;
      if (confirmDialog.open) confirmDialog.close();
      resolve(value);
    };
    confirmOk.onclick = () => finish(true);
    confirmCancel.onclick = () => finish(false);
    confirmDialog.onclose = () => finish(false);
  });
}

// ============================================================
// Settings
// ============================================================
function openSettings() {
  loadSettings();
  apiKeyError.classList.add('hidden');
  settingsContext.classList.toggle('hidden', !state.pendingGenerate);
  settingsContextText.textContent = apiKeyInput.value
    ? 'Corrigez la clé si besoin : votre offre est conservée et l’adaptation redémarre dès l’enregistrement.'
    : 'Il manque une clé API pour lancer l’adaptation. Votre offre est conservée : la génération démarre dès l’enregistrement.';
  saveSettingsBtn.textContent = state.pendingGenerate ? 'Enregistrer et adapter' : 'Enregistrer';
  apiKeyInput.autofocus = state.pendingGenerate;
  settingsDialog.showModal();
}

function updateProviderHelp(provider) {
  const link = PROVIDER_LINKS[provider] || PROVIDER_LINKS.groq;
  apiKeyLink.href = link.url;
  apiKeyLinkLabel.textContent = link.label;
}

function updateProviderKeys() {
  providerInputs.forEach((input) => {
    const badge = input.closest('.provider-option').querySelector('.provider-key');
    badge.classList.toggle('hidden', !getApiKey(input.value));
  });
}

// ============================================================
// Profile Photo
// ============================================================
function handleProfilePhotoUpload(file) {
  if (!['image/jpeg', 'image/png'].includes(file.type)) {
    showToast('Utilisez une image JPG ou PNG.', 'error');
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    showToast('Image trop volumineuse (5 Mo maximum).', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    setProfilePhoto(e.target.result);
    showToast('Photo ajoutée au CV.', 'success');
  };
  reader.readAsDataURL(file);
}

function setProfilePhoto(dataURL) {
  state.profilePhotoDataURL = dataURL;
  try {
    if (dataURL) localStorage.setItem(PHOTO_KEY, dataURL);
    else localStorage.removeItem(PHOTO_KEY);
  } catch (error) {
    console.warn('Profile photo storage full', error);
    showToast('Photo utilisable pour cette session : elle est trop lourde pour être mémorisée.', 'info', 6000);
  }
  renderPhotoControls();
  if (state.adaptedCV) renderResults();
}

function restoreProfilePhoto() {
  state.profilePhotoDataURL = localStorage.getItem(PHOTO_KEY);
  renderPhotoControls();
}

function renderPhotoControls() {
  const photo = state.profilePhotoDataURL;
  $$('.photo-preview').forEach((el) => {
    el.innerHTML = photo ? `<img src="${photo}" alt="Photo du CV" />` : icon('add_a_photo');
    el.classList.toggle('has-photo', Boolean(photo));
  });
  $$('.js-photo-add').forEach((button) => button.classList.toggle('hidden', Boolean(photo)));
  $$('.js-photo-remove').forEach((button) => button.classList.toggle('hidden', !photo));
}

// ============================================================
// File Handling
// ============================================================
async function handleFileUpload(file) {
  goToStep(1);
  uploadError.classList.add('hidden');

  if (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) {
    showUploadError('Ce fichier n’est pas un PDF. Exportez votre CV en PDF, ou collez directement son texte.');
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    showUploadError('Ce fichier dépasse 10 Mo. Exportez une version allégée, ou collez directement son texte.');
    return;
  }

  fileName.textContent = file.name;
  fileSize.textContent = formatFileSize(file.size);
  dropZone.classList.add('hidden');
  filePreview.classList.remove('hidden');
  nextStep1Btn.classList.remove('hidden');

  extractedTextContainer.classList.add('hidden');
  manualInputContainer.classList.add('hidden');
  setExtractionStatus('Lecture du CV', 'Préparation...', 'loading');
  extractedTextEl.textContent = '';
  nextStep1Btn.disabled = true;

  // Render PDF preview in parallel
  renderPDFPreview(file);

  try {
    const result = await extractTextFromPDF(file, (status) => {
      switch (status.phase) {
        case 'text':
          setExtractionStatus('Lecture du CV', 'Extraction du texte...', 'loading');
          break;
        case 'ocr-init':
          setExtractionStatus('Lecture par OCR', 'Ce PDF est une image : la lecture prend un peu plus de temps.', 'loading');
          break;
        case 'ocr-page':
          setExtractionStatus('Lecture par OCR', `Page ${status.page} sur ${status.totalPages}`, 'loading');
          break;
        case 'ocr-recognize':
          setExtractionStatus('Lecture par OCR', `Page ${status.page} · ${status.progress} %`, 'loading');
          break;
        case 'ocr-done':
          setExtractionStatus('Profil extrait', 'OCR terminé', 'done');
          break;
      }
    });

    if (result.text && result.text.trim().length >= MIN_CV_LENGTH) {
      state.extractedText = result.text;
      state.numPages = result.numPages;
      state.isImageBased = result.method === 'ocr';

      extractedTextContainer.classList.remove('hidden');
      extractedTextEl.textContent = result.text;

      const methodLabel = result.method === 'ocr' ? 'lu par OCR' : 'texte extrait';
      setExtractionStatus('CV prêt', `${formatCount(result.numPages, 'page')} · ${methodLabel}`, 'done');
      nextStep1Btn.disabled = false;
      saveSourceProfile(file.name, result.text, result.numPages, result.method, file.size);
      refreshStatus();
    } else {
      showExtractionFailure();
    }
  } catch (err) {
    console.error('PDF parsing error:', err);
    showExtractionFailure();
  }
}

function showExtractionFailure() {
  setExtractionStatus('Texte illisible', 'Ce PDF n’a pas pu être lu. Collez le texte de votre CV ci-dessous.', 'error');
  showManualInput('Texte de votre CV', { keepFile: true });
}

function showUploadError(message) {
  uploadError.textContent = message;
  uploadError.classList.remove('hidden');
}

function showDropZone() {
  dropZone.classList.remove('hidden');
  filePreview.classList.add('hidden');
  manualInputContainer.classList.add('hidden');
  nextStep1Btn.classList.add('hidden');
  uploadError.classList.add('hidden');
}

function showManualInput(label, { keepFile = false } = {}) {
  dropZone.classList.add('hidden');
  filePreview.classList.toggle('hidden', !keepFile);
  uploadError.classList.add('hidden');
  manualLabel.textContent = label;
  manualInputContainer.classList.remove('hidden');
  nextStep1Btn.classList.remove('hidden');
  nextStep1Btn.disabled = manualCVText.value.trim().length < MIN_CV_LENGTH;
  manualCVText.focus();
}

async function renderPDFPreview(file) {
  try {
    const canvases = await renderPDFPagesToImages(file, 1.2);
    pdfPreviewPages.innerHTML = '';
    for (const canvas of canvases) {
      pdfPreviewPages.appendChild(canvas);
    }
    pdfPreviewContainer.classList.remove('hidden');
  } catch (err) {
    console.error('PDF preview error:', err);
  }
}

async function confirmRemoveCV() {
  if (getSavedCV()) {
    const confirmed = await confirmAction({
      title: 'Supprimer votre CV ?',
      body: 'Il sera retiré de ce navigateur. Vos candidatures déjà générées sont conservées.',
      confirmLabel: 'Supprimer',
    });
    if (!confirmed) return;
  }
  resetFile();
  goToStep(1);
}

function resetFile() {
  state.extractedText = '';
  state.numPages = 0;
  state.isImageBased = false;
  fileInput.value = '';
  manualCVText.value = '';
  manualCharCount.textContent = `${MIN_CV_LENGTH} caractères minimum`;
  showDropZone();
  pdfPreviewContainer.classList.add('hidden');
  pdfPreviewPages.innerHTML = '';
  extractedTextContainer.classList.add('hidden');
  nextStep1Btn.disabled = true;
  localStorage.removeItem(SAVED_CV_KEY);
  updateSavedCVSummary();
  refreshStatus();
}

function setExtractionStatus(title, detail, status) {
  extractionStatus.classList.remove('is-loading', 'is-done', 'is-error');
  extractionStatus.classList.add(`is-${status}`);
  extractionStatus.querySelector('strong').textContent = title;
  charCount.textContent = detail;
}

function saveSourceProfile(name, text, numPages, method, size = 0) {
  const source = { name, text, numPages, method, size, savedAt: new Date().toISOString() };
  try {
    localStorage.setItem(SAVED_CV_KEY, JSON.stringify(source));
    updateSavedCVSummary(source);
  } catch (error) {
    console.warn('Source profile storage full', error);
    showToast('Le CV est utilisable, mais la mémoire locale est pleine.', 'info');
  }
}

function getSavedCV() {
  try {
    return JSON.parse(localStorage.getItem(SAVED_CV_KEY) || 'null');
  } catch {
    return null;
  }
}

function restoreSavedCV() {
  const source = getSavedCV();
  if (!source?.text || source.text.length < 30) return;

  state.extractedText = source.text;
  state.numPages = source.numPages || 0;
  state.isImageBased = source.method === 'ocr';
  fileName.textContent = source.name || 'CV enregistré';
  fileSize.textContent = source.size ? formatFileSize(source.size) : 'Mémorisé sur cet appareil';
  extractedTextEl.textContent = source.text;
  dropZone.classList.add('hidden');
  filePreview.classList.remove('hidden');
  extractedTextContainer.classList.remove('hidden');
  pdfPreviewContainer.classList.add('hidden');
  setExtractionStatus('CV prêt', describeSource(source), 'done');
  nextStep1Btn.classList.remove('hidden');
  nextStep1Btn.disabled = false;
  updateSavedCVSummary(source);
}

function describeSource(source) {
  const parts = [];
  if (source.numPages) parts.push(formatCount(source.numPages, 'page'));
  if (source.method === 'ocr') parts.push('lu par OCR');
  if (source.savedAt) parts.push(formatDate(source.savedAt));
  return parts.join(' · ') || 'Mémorisé sur cet appareil';
}

function updateSavedCVSummary(source = getSavedCV()) {
  savedCVName.textContent = source?.name || 'Aucun CV enregistré';
  savedCVMeta.textContent = source?.text ? describeSource(source) : 'Ajoutez un CV pour commencer';
}

// ============================================================
// Offer form
// ============================================================
function startNewApplication() {
  if (state.generating) {
    goToStep(3);
    return;
  }
  if (state.adaptedCV) resetOffer();
  goToStep(hasCV() ? 2 : 1);
}

function resetOffer() {
  state.adaptedCV = null;
  state.coverLetter = null;
  jobTitleInput.value = '';
  companyNameInput.value = '';
  jobDescriptionInput.value = '';
  jobFileLabel.textContent = 'Importer PDF ou image';
  sessionStorage.removeItem(OFFER_DRAFT_KEY);
  hideGenerationError();
  updateGenerateButton();
}

function saveOfferDraft() {
  try {
    sessionStorage.setItem(OFFER_DRAFT_KEY, JSON.stringify({
      description: jobDescriptionInput.value,
      title: jobTitleInput.value,
      company: companyNameInput.value,
    }));
  } catch (error) {
    console.warn('Offer draft storage full', error);
  }
}

function restoreOfferDraft() {
  try {
    const draft = JSON.parse(sessionStorage.getItem(OFFER_DRAFT_KEY) || 'null');
    if (!draft) return;
    jobDescriptionInput.value = draft.description || '';
    jobTitleInput.value = draft.title || '';
    companyNameInput.value = draft.company || '';
  } catch (error) {
    console.warn('Offer draft unreadable', error);
  }
}

function setCheck(el, done, label) {
  el.classList.toggle('done', done);
  el.querySelector('.check-label').textContent = label;
}

function updateGenerateButton() {
  const rawLength = jobDescriptionInput.value.length;
  const length = jobDescriptionInput.value.trim().length;
  const offerReady = length > MIN_OFFER_LENGTH;
  const keyReady = Boolean(getSettings().apiKey);

  generateBtn.disabled = !offerReady || !hasCV();
  jobDescCount.textContent = formatCount(rawLength, 'caractère');

  if (length === 0) jobDescHint.textContent = '';
  else if (!offerReady) jobDescHint.textContent = 'Ce texte est trop court pour être analysé.';
  else if (length < FULL_OFFER_LENGTH) jobDescHint.textContent = 'Collez l’offre complète pour un résultat plus précis.';
  else jobDescHint.textContent = '';

  setCheck(checkCV, hasCV(), hasCV() ? 'CV prêt' : 'CV manquant');
  setCheck(checkOffer, offerReady, offerReady ? 'Offre prête' : 'Offre à coller');
  setCheck(checkAI, keyReady, keyReady ? getProviderName() : 'Ajouter une clé API');
  actionBar.classList.toggle('is-ready', offerReady && keyReady && hasCV());
}

function updateGenerationChoice() {
  includeCoverLetterInput.closest('.rail-toggle').classList.toggle('is-disabled', !includeCoverLetterInput.checked);
}

async function handleJobFile(file) {
  const isPDF = file.type === 'application/pdf';
  const isImage = file.type.startsWith('image/');
  if (!isPDF && !isImage) {
    showToast('Utilisez un PDF ou une image.', 'error');
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    showToast('Fichier trop volumineux (10 Mo maximum).', 'error');
    return;
  }

  jobFileInput.disabled = true;
  jobFileLabel.textContent = 'Lecture en cours...';
  const placeholder = jobDescriptionInput.placeholder;
  jobDescriptionInput.placeholder = 'Extraction de l’offre en cours...';
  try {
    const onProgress = (status) => {
      if (status.phase === 'ocr-recognize') jobFileLabel.textContent = `OCR ${status.progress} %`;
      else if (status.phase === 'ocr-page') jobFileLabel.textContent = `Page ${status.page}/${status.totalPages}`;
    };
    const result = isPDF
      ? await extractTextFromPDF(file, onProgress)
      : await extractTextFromImage(file, onProgress);
    if (!result.text || result.text.trim().length < MIN_OFFER_LENGTH) throw new Error('Texte insuffisant');
    jobDescriptionInput.value = result.text.trim();
    jobDescriptionInput.dispatchEvent(new Event('input'));
    jobFileLabel.textContent = file.name;
    showToast('Offre extraite et prête à analyser.', 'success');
  } catch (error) {
    console.error('Job offer extraction error:', error);
    jobFileLabel.textContent = 'Importer PDF ou image';
    showToast('Impossible de lire cette offre. Vous pouvez coller son texte.', 'error');
  } finally {
    jobFileInput.disabled = false;
    jobDescriptionInput.placeholder = placeholder;
    jobFileInput.value = '';
  }
}

// ============================================================
// Generate
// ============================================================
function describeGenerationError(err) {
  const provider = getProviderName();
  const status = err?.status;
  const message = String(err?.message || '');

  if (status === 401 || status === 403 || /api key/i.test(message)) {
    return { title: `${provider} a refusé la clé API`, detail: 'Vérifiez qu’elle est complète et toujours active.', keyIssue: true };
  }
  if (status === 429) {
    return { title: `Limite de ${provider} atteinte`, detail: 'Patientez une minute avant de réessayer, ou changez de fournisseur dans les réglages.' };
  }
  if (status >= 500) {
    return { title: `${provider} est momentanément indisponible`, detail: 'Votre offre est conservée. Réessayez dans quelques instants.' };
  }
  if (err instanceof TypeError) {
    return { title: 'Connexion impossible', detail: 'Vérifiez votre connexion internet, puis réessayez.' };
  }
  return { title: 'La génération n’a pas abouti', detail: message || 'Réessayez dans quelques instants.' };
}

function showGenerationError(err) {
  const { title, detail, keyIssue } = describeGenerationError(err);
  generationErrorTitle.textContent = title;
  generationErrorDetail.textContent = detail;
  generationErrorSettings.classList.toggle('hidden', !keyIssue);
  generationError.classList.remove('hidden');
}

function hideGenerationError() {
  generationError.classList.add('hidden');
}

async function handleGenerate() {
  if (state.generating) {
    goToStep(3);
    return;
  }
  hideGenerationError();

  const settings = getSettings();
  if (!settings.apiKey) {
    state.pendingGenerate = true;
    openSettings();
    return;
  }

  if (!hasCV()) {
    showToast('Le texte du CV est trop court.', 'error');
    goToStep(1);
    return;
  }

  const jobTitle = jobTitleInput.value.trim();
  const companyName = companyNameInput.value.trim();
  const jobDescription = jobDescriptionInput.value.trim();
  const withLetter = includeCoverLetterInput.checked;

  state.generating = true;
  goToStep(3);

  [loadingStep1, loadingStep2, loadingStep3].forEach((el) => el.classList.remove('active', 'done'));
  loadingStep3.classList.toggle('hidden', !withLetter);
  setProgress(5);

  try {
    loadingStep1.classList.add('active');
    loadingTitle.textContent = 'Analyse du CV et de l’offre...';
    setProgress(15);

    const cvResult = await adaptCV(
      state.extractedText,
      jobDescription,
      jobTitle,
      companyName,
      (progress) => {
        if (progress === 'adapt-start') {
          loadingStep1.classList.remove('active');
          loadingStep1.classList.add('done');
          loadingStep2.classList.add('active');
          loadingTitle.textContent = 'Adaptation du CV en cours...';
          setProgress(40);
        }
        if (progress === 'adapt-done') {
          loadingStep2.classList.remove('active');
          loadingStep2.classList.add('done');
          setProgress(withLetter ? 65 : 100);
        }
      }
    );

    let letterResult = null;
    if (withLetter) {
      loadingStep3.classList.add('active');
      loadingTitle.textContent = 'Rédaction de la lettre de motivation...';
      setProgress(75);
      letterResult = await generateCoverLetter(
        state.extractedText,
        jobDescription,
        jobTitle,
        companyName,
        (progress) => {
          if (progress === 'letter-done') {
            loadingStep3.classList.remove('active');
            loadingStep3.classList.add('done');
            setProgress(100);
          }
        }
      );
    }

    state.adaptedCV = cvResult;
    state.coverLetter = letterResult;

    // Save to history
    saveToHistory({
      id: Date.now(),
      date: new Date().toISOString(),
      jobTitle,
      companyName,
      candidateName: cvResult.personalInfo?.fullName || detectCandidateName(state.extractedText) || 'Candidat',
      matchScore: cvResult.matchScore || null,
      adaptedCV: cvResult,
      coverLetter: letterResult,
      cvTemplate: state.cvTemplate,
    });

    // Short delay for the 100% progress bar to be visible
    await wait(400);

    state.generating = false;
    setActiveDoc('cv');
    renderResults();
    syncGenerationView();
    syncStepper();

    if (resolveRoute() === STEP_ROUTES[3]) {
      successMark.classList.remove('is-fresh');
      void successMark.offsetWidth;
      successMark.classList.add('is-fresh');
      resultTitle.focus({ preventScroll: true });
    } else {
      showToast(letterResult ? 'Votre candidature est prête.' : 'Votre CV est prêt.', 'success', 8000, {
        label: 'Voir',
        onClick: () => goToStep(3),
      });
    }
  } catch (err) {
    console.error('Generation error:', err);
    state.generating = false;
    syncGenerationView();
    showGenerationError(err);
    goToStep(2);
  }
}

function setProgress(percent) {
  loadingProgressBar.style.width = `${percent}%`;
}

// ============================================================
// Render Results
// ============================================================
function setActiveDoc(doc) {
  state.activeDoc = doc;
  const isLetter = doc === 'letter';
  docTabCV.setAttribute('aria-selected', String(!isLetter));
  docTabLetter.setAttribute('aria-selected', String(isLetter));
  docTabCV.tabIndex = isLetter ? -1 : 0;
  docTabLetter.tabIndex = isLetter ? 0 : -1;
  adaptedCVPreview.classList.toggle('hidden', isLetter);
  coverLetterPreview.classList.toggle('hidden', !isLetter);
  docCopyBtn.classList.toggle('hidden', !isLetter);
}

function renderResults() {
  const hasLetter = Boolean(state.coverLetter);
  if (!hasLetter && state.activeDoc === 'letter') setActiveDoc('cv');
  docTabLetter.classList.toggle('hidden', !hasLetter);

  const company = companyNameInput.value.trim();
  const title = getEntryTitle({
    jobTitle: jobTitleInput.value.trim(),
    coverLetter: state.coverLetter,
    adaptedCV: state.adaptedCV,
  });
  resultTitle.textContent = hasLetter ? 'Votre candidature est prête' : 'Votre CV est prêt';
  resultSubtitle.textContent = [title, company].filter(Boolean).join(' · ');

  if (state.adaptedCV) {
    adaptedCVPreview.className = `result-preview cv-live-${state.cvTemplate}${state.activeDoc === 'letter' ? ' hidden' : ''}`;
    adaptedCVPreview.innerHTML = renderLiveCVPreview(state.adaptedCV, state.cvTemplate);
    renderInsights(state.adaptedCV);
  }

  if (hasLetter) {
    const subject = state.coverLetter.subject
      ? `<div class="letter-subject">Objet : ${esc(state.coverLetter.subject)}</div>`
      : '';
    coverLetterPreview.innerHTML = `<div class="letter-page">${subject}<div class="letter-text">${esc(buildLetterText(state.coverLetter))}</div></div>`;
  }
}

function buildLetterText(letter) {
  const cleanLetterPart = (value) => String(value || '')
    .replace(/^\s*(?:(?:bonjour\s+)?madame\s*[,/&-]?\s*monsieur|(?:bonjour\s+)?monsieur\s*[,/&-]?\s*madame|madame|monsieur)[\s,:-]*/i, '')
    .replace(/\s*(?:bien\s+)?cordialement[,.]?\s*(?:\n\s*[^\n]{2,80})?\s*$/i, '')
    .trim();
  const rawGreeting = String(letter.greeting || '').trim();
  const greeting = /(?:madame|monsieur).*(?:madame|monsieur)/i.test(rawGreeting)
    ? 'Madame, Monsieur,'
    : rawGreeting.split('\n')[0] || 'Madame, Monsieur,';
  const candidateName = letter.candidateName || state.adaptedCV?.personalInfo?.fullName || '';
  const signature = ['Cordialement,', candidateName].filter(Boolean).join('\n');
  return [greeting, cleanLetterPart(letter.opening), cleanLetterPart(letter.body), cleanLetterPart(letter.closing), signature]
    .filter(Boolean)
    .join('\n\n');
}

function clampScore(value) {
  const score = Number(value);
  if (!Number.isFinite(score) || score <= 0) return null;
  return Math.min(100, Math.round(score));
}

function renderInsights(cv) {
  const score = clampScore(cv.matchScore);
  scoreCard.classList.toggle('hidden', score === null);
  if (score !== null) {
    scoreValue.textContent = `${score} %`;
    if (score >= 75) scoreLabel.textContent = 'Bonne adéquation';
    else if (score >= 50) scoreLabel.textContent = 'Adéquation partielle';
    else scoreLabel.textContent = 'Adéquation faible';
    scoreMeter.style.width = `${score}%`;
  }

  const keywords = (cv.addedKeywords || []).filter(Boolean);
  keywordsCard.classList.toggle('hidden', keywords.length === 0);
  keywordsList.innerHTML = keywords.map((keyword) => `<span>${esc(keyword)}</span>`).join('');

  const tips = (cv.improvements || []).filter(Boolean);
  tipsCard.classList.toggle('hidden', tips.length === 0);
  tipsList.innerHTML = tips.map((tip) => `<li>${esc(tip)}</li>`).join('');
}

function getEntryTitle(entry) {
  if (entry.jobTitle) return entry.jobTitle;
  const fromLetter = String(entry.coverLetter?.subject || '')
    .replace(/^candidature\s+(?:au|pour le)\s+poste\s+de\s*/i, '')
    .trim();
  return fromLetter || entry.adaptedCV?.personalInfo?.title || 'Poste non précisé';
}

// ============================================================
// Downloads
// ============================================================
function handleDownloadCV() {
  if (!state.adaptedCV) return;
  try {
    const name = state.adaptedCV.personalInfo?.fullName || detectCandidateName(state.extractedText);
    const doc = generateAdaptedCVPDF(state.adaptedCV, name, state.profilePhotoDataURL, state.cvTemplate);
    const jobTitle = jobTitleInput.value.trim() || 'poste';
    const safe = jobTitle.replace(/[^a-zA-Z0-9àâäéèêëïîôùûüÿçæœ\s-]/g, '').replace(/\s+/g, '_').substring(0, 30);
    downloadPDF(doc, `CV_Adapte_${safe}.pdf`);
    showToast('Source LaTeX du CV téléchargée.', 'success');
  } catch (err) {
    console.error('Download error:', err);
    showToast('Erreur de génération du fichier.', 'error');
  }
}

function handleDownloadCoverLetter() {
  if (!state.coverLetter) return;
  try {
    const name = state.adaptedCV?.personalInfo?.fullName || detectCandidateName(state.extractedText);
    const jobTitle = jobTitleInput.value.trim();
    const company = companyNameInput.value.trim();
    const doc = generateCoverLetterPDF(state.coverLetter, name, jobTitle, company, state.letterTemplate);
    const safe = (company || jobTitle || 'candidature').replace(/[^a-zA-Z0-9àâäéèêëïîôùûüÿçæœ\s-]/g, '').replace(/\s+/g, '_').substring(0, 30);
    downloadPDF(doc, `Lettre_${safe}.pdf`); // Will save as .tex via pdf-generator.js downloadPDF fn
    showToast('Source LaTeX de la lettre téléchargée.', 'success');
  } catch (err) {
    console.error('Download error:', err);
    showToast('Erreur de génération du fichier.', 'error');
  }
}

async function handleCopyLetter() {
  if (!state.coverLetter) return;
  try {
    await navigator.clipboard.writeText(buildLetterText(state.coverLetter));
    showToast('Lettre copiée.', 'success');
  } catch (err) {
    console.error('Copy error:', err);
    showToast('Copie impossible : sélectionnez le texte manuellement.', 'error');
  }
}

function openLatexPreview(title, tex, engine) {
  latexDialogTitle.textContent = title;
  latexForm.querySelector('input[name="engine"]').value = engine;
  latexForm.target = 'latexIframe';
  latexInput.value = tex;
  latexIframe.src = 'about:blank';
  latexLoading.classList.remove('is-hidden');
  latexLoading.querySelector('p').textContent = engine === 'lualatex'
    ? 'Création du PDF, 30 à 60 secondes avec une photo...'
    : 'Création du PDF...';
  latexDialog.showModal();
  setTimeout(() => {
    latexIframe.dataset.pending = 'true';
    latexForm.submit();
  }, 200);
}

async function handlePreviewCV() {
  if (!state.adaptedCV) return;
  try {
    const name = state.adaptedCV.personalInfo?.fullName || detectCandidateName(state.extractedText);
    const tex = generateAdaptedCVPDF(state.adaptedCV, name, state.profilePhotoDataURL, state.cvTemplate);

    // Clean up any previously injected companion files
    latexForm.querySelectorAll('.aux-file-field').forEach(el => el.remove());

    if (['altacv', 'maltacv', 'mycv'].includes(state.cvTemplate)) {
      const clsFile = state.cvTemplate === 'mycv' ? 'my_cv.cls' : state.cvTemplate + '.cls';
      try {
        const clsResp = await fetch('/' + clsFile);
        if (!clsResp.ok) throw new Error(`HTTP ${clsResp.status}`);
        const clsText = await clsResp.text();

        // Inject cls BEFORE the main textarea so TeXLive.net sees it first
        const clsNameInput = document.createElement('input');
        clsNameInput.type = 'hidden';
        clsNameInput.name = 'filename[]';
        clsNameInput.className = 'aux-file-field';
        clsNameInput.value = clsFile;

        const clsContentArea = document.createElement('textarea');
        clsContentArea.name = 'filecontents[]';
        clsContentArea.className = 'aux-file-field';
        clsContentArea.style.display = 'none';
        clsContentArea.value = clsText;

        // Insert the cls fields at the TOP of the form, before the main document textarea
        latexForm.insertBefore(clsContentArea, latexInput);
        latexForm.insertBefore(clsNameInput, clsContentArea);

      } catch (fetchErr) {
        console.warn(`Could not fetch ${clsFile}:`, fetchErr);
        showToast(`${clsFile} introuvable — vérifiez le dossier /public.`, 'error', 5000);
      }
    }

    openLatexPreview('Votre CV en PDF', tex, getEngineForTemplate(state.cvTemplate, Boolean(state.profilePhotoDataURL)));
  } catch (err) {
    console.error('Preview error:', err);
    showToast('Erreur lors de la création du PDF.', 'error');
  }
}

function handlePreviewCoverLetter() {
  if (!state.coverLetter) return;
  try {
    const name = state.adaptedCV?.personalInfo?.fullName || detectCandidateName(state.extractedText);
    const jobTitle = jobTitleInput.value.trim();
    const company = companyNameInput.value.trim();
    const tex = generateCoverLetterPDF(state.coverLetter, name, jobTitle, company, state.letterTemplate);
    latexForm.querySelectorAll('.aux-file-field').forEach(el => el.remove());
    openLatexPreview('Votre lettre en PDF', tex, 'pdflatex');
  } catch (err) {
    console.error('Preview error:', err);
    showToast('Erreur lors de la création du PDF.', 'error');
  }
}

// ============================================================
// Name Detection (3-strategy approach)
// ============================================================
function detectCandidateName(text) {
  if (!text) return '';
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // Strategy 1: First 5 lines, look for name patterns
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    if (line.includes('@') || line.includes('http') || line.includes('www.')) continue;
    if (/^\d/.test(line) || line.length > 50) continue;
    if (line.toLowerCase().includes('curriculum') || line.toLowerCase().includes('cv ')) continue;

    const words = line.split(/\s+/);
    if (words.length >= 2 && words.length <= 5) {
      const allCap = words.every(w => /^[A-ZÀ-ÿ]/.test(w) || w.length <= 2);
      if (allCap) return line;
    }

    if (/^[A-ZÀ-Ÿ\s-]{4,40}$/.test(line) && words.length >= 2 && words.length <= 4) {
      return line.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }
  }

  // Strategy 2: "Nom:" pattern
  for (const line of lines.slice(0, 15)) {
    const m = line.match(/(?:nom\s*:?\s*|name\s*:?\s*)(.+)/i);
    if (m && m[1].length < 40) return m[1].trim();
  }

  // Strategy 3: First short line
  for (const line of lines.slice(0, 3)) {
    if (line.length >= 4 && line.length <= 35 && !line.includes('@')) return line;
  }

  return '';
}

// ============================================================
// Utilities
// ============================================================
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' octets';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
  return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
}

function formatCount(count, noun) {
  return `${count.toLocaleString('fr-FR')} ${noun}${count > 1 ? 's' : ''}`;
}

function formatDate(value) {
  return new Date(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function esc(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================
// Template Gallery
// ============================================================
function syncTemplateUI() {
  const name = TEMPLATES[state.cvTemplate]?.name || state.cvTemplate;
  $$('.js-template-name').forEach((el) => { el.textContent = name; });
  $$('.js-template-swatch').forEach((el) => { el.className = `template-swatch js-template-swatch ${state.cvTemplate}`; });
}

function openTemplateGallery() {
  const current = TEMPLATES[state.cvTemplate] ? state.cvTemplate : 'classic';
  templateOptions.innerHTML = Object.entries(TEMPLATES).map(([id, template]) => `
    <label class="template-option">
      <input type="radio" name="cvTemplateChoice" value="${id}" ${id === current ? 'checked autofocus' : ''} />
      <span class="template-swatch ${id}" aria-hidden="true"><i></i><i></i><i></i></span>
      <span><strong>${template.name}</strong><small>${template.description}</small></span>
    </label>`).join('');
  templatePreviewContent.innerHTML = renderTemplatePreview(current);
  templateDialog.showModal();
}

function selectPreviewedTemplate() {
  const choice = $('input[name="cvTemplateChoice"]:checked')?.value;
  templateDialog.close();
  if (!choice || choice === state.cvTemplate) return;
  state.cvTemplate = choice;
  localStorage.setItem(TEMPLATE_KEY, choice);
  syncTemplateUI();
  if (state.adaptedCV) renderResults();
  showToast(`Modèle « ${TEMPLATES[choice].name} » appliqué.`, 'success');
}

// ============================================================
// History System (localStorage)
// ============================================================
const HISTORY_KEY = 'adaptacv_history';
const MAX_HISTORY = 20;

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch { return []; }
}

function writeHistory(history) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (e) {
    console.warn('History storage full', e);
    showToast('Mémoire locale pleine : ce dossier n’a pas été ajouté à l’historique.', 'info', 6000);
  }
  updateHistoryBadge();
}

function saveToHistory(entry) {
  const history = getHistory();
  history.unshift(entry);
  if (history.length > MAX_HISTORY) history.splice(MAX_HISTORY);
  writeHistory(history);
}

function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
  updateHistoryBadge();
}

function updateHistoryBadge() {
  const count = getHistory().length;
  historyBadge.textContent = count;
  historyBadge.classList.toggle('hidden', count === 0);
}

function removeHistoryEntry(entry) {
  const history = getHistory();
  const index = history.findIndex((item) => item.id === entry.id);
  writeHistory(history.filter((item) => item.id !== entry.id));
  renderHistoryList();
  showToast('Candidature supprimée.', 'info', 6000, {
    label: 'Annuler',
    onClick: () => {
      const restored = getHistory();
      restored.splice(index, 0, entry);
      writeHistory(restored);
      renderHistoryList();
    },
  });
}

function openHistoryEntry(entry) {
  state.adaptedCV = entry.adaptedCV;
  state.coverLetter = entry.coverLetter;
  state.cvTemplate = entry.cvTemplate || 'classic';
  includeCoverLetterInput.checked = Boolean(entry.coverLetter);
  updateGenerationChoice();
  jobTitleInput.value = entry.jobTitle || '';
  companyNameInput.value = entry.companyName || '';
  syncTemplateUI();
  successMark.classList.remove('is-fresh');
  setActiveDoc('cv');
  renderResults();
  goToStep(3);
}

function normalizeSearch(value) {
  return String(value || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function renderHistoryStats(history) {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const scores = history.map((entry) => clampScore(entry.matchScore)).filter((score) => score !== null);
  statTotal.textContent = history.length;
  statWeek.textContent = history.filter((entry) => new Date(entry.date).getTime() >= weekAgo).length;
  statScore.textContent = scores.length
    ? `${Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)} %`
    : '–';
}

function renderHistoryList() {
  const history = getHistory();
  const query = normalizeSearch(historySearch.value.trim());
  const visible = history.filter((entry) => normalizeSearch(`${getEntryTitle(entry)} ${entry.companyName}`).includes(query));

  historyEmpty.classList.toggle('hidden', history.length > 0);
  historyToolbar.classList.toggle('hidden', history.length === 0);
  historyStats.classList.toggle('hidden', history.length === 0);
  historyTable.classList.toggle('hidden', visible.length === 0);
  historyNoMatch.classList.toggle('hidden', history.length === 0 || visible.length > 0);
  renderHistoryStats(history);

  historyList.innerHTML = '';
  visible.forEach((entry) => {
    const title = getEntryTitle(entry);
    const score = clampScore(entry.matchScore);
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>
        <button class="history-open-btn truncate" type="button">${esc(title)}</button>
        <span class="history-company">${entry.companyName ? esc(entry.companyName) : 'Entreprise non précisée'}</span>
      </td>
      <td>${entry.coverLetter ? 'CV et lettre' : 'CV seul'}</td>
      <td>${score === null ? '–' : `<span class="history-score">${score} %<span class="meter" aria-hidden="true"><span style="width:${score}%"></span></span></span>`}</td>
      <td class="history-date"><time datetime="${esc(entry.date)}">${formatDate(entry.date)}</time></td>
      <td class="history-actions"><button class="btn btn-ghost btn-icon js-delete" type="button" title="Supprimer" aria-label="Supprimer ${esc(title)}">${icon('delete')}</button></td>
    `;
    row.addEventListener('click', (e) => {
      if (e.target.closest('.js-delete')) removeHistoryEntry(entry);
      else openHistoryEntry(entry);
    });
    historyList.appendChild(row);
  });
}

// ============================================================
// Profile view
// ============================================================
function renderProfile() {
  const source = getSavedCV() || (hasCV() ? { name: 'CV de cette session', text: state.extractedText, numPages: state.numPages } : null);
  profileEmpty.classList.toggle('hidden', Boolean(source));
  profileContent.classList.toggle('hidden', !source);
  if (!source) return;

  profileName.textContent = source.name || 'CV enregistré';
  profileMeta.textContent = describeSource(source);
  if (document.activeElement !== profileText) profileText.value = source.text;
  profileCharCount.textContent = formatCount(profileText.value.length, 'caractère');
  profileSaveStatus.classList.remove('is-error');
  profileSaveStatus.textContent = '';
}

function saveProfileText() {
  const text = profileText.value.trim();
  if (text.length < MIN_CV_LENGTH) {
    profileSaveStatus.classList.add('is-error');
    profileSaveStatus.textContent = `Non enregistré : ${MIN_CV_LENGTH} caractères minimum`;
    return;
  }
  const source = getSavedCV() || { name: 'CV collé', numPages: 0, method: 'manuel', size: 0 };
  state.extractedText = text;
  saveSourceProfile(source.name, text, source.numPages, source.method, source.size);
  extractedTextEl.textContent = text;
  profileMeta.textContent = describeSource(getSavedCV() || source);
  profileSaveStatus.classList.remove('is-error');
  profileSaveStatus.textContent = 'Enregistré';
}

// ============================================================
// CV previews
// ============================================================
function renderLiveCVPreview(cv, template) {
  const pi = cv.personalInfo || {};
  const photo = state.profilePhotoDataURL
    ? `<img class="cvp-photo" src="${state.profilePhotoDataURL}" alt="Photo de profil">`
    : '';
  const contactValues = [pi.email, pi.phone, pi.location, pi.linkedin, pi.website, pi.github].filter(Boolean);
  const contacts = contactValues.map(esc).join(' · ');
  const contactLines = contactValues.map(value => `<span>${esc(value)}</span>`).join('');
  const skills = (cv.keySkills || []).map(skill => `<span>${esc(skill)}</span>`).join('');
  const experience = (cv.experience || []).map(exp => `
    <div class="cvp-entry">
      <div class="cvp-entry-head"><strong>${esc(exp.title || '')}</strong><time>${esc(exp.period || '')}</time></div>
      <b>${esc(exp.company || '')}</b>
      ${exp.description ? `<p>${esc(exp.description)}</p>` : ''}
      ${exp.bullets?.length ? `<ul>${exp.bullets.map(item => `<li>${esc(item)}</li>`).join('')}</ul>` : ''}
    </div>`).join('');
  const education = (cv.education || []).map(edu => `
    <div class="cvp-entry">
      <div class="cvp-entry-head"><strong>${esc(edu.degree || '')}</strong><time>${esc(edu.period || '')}</time></div>
      <b>${esc(edu.school || '')}</b>
      ${edu.description ? `<p>${esc(edu.description)}</p>` : ''}
    </div>`).join('');
  const projects = (cv.projects || []).map(project => `
    <div class="cvp-entry">
      <div class="cvp-entry-head"><strong>${esc(project.name || '')}</strong></div>
      ${project.description ? `<p>${esc(project.description)}</p>` : ''}
    </div>`).join('');
  const certifications = (cv.certifications || []).filter(Boolean).map(esc).join(' · ');
  const languages = (cv.languages || []).filter(Boolean).map(esc).join(' · ');

  const summary = cv.summary ? `<section><h4>Profil</h4><p>${esc(cv.summary)}</p></section>` : '';
  const experienceSection = experience ? `<section><h4>${template === 'executive' ? 'Parcours professionnel' : 'Expérience'}</h4>${experience}</section>` : '';
  const educationSection = education ? `<section><h4>Formation</h4>${education}</section>` : '';
  const skillsSection = skills ? `<section class="cvp-skills"><h4>${template === 'executive' ? 'Expertises' : 'Compétences'}</h4><div>${skills}</div></section>` : '';
  const projectsSection = projects ? `<section><h4>Projets</h4>${projects}</section>` : '';
  const certificationsSection = certifications ? `<section><h4>Certifications</h4><p>${certifications}</p></section>` : '';
  const languagesSection = languages ? `<section><h4>Langues</h4><p>${languages}</p></section>` : '';
  const extras = `${projectsSection}${certificationsSection}${languagesSection}`;
  const header = `<header>${photo}<div><h3>${esc(pi.fullName || 'Candidat')}</h3><p>${esc(pi.title || '')}</p><small>${contacts}</small></div></header>`;

  if (template === 'modern') {
    const sidebarLanguages = languages ? `<h4>Langues</h4><div class="cvp-sidebar-list">${(cv.languages || []).filter(Boolean).map(value => `<span>${esc(value)}</span>`).join('')}</div>` : '';
    return `<div class="cvp-page"><aside>${photo}<h4>Contact</h4><div class="cvp-sidebar-list">${contactLines}</div>${skillsSection}${sidebarLanguages}</aside><main>${header.replace(photo, '')}${summary}${experienceSection}${educationSection}${projectsSection}${certificationsSection}</main></div>`;
  }
  if (template === 'bold') {
    return `<div class="cvp-page"><i class="cvp-colorbar"></i>${header}${skillsSection}${summary}${experienceSection}${educationSection}${extras}</div>`;
  }
  return `<div class="cvp-page">${header}${summary}${template === 'classic' ? skillsSection : ''}${experienceSection}${educationSection}${template !== 'classic' ? skillsSection : ''}${extras}</div>`;
}

function renderTemplatePreview(template) {
  // Sample data for preview
  const previewPhoto = state.profilePhotoDataURL
    ? `<img class="tpf-photo" src="${state.profilePhotoDataURL}" alt="Photo de profil">`
    : '';
  const sampleSkills = ['JavaScript', 'Python', 'React', 'Docker', 'SQL', 'Git'];
  const skills = sampleSkills.map(s => `<span class="tpf-badge">${s}</span>`).join('');
  const skillsBold = sampleSkills.map(s => `<span class="tpf-badge tpf-badge-bold">${s}</span>`).join('');

  const sectionCV = (title, cls = '') => `<div class="tpf-section-title ${cls}">${title}</div>`;
  const loremShort = 'Ingénieur logiciel orienté produit, spécialisé dans la conception d’interfaces web fiables et accessibles.';
  const loremBullets = '<span class="tpf-bullet">Conception et évolution d’applications web avec React et Node.js</span><span class="tpf-bullet">Mise en place de pipelines CI/CD avec Docker et GitLab</span><span class="tpf-bullet">Amélioration continue des performances et de la qualité du code</span>';
  const expBlock = () => `<div><div class="tpf-entry-title">Ingénieur logiciel</div><div class="tpf-entry-meta">Atelier Numérique · 2021–2024</div><div class="tpf-text">${loremBullets}</div></div>`;
  const eduBlock = () => `<div><div class="tpf-entry-title">Master Informatique</div><div class="tpf-entry-meta">Université de Lyon · 2019</div></div>`;

  switch (template) {
    case 'classic':
      return `<div class="tpf-classic">
        <div class="tpf-topbar"></div>
        <div class="tpf-body">
          ${previewPhoto}
          <div class="tpf-name">Camille Martin</div>
          <div class="tpf-title">Ingénieur logiciel web</div>
          <div class="tpf-contact">camille.martin@email.com  ·  +33 6 12 34 56  ·  Lyon, France</div>
          <div class="tpf-divider"></div>
          ${sectionCV('Profil')}
          <div class="tpf-text">${loremShort}</div>
          ${sectionCV('Compétences')}
          <div>${skills}</div>
          ${sectionCV('Expérience Professionnelle')}
          ${expBlock()}
          ${sectionCV('Formation')}
          ${eduBlock()}
        </div>
      </div>`;

    case 'modern':
      return `<div class="tpf-modern">
        <div class="tpf-sidebar">
          ${previewPhoto}
          ${sectionCV('Contact', 'tpf-section-title-dark')}
          <div class="tpf-sidebar-list"><span>camille@email.com</span><span>+33 6 12 34 56</span><span>Lyon, France</span></div>
          ${sectionCV('Compétences', 'tpf-section-title-dark')}
          <div class="tpf-sidebar-list">${sampleSkills.map(skill => `<span>${skill}</span>`).join('')}</div>
          ${sectionCV('Langues', 'tpf-section-title-dark')}
          <div class="tpf-sidebar-list"><span>Français · Natif</span><span>Anglais · Courant</span></div>
        </div>
        <div class="tpf-main">
          <div class="tpf-name">Camille Martin</div>
          <div class="tpf-title">Ingénieur logiciel web</div>
          ${sectionCV('Profil')}
          <div class="tpf-text">${loremShort}</div>
          ${sectionCV('Expérience')}
          ${expBlock()}
          ${sectionCV('Formation')}
          ${eduBlock()}
        </div>
      </div>`;

    case 'minimal':
      return `<div class="tpf-minimal">
        ${previewPhoto}
        <div class="tpf-name">Camille Martin</div>
        <div class="tpf-title">Ingénieur logiciel web</div>
        <div class="tpf-contact">camille@email.com · +33 6 12 34 56 · Lyon</div>
        <div class="tpf-sep"></div>
        <div style="text-align:left;">
          ${sectionCV('Profil')}
          <div class="tpf-text">${loremShort}</div>
          ${sectionCV('Expérience')}
          ${expBlock()}
          ${sectionCV('Formation')}
          ${eduBlock()}
          ${sectionCV('Compétences')}
          <div>${skills}</div>
        </div>
      </div>`;

    case 'executive':
      return `<div class="tpf-executive">
        <div class="tpf-band">
          <div><div class="tpf-name">Camille Martin</div><div class="tpf-title">Ingénieur logiciel web</div></div>${previewPhoto}
        </div>
        <div class="tpf-body">
          <div class="tpf-contact">camille@email.com · +33 6 12 34 56 · Lyon</div>
          ${sectionCV('Profil exécutif')}
          <div class="tpf-text">${loremShort}</div>
          ${sectionCV('Expérience')}
          ${expBlock()}
          ${sectionCV('Formation')}
          ${eduBlock()}
          ${sectionCV('Expertises')}
          <div>${skills}</div>
        </div>
      </div>`;

    case 'bold':
      return `<div class="tpf-bold">
        <div class="tpf-bold-bar"></div>
        <div class="tpf-body">
          <div class="tpf-bold-head"><div><div class="tpf-name">Camille Martin</div><div class="tpf-title">Ingénieur logiciel web</div><div class="tpf-contact">camille@email.com · Lyon, France</div></div>${previewPhoto}</div>
          <div class="tpf-bold-skills"><strong>Compétences clés</strong>${skillsBold}</div>
          ${sectionCV('Profil')}
          <div class="tpf-text">${loremShort}</div>
          ${sectionCV('Expériences sélectionnées')}
          ${expBlock()}
          ${sectionCV('Formation')}
          ${eduBlock()}
        </div>
      </div>`;

    default:
      return '<div class="tpf-classic"><div class="tpf-body">Aperçu non disponible</div></div>';
  }
}

// ============================================================
// Start
// ============================================================
init();
