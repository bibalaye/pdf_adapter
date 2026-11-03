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
  getSelectedModel,
  getProviderChoices,
  getProviderInfo,
  getCustomModel,
  getLiveModels,
  saveSettings,
  saveCustomModel,
  deleteCustomModel,
  normalizeEndpoint,
  isAIReady,
  isCustomProviderId,
  getOpenRouterAllowsCollection,
  setOpenRouterAllowsCollection,
  fetchAvailableModels,
  testConnection,
  getProviderName,
  getProviderDisplayName,
  getLastModelUsed,
  onAIStatus,
  adaptCV,
  generateCoverLetter,
} from './ai-service.js';
import { runHiringPanel } from './hiring-panel.js';
import { enforceFidelity, findUnattestedNumbers, keywordCoverage, cvToText } from './fidelity.js';
import {
  buildCVDocument,
  generateCoverLetterPDF,
  downloadPDF,
  getEngineForTemplate,
} from './pdf-generator.js';
import {
  TEMPLATE_CATALOG,
  TEMPLATE_CATEGORIES,
  DEFAULT_TEMPLATE,
  SAMPLE_CV,
  getTemplateLabels,
} from './cv-templates.js';
import { showToast } from './toast.js';
import { icon } from './icon.js';

// ============================================================
// Constants
// ============================================================
const SAVED_CV_KEY = 'adaptacv_source_profile';
const PHOTO_KEY = 'adaptacv_profile_photo';
const TEMPLATE_KEY = 'adaptacv_cv_template';
const OFFER_DRAFT_KEY = 'adaptacv_offer_draft';
const PANEL_KEY = 'adaptacv_panel_enabled';
const PANEL_ISOLATED_KEY = 'adaptacv_panel_isolated';
const OTHER_MODEL = '__other__';
const LOADING_HINT = 'Gardez cet onglet ouvert.';
const VERDICT_LABELS = { yes: 'Retenu', maybe: 'À revoir', no: 'Écarté' };
const MAX_PHOTO_SIDE = 900;
const LEGACY_TEMPLATES = { altacv: 'alta', twentysecond: 'panel' };
const MIN_OFFER_LENGTH = 20;
const MIN_CV_LENGTH = 50;
const FULL_OFFER_LENGTH = 200;

const ROUTES = {
  '#/cv-source': { view: 'new', step: 1, title: 'Nouvelle candidature' },
  '#/offre': { view: 'new', step: 2, title: 'Nouvelle candidature' },
  '#/dossier': { view: 'new', step: 3, title: 'Nouvelle candidature' },
  '#/candidatures': { view: 'applications', title: 'Candidatures' },
  '#/mon-cv': { view: 'profile', title: 'Mon CV' },
};
const STEP_ROUTES = { 1: '#/cv-source', 2: '#/offre', 3: '#/dossier' };

function resolveTemplate(id) {
  const current = LEGACY_TEMPLATES[id] || id;
  return TEMPLATE_CATALOG[current] ? current : DEFAULT_TEMPLATE;
}

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
  panel: null,
  fidelity: null,
  coverage: null,
  modelUsed: null,
  profilePhotoDataURL: null,
  cvTemplate: resolveTemplate(storedTemplate),
  docLanguage: 'fr',
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
const includePanelInput = $('#includePanel');
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
const templateFilters = $('#templateFilters');
const templateFacts = $('#templateFacts');
const templateCredit = $('#templateCredit');
const templateSampleBtn = $('#templateSampleBtn');
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
const loadingStepPanel = $('#loadingStepPanel');
const loadingStepFix = $('#loadingStepFix');
const loadingSubtitle = $('#loadingSubtitle');
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
const previewNote = $('#previewNote');
const coverLetterPreview = $('#coverLetterPreview');
const scoreCard = $('#scoreCard');
const scoreValue = $('#scoreValue');
const scoreLabel = $('#scoreLabel');
const scoreMeter = $('#scoreMeter');
const keywordsCard = $('#keywordsCard');
const keywordsList = $('#keywordsList');
const tipsCard = $('#tipsCard');
const tipsList = $('#tipsList');
const coverageLine = $('#coverageLine');
const panelCard = $('#panelCard');
const panelFailed = $('#panelFailed');
const panelBody = $('#panelBody');
const screenBefore = $('#screenBefore');
const screenArrow = $('#screenArrow');
const screenAfter = $('#screenAfter');
const panelReviews = $('#panelReviews');
const panelMistakesBox = $('#panelMistakesBox');
const panelMistakesTitle = $('#panelMistakesTitle');
const panelMistakes = $('#panelMistakes');
const questionsCard = $('#questionsCard');
const questionsList = $('#questionsList');
const fidelityCard = $('#fidelityCard');
const fidelitySummary = $('#fidelitySummary');
const fidelityList = $('#fidelityList');
const resultModel = $('#resultModel');

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
const providerGrid = $('#providerGrid');
const addCustomModelBtn = $('#addCustomModelBtn');
const customModelForm = $('#customModelForm');
const customFormTitle = $('#customFormTitle');
const customName = $('#customName');
const customUrl = $('#customUrl');
const customModelId = $('#customModelId');
const customKey = $('#customKey');
const customFormError = $('#customFormError');
const customSaveBtn = $('#customSaveBtn');
const customCancelBtn = $('#customCancelBtn');
const customModelInfo = $('#customModelInfo');
const customInfoModel = $('#customInfoModel');
const customInfoUrl = $('#customInfoUrl');
const customEditBtn = $('#customEditBtn');
const customDeleteBtn = $('#customDeleteBtn');
const modelField = $('#modelField');
const modelSelect = $('#modelSelect');
const modelCustomId = $('#modelCustomId');
const modelHint = $('#modelHint');
const refreshModelsBtn = $('#refreshModelsBtn');
const apiKeyLabel = $('#apiKeyLabel');
const apiKeyInput = $('#apiKey');
const apiKeyError = $('#apiKeyError');
const testConnectionBtn = $('#testConnectionBtn');
const testConnectionResult = $('#testConnectionResult');
const providerDataText = $('#providerDataText');
const openrouterCollectionRow = $('#openrouterCollectionRow');
const openrouterAllowCollection = $('#openrouterAllowCollection');
const panelIsolatedInput = $('#panelIsolated');
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
  includePanelInput.checked = localStorage.getItem(PANEL_KEY) !== 'false';
  onAIStatus(handleAIStatus);
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
  languageInputs.forEach((input) => { input.checked = input.value === settings.language; });
  panelIsolatedInput.checked = localStorage.getItem(PANEL_ISOLATED_KEY) === 'true';
  openrouterAllowCollection.checked = getOpenRouterAllowsCollection();
  renderProviderOptions(settings.provider);
}

function handleAIStatus(status) {
  if (status.type === 'waiting') {
    loadingSubtitle.textContent = `Limite gratuite de ${status.provider} atteinte : reprise dans ${status.seconds} s.`;
  } else if (status.type === 'resumed') {
    loadingSubtitle.textContent = LOADING_HINT;
  } else if (status.type === 'model-fallback') {
    showToast(`${status.from} est indisponible : ${status.to} prend le relais.`, 'info', 6000);
  }
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
  const keyReady = isAIReady();

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
  includePanelInput.addEventListener('change', () => {
    localStorage.setItem(PANEL_KEY, String(includePanelInput.checked));
  });
  languageInputs.forEach((input) => input.addEventListener('change', () => {
    const settings = getSettings();
    saveSettings(settings.provider, settings.apiKey, input.value, settings.model);
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
  templateOptions.addEventListener('change', (e) => renderGalleryPreview(e.target.value));
  templateFilters.addEventListener('click', (e) => {
    const filter = e.target.closest('[data-filter]');
    if (filter) renderGalleryOptions(filter.dataset.filter);
  });
  previewSelectBtn.addEventListener('click', selectPreviewedTemplate);
  templateSampleBtn.addEventListener('click', handleTemplateSample);

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
  questionsCard.addEventListener('submit', handleQuestionsSubmit);

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

  providerGrid.addEventListener('change', () => syncProviderFields(getFormProvider()));
  modelSelect.addEventListener('change', () => {
    const other = modelSelect.value === OTHER_MODEL;
    modelCustomId.classList.toggle('hidden', !other);
    if (other) modelCustomId.focus();
    testConnectionResult.textContent = '';
  });
  refreshModelsBtn.addEventListener('click', () => refreshModels(getFormProvider()));
  testConnectionBtn.addEventListener('click', handleTestConnection);
  addCustomModelBtn.addEventListener('click', () => openCustomForm());
  customEditBtn.addEventListener('click', () => openCustomForm(getCustomModel(getFormProvider())));
  customCancelBtn.addEventListener('click', closeCustomForm);
  customSaveBtn.addEventListener('click', handleCustomSave);
  customDeleteBtn.addEventListener('click', handleCustomDelete);

  toggleApiKeyBtn.addEventListener('click', () => {
    const reveal = apiKeyInput.type === 'password';
    apiKeyInput.type = reveal ? 'text' : 'password';
    toggleApiKeyBtn.innerHTML = icon(reveal ? 'visibility_off' : 'visibility');
    toggleApiKeyBtn.setAttribute('aria-label', reveal ? 'Masquer la clé' : 'Afficher la clé');
  });

  apiKeyInput.addEventListener('input', () => apiKeyError.classList.add('hidden'));

  saveSettingsBtn.addEventListener('click', () => {
    const apiKey = apiKeyInput.value.trim();
    const provider = getFormProvider();
    const resume = state.pendingGenerate;
    if (resume && !apiKey && !isCustomProviderId(provider)) {
      apiKeyError.classList.remove('hidden');
      apiKeyInput.focus();
      return;
    }
    saveSettings(provider, apiKey, getSettings().language, getFormModel());
    localStorage.setItem(PANEL_ISOLATED_KEY, String(panelIsolatedInput.checked));
    setOpenRouterAllowsCollection(openrouterAllowCollection.checked);
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
  closeCustomForm();
  apiKeyError.classList.add('hidden');
  settingsContext.classList.toggle('hidden', !state.pendingGenerate);
  settingsContextText.textContent = apiKeyInput.value
    ? 'Corrigez la clé si besoin : votre offre est conservée et l’adaptation redémarre dès l’enregistrement.'
    : 'Il manque une clé API pour lancer l’adaptation. Votre offre est conservée : la génération démarre dès l’enregistrement.';
  saveSettingsBtn.textContent = state.pendingGenerate ? 'Enregistrer et adapter' : 'Enregistrer';
  apiKeyInput.autofocus = state.pendingGenerate;
  settingsDialog.showModal();
}

function getFormProvider() {
  return $('input[name="aiProvider"]:checked')?.value || getSettings().provider;
}

function getFormModel() {
  return modelSelect.value === OTHER_MODEL ? modelCustomId.value.trim() : modelSelect.value;
}

function renderProviderOptions(selected) {
  providerGrid.innerHTML = getProviderChoices().map((choice) => `
    <label class="provider-option">
      <input type="radio" name="aiProvider" value="${esc(choice.id)}" ${choice.id === selected ? 'checked' : ''} />
      <span>
        <strong>${esc(choice.name)}</strong>
        <small>${esc(choice.tagline)}</small>
        ${choice.hasKey ? '<i class="provider-key">Clé enregistrée</i>' : ''}
      </span>
    </label>`).join('');
  syncProviderFields(selected);
}

function syncProviderFields(providerId) {
  const custom = isCustomProviderId(providerId);
  modelField.classList.toggle('hidden', custom);
  customModelInfo.classList.toggle('hidden', !custom);
  apiKeyLink.classList.toggle('hidden', custom);
  openrouterCollectionRow.classList.toggle('hidden', providerId !== 'openrouter');
  apiKeyLabel.textContent = custom ? 'Clé API (optionnelle)' : 'Clé API';
  apiKeyInput.value = getApiKey(providerId);
  apiKeyError.classList.add('hidden');
  testConnectionResult.textContent = '';
  modelHint.classList.add('hidden');

  if (custom) {
    const record = getCustomModel(providerId);
    customInfoModel.textContent = record?.model || '';
    customInfoUrl.textContent = record?.baseUrl || '';
    providerDataText.textContent = `Votre CV et votre clé sont envoyés à ${record ? new URL(record.baseUrl).host : 'ce service'}. Vérifiez que vous lui faites confiance.`;
    return;
  }

  const info = getProviderInfo(providerId);
  apiKeyLink.href = info.keyUrl;
  apiKeyLinkLabel.textContent = info.keyLabel;
  providerDataText.textContent = info.dataNote;
  renderModelOptions(providerId, getSelectedModel(providerId));
  if (info.modelsArePublic && getLiveModels(providerId).length === 0) refreshModels(providerId, { silent: true });
}

function renderModelOptions(providerId, selected) {
  const info = getProviderInfo(providerId);
  const catalogIds = info.models.map((model) => model.id);
  const liveIds = getLiveModels(providerId).filter((id) => !catalogIds.includes(id));

  modelSelect.innerHTML = '';
  const catalog = document.createElement('optgroup');
  catalog.label = 'Sélection AdaptaCV';
  info.models.forEach((model) => {
    catalog.appendChild(new Option(model.hint ? `${model.label} (${model.hint})` : model.label, model.id));
  });
  modelSelect.appendChild(catalog);
  if (liveIds.length) {
    const live = document.createElement('optgroup');
    live.label = providerId === 'openrouter' ? 'Autres modèles gratuits' : 'Disponibles sur votre compte';
    liveIds.forEach((id) => live.appendChild(new Option(id, id)));
    modelSelect.appendChild(live);
  }
  modelSelect.appendChild(new Option('Autre identifiant…', OTHER_MODEL));

  const isOther = Boolean(selected) && !catalogIds.includes(selected) && !liveIds.includes(selected);
  modelSelect.value = isOther ? OTHER_MODEL : selected;
  modelCustomId.classList.toggle('hidden', !isOther);
  modelCustomId.value = isOther ? selected : '';
}

function showModelHint(text) {
  modelHint.textContent = text;
  modelHint.classList.remove('hidden');
}

async function refreshModels(providerId, { silent = false } = {}) {
  const info = getProviderInfo(providerId);
  if (!info) return;
  const apiKey = apiKeyInput.value.trim();
  if (!apiKey && !info.modelsArePublic) {
    if (!silent) showModelHint('Ajoutez d’abord votre clé pour lister les modèles de votre compte.');
    return;
  }
  if (!silent) showModelHint('Recherche des modèles...');
  try {
    const selected = getFormModel();
    const models = await fetchAvailableModels(providerId, apiKey);
    if (getFormProvider() !== providerId) return;
    renderModelOptions(providerId, selected);
    if (!silent) showModelHint(`${formatCount(models.length, 'modèle')} trouvé${models.length > 1 ? 's' : ''}.`);
  } catch (error) {
    console.warn('Model list unavailable', error);
    if (!silent) showModelHint('Liste indisponible. Vérifiez la clé, ou saisissez l’identifiant du modèle.');
  }
}

async function handleTestConnection() {
  const provider = getFormProvider();
  const apiKey = apiKeyInput.value.trim();
  if (!apiKey && !isCustomProviderId(provider)) {
    apiKeyError.classList.remove('hidden');
    apiKeyInput.focus();
    return;
  }
  testConnectionBtn.disabled = true;
  testConnectionResult.textContent = 'Test en cours...';
  try {
    const model = isCustomProviderId(provider) ? getCustomModel(provider)?.model : getFormModel();
    const { elapsedMs } = await testConnection({ provider, model, apiKey });
    testConnectionResult.textContent = `Connexion réussie en ${elapsedMs.toLocaleString('fr-FR')} ms.`;
  } catch (error) {
    console.warn('Connection test failed', error);
    testConnectionResult.textContent = describeGenerationError(error).title;
  } finally {
    testConnectionBtn.disabled = false;
  }
}

let editingCustomId = null;

function openCustomForm(record = null) {
  editingCustomId = record?.id || null;
  customFormTitle.textContent = record ? 'Modifier ce modèle' : 'Ajouter un modèle';
  customName.value = record?.name || '';
  customUrl.value = record?.baseUrl || '';
  customModelId.value = record?.model || '';
  customKey.value = record?.apiKey || '';
  customFormError.classList.add('hidden');
  customModelForm.classList.remove('hidden');
  saveSettingsBtn.disabled = true;
  customName.focus();
}

function closeCustomForm() {
  editingCustomId = null;
  customModelForm.classList.add('hidden');
  saveSettingsBtn.disabled = false;
}

function handleCustomSave() {
  const name = customName.value.trim();
  const model = customModelId.value.trim();
  const { url, error } = normalizeEndpoint(customUrl.value);
  const problem = !name ? 'Donnez un nom à ce modèle.'
    : error ? error
    : !model ? 'Indiquez l’identifiant du modèle.'
    : '';
  if (problem) {
    customFormError.textContent = problem;
    customFormError.classList.remove('hidden');
    return;
  }
  const saved = saveCustomModel({ id: editingCustomId, name, baseUrl: url, model, apiKey: customKey.value.trim() });
  closeCustomForm();
  renderProviderOptions(saved.providerId);
}

async function handleCustomDelete() {
  const provider = getFormProvider();
  const record = getCustomModel(provider);
  const confirmed = await confirmAction({
    title: `Supprimer « ${record?.name || 'ce modèle'} » ?`,
    body: 'Son adresse et sa clé seront retirées de ce navigateur.',
    confirmLabel: 'Supprimer',
  });
  if (!confirmed) return;
  deleteCustomModel(provider);
  closeCustomForm();
  renderProviderOptions(getSettings().provider);
  refreshStatus();
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
  reader.onload = async (e) => {
    setProfilePhoto(await downscalePhoto(e.target.result));
    const unsupported = TEMPLATE_CATALOG[state.cvTemplate]?.photo === false;
    showToast(unsupported ? `Photo enregistrée, mais le modèle « ${TEMPLATE_CATALOG[state.cvTemplate].name} » n’en affiche pas.` : 'Photo ajoutée au CV.', unsupported ? 'info' : 'success');
  };
  reader.readAsDataURL(file);
}

/**
 * A photo printed at 3 cm needs no more: this keeps the document light to send and to compile.
 */
function downscalePhoto(dataURL) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onerror = () => resolve(dataURL);
    image.onload = () => {
      const largest = Math.max(image.width, image.height);
      if (largest <= MAX_PHOTO_SIDE) {
        resolve(dataURL);
        return;
      }
      const ratio = MAX_PHOTO_SIDE / largest;
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(image.width * ratio);
      canvas.height = Math.round(image.height * ratio);
      const context = canvas.getContext('2d');
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };
    image.src = dataURL;
  });
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
  state.panel = null;
  state.fidelity = null;
  state.coverage = null;
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
  const keyReady = isAIReady();

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
  if (status === 404 || status === 410) {
    const collectionBlocked = /data policy|no endpoints/i.test(message);
    return {
      title: collectionBlocked ? 'Aucun hébergeur sans collecte de données pour ce modèle' : 'Modèle indisponible',
      detail: collectionBlocked
        ? 'Choisissez un autre modèle ou fournisseur, ou autorisez ces hébergeurs dans les réglages.'
        : 'Ce modèle n’est plus proposé. Choisissez-en un autre dans les réglages.',
      keyIssue: true,
    };
  }
  if (status === 413) {
    return { title: 'CV et offre trop longs pour ce modèle gratuit', detail: 'Raccourcissez l’offre, ou choisissez un autre modèle dans les réglages.', keyIssue: true };
  }
  if (status === 429) {
    return { title: `Limite gratuite de ${provider} atteinte`, detail: 'Les étapes déjà faites sont conservées. Réessayez plus tard, ou changez de modèle dans les réglages.', keyIssue: true };
  }
  if (status >= 500) {
    return { title: `${provider} est momentanément indisponible`, detail: 'Votre offre est conservée. Réessayez dans quelques instants.' };
  }
  if (err instanceof TypeError) {
    if (isCustomProviderId(getSettings().provider)) {
      return { title: `Connexion impossible à ${provider}`, detail: 'Vérifiez l’adresse, et que ce service autorise les appels depuis ce site (CORS).', keyIssue: true };
    }
    return { title: 'Connexion impossible', detail: 'Vérifiez votre connexion internet, puis réessayez.' };
  }
  return { title: 'La génération n’a pas abouti', detail: message || 'Réessayez dans quelques instants.' };
}

function showGenerationError(err) {
  const { title, detail, keyIssue } = describeGenerationError(err);
  generationErrorTitle.textContent = title;
  generationErrorDetail.textContent = detail;
  generationErrorSettings.classList.toggle('hidden', !keyIssue);
  generationErrorSettings.textContent = title.includes('clé API') ? 'Vérifier la clé' : 'Ouvrir les réglages';
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
  if (!isAIReady(settings)) {
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
  const withPanel = includePanelInput.checked;
  const { language } = settings;
  state.docLanguage = language;

  state.generating = true;
  goToStep(3);

  const steps = [loadingStep1, loadingStep2, loadingStepPanel, loadingStepFix, loadingStep3];
  steps.forEach((el) => el.classList.remove('active', 'done'));
  loadingStepPanel.classList.toggle('hidden', !withPanel);
  loadingStepFix.classList.toggle('hidden', !withPanel);
  loadingStep3.classList.toggle('hidden', !withLetter);
  loadingSubtitle.textContent = LOADING_HINT;

  const startStep = (el, title, progress) => {
    el.classList.add('active');
    loadingTitle.textContent = title;
    setProgress(progress);
  };
  const finishStep = (el) => {
    el.classList.remove('active');
    el.classList.add('done');
  };

  try {
    startStep(loadingStep1, 'Analyse du CV et de l’offre...', 10);

    const cvResult = await adaptCV(
      state.extractedText,
      jobDescription,
      jobTitle,
      companyName,
      (progress) => {
        if (progress === 'adapt-start') {
          finishStep(loadingStep1);
          startStep(loadingStep2, 'Adaptation du CV en cours...', 25);
        }
        if (progress === 'adapt-done') finishStep(loadingStep2);
      }
    );

    let draftCV = cvResult;
    let panel = null;
    if (withPanel) {
      try {
        const result = await runHiringPanel({
          cvText: state.extractedText,
          adaptedCV: cvResult,
          jobDescription,
          jobTitle,
          companyName,
          language,
          isolated: localStorage.getItem(PANEL_ISOLATED_KEY) === 'true',
          onProgress: (progress) => {
            if (progress === 'review-start') startStep(loadingStepPanel, 'Les relecteurs examinent votre CV...', 45);
            if (progress === 'review-done') finishStep(loadingStepPanel);
            if (progress === 'rebuild-start') startStep(loadingStepFix, 'Correction des erreurs relevées...', 65);
            if (progress === 'rebuild-done') finishStep(loadingStepFix);
          },
        });
        draftCV = result.cv;
        panel = result.panel;
      } catch (panelError) {
        // The adapted CV stays usable: the panel is an improvement, not a requirement
        console.warn('Hiring panel failed', panelError);
        steps.forEach((el) => el.classList.remove('active'));
        panel = { failed: true, reason: describeGenerationError(panelError).title };
      }
    }

    const fidelity = enforceFidelity(draftCV, state.extractedText, { language });

    let letterResult = null;
    if (withLetter) {
      startStep(loadingStep3, 'Rédaction de la lettre de motivation...', 85);
      letterResult = await generateCoverLetter(
        state.extractedText,
        jobDescription,
        jobTitle,
        companyName,
        (progress) => {
          if (progress === 'letter-done') finishStep(loadingStep3);
        }
      );
      const unattested = findUnattestedNumbers(
        [letterResult.opening, letterResult.body, letterResult.closing].join(' '),
        state.extractedText,
        jobDescription,
      );
      if (unattested.length) fidelity.warnings.push(`Lettre, chiffres à vérifier : ${unattested.join(', ')}`);
    }
    setProgress(100);

    const keywords = cvResult.offerAnalysis?.keywords || [];
    const coverage = keywords.length
      ? { before: keywordCoverage(state.extractedText, keywords), after: keywordCoverage(cvToText(fidelity.cv), keywords) }
      : null;
    // Wording taken from the offer without support in the source: a person must confirm it
    const borrowed = (coverage?.after.found || []).filter((term) => !coverage.before.found.includes(term));
    if (borrowed.length) fidelity.warnings.push(`Termes de l’offre absents de votre CV, à confirmer : ${borrowed.join(', ')}`);

    state.adaptedCV = fidelity.cv;
    state.coverLetter = letterResult;
    state.panel = panel;
    state.fidelity = { removed: fidelity.removed, warnings: fidelity.warnings };
    state.coverage = coverage;
    state.modelUsed = getLastModelUsed();

    // Save to history
    saveToHistory({
      id: Date.now(),
      date: new Date().toISOString(),
      jobTitle,
      companyName,
      jobDescription,
      candidateName: fidelity.cv.personalInfo?.fullName || detectCandidateName(state.extractedText) || 'Candidat',
      matchScore: fidelity.cv.matchScore || null,
      adaptedCV: fidelity.cv,
      coverLetter: letterResult,
      cvTemplate: state.cvTemplate,
      language,
      panel,
      fidelity: state.fidelity,
      coverage,
      modelUsed: state.modelUsed,
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
      showToast(state.coverLetter ? 'Votre candidature est prête.' : 'Votre CV est prêt.', 'success', 8000, {
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
  previewNote.classList.toggle('hidden', isLetter);
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
    adaptedCVPreview.innerHTML = renderLiveCVPreview(state.adaptedCV, state.cvTemplate);
    renderInsights(state.adaptedCV);
  }
  renderPanel();
  renderFidelity();
  resultModel.textContent = state.modelUsed ? `Généré avec ${state.modelUsed}.` : '';

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
  const signature = [letter.signoff || 'Cordialement,', candidateName].filter(Boolean).join('\n');
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
  tipsCard.classList.toggle('hidden', tips.length === 0 || Boolean(state.panel?.questions?.length));
  tipsList.innerHTML = tips.map((tip) => `<li>${esc(tip)}</li>`).join('');

  coverageLine.classList.toggle('hidden', !state.coverage);
  if (state.coverage) {
    const { before, after } = state.coverage;
    coverageLine.textContent = `Termes de l’offre : ${before.found.length} dans votre CV, ${after.found.length} sur ${after.total} dans cette version.`;
  }
}

function setVerdict(el, verdict) {
  el.textContent = VERDICT_LABELS[verdict] || '';
  el.className = `verdict verdict-${verdict}`;
}

function renderPanel() {
  const panel = state.panel;
  panelCard.classList.toggle('hidden', !panel);
  questionsCard.classList.toggle('hidden', !panel?.questions?.length);
  if (!panel) return;

  panelFailed.classList.toggle('hidden', !panel.failed);
  panelBody.classList.toggle('hidden', Boolean(panel.failed));
  if (panel.failed) {
    panelFailed.textContent = `Le panel n’a pas pu se terminer (${panel.reason}). Votre CV reste adapté et vérifié.`;
    return;
  }

  setVerdict(screenBefore, panel.screenBefore);
  screenArrow.classList.toggle('hidden', !panel.screenAfter);
  screenAfter.classList.toggle('hidden', !panel.screenAfter);
  if (panel.screenAfter) setVerdict(screenAfter, panel.screenAfter.verdict);

  panelReviews.innerHTML = panel.reviews.map((review) => `
    <li>
      <details class="review-row">
        <summary><span>${esc(review.label)}</span><span class="verdict verdict-${esc(review.verdict)}">${VERDICT_LABELS[review.verdict]}</span></summary>
        ${review.worstLine ? `<blockquote>${esc(review.worstLine)}</blockquote>` : ''}
        ${review.problems.length ? `<ul>${review.problems.map((problem) => `<li>${esc(problem)}</li>`).join('')}</ul>` : ''}
      </details>
    </li>`).join('');

  panelMistakesBox.classList.toggle('hidden', panel.mistakes.length === 0);
  const mistakeStatus = panel.rewriteKept === false ? 'relevée' : 'traitée';
  panelMistakesTitle.textContent = `${formatCount(panel.mistakes.length, 'erreur')} ${mistakeStatus}${panel.mistakes.length > 1 ? 's' : ''}`;
  panelMistakes.innerHTML = panel.mistakes.map((mistake) => `
    <li>
      ${mistake.line ? `<blockquote>${esc(mistake.line)}</blockquote>` : ''}
      <span>${esc(mistake.why)}</span>
      ${mistake.flaggedBy.length ? `<small>${esc(mistake.flaggedBy.join(', '))}</small>` : ''}
    </li>`).join('');

  questionsList.innerHTML = panel.questions.map((question, position) => `
    <label class="field" for="question${position}">
      <span>${esc(question)}</span>
      <textarea id="question${position}" rows="2" data-question="${esc(question)}"></textarea>
    </label>`).join('');
}

function renderFidelity() {
  const fidelity = state.fidelity;
  fidelityCard.classList.toggle('hidden', !fidelity);
  if (!fidelity) return;
  const { removed = [] } = fidelity;
  const warnings = [...(fidelity.warnings || [])];
  if (state.panel?.rewriteKept === false) warnings.unshift('La correction du panel perdait des termes de l’offre : la version adaptée a été conservée.');
  fidelitySummary.textContent = removed.length + warnings.length === 0
    ? 'Chiffres, compétences et coordonnées comparés à votre CV : rien à signaler.'
    : `${formatCount(removed.length, 'élément')} retiré${removed.length > 1 ? 's' : ''} car absent${removed.length > 1 ? 's' : ''} de votre CV, ${warnings.length} à vérifier.`;
  fidelityList.innerHTML = [
    ...removed.map((item) => `<li><strong>${esc(item.text)}</strong><span>${esc(item.reason)}</span></li>`),
    ...warnings.map((item) => `<li><span>${esc(item)}</span></li>`),
  ].join('');
}

function handleQuestionsSubmit(event) {
  event.preventDefault();
  const answers = [...questionsList.querySelectorAll('textarea')]
    .filter((field) => field.value.trim())
    .map((field) => `- ${field.dataset.question} ${field.value.trim()}`);
  if (answers.length === 0) {
    showToast('Répondez à au moins une question.', 'info');
    return;
  }

  const source = getSavedCV() || { name: 'CV collé', numPages: 0, method: 'manuel', size: 0 };
  state.extractedText = `${state.extractedText.trim()}\n\nPRÉCISIONS DU CANDIDAT\n${answers.join('\n')}`;
  saveSourceProfile(source.name, state.extractedText, source.numPages, source.method, source.size);
  extractedTextEl.textContent = state.extractedText;

  if (jobDescriptionInput.value.trim().length <= MIN_OFFER_LENGTH) {
    showToast('Réponses ajoutées à votre CV. Collez l’offre pour relancer l’adaptation.', 'success', 6000);
    goToStep(2);
    return;
  }
  handleGenerate();
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
async function handleDownloadCV() {
  if (!state.adaptedCV) return;
  try {
    const name = state.adaptedCV.personalInfo?.fullName || detectCandidateName(state.extractedText);
    const doc = await buildCVDocument(state.adaptedCV, name, state.profilePhotoDataURL, state.cvTemplate, state.docLanguage);
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
    const doc = generateCoverLetterPDF(state.coverLetter, name, jobTitle, company, state.docLanguage);
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
    const doc = await buildCVDocument(state.adaptedCV, name, state.profilePhotoDataURL, state.cvTemplate, state.docLanguage);
    const engine = getEngineForTemplate(state.cvTemplate, {
      hasPhoto: Boolean(state.profilePhotoDataURL),
      text: JSON.stringify(state.adaptedCV),
    });
    openLatexPreview('Votre CV en PDF', doc, engine);
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
    const doc = generateCoverLetterPDF(state.coverLetter, name, jobTitle, company, state.docLanguage);
    const engine = getEngineForTemplate(DEFAULT_TEMPLATE, { text: JSON.stringify(state.coverLetter) });
    openLatexPreview('Votre lettre en PDF', doc, engine);
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
  // innerHTML leaves quotes as they are: this text also ends up in attributes
  return div.innerHTML.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================
// Template Gallery
// ============================================================
function swatchClass(templateId) {
  const layout = TEMPLATE_CATALOG[templateId]?.preview.layout || 'centered';
  return `template-swatch sw-${layout}`;
}

function syncTemplateUI() {
  const template = TEMPLATE_CATALOG[state.cvTemplate] || TEMPLATE_CATALOG[DEFAULT_TEMPLATE];
  $$('.js-template-name').forEach((el) => { el.textContent = template.name; });
  $$('.js-template-swatch').forEach((el) => {
    el.className = `${swatchClass(state.cvTemplate)} js-template-swatch`;
    el.style.setProperty('--sw', template.preview.dark || template.preview.accent);
  });
}

function getGalleryChoice() {
  return $('input[name="cvTemplateChoice"]:checked')?.value || null;
}

function renderGalleryOptions(filter = 'all', selected = getGalleryChoice()) {
  const ids = Object.keys(TEMPLATE_CATALOG);
  const visible = ids.filter((id) => filter === 'all' || TEMPLATE_CATALOG[id].category === filter);
  const choice = visible.includes(selected) ? selected : visible[0];

  const filters = [['all', 'Tous', ids.length], ...Object.entries(TEMPLATE_CATEGORIES).map(([key, label]) => [
    key,
    label,
    ids.filter((id) => TEMPLATE_CATALOG[id].category === key).length,
  ])];
  templateFilters.innerHTML = filters.map(([key, label, count]) => `
    <button class="template-filter" type="button" data-filter="${key}" aria-pressed="${key === filter}">${label} <span>${count}</span></button>`).join('');

  templateOptions.innerHTML = visible.map((id) => {
    const template = TEMPLATE_CATALOG[id];
    const accent = template.preview.dark || template.preview.accent;
    return `
    <label class="template-option">
      <input type="radio" name="cvTemplateChoice" value="${id}" ${id === choice ? 'checked autofocus' : ''} />
      <span class="${swatchClass(id)}" style="--sw:${accent}" aria-hidden="true"><i></i><i></i><i></i></span>
      <span><strong>${template.name}</strong><small>${template.description}</small></span>
    </label>`;
  }).join('');
  renderGalleryPreview(choice);
}

function renderGalleryPreview(templateId) {
  const template = TEMPLATE_CATALOG[templateId];
  templatePreviewContent.innerHTML = renderLiveCVPreview(SAMPLE_CV, templateId, 'fr');
  // The preview is a whole page reduced to the width available here
  const page = templatePreviewContent.firstElementChild;
  if (page && templatePreviewContent.clientWidth) page.style.zoom = String(templatePreviewContent.clientWidth / 760);

  const columns = template.columns === 1 ? 'Une colonne' : 'Deux colonnes, moins sûr pour les logiciels de tri';
  templateFacts.textContent = `${columns} · ${template.photo ? 'Photo possible' : 'Sans photo'}`;
  templateCredit.innerHTML = template.source
    ? `Basé sur <a href="${template.source.url}" target="_blank" rel="noreferrer">${template.source.name}</a>, licence ${template.source.license}. Aperçu indicatif.`
    : 'Modèle AdaptaCV. Aperçu indicatif.';
}

function openTemplateGallery() {
  templateDialog.showModal();
  renderGalleryOptions('all', state.cvTemplate);
}

function selectPreviewedTemplate() {
  const choice = getGalleryChoice();
  templateDialog.close();
  if (!choice || choice === state.cvTemplate) return;
  state.cvTemplate = choice;
  localStorage.setItem(TEMPLATE_KEY, choice);
  syncTemplateUI();
  if (state.adaptedCV) renderResults();
  showToast(`Modèle « ${TEMPLATE_CATALOG[choice].name} » appliqué.`, 'success');
}

/**
 * Compiles the template with the fictional CV: no personal data leaves the browser.
 */
async function handleTemplateSample() {
  const choice = getGalleryChoice();
  if (!choice) return;
  try {
    const doc = await buildCVDocument(SAMPLE_CV, '', '', choice, 'fr');
    openLatexPreview(`Exemple du modèle ${TEMPLATE_CATALOG[choice].name}, données fictives`, doc, getEngineForTemplate(choice));
  } catch (err) {
    console.error('Sample error:', err);
    showToast('Impossible de préparer cet exemple.', 'error');
  }
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
  state.panel = entry.panel || null;
  state.fidelity = entry.fidelity || null;
  state.coverage = entry.coverage || null;
  state.modelUsed = entry.modelUsed || null;
  state.cvTemplate = resolveTemplate(entry.cvTemplate);
  state.docLanguage = entry.language || 'fr';
  includeCoverLetterInput.checked = Boolean(entry.coverLetter);
  updateGenerationChoice();
  jobTitleInput.value = entry.jobTitle || '';
  companyNameInput.value = entry.companyName || '';
  jobDescriptionInput.value = entry.jobDescription || '';
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
const PREVIEW_ORDER = {
  centered: ['summary', 'skills', 'experience', 'education', 'projects', 'certifications', 'languages', 'interests'],
  impact: ['summary', 'skills', 'experience', 'education', 'projects', 'certifications', 'languages', 'interests'],
  plain: ['summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'languages', 'interests'],
  banner: ['summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'languages', 'interests'],
  banking: ['summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'languages', 'interests'],
  margin: ['summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'languages', 'interests'],
  compact: ['summary', 'experience', 'education', 'projects', 'skills', 'certifications', 'languages', 'interests'],
  academic: ['summary', 'education', 'experience', 'projects', 'certifications', 'skills', 'languages', 'interests'],
  bar: ['skills', 'summary', 'experience', 'education', 'projects', 'certifications', 'languages', 'interests'],
};

function renderLiveCVPreview(cv, templateId, language = state.docLanguage) {
  const template = TEMPLATE_CATALOG[templateId] || TEMPLATE_CATALOG[DEFAULT_TEMPLATE];
  const { layout, accent, dark, soft, serif, nameRight, nameLeft, light } = template.preview;
  const L = getTemplateLabels(language, templateId);
  const pi = cv.personalInfo || {};
  const clean = (items) => (items || []).filter(Boolean);

  const photo = state.profilePhotoDataURL && template.photo
    ? `<img class="cvp-photo" src="${state.profilePhotoDataURL}" alt="Photo de profil">`
    : '';
  const contactValues = clean([pi.email, pi.phone, pi.location, pi.linkedin, pi.website, pi.github]);
  const heading = (title) => {
    if (layout !== 'impact') return `<h4>${esc(title)}</h4>`;
    const letters = [...title];
    return `<h4><em>${esc(letters.slice(0, 3).join(''))}</em>${esc(letters.slice(3).join(''))}</h4>`;
  };
  const lines = (values) => (values.length ? `<div class="cvp-lines">${values.map((value) => `<span>${esc(value)}</span>`).join('')}</div>` : '');
  const entry = (title, period, subtitle, description, bullets) => `
    <div class="cvp-entry">
      <div class="cvp-entry-head"><strong>${esc(title || '')}</strong><time>${esc(period || '')}</time></div>
      ${subtitle ? `<b>${esc(subtitle)}</b>` : ''}
      ${description ? `<p>${esc(description)}</p>` : ''}
      ${bullets?.length ? `<ul>${bullets.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>` : ''}
    </div>`;
  const wrap = (title, content, className = '') => (content ? `<section${className ? ` class="${className}"` : ''}>${heading(title)}${content}</section>` : '');

  const skills = clean(cv.keySkills).map((skill) => `<span>${esc(skill)}</span>`).join('');
  const blocks = {
    summary: () => wrap(L.profile, cv.summary ? `<p>${esc(cv.summary)}</p>` : ''),
    skills: () => wrap(L.skills, skills ? `<div>${skills}</div>` : '', 'cvp-skills'),
    experience: () => wrap(L.experience, (cv.experience || []).map((exp) => entry(exp.title, exp.period, exp.company, exp.description, exp.bullets)).join('')),
    education: () => wrap(L.education, (cv.education || []).map((edu) => entry(edu.degree, edu.period, edu.school, edu.description)).join('')),
    projects: () => wrap(L.projects, (cv.projects || []).filter((project) => project?.name || project?.description).map((project) => entry(project.name, '', '', project.description)).join('')),
    certifications: () => wrap(L.certifications, clean(cv.certifications).length ? `<p>${clean(cv.certifications).map(esc).join(' · ')}</p>` : ''),
    languages: () => wrap(L.languages, clean(cv.languages).length ? `<p>${clean(cv.languages).map(esc).join(' · ')}</p>` : ''),
    interests: () => wrap(L.interests, clean(cv.interests).length ? `<p>${clean(cv.interests).map(esc).join(' · ')}</p>` : ''),
  };

  const fullName = String(pi.fullName || 'Candidat');
  const nameParts = fullName.trim().split(/\s+/);
  const nameMarkup = layout === 'impact' && nameParts.length > 1
    ? `<span>${esc(nameParts.slice(0, -1).join(' '))}</span> ${esc(nameParts.at(-1))}`
    : esc(fullName);
  const headerPhoto = layout === 'sidebar' ? '' : photo;
  const header = `<header>${headerPhoto}<div><h3>${nameMarkup}</h3>${pi.title ? `<p>${esc(pi.title)}</p>` : ''}${layout === 'sidebar' ? '' : `<small>${contactValues.map(esc).join(' · ')}</small>`}</div></header>`;

  const classes = ['cvp-page', `cvp-${layout}`, serif && 'cvp-serif', nameRight && 'cvp-name-right', nameLeft && 'cvp-name-left', light && 'cvp-light'].filter(Boolean).join(' ');
  const style = `--cvp-accent:${accent};--cvp-dark:${dark || accent};--cvp-soft:${soft || '#EEF4EF'}`;

  if (layout === 'sidebar') {
    const side = [
      photo,
      wrap(L.contact, lines(contactValues)),
      wrap(L.skills, lines(clean(cv.keySkills))),
      wrap(L.languages, lines(clean(cv.languages))),
      wrap(L.certifications, lines(clean(cv.certifications))),
      wrap(L.interests, lines(clean(cv.interests))),
    ].join('');
    const main = ['summary', 'experience', 'education', 'projects'].map((key) => blocks[key]()).join('');
    return `<div class="${classes}" style="${style}"><aside>${side}</aside><main>${header}${main}</main></div>`;
  }
  if (layout === 'alta') {
    const main = ['summary', 'experience', 'education', 'projects'].map((key) => blocks[key]()).join('');
    const side = ['skills', 'languages', 'certifications', 'interests'].map((key) => blocks[key]()).join('');
    return `<div class="${classes}" style="${style}">${header}<div class="cvp-columns"><main>${main}</main><aside>${side}</aside></div></div>`;
  }
  return `<div class="${classes}" style="${style}">${header}${PREVIEW_ORDER[layout].map((key) => blocks[key]()).join('')}</div>`;
}

// ============================================================
// Start
// ============================================================
init();
