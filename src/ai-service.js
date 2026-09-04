/**
 * AI Service — Communicates with Groq, Gemini, or Mistral APIs
 */

const PROVIDERS = {
    groq: {
        name: 'Groq',
        model: 'llama-3.3-70b-versatile',
        url: 'https://api.groq.com/openai/v1/chat/completions',
        format: 'openai',
    },
    gemini: {
        name: 'Google Gemini',
        model: 'gemini-2.5-flash',
        url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
        format: 'gemini',
    },
    mistral: {
        name: 'Mistral AI',
        model: 'mistral-small-latest',
        url: 'https://api.mistral.ai/v1/chat/completions',
        format: 'openai',
    },
};

/**
 * Get saved settings from localStorage
 */
export function getSettings() {
    return {
        provider: localStorage.getItem('cv_adapter_provider') || 'groq',
        apiKey: localStorage.getItem('cv_adapter_api_key') || '',
        language: localStorage.getItem('cv_adapter_language') || 'fr',
    };
}

/**
 * Save settings to localStorage
 */
export function saveSettings(provider, apiKey, language) {
    localStorage.setItem('cv_adapter_provider', provider);
    localStorage.setItem('cv_adapter_api_key', apiKey);
    localStorage.setItem('cv_adapter_language', language);
}

/**
 * Get the display name for the current provider
 */
export function getProviderDisplayName() {
    const settings = getSettings();
    const provider = PROVIDERS[settings.provider];
    return provider ? `${provider.name} (${provider.model})` : 'Non configuré';
}

/**
 * Build the system prompt for CV adaptation
 * IMPORTANT: This prompt ensures ALL personal info is preserved
 */
function buildAdaptCVPrompt(language) {
    const lang = language === 'fr' ? 'français' : 'English';
    return `Tu es un rédacteur de CV rigoureux spécialisé dans l'adaptation ATS. Tu travailles uniquement à partir du CV et de l'offre fournis. Réponds en ${lang}.

PRINCIPE ABSOLU : ADAPTER LA PRÉSENTATION, JAMAIS LES FAITS.

DONNÉES IMMUABLES À RECOPIER SANS LES ALTÉRER :
1. Identité et coordonnées : nom, email, téléphone, adresse et liens.
2. Expériences : nombre d'expériences, employeurs, intitulés occupés, lieux, dates et ordre chronologique.
3. Formations : diplômes, établissements, spécialités, dates, mentions et projets indiqués.
4. Certifications : nom, organisme, date, identifiant et niveau.
5. Langues, projets, outils, compétences et réalisations factuelles.

INTERDICTIONS STRICTES :
- N'invente, ne complète et ne déduis aucun fait absent du CV.
- N'invente jamais de métrique, pourcentage, volume, budget, taille d'équipe, responsabilité, technologie, résultat, client ou mission.
- N'ajoute aucune compétence uniquement parce qu'elle figure dans l'offre.
- Ne transforme pas une exposition ou une notion en maîtrise ou expertise.
- Ne calcule et ne mentionne jamais un nombre total d'années d'expérience, sauf si ce nombre est écrit explicitement dans le CV source.
- N'ajoute jamais senior, expert, lead, manager ou spécialiste si ce niveau n'est pas explicitement justifié dans le CV.
- Ne comble pas les champs manquants : utilise une chaîne vide ou un tableau vide.
- En cas de doute, conserve le texte source plutôt que de supposer.

ADAPTATIONS AUTORISÉES :
- Réordonner les compétences déjà présentes selon leur pertinence pour l'offre.
- Reformuler et raccourcir une mission sans changer son sens, le niveau de responsabilité ni les résultats.
- Réutiliser un mot-clé de l'offre seulement si la même compétence ou notion est attestée dans le CV.
- Mettre d'abord les éléments les plus pertinents, sans supprimer une expérience, une formation ou une certification.

TITRE DU CV :
- Crée un titre professionnel de 3 à 6 mots appartenant à la même famille de métier que le poste visé.
- Ne recopie pas mot pour mot l'intitulé de l'offre.
- Le titre doit rester cohérent avec le niveau et les compétences réellement visibles dans le CV.
- N'ajoute aucune séniorité absente du CV.

RÉSUMÉ ET CONTENU :
- Rédige un résumé sobre de 2 à 4 phrases fondé uniquement sur le profil réel.
- Ne fais aucune affirmation générale non démontrée.
- Pour chaque expérience, conserve seulement les missions et résultats attestés. Reformule au maximum 2 à 5 points existants, sans en créer pour atteindre un quota.
- Reproduis les descriptions de formation et certification uniquement si elles existent.
- Le score de correspondance évalue seulement l'adéquation réelle et ne doit pas être artificiellement élevé.

FORMAT DE RÉPONSE :
Tu DOIS répondre UNIQUEMENT avec un objet JSON valide (sans markdown, sans backticks) avec la structure suivante :
{
  "personalInfo": {
    "fullName": "Prénom NOM du candidat (COPIÉ DU CV)",
    "title": "Titre de la famille du poste, non identique à l'offre et sans séniorité inventée",
    "email": "email du candidat (COPIÉ DU CV)",
    "phone": "téléphone du candidat (COPIÉ DU CV)",
    "location": "ville/adresse du candidat (COPIÉ DU CV)",
    "linkedin": "lien LinkedIn si présent",
    "website": "site web ou portfolio si présent",
    "github": "GitHub si présent"
  },
  "summary": "Résumé factuel de 2 à 4 phrases, sans nombre d'années déduit",
  "keySkills": ["uniquement des compétences présentes dans le CV, réordonnées par pertinence"],
  "experience": [
    {
      "title": "Titre du poste EXACT",
      "company": "Nom de l'entreprise EXACT",
      "period": "Dates EXACTES",
      "description": "Reformulation fidèle d'un contexte explicitement présent, sinon chaîne vide",
      "bullets": [
        "Missions ou résultats réellement présents dans le CV, reformulés sans ajout"
      ]
    }
  ],
  "education": [
    {
      "degree": "Diplôme EXACT",
      "school": "École/Université EXACTE",
      "period": "Dates EXACTES",
      "description": "Description présente dans le CV, sinon chaîne vide"
    }
  ],
  "projects": [
    {
      "name": "Nom du projet",
      "description": "Description courte du projet et technologies utilisées",
      "link": "URL si disponible"
    }
  ],
  "languages": ["Langue 1 - Niveau (ex: Natif, Courant, Intermédiaire)", "Langue 2 - Niveau"],
  "certifications": ["Certifications recopiées sans modification ni ajout"],
  "interests": ["Centre d'intérêt 1", "Centre d'intérêt 2"],
  "matchScore": 85,
  "improvements": ["conseil 1 pour améliorer le CV", "conseil 2"],
  "addedKeywords": ["mots-clés ATS déjà présents dans le CV et pertinents pour l'offre"]
}

CONTRÔLE FINAL : compare chaque information au CV source. Si une donnée ne peut pas être reliée directement au CV, supprime-la. Ne remplace jamais une donnée par un placeholder. Réponds uniquement avec le JSON.`;
}

/**
 * Build the system prompt for cover letter generation
 */
function buildCoverLetterPrompt(language) {
    const lang = language === 'fr' ? 'français' : 'English';
    return `Tu rédiges une lettre de motivation courte, précise et crédible en ${lang}, uniquement à partir du CV et de l'offre fournis.

RÈGLES FACTUELLES :
1. N'invente aucune expérience, compétence, réalisation, métrique, ancienneté, connaissance de l'entreprise ou motivation personnelle.
2. Ne mentionne un nombre d'années d'expérience que s'il est écrit explicitement dans le CV.
3. Ne prétends pas connaître l'actualité, la culture, les produits ou les projets de l'entreprise sauf s'ils figurent dans l'offre.
4. Choisis un ou deux éléments réels du profil qui répondent directement aux priorités explicites de l'offre.
5. Si le profil ne couvre pas un critère, ne prétends pas le contraire.

STYLE ET LONGUEUR :
- 180 à 250 mots maximum, hors objet, salutation et signature.
- Trois paragraphes courts : motivation liée à l'offre, adéquation factuelle du profil, projection concrète dans le poste.
- Ton direct, naturel et professionnel. Pas de flatterie générique, superlatif, cliché ou répétition du CV.
- Une seule salutation dans le champ "greeting". N'écris aucune salutation dans opening, body ou closing.
- Le champ "closing" contient seulement la dernière phrase proposant un échange. Il ne contient ni "Cordialement", ni signature.
- N'ajoute pas de champ fullText et ne répète jamais le nom du candidat dans le corps.

FORMAT DE RÉPONSE :
Tu DOIS répondre UNIQUEMENT avec un objet JSON valide (sans markdown, sans backticks) avec la structure suivante :
{
  "candidateName": "Prénom NOM du candidat",
  "subject": "Candidature au poste de [titre exact du poste visé]",
  "greeting": "Madame, Monsieur, ou nom du recruteur seulement s'il figure dans l'offre",
  "opening": "Motivation spécifique fondée sur les missions de l'offre",
  "body": "Adéquation entre un ou deux éléments réels du CV et les besoins de l'offre",
  "closing": "Contribution envisagée et proposition d'échange, sans formule de politesse ni signature"
}

IMPORTANT : Ne génère aucun placeholder. Vérifie que chaque affirmation sur le candidat existe dans le CV et que chaque affirmation sur l'entreprise existe dans l'offre. Réponds uniquement avec le JSON.`;
}

const CACHE_PREFIX = 'adaptacv_cache_v2_';

function hashCode(str) {
    let hash = 0;
    for (let i = 0, len = str.length; i < len; i++) {
        let chr = str.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
}

function getCacheKey(type, cvText, jobDescription, jobTitle, companyName, language, provider) {
    const raw = `${type}|${cvText}|${jobDescription}|${jobTitle}|${companyName}|${language}|${provider}`;
    return CACHE_PREFIX + type + '_' + hashCode(raw);
}

/**
 * Call the AI API to adapt the CV
 */
export async function adaptCV(cvText, jobDescription, jobTitle, companyName, onProgress) {
    const settings = getSettings();
    if (!settings.apiKey) {
        throw new Error('Clé API non configurée. Cliquez sur ⚙️ pour ajouter votre clé API.');
    }

    const providerName = settings.provider;
    const provider = PROVIDERS[providerName];
    if (!provider) {
        throw new Error('Fournisseur IA non reconnu.');
    }

    const cacheKey = getCacheKey('cv', cvText, jobDescription, jobTitle, companyName, settings.language, providerName);
    try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
            if (onProgress) {
                onProgress('adapt-start');
                setTimeout(() => onProgress('adapt-done'), 500);
            }
            return JSON.parse(cached);
        }
    } catch(e) { console.warn('Cache read error', e); }

    const userMessage = `VOICI LE CV COMPLET DU CANDIDAT :
---
${cvText}
---

VOICI L'OFFRE D'EMPLOI CIBLÉE :
Poste : ${jobTitle || 'Non spécifié'}
Entreprise : ${companyName || 'Non spécifiée'}
---
${jobDescription}
---

INSTRUCTIONS DÉTAILLÉES :
1. Commence par extraire TOUTES les informations personnelles du candidat (nom, prénom, email, téléphone, adresse, LinkedIn, GitHub, site web, etc.)
2. Recopie sans modification les employeurs, postes occupés, dates, formations, diplômes et certifications.
3. Conserve uniquement les missions, compétences, métriques et résultats présents dans le CV. N'en crée aucun.
4. Réordonne et reformule sobrement les éléments réels les plus pertinents pour l'offre.
5. Crée un titre de la même famille professionnelle que le poste ciblé, mais différent de son intitulé exact et conforme au niveau réel du candidat.
6. Ne mentionne pas de nombre total d'années d'expérience sauf s'il est explicitement écrit dans le CV.
7. Avant de répondre, supprime toute affirmation qui ne peut pas être prouvée par le CV source.

Réponds UNIQUEMENT en JSON valide.`;

    if (onProgress) onProgress('adapt-start');

    const result = await callAI(
        provider,
        settings.apiKey,
        buildAdaptCVPrompt(settings.language),
        userMessage
    );

    const parsedResult = parseJSONResponse(result);
    try {
        sessionStorage.setItem(cacheKey, JSON.stringify(parsedResult));
    } catch(e) { console.warn('Cache write error', e); }

    if (onProgress) onProgress('adapt-done');
    return parsedResult;
}

/**
 * Call the AI API to generate a cover letter
 */
export async function generateCoverLetter(cvText, jobDescription, jobTitle, companyName, onProgress) {
    const settings = getSettings();
    const providerName = settings.provider;
    const provider = PROVIDERS[providerName];

    const cacheKey = getCacheKey('letter', cvText, jobDescription, jobTitle, companyName, settings.language, providerName);
    try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
            if (onProgress) {
                onProgress('letter-start');
                setTimeout(() => onProgress('letter-done'), 500);
            }
            return normalizeCoverLetter(JSON.parse(cached));
        }
    } catch(e) { console.warn('Cache read error', e); }

    const userMessage = `VOICI LE CV COMPLET DU CANDIDAT :
---
${cvText}
---

VOICI L'OFFRE D'EMPLOI CIBLÉE :
Poste : ${jobTitle || 'Non spécifié'}
Entreprise : ${companyName || 'Non spécifiée'}
---
${jobDescription}
---

INSTRUCTIONS DÉTAILLÉES :
1. Analyse uniquement les besoins explicitement présents dans l'offre.
2. Sélectionne un ou deux éléments vérifiables du CV qui y répondent réellement.
3. Rédige 180 à 250 mots en trois paragraphes courts et complémentaires.
4. Formule une motivation cohérente à partir des missions proposées et du parcours réel, sans inventer d'intérêt personnel.
5. Place la salutation uniquement dans "greeting" et aucune formule de politesse dans "closing".

Réponds UNIQUEMENT en JSON valide.`;

    if (onProgress) onProgress('letter-start');

    const result = await callAI(
        provider,
        settings.apiKey,
        buildCoverLetterPrompt(settings.language),
        userMessage
    );

    const parsedResult = normalizeCoverLetter(parseJSONResponse(result));
    try {
        sessionStorage.setItem(cacheKey, JSON.stringify(parsedResult));
    } catch(e) { console.warn('Cache write error', e); }

    if (onProgress) onProgress('letter-done');
    return parsedResult;
}

function normalizeCoverLetter(letter) {
    const greetingPattern = /^\s*(?:(?:bonjour\s+)?madame\s*[,/&-]?\s*monsieur|(?:bonjour\s+)?monsieur\s*[,/&-]?\s*madame|madame|monsieur|dear\s+(?:sir(?:\s+or\s+madam)?|madam))[\s,:-]*/i;
    const signoffPattern = /\s*(?:bien\s+)?cordialement[,.]?\s*(?:\n\s*[^\n]{2,80})?\s*$/i;
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
    };
}

/**
 * Make the actual API call based on provider format
 */
async function callAI(provider, apiKey, systemPrompt, userMessage) {
    if (provider.format === 'openai') {
        return await callOpenAIFormat(provider, apiKey, systemPrompt, userMessage);
    } else if (provider.format === 'gemini') {
        return await callGeminiFormat(provider, apiKey, systemPrompt, userMessage);
    }
    throw new Error('Format de provider non supporté');
}

/**
 * Call OpenAI-compatible API (Groq, Mistral)
 */
async function callOpenAIFormat(provider, apiKey, systemPrompt, userMessage) {
    const response = await fetch(provider.url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: provider.model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage },
            ],
            temperature: 0.7,
            max_tokens: 8192,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData?.error?.message || response.statusText;
        throw new Error(`Erreur API ${provider.name}: ${errorMsg}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
}

/**
 * Call Gemini API
 */
async function callGeminiFormat(provider, apiKey, systemPrompt, userMessage) {
    const url = `${provider.url}?key=${apiKey}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            system_instruction: {
                parts: [{ text: systemPrompt }],
            },
            contents: [
                {
                    parts: [{ text: userMessage }],
                },
            ],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 8192,
                responseMimeType: 'application/json',
            },
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData?.error?.message || response.statusText;
        throw new Error(`Erreur API ${provider.name}: ${errorMsg}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

/**
 * Parse a JSON response from the AI, handling potential formatting issues
 */
function parseJSONResponse(raw) {
    // Remove markdown code blocks if present
    let cleaned = raw.trim();
    if (cleaned.startsWith('```json')) {
        cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith('```')) {
        cleaned = cleaned.slice(0, -3);
    }
    cleaned = cleaned.trim();

    try {
        return JSON.parse(cleaned);
    } catch (e) {
        // Try to find JSON in the response
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]);
            } catch (e2) {
                throw new Error('Impossible de parser la réponse IA. Réessayez.');
            }
        }
        throw new Error('La réponse IA n\'est pas au format JSON attendu. Réessayez.');
    }
}
