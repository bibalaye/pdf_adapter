/**
 * AdaptaCV — Main Application
 * Orchestrates UI, PDF parsing, AI calls, PDF generation,
 * particles, confetti, and micro-animations
 */
import './style.css';
import { extractTextFromPDF, renderPDFPagesToImages } from './pdf-parser.js';
import {
  getSettings,
  saveSettings,
  getProviderDisplayName,
  adaptCV,
  generateCoverLetter,
} from './ai-service.js';
import {
  generateAdaptedCVPDF,
  generateCoverLetterPDF,
  downloadPDF,
} from './pdf-generator.js';
import { showToast } from './toast.js';

// ============================================================
// State
// ============================================================
const state = {
  uploadedFile: null,
  extractedText: '',
  numPages: 0,
  isImageBased: false,
  currentStep: 1,
  adaptedCV: null,
  coverLetter: null,
  profilePhotoDataURL: null,
  cvTemplate: 'classic',
  letterTemplate: 'formal',
};

// ============================================================
// DOM References
// ============================================================
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// Steps
const stepContents = { 1: $('#step1'), 2: $('#step2'), 3: $('#step3') };

// Step 1
const dropZone = $('#dropZone');
const fileInput = $('#fileInput');
const filePreview = $('#filePreview');
const fileName = $('#fileName');
const fileSize = $('#fileSize');
const pdfPreviewContainer = $('#pdfPreviewContainer');
const pdfPreviewPages = $('#pdfPreviewPages');
const togglePreviewBtn = $('#togglePreview');
const extractedTextContainer = $('#extractedTextContainer');
const extractedTextEl = $('#extractedText');
const charCount = $('#charCount');
const manualInputContainer = $('#manualInputContainer');
const manualCVText = $('#manualCVText');
const manualCharCount = $('#manualCharCount');
const removeFileBtn = $('#removeFile');
const nextStep1Btn = $('#nextStep1');

// Step 2
const profilePhotoSection = $('#profilePhotoSection');
const profilePhotoInput = $('#profilePhotoInput');
const profilePhotoPreview = $('#profilePhotoPreview');
const removeProfilePhotoBtn = $('#removeProfilePhoto');
const jobTitleInput = $('#jobTitle');
const companyNameInput = $('#companyName');
const jobDescriptionInput = $('#jobDescription');
const jobDescCount = $('#jobDescCount');
const prevStep2Btn = $('#prevStep2');
const generateBtn = $('#generateBtn');
const cvTemplateGrid = $('#cvTemplateGrid');
const letterTemplateGrid = $('#letterTemplateGrid');
const templatePreviewModal = $('#templatePreviewModal');
const previewModalTitle = $('#previewModalTitle');
const templatePreviewContent = $('#templatePreviewContent');
const closePreviewBtn = $('#closePreviewBtn');
const previewSelectBtn = $('#previewSelectBtn');

// Step 3
const loadingState = $('#loadingState');
const resultsState = $('#resultsState');
const newAdaptation = $('#newAdaptation');
const loadingTitle = $('#loadingTitle');
const loadingProgressBar = $('#loadingProgressBar');
const adaptedCVPreview = $('#adaptedCVPreview');
const coverLetterPreview = $('#coverLetterPreview');
const downloadCVBtn = $('#downloadCV');
const downloadCoverLetterBtn = $('#downloadCoverLetter');
const startOverBtn = $('#startOverBtn');

// Loading steps
const loadingStep1 = $('#loadingStep1');
const loadingStep2 = $('#loadingStep2');
const loadingStep3 = $('#loadingStep3');

// Settings
const settingsBtn = $('#settingsBtn');
const settingsModal = $('#settingsModal');
const closeSettingsBtn = $('#closeSettingsBtn');
const aiProviderSelect = $('#aiProvider');
const apiKeyInput = $('#apiKey');
const toggleApiKeyBtn = $('#toggleApiKey');
const languageSelect = $('#language');
const saveSettingsBtn = $('#saveSettings');
const helpLinkGroq = $('#helpLinkGroq');
const helpLinkGemini = $('#helpLinkGemini');
const helpLinkMistral = $('#helpLinkMistral');
const footerProvider = $('#footerProvider');

// Steps indicator
const stepIndicators = $$('.steps-indicator .step');
const stepLines = $$('.steps-indicator .step-line');

// ============================================================
// Initialization
// ============================================================
function init() {
  loadSettings();
  setupEventListeners();
  updateFooterProvider();
  initParticles();
  refreshLucideIcons();
}

function loadSettings() {
  const settings = getSettings();
  aiProviderSelect.value = settings.provider;
  apiKeyInput.value = settings.apiKey;
  languageSelect.value = settings.language;
  updateHelpLinks(settings.provider);
}

function updateFooterProvider() {
  footerProvider.textContent = getProviderDisplayName();
}

/**
 * Re-initialize Lucide icons (needed after dynamic DOM changes)
 */
function refreshLucideIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// ============================================================
// Floating Particles System
// ============================================================
function initParticles() {
  const container = $('#particles');
  if (!container) return;

  const count = 15;
  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.animationDuration = `${12 + Math.random() * 20}s`;
    particle.style.animationDelay = `${Math.random() * 15}s`;
    particle.style.width = `${1 + Math.random() * 2}px`;
    particle.style.height = particle.style.width;

    // Warm, subtle colors
    const colors = ['#c4b5fd', '#ddd6fe', '#fecdd3', '#bfdbfe', '#fde68a'];
    particle.style.background = colors[Math.floor(Math.random() * colors.length)];

    container.appendChild(particle);
  }
}

// ============================================================
// Confetti System
// ============================================================
function launchConfetti() {
  const canvas = $('#confettiCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const pieces = [];
  const colors = ['#6c5ce7', '#a29bfe', '#00b894', '#fdcb6e', '#e17055', '#74b9ff', '#fab1a0'];

  for (let i = 0; i < 120; i++) {
    pieces.push({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 200,
      w: 4 + Math.random() * 6,
      h: 8 + Math.random() * 8,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 12,
      vx: (Math.random() - 0.5) * 4,
      vy: 2 + Math.random() * 5,
      opacity: 1,
    });
  }

  let frame = 0;
  const maxFrames = 180;

  function animate() {
    frame++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const fadeStart = maxFrames * 0.6;
    for (const p of pieces) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08; // gravity
      p.rotation += p.rotationSpeed;

      if (frame > fadeStart) {
        p.opacity = Math.max(0, 1 - (frame - fadeStart) / (maxFrames - fadeStart));
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }

    if (frame < maxFrames) {
      requestAnimationFrame(animate);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  animate();
}

// ============================================================
// Event Listeners
// ============================================================
function setupEventListeners() {
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
    const fromLabel = e.target.closest('label[for="fileInput"]');
    const fromInput = e.target === fileInput;
    if (!fromLabel && !fromInput) {
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

  removeFileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    resetFile();
  });

  // --- PDF Preview Toggle ---
  togglePreviewBtn.addEventListener('click', () => {
    pdfPreviewPages.classList.toggle('collapsed');
  });

  // --- Profile Photo ---
  profilePhotoSection.addEventListener('click', () => profilePhotoInput.click());

  profilePhotoInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) handleProfilePhotoUpload(e.target.files[0]);
  });

  removeProfilePhotoBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    removeProfilePhoto();
  });

  // --- Manual CV text ---
  manualCVText.addEventListener('input', () => {
    const len = manualCVText.value.length;
    manualCharCount.textContent = `${len} caractère${len !== 1 ? 's' : ''}`;
    state.extractedText = manualCVText.value.trim();
    nextStep1Btn.disabled = len < 50;
  });

  // --- Navigation ---
  nextStep1Btn.addEventListener('click', () => {
    if (state.isImageBased && manualCVText.value.trim()) {
      state.extractedText = manualCVText.value.trim();
    }
    goToStep(2);
  });

  prevStep2Btn.addEventListener('click', () => goToStep(1));
  startOverBtn.addEventListener('click', () => {
    state.adaptedCV = null;
    state.coverLetter = null;
    goToStep(1);
  });

  // --- Job Description ---
  jobDescriptionInput.addEventListener('input', () => {
    const len = jobDescriptionInput.value.length;
    jobDescCount.textContent = `${len} caractère${len !== 1 ? 's' : ''}`;
    updateGenerateButton();
  });

  jobTitleInput.addEventListener('input', updateGenerateButton);

  // --- Template Selection ---
  if (cvTemplateGrid) {
    cvTemplateGrid.addEventListener('click', (e) => {
      if (e.target.closest('.template-preview-btn')) return;
      const card = e.target.closest('.template-card');
      if (!card) return;
      cvTemplateGrid.querySelectorAll('.template-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      state.cvTemplate = card.dataset.template;
    });
  }
  if (letterTemplateGrid) {
    letterTemplateGrid.addEventListener('click', (e) => {
      if (e.target.closest('.template-preview-btn')) return;
      const card = e.target.closest('.template-card');
      if (!card) return;
      letterTemplateGrid.querySelectorAll('.template-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      state.letterTemplate = card.dataset.template;
    });
  }

  // --- Template Preview Buttons ---
  document.querySelectorAll('.template-preview-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const tpl = btn.dataset.template;
      const type = btn.dataset.type;
      openTemplatePreview(tpl, type);
    });
  });

  // --- Preview Modal ---
  if (closePreviewBtn) closePreviewBtn.addEventListener('click', closeTemplatePreview);
  if (templatePreviewModal) templatePreviewModal.addEventListener('click', (e) => {
    if (e.target === templatePreviewModal) closeTemplatePreview();
  });
  if (previewSelectBtn) previewSelectBtn.addEventListener('click', selectPreviewedTemplate);

  // --- Generate ---
  generateBtn.addEventListener('click', handleGenerate);

  // --- Downloads ---
  downloadCVBtn.addEventListener('click', handleDownloadCV);
  downloadCoverLetterBtn.addEventListener('click', handleDownloadCoverLetter);

  // --- Settings ---
  settingsBtn.addEventListener('click', () => settingsModal.classList.remove('hidden'));
  closeSettingsBtn.addEventListener('click', () => settingsModal.classList.add('hidden'));
  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) settingsModal.classList.add('hidden');
  });

  aiProviderSelect.addEventListener('change', () => updateHelpLinks(aiProviderSelect.value));

  toggleApiKeyBtn.addEventListener('click', () => {
    apiKeyInput.type = apiKeyInput.type === 'password' ? 'text' : 'password';
  });

  saveSettingsBtn.addEventListener('click', () => {
    saveSettings(aiProviderSelect.value, apiKeyInput.value, languageSelect.value);
    updateFooterProvider();
    settingsModal.classList.add('hidden');
    showToast('Paramètres sauvegardés !', 'success');
  });

  // --- Keyboard ---
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') settingsModal.classList.add('hidden');
  });
}

// ============================================================
// Profile Photo
// ============================================================
function handleProfilePhotoUpload(file) {
  if (!file.type.startsWith('image/')) {
    showToast('Veuillez sélectionner une image.', 'error');
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    showToast('Image trop volumineuse (max 5 Mo).', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    state.profilePhotoDataURL = e.target.result;
    profilePhotoPreview.innerHTML = `<img src="${e.target.result}" alt="Photo de profil" />`;
    profilePhotoPreview.classList.add('has-photo');
    removeProfilePhotoBtn.classList.remove('hidden');
    showToast('Photo ajoutée ! Elle sera intégrée au CV.', 'success');
  };
  reader.readAsDataURL(file);
}

function removeProfilePhoto() {
  state.profilePhotoDataURL = null;
  profilePhotoPreview.innerHTML = '';
  profilePhotoPreview.classList.remove('has-photo');
  removeProfilePhotoBtn.classList.add('hidden');
  profilePhotoInput.value = '';

  // Re-inject Lucide icon
  const icon = document.createElement('i');
  icon.setAttribute('data-lucide', 'user-plus');
  profilePhotoPreview.appendChild(icon);
  refreshLucideIcons();
  showToast('Photo supprimée.', 'info');
}

// ============================================================
// File Handling
// ============================================================
async function handleFileUpload(file) {
  if (file.type !== 'application/pdf') {
    showToast('Veuillez sélectionner un fichier PDF.', 'error');
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    showToast('Le fichier est trop volumineux (max 10 Mo).', 'error');
    return;
  }

  state.uploadedFile = file;

  fileName.textContent = file.name;
  fileSize.textContent = formatFileSize(file.size);
  dropZone.classList.add('hidden');
  filePreview.classList.remove('hidden');

  extractedTextContainer.classList.remove('hidden');
  manualInputContainer.classList.add('hidden');
  extractedTextEl.textContent = '⏳ Extraction du texte en cours...';
  charCount.textContent = '';
  nextStep1Btn.disabled = true;

  // Render PDF preview in parallel
  renderPDFPreview(file);

  try {
    const result = await extractTextFromPDF(file, (status) => {
      switch (status.phase) {
        case 'text':
          extractedTextEl.textContent = '📄 Extraction du texte standard...';
          break;
        case 'ocr-init':
          extractedTextEl.textContent = '🔍 PDF basé images détecté !\n\n⏳ Chargement OCR (Tesseract.js)...';
          charCount.textContent = 'OCR en cours...';
          showToast('PDF design détecté → OCR automatique lancé', 'info', 5000);
          break;
        case 'ocr-page':
          extractedTextEl.textContent = `🔍 OCR en cours...\n\n📃 Page ${status.page}/${status.totalPages}\n⏳ ${status.progress}%`;
          charCount.textContent = `Page ${status.page}/${status.totalPages}`;
          break;
        case 'ocr-recognize':
          extractedTextEl.textContent = `🔍 Reconnaissance page ${status.page}/${status.totalPages}\n⏳ ${status.progress}%`;
          break;
        case 'ocr-done':
          extractedTextEl.textContent = '✅ OCR terminé !';
          break;
      }
    });

    state.extractedText = result.text;
    state.numPages = result.numPages;
    state.isImageBased = (result.method === 'ocr');

    if (result.text && result.text.trim().length >= 50) {
      extractedTextContainer.classList.remove('hidden');
      manualInputContainer.classList.add('hidden');
      extractedTextEl.textContent = result.text;

      const methodLabel = result.method === 'ocr' ? 'OCR' : 'texte';
      charCount.textContent = `${result.text.length} car. • ${result.numPages} page${result.numPages > 1 ? 's' : ''} • ${methodLabel}`;
      nextStep1Btn.disabled = false;
      showToast(`CV extrait ${result.method === 'ocr' ? 'via OCR' : ''} ! (${result.text.length} car.)`, 'success');
    } else {
      state.isImageBased = true;
      extractedTextContainer.classList.add('hidden');
      manualInputContainer.classList.remove('hidden');
      nextStep1Btn.disabled = true;
      showToast('Extraction insuffisante. Collez le contenu manuellement.', 'info', 6000);
    }
  } catch (err) {
    console.error('PDF parsing error:', err);
    state.isImageBased = true;
    extractedTextContainer.classList.add('hidden');
    manualInputContainer.classList.remove('hidden');
    nextStep1Btn.disabled = true;
    showToast('Erreur extraction. Collez le contenu manuellement.', 'error', 6000);
  }
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

function resetFile() {
  state.uploadedFile = null;
  state.extractedText = '';
  state.numPages = 0;
  state.isImageBased = false;
  fileInput.value = '';
  manualCVText.value = '';
  manualCharCount.textContent = '0 caractères';
  dropZone.classList.remove('hidden');
  filePreview.classList.add('hidden');
  pdfPreviewContainer.classList.add('hidden');
  pdfPreviewPages.innerHTML = '';
  extractedTextContainer.classList.remove('hidden');
  manualInputContainer.classList.add('hidden');
  nextStep1Btn.disabled = true;
}

// ============================================================
// Step Navigation
// ============================================================
function goToStep(step) {
  state.currentStep = step;

  Object.values(stepContents).forEach((el) => el.classList.remove('active'));
  stepContents[step].classList.add('active');

  stepIndicators.forEach((indicator, index) => {
    const stepNum = index + 1;
    indicator.classList.remove('active', 'completed');
    if (stepNum === step) indicator.classList.add('active');
    else if (stepNum < step) indicator.classList.add('completed');
  });

  stepLines.forEach((line, index) => {
    line.classList.remove('completed');
    if (index < step - 1) line.classList.add('completed');
  });

  if (step === 2) {
    updateGenerateButton();
    setTimeout(() => jobTitleInput.focus(), 300);
  }

  refreshLucideIcons();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================
// Generate
// ============================================================
function updateGenerateButton() {
  generateBtn.disabled = jobDescriptionInput.value.trim().length <= 20;
}

async function handleGenerate() {
  const settings = getSettings();
  if (!settings.apiKey) {
    showToast('Configurez votre clé API dans les paramètres (⚙️).', 'error');
    settingsModal.classList.remove('hidden');
    return;
  }

  if (!state.extractedText || state.extractedText.length < 30) {
    showToast('Le texte du CV est trop court.', 'error');
    goToStep(1);
    return;
  }

  const jobTitle = jobTitleInput.value.trim();
  const companyName = companyNameInput.value.trim();
  const jobDescription = jobDescriptionInput.value.trim();

  goToStep(3);
  loadingState.classList.remove('hidden');
  resultsState.classList.add('hidden');
  newAdaptation.classList.add('hidden');

  [loadingStep1, loadingStep2, loadingStep3].forEach((el) => el.classList.remove('active', 'done'));
  setProgress(5);

  try {
    loadingStep1.classList.add('active');
    loadingTitle.textContent = 'Analyse du CV et de l\'offre...';
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
          setProgress(65);
        }
      }
    );

    state.adaptedCV = cvResult;

    loadingStep3.classList.add('active');
    loadingTitle.textContent = 'Rédaction de la lettre de motivation...';
    setProgress(75);

    const letterResult = await generateCoverLetter(
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

    state.coverLetter = letterResult;

    // Short delay for the 100% progress bar to be visible
    await wait(400);

    renderResults();
    loadingState.classList.add('hidden');
    resultsState.classList.remove('hidden');
    newAdaptation.classList.remove('hidden');

    refreshLucideIcons();
    showToast('CV adapté et lettre de motivation générés ! 🎉', 'success');
    launchConfetti();

  } catch (err) {
    console.error('Generation error:', err);
    loadingState.classList.add('hidden');
    showToast(err.message || 'Erreur lors de la génération.', 'error');
    goToStep(2);
  }
}

function setProgress(percent) {
  if (loadingProgressBar) {
    loadingProgressBar.style.width = `${percent}%`;
  }
}

// ============================================================
// Render Results
// ============================================================
function renderResults() {
  if (state.adaptedCV) {
    const cv = state.adaptedCV;
    let html = '';

    // Personal info
    if (cv.personalInfo) {
      const pi = cv.personalInfo;
      html += `<div style="margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid var(--border-light);">`;
      if (pi.fullName) html += `<div style="font-size:1.15em;font-weight:700;color:var(--text-primary);margin-bottom:4px;">${esc(pi.fullName)}</div>`;
      if (pi.title) html += `<div style="font-size:0.88em;color:var(--accent-primary);margin-bottom:6px;">${esc(pi.title)}</div>`;
      const cp = [pi.email, pi.phone, pi.location].filter(Boolean);
      if (cp.length) html += `<div style="font-size:0.78em;color:var(--text-muted);">${cp.map(c => esc(c)).join(' • ')}</div>`;
      html += `</div>`;
    }

    if (cv.matchScore) {
      const sc = cv.matchScore;
      const col = sc >= 75 ? '#00b894' : sc >= 50 ? '#fdcb6e' : '#d63031';
      html += `<div style="margin-bottom:14px;display:flex;align-items:center;gap:8px;">
        <strong>🎯 Score :</strong>
        <span style="background:${col}14;color:${col};padding:3px 12px;border-radius:20px;font-weight:700;font-size:0.88em;border:1px solid ${col}25;">${sc}%</span>
      </div>`;
    }

    if (cv.summary) {
      html += `<div style="margin-bottom:14px;"><strong style="color:var(--accent-primary);">📋 Résumé</strong><br><span style="color:var(--text-secondary);font-style:italic;font-size:0.88em;line-height:1.7;">${esc(cv.summary)}</span></div>`;
    }

    if (cv.keySkills?.length) {
      html += `<div style="margin-bottom:14px;"><strong style="color:var(--accent-primary);">🔧 Compétences</strong><div style="margin-top:6px;display:flex;flex-wrap:wrap;gap:4px;">`;
      for (const s of cv.keySkills) {
        html += `<span style="display:inline-block;background:rgba(108,92,231,0.06);color:var(--accent-primary);padding:3px 10px;border-radius:20px;font-size:0.76em;border:1px solid rgba(108,92,231,0.15);">${esc(s)}</span>`;
      }
      html += `</div></div>`;
    }

    if (cv.experience?.length) {
      html += `<div style="margin-bottom:14px;"><strong style="color:var(--accent-primary);">💼 Expérience</strong>`;
      for (const exp of cv.experience) {
        html += `<div style="margin-top:10px;padding-left:12px;border-left:2px solid rgba(108,92,231,0.2);">
          <strong style="color:var(--text-primary);font-size:0.92em;">${esc(exp.title || '')}</strong>
          <div style="color:var(--accent-primary);font-size:0.82em;">${esc(exp.company || '')} ${exp.period ? '— ' + esc(exp.period) : ''}</div>`;
        if (exp.bullets?.length) {
          html += '<ul style="margin:6px 0 0 16px;color:var(--text-secondary);font-size:0.85em;">';
          for (const b of exp.bullets) html += `<li style="margin-bottom:3px;">${esc(b)}</li>`;
          html += '</ul>';
        }
        html += '</div>';
      }
      html += '</div>';
    }

    if (cv.education?.length) {
      html += `<div style="margin-bottom:14px;"><strong style="color:#0984e3;">🎓 Formation</strong>`;
      for (const edu of cv.education) {
        html += `<div style="margin-top:6px;padding-left:12px;border-left:2px solid rgba(9,132,227,0.2);">
          <strong style="color:var(--text-primary);font-size:0.9em;">${esc(edu.degree || '')}</strong>
          <div style="color:#0984e3;font-size:0.82em;">${esc(edu.school || '')} ${edu.period ? '— ' + esc(edu.period) : ''}</div>
        </div>`;
      }
      html += '</div>';
    }

    if (cv.addedKeywords?.length) {
      html += `<div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--border-light);"><strong style="color:var(--text-muted);font-size:0.78em;">🏷️ Mots-clés ATS</strong><br><em style="color:var(--text-muted);font-size:0.76em;">${cv.addedKeywords.map(k => esc(k)).join(' • ')}</em></div>`;
    }

    adaptedCVPreview.innerHTML = html;
  }

  if (state.coverLetter) {
    const letter = state.coverLetter;

    // Build display with subject
    let letterHtml = '';
    if (letter.subject) {
      letterHtml += `<div style="font-weight:700;color:var(--text-primary);margin-bottom:12px;font-size:0.92em;">Objet : ${esc(letter.subject)}</div>`;
    }

    const fullText = letter.fullText ||
      [letter.greeting, '', letter.opening, '', letter.body, '', letter.closing, '', letter.signature]
        .filter(part => part !== undefined)
        .join('\n');

    letterHtml += `<div style="white-space:pre-wrap;line-height:1.8;font-size:0.88em;color:var(--text-secondary);">${esc(fullText)}</div>`;
    coverLetterPreview.innerHTML = letterHtml;
  }
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
    showToast('CV téléchargé !', 'success');
  } catch (err) {
    console.error('Download error:', err);
    showToast('Erreur de génération du PDF.', 'error');
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
    downloadPDF(doc, `Lettre_${safe}.pdf`);
    showToast('Lettre téléchargée !', 'success');
  } catch (err) {
    console.error('Download error:', err);
    showToast('Erreur de génération du PDF.', 'error');
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

function esc(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function updateHelpLinks(provider) {
  helpLinkGroq.classList.toggle('hidden', provider !== 'groq');
  helpLinkGemini.classList.toggle('hidden', provider !== 'gemini');
  helpLinkMistral.classList.toggle('hidden', provider !== 'mistral');
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================
// Template Preview System
// ============================================================
let previewedTemplate = null;
let previewedType = null;

const TEMPLATE_NAMES = {
  classic: 'Classique', modern: 'Moderne', minimal: 'Minimaliste',
  executive: 'Exécutif', bold: 'Créatif',
  formal: 'Formelle', creative: 'Créative', elegant: 'Élégante',
};

function openTemplatePreview(template, type) {
  previewedTemplate = template;
  previewedType = type;
  const label = type === 'cv' ? 'CV' : 'Lettre';
  previewModalTitle.textContent = `Aperçu — ${TEMPLATE_NAMES[template] || template} (${label})`;
  templatePreviewContent.innerHTML = renderTemplatePreview(template, type);
  templatePreviewModal.classList.remove('hidden');
  refreshLucideIcons();
}

function closeTemplatePreview() {
  templatePreviewModal.classList.add('hidden');
  previewedTemplate = null;
  previewedType = null;
}

function selectPreviewedTemplate() {
  if (!previewedTemplate || !previewedType) return;
  if (previewedType === 'cv') {
    state.cvTemplate = previewedTemplate;
    cvTemplateGrid.querySelectorAll('.template-card').forEach(c => {
      c.classList.toggle('selected', c.dataset.template === previewedTemplate);
    });
  } else {
    state.letterTemplate = previewedTemplate;
    letterTemplateGrid.querySelectorAll('.template-card').forEach(c => {
      c.classList.toggle('selected', c.dataset.template === previewedTemplate);
    });
  }
  closeTemplatePreview();
  showToast(`Modèle "${TEMPLATE_NAMES[previewedTemplate]}" sélectionné`, 'success');
}

function renderTemplatePreview(template, type) {
  // Sample data for preview
  const sampleSkills = ['JavaScript', 'Python', 'React', 'Docker', 'SQL', 'Git'];
  const skills = sampleSkills.map(s => `<span class="tpf-badge">${s}</span>`).join('');
  const skillsDark = sampleSkills.map(s => `<span class="tpf-badge tpf-badge-dark">${s}</span>`).join('');
  const skillsBold = sampleSkills.map(s => `<span class="tpf-badge tpf-badge-bold">${s}</span>`).join('');

  const sectionCV = (title, cls = '') => `<div class="tpf-section-title ${cls}">${title}</div>`;
  const loremShort = 'Ingénieur passionné avec 5+ ans d\'expérience en développement web.';
  const loremBullets = '• Développement d\'applications web full-stack avec React et Node.js<br>• Mise en place de pipelines CI/CD avec Docker et GitLab<br>• Optimisation des performances et qualité du code';
  const expBlock = (cls = '') => `<div style="margin-bottom:6px;"><div style="font-weight:700;font-size:7.5px;color:#2d2d40;">Ingénieur Full Stack</div><div style="font-size:6.5px;color:#4338ca;">Entreprise SAS — 2021–2024</div><div class="tpf-text ${cls}" style="margin-top:2px;">${loremBullets}</div></div>`;
  const eduBlock = (cls = '') => `<div style="margin-bottom:4px;"><div style="font-weight:700;font-size:7px;color:#2d2d40;">Master Informatique</div><div style="font-size:6.5px;color:#4338ca;">Université Paris — 2019</div></div>`;

  const letterBody = 'Madame, Monsieur,<br><br>Fortement intéressé par le poste de Développeur Full Stack au sein de votre entreprise, je me permets de vous soumettre ma candidature.<br><br>Fort de 5 années d\'expérience en développement web, j\'ai acquis une expertise solide en React, Node.js et DevOps. Mon parcours m\'a permis de mener des projets ambitieux alliant innovation technique et rigueur méthodologique.<br><br>Je serais ravi d\'échanger avec vous lors d\'un entretien.<br><br>Cordialement,<br>Jean Dupont';

  if (type === 'cv') {
    switch (template) {
      case 'classic':
        return `<div class="tpf-classic">
          <div class="tpf-topbar"></div>
          <div class="tpf-body">
            <div class="tpf-name">Jean Dupont</div>
            <div class="tpf-title">Ingénieur Full Stack</div>
            <div class="tpf-contact">jean.dupont@email.com  •  +33 6 12 34 56  •  Paris, France</div>
            <div class="tpf-divider"></div>
            ${sectionCV('Profil')}
            <div class="tpf-text tpf-text-italic">${loremShort}</div>
            ${sectionCV('Compétences')}
            <div style="margin-bottom:6px;">${skills}</div>
            ${sectionCV('Expérience Professionnelle')}
            ${expBlock()}
            ${sectionCV('Formation')}
            ${eduBlock()}
          </div>
        </div>`;

      case 'modern':
        return `<div class="tpf-modern">
          <div class="tpf-sidebar">
            <div class="tpf-name">Jean Dupont</div>
            ${sectionCV('Contact', 'tpf-section-title-dark')}
            <div class="tpf-text tpf-text-light">✉ jean@email.com</div>
            <div class="tpf-text tpf-text-light">☎ +33 6 12 34 56</div>
            <div class="tpf-text tpf-text-light">📍 Paris</div>
            ${sectionCV('Compétences', 'tpf-section-title-dark')}
            <div style="margin-bottom:4px;">${skillsDark}</div>
            ${sectionCV('Langues', 'tpf-section-title-dark')}
            <div class="tpf-text tpf-text-light">• Français — Natif</div>
            <div class="tpf-text tpf-text-light">• Anglais — Courant</div>
          </div>
          <div class="tpf-main">
            <div class="tpf-name">Jean Dupont</div>
            <div class="tpf-title">Ingénieur Full Stack</div>
            ${sectionCV('Profil')}
            <div class="tpf-text tpf-text-italic">${loremShort}</div>
            ${sectionCV('Expérience')}
            ${expBlock()}
            ${sectionCV('Formation')}
            ${eduBlock()}
          </div>
        </div>`;

      case 'minimal':
        return `<div class="tpf-minimal">
          <div class="tpf-name">Jean Dupont</div>
          <div class="tpf-title">Ingénieur Full Stack</div>
          <div class="tpf-contact">jean@email.com  |  +33 6 12 34 56  |  Paris</div>
          <div class="tpf-sep"></div>
          <div style="text-align:left;">
            ${sectionCV('Profil')}
            <div class="tpf-text tpf-text-italic">${loremShort}</div>
            ${sectionCV('Compétences')}
            <div style="margin-bottom:6px;">${skills}</div>
            ${sectionCV('Expérience')}
            ${expBlock()}
            ${sectionCV('Formation')}
            ${eduBlock()}
          </div>
        </div>`;

      case 'executive':
        return `<div class="tpf-executive">
          <div class="tpf-band">
            <div class="tpf-name">Jean Dupont</div>
            <div class="tpf-title">Ingénieur Full Stack</div>
          </div>
          <div class="tpf-body">
            <div class="tpf-text" style="font-size:6.5px;color:#8888aa;margin-bottom:8px;">jean@email.com  •  +33 6 12 34 56  •  Paris</div>
            ${sectionCV('Profil')}
            <div class="tpf-text tpf-text-italic">${loremShort}</div>
            ${sectionCV('Compétences')}
            <div style="margin-bottom:6px;">${skills}</div>
            ${sectionCV('Expérience')}
            ${expBlock()}
            ${sectionCV('Formation')}
            ${eduBlock()}
          </div>
        </div>`;

      case 'bold':
        return `<div class="tpf-bold">
          <div class="tpf-sidebar">
            <div class="tpf-name">Jean Dupont</div>
            ${sectionCV('Contact', 'tpf-section-title-bold')}
            <div class="tpf-text tpf-text-white">✉ jean@email.com</div>
            <div class="tpf-text tpf-text-white">☎ +33 6 12 34 56</div>
            <div class="tpf-text tpf-text-white">📍 Paris</div>
            ${sectionCV('Compétences', 'tpf-section-title-bold')}
            <div style="margin-bottom:4px;">${skillsBold}</div>
            ${sectionCV('Langues', 'tpf-section-title-bold')}
            <div class="tpf-text tpf-text-white">• Français — Natif</div>
            <div class="tpf-text tpf-text-white">• Anglais — Courant</div>
          </div>
          <div class="tpf-main">
            <div class="tpf-name">Jean Dupont</div>
            <div class="tpf-title">Ingénieur Full Stack</div>
            ${sectionCV('Profil')}
            <div class="tpf-text tpf-text-italic">${loremShort}</div>
            ${sectionCV('Expérience')}
            ${expBlock()}
            ${sectionCV('Formation')}
            ${eduBlock()}
          </div>
        </div>`;

      default:
        return '<div style="padding:20px;text-align:center;color:#999;">Aperçu non disponible</div>';
    }
  } else {
    // Letter templates
    switch (template) {
      case 'formal':
        return `<div class="tpf-formal">
          <div class="tpf-name">Jean Dupont</div>
          <div class="tpf-date">13 février 2026</div>
          <div class="tpf-object">Objet : Candidature au poste de Développeur Full Stack</div>
          <div class="tpf-hr"></div>
          <div class="tpf-text" style="line-height:2;">${letterBody}</div>
        </div>`;

      case 'creative':
        return `<div class="tpf-letter-creative">
          <div class="tpf-bar"></div>
          <div class="tpf-body">
            <div class="tpf-name">Jean Dupont</div>
            <div class="tpf-object-box">
              <strong style="color:#4338ca;">Objet</strong><br>
              Candidature au poste de Développeur Full Stack
            </div>
            <div style="font-size:6.5px;color:#999;text-align:right;margin-bottom:8px;">13 février 2026</div>
            <div class="tpf-text" style="line-height:2;">${letterBody}</div>
          </div>
        </div>`;

      case 'elegant':
        return `<div class="tpf-elegant">
          <div class="tpf-frame"></div>
          <div class="tpf-body">
            <div class="tpf-name">Jean Dupont</div>
            <div class="tpf-hr"></div>
            <div style="font-size:6.5px;color:#999;margin-bottom:8px;">13 février 2026</div>
            <div style="font-size:7.5px;font-weight:600;margin-bottom:8px;text-align:left;">Objet : Candidature au poste de Développeur Full Stack</div>
            <div class="tpf-text" style="text-align:left;line-height:2;">${letterBody}</div>
          </div>
        </div>`;

      default:
        return '<div style="padding:20px;text-align:center;color:#999;">Aperçu non disponible</div>';
    }
  }
}

// ============================================================
// Start
// ============================================================
init();
