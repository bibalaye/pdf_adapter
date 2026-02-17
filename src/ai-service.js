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
    return `Tu es un expert senior en recrutement, rédaction de CV professionnels et optimisation ATS (Applicant Tracking System) avec 15+ ans d'expérience.

Ton rôle est d'adapter le contenu d'un CV existant pour qu'il corresponde au mieux à une offre d'emploi spécifique. Tu dois produire un CV COMPLET, DÉTAILLÉ et PROFESSIONNEL qui impressionne les recruteurs.

RÈGLES IMPÉRATIVES :
1. Tu DOIS CONSERVER et RECOPIER EXACTEMENT toutes les informations personnelles du candidat : nom complet, prénom, email, téléphone, adresse, LinkedIn, site web, GitHub, portfolio, etc.
2. Tu DOIS CONSERVER toutes les expériences professionnelles RÉELLES du candidat avec les dates, entreprises et postes EXACTS. NE CHANGE PAS les noms d'entreprises, les dates, ou les titres de poste originaux.
3. Tu DOIS CONSERVER toutes les formations du candidat avec les dates, écoles et diplômes EXACTS.
4. Tu ne dois PAS INVENTER de compétences, expériences ou formations que le candidat n'a pas.
5. Tu peux REFORMULER les descriptions de missions et réalisations pour mieux correspondre à l'offre (utiliser les mots-clés de l'offre).
6. Tu peux RÉORGANISER l'ordre des compétences pour mettre en avant celles pertinentes pour l'offre.
7. Tu peux AJOUTER des mots-clés ATS pertinents issus de l'offre, UNIQUEMENT s'ils correspondent à des compétences réelles du candidat.
8. Tu dois garder un ton professionnel et factuel.
9. Réponds en ${lang}.

RÈGLES DE CONTENU DÉTAILLÉ — TRÈS IMPORTANT :
10. Le "summary" (résumé professionnel) doit faire 4 à 6 phrases complètes. Il doit être percutant, mentionner les années d'expérience, les domaines d'expertise principaux, les technologies clés, et montrer la valeur ajoutée du candidat par rapport à l'offre.
11. Chaque expérience professionnelle doit avoir entre 4 et 6 "bullets" (réalisations). Chaque bullet doit être détaillé (1-2 phrases), utiliser des verbes d'action forts et inclure des métriques/chiffres quand possible (ex: "Augmenté les performances de 40%", "Géré une équipe de 5 développeurs", "Déployé en production pour 10 000+ utilisateurs").
12. Chaque formation doit inclure un champ "description" avec les mentions, spécialisations, projets notables ou mémoire si pertinent.
13. Les "keySkills" doivent comprendre entre 8 et 15 compétences, organisées par pertinence pour l'offre.
14. Si le candidat a des projets personnels/open source pertinents, les inclure dans "projects".
15. Inclure les "interests" (centres d'intérêt) si le candidat en mentionne.
16. Les "certifications" doivent inclure l'organisme certificateur si disponible.

FORMAT DE RÉPONSE :
Tu DOIS répondre UNIQUEMENT avec un objet JSON valide (sans markdown, sans backticks) avec la structure suivante :
{
  "personalInfo": {
    "fullName": "Prénom NOM du candidat (COPIÉ DU CV)",
    "title": "Titre professionnel adapté à l'offre",
    "email": "email du candidat (COPIÉ DU CV)",
    "phone": "téléphone du candidat (COPIÉ DU CV)",
    "location": "ville/adresse du candidat (COPIÉ DU CV)",
    "linkedin": "lien LinkedIn si présent",
    "website": "site web ou portfolio si présent",
    "github": "GitHub si présent"
  },
  "summary": "Résumé professionnel DÉTAILLÉ adapté à l'offre (4-6 phrases percutantes mentionnant années d'expérience, domaines d'expertise, technologies maîtrisées et valeur ajoutée pour le poste visé)",
  "keySkills": ["compétence 1", "compétence 2", "...", "8 à 15 compétences organisées par pertinence"],
  "experience": [
    {
      "title": "Titre du poste EXACT",
      "company": "Nom de l'entreprise EXACT",
      "period": "Dates EXACTES",
      "description": "Brève description du rôle et du contexte (équipe, environnement technique, enjeux)",
      "bullets": [
        "Réalisation 1 détaillée avec verbe d'action et métriques (obligatoire: 4-6 bullets par expérience)",
        "Réalisation 2 reformulée avec mots-clés de l'offre et impact mesurable",
        "Réalisation 3 mettant en avant les compétences techniques utilisées",
        "Réalisation 4 démontrant les résultats concrets et la valeur apportée"
      ]
    }
  ],
  "education": [
    {
      "degree": "Diplôme EXACT",
      "school": "École/Université EXACTE",
      "period": "Dates EXACTES",
      "description": "Mention, spécialisation, matières pertinentes ou projet de fin d'études si applicable"
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
  "certifications": ["Certification 1 — Organisme (Année si connue)", "Certification 2"],
  "interests": ["Centre d'intérêt 1", "Centre d'intérêt 2"],
  "matchScore": 85,
  "improvements": ["conseil 1 pour améliorer le CV", "conseil 2"],
  "addedKeywords": ["mot-clé ATS 1 ajouté", "mot-clé ATS 2"]
}

IMPORTANT : 
- Tous les champs de personalInfo, experience et education doivent contenir les données RÉELLES du CV du candidat. Ne remplace JAMAIS un nom, une date, un diplôme ou une entreprise par un placeholder.
- Le CV généré doit être EXHAUSTIF et COMPLET. Ne raccourcis PAS le contenu. Un bon CV professionnel fait 1 à 2 pages.
- Chaque bullet point doit être une phrase complète avec un verbe d'action au début.
- Si des informations sont manquantes dans le CV source (pas de projets, pas de centres d'intérêt), laisse le tableau vide [].`;
}

/**
 * Build the system prompt for cover letter generation
 */
function buildCoverLetterPrompt(language) {
    const lang = language === 'fr' ? 'français' : 'English';
    return `Tu es un expert en rédaction de lettres de motivation professionnelles.

Ton rôle est de rédiger une lettre de motivation personnalisée et convaincante basée sur le CV du candidat et l'offre d'emploi.

RÈGLES :
1. La lettre doit être professionnelle mais avec un ton moderne et authentique.
2. Elle doit utiliser le vrai nom du candidat.
3. Elle doit montrer la motivation du candidat pour ce poste SPÉCIFIQUE dans cette entreprise SPÉCIFIQUE.
4. Elle doit mettre en relation les compétences et expériences RÉELLES du candidat avec les besoins de l'offre.
5. Elle doit être concise (300-400 mots maximum).
6. Ne pas inventer de compétences que le candidat n'a pas.
7. Inclure des exemples concrets tirés de l'expérience du candidat.
8. Réponds en ${lang}.

FORMAT DE RÉPONSE :
Tu DOIS répondre UNIQUEMENT avec un objet JSON valide (sans markdown, sans backticks) avec la structure suivante :
{
  "candidateName": "Prénom NOM du candidat",
  "subject": "Candidature au poste de [titre exact du poste visé]",
  "greeting": "Madame, Monsieur,",
  "opening": "Premier paragraphe d'accroche montrant l'intérêt pour le poste...",
  "body": "Corps de la lettre reliant les compétences du candidat aux besoins de l'offre (2-3 paragraphes, utilise \\n\\n pour séparer)...",
  "closing": "Paragraphe de conclusion avec appel à l'action...",
  "signature": "Cordialement,\\nPrénom NOM",
  "fullText": "La lettre complète en un seul bloc de texte formaté, commençant par l'objet puis la formule de politesse, le corps et la signature"
}`;
}

/**
 * Call the AI API to adapt the CV
 */
export async function adaptCV(cvText, jobDescription, jobTitle, companyName, onProgress) {
    const settings = getSettings();
    if (!settings.apiKey) {
        throw new Error('Clé API non configurée. Cliquez sur ⚙️ pour ajouter votre clé API.');
    }

    const provider = PROVIDERS[settings.provider];
    if (!provider) {
        throw new Error('Fournisseur IA non reconnu.');
    }

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
2. Conserve TOUTES les expériences professionnelles avec les dates et entreprises EXACTES
3. Pour CHAQUE expérience, génère entre 4 et 6 bullet points DÉTAILLÉS avec des verbes d'action et des métriques/chiffres quand possible
4. Ajoute une "description" de contexte pour chaque expérience (taille d'équipe, stack technique, enjeux)
5. Conserve TOUTES les formations avec dates et écoles EXACTES, et ajoute une description (mention, spécialisation)
6. Crée un résumé professionnel LONG et PERCUTANT (4-6 phrases) qui met en avant les points forts du candidat par rapport à l'offre
7. Liste 8 à 15 compétences clés organisées par pertinence
8. Inclus les projets personnels/professionnels notables si mentionnés
9. Inclus les centres d'intérêt si mentionnés
10. Reformule les descriptions pour correspondre aux mots-clés de l'offre

RAPPEL : Le CV doit être COMPLET et DÉTAILLÉ, pas un résumé minimaliste. Chaque section doit être riche en contenu.

Réponds UNIQUEMENT en JSON valide.`;

    if (onProgress) onProgress('adapt-start');

    const result = await callAI(
        provider,
        settings.apiKey,
        buildAdaptCVPrompt(settings.language),
        userMessage
    );

    if (onProgress) onProgress('adapt-done');
    return parseJSONResponse(result);
}

/**
 * Call the AI API to generate a cover letter
 */
export async function generateCoverLetter(cvText, jobDescription, jobTitle, companyName, onProgress) {
    const settings = getSettings();
    const provider = PROVIDERS[settings.provider];

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

Rédige une lettre de motivation personnalisée en utilisant le VRAI nom du candidat et ses VRAIES expériences. Réponds UNIQUEMENT en JSON valide.`;

    if (onProgress) onProgress('letter-start');

    const result = await callAI(
        provider,
        settings.apiKey,
        buildCoverLetterPrompt(settings.language),
        userMessage
    );

    if (onProgress) onProgress('letter-done');
    return parseJSONResponse(result);
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
