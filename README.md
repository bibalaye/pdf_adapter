<div align="center">
  <img src="public/logo.svg" alt="AdaptaCV" width="280">

  <h1>AdaptaCV</h1>

  <p><strong>Un CV fidèle à votre parcours, clairement adapté à chaque offre.</strong></p>

  <p>
    <a href="#installation">Installation</a> ·
    <a href="#configuration-ia">Configuration IA</a> ·
    <a href="#contribuer">Contribuer</a> ·
    <a href="https://github.com/bibalaye/pdf_adapter/issues">Issues</a>
  </p>
</div>

## À propos

AdaptaCV est une application web qui transforme un CV source et une offre d’emploi en dossier de candidature ciblé.

Le projet poursuit un principe simple : **adapter la présentation, jamais inventer le parcours**. Les expériences, formations, certifications, compétences, dates et métriques doivent provenir du CV original.

### Parcours utilisateur

1. Importer un CV au format PDF, ou coller son texte.
2. Extraire son contenu localement, avec OCR si nécessaire, et le corriger depuis **Mon CV**.
3. Coller ou importer une offre d’emploi en PDF ou en image.
4. Choisir un modèle de CV et, éventuellement, une lettre de motivation.
5. Générer, relire, puis obtenir le PDF ou la source LaTeX.
6. Retrouver chaque dossier dans **Candidatures**.

## Fonctionnalités

- Extraction de texte avec `pdfjs-dist`.
- OCR français et anglais avec Tesseract.js.
- Import des offres par texte, PDF, JPG, PNG ou WebP.
- Profil source mémorisé dans le stockage local du navigateur.
- Adaptation du CV avec Groq, Google Gemini, Mistral AI, OpenRouter, ou votre propre modèle compatible OpenAI.
- Panel de recrutement : sept relecteurs simulés essaient de rejeter le CV, puis il est reconstruit.
- Contrôle de fidélité sans IA : ce qui n'apparaît pas dans le CV source est retiré et signalé.
- Questions posées au candidat pour les faits manquants, intégrées au CV source.
- Prompts conçus pour limiter les inventions et préserver les informations factuelles.
- Lettre de motivation courte et optionnelle.
- Quinze modèles de CV classés en quatre familles, dont sept issus des bibliothèques libres moderncv, AltaCV et Jake's Resume ([sources et licences](THIRD_PARTY_NOTICES.md)).
- Galerie avec filtres, aperçu de chaque modèle et vrai PDF d’exemple généré à partir de données fictives.
- Titres de sections en français ou en anglais, selon la langue du dossier.
- Photo facultative conservée dans sa qualité originale.
- Historique local des candidatures, avec recherche, score d’adéquation et annulation de la suppression.
- Mots-clés mis en avant et pistes d’amélioration affichés avec chaque dossier.
- Une clé API distincte pour chaque fournisseur.
- Génération de documents LaTeX et PDF via TeXLive.net.
- PWA installable avec manifeste, icônes maskables et écran hors connexion.
- Interface responsive pour ordinateur et mobile.

## Confidentialité

AdaptaCV ne possède pas de serveur applicatif dans son état actuel.

- Le CV extrait, les réglages et l’historique sont mémorisés dans le navigateur avec `localStorage` ou `sessionStorage`.
- Lors d’une génération, le texte du CV et de l’offre est envoyé au fournisseur IA sélectionné avec la clé API renseignée par l’utilisateur.
- Le PDF est compilé par le service externe TeXLive.net, qui reçoit le contenu du document à chaque demande.
- La police et les icônes sont servies par l’application : aucune requête vers Google Fonts.
- Aucune garantie ne peut être donnée concernant la conservation ou le traitement des données par ces services tiers. Consultez leurs politiques avant utilisation.
- Évitez d’utiliser des données sensibles si vous ne souhaitez pas les transmettre au fournisseur configuré.

## Stack technique

| Domaine | Technologie |
| --- | --- |
| Build | Vite 7 |
| Interface | HTML, CSS et JavaScript natif |
| PDF | pdfjs-dist, pdf-lib |
| OCR | Tesseract.js |
| Téléchargement | file-saver |
| IA | Groq, Gemini, Mistral, OpenRouter, services compatibles OpenAI |
| Documents | LaTeX, TeXLive.net |
| PWA | Web App Manifest, Service Worker |

## Installation

### Prérequis

- Node.js 20 ou version ultérieure recommandée.
- npm.
- Une clé API pour au moins un fournisseur IA compatible.

### Lancer le projet

```bash
git clone https://github.com/bibalaye/pdf_adapter.git
cd pdf_adapter
npm install
npm run dev
```

Vite affiche ensuite l’adresse locale de l’application, généralement `http://localhost:5173`.

### Build de production

```bash
npm run build
npm run preview
```

Les fichiers générés se trouvent dans `dist/`.

## Configuration IA

La configuration est effectuée directement dans l’application avec le menu **Réglages**. Si aucune clé n’est enregistrée, elle est demandée au moment de lancer l’adaptation et la génération reprend dès l’enregistrement.

| Fournisseur | Modèle recommandé | Création de clé |
| --- | --- | --- |
| Groq | `openai/gpt-oss-120b` | [console.groq.com/keys](https://console.groq.com/keys) |
| Google | `gemini-3.8-flash` | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| Mistral AI | `mistral-small-2603` | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) |
| OpenRouter | `nvidia/nemotron-3.5-super-vl:free` | [openrouter.ai/settings/keys](https://openrouter.ai/settings/keys) |

Catalogue vérifié le 2 novembre 2026 sur la documentation de chaque fournisseur. Il vieillit vite : le bouton d'actualisation des réglages interroge le fournisseur, et l'application passe au modèle suivant si l'un d'eux est retiré. Mettez à jour `PROVIDERS` dans `src/ai-service.js` à chaque changement.

Les offres gratuites peuvent utiliser les données envoyées, selon le fournisseur. Les réglages l'indiquent pour chacun d'eux.

### Ajouter son propre modèle

**Réglages**, puis **Ajouter mon propre modèle** accepte tout service compatible avec l'API OpenAI : Ollama, LM Studio, vLLM ou un autre fournisseur. L'adresse doit être en https, sauf sur une adresse locale. Un serveur local doit autoriser les appels depuis le site (par exemple `OLLAMA_ORIGINS` pour Ollama).

Chaque clé est enregistrée dans le stockage local du navigateur, séparément pour chaque fournisseur. Elle ne doit jamais être ajoutée au code, à Git ou à une capture d’écran publique.

## PWA

Le projet peut être installé comme application sur les navigateurs compatibles.

- Chrome et Android proposent le bouton **Installer**.
- Sur iPhone et iPad, utilisez **Partager**, puis **Sur l’écran d’accueil**.
- Le shell de l’application et une page hors connexion sont mis en cache.
- Une connexion reste nécessaire pour appeler les fournisseurs IA et compiler les aperçus distants.

Les icônes de marque et le sprite d’icônes de l’interface peuvent être régénérés avec :

```bash
npm run brand:icons
npm run brand:sprite
```

Pour utiliser une nouvelle icône d’interface, ajoutez son nom Material Symbols à la liste de `scripts/build-icon-sprite.mjs`, puis régénérez le sprite.

## Structure du projet

```text
pdf_adapter/
├── index.html                  # Structure de l’application
├── src/
│   ├── main.js                 # État, routes, navigation et interactions
│   ├── ai-service.js           # Catalogue de modèles, appels et reprises
│   ├── prompts.js              # Prompts système
│   ├── hiring-panel.js         # Panel de recrutement et reconstruction
│   ├── fidelity.js             # Contrôle de fidélité, sans IA
│   ├── pdf-parser.js           # Extraction PDF et OCR
│   ├── pdf-generator.js        # Orchestration LaTeX
│   ├── cv-templates.js         # Catalogue et modèles LaTeX de CV et de lettre
│   ├── style.css               # Système visuel et responsive
│   ├── icon.js                 # Référence au sprite d’icônes
│   └── toast.js                # Notifications
├── public/
│   ├── manifest.webmanifest    # Manifeste PWA
│   ├── service-worker.js       # Cache et mode hors connexion
│   ├── offline.html            # Écran hors connexion
│   ├── icons.svg               # Sprite d’icônes de l’interface
│   └── icon-*.png              # Icônes installables
├── scripts/
│   ├── generate-brand-icons.mjs
│   ├── build-icon-sprite.mjs
│   └── check-latex-templates.mjs  # Compile chaque modèle sur TeXLive.net
├── tests/                      # Contrôle de fidélité et structure des modèles
├── THIRD_PARTY_NOTICES.md      # Sources et licences des modèles
└── BRAND_MASTER_PROMPT.md      # Brief complet de branding
```

## Principes de génération

Une génération enchaîne l'adaptation, le panel, la reconstruction, un second passage du filtre et la lettre. Le panel express tient en une requête pour respecter les quotas gratuits. L'option **Relecteurs isolés** envoie une requête par relecteur. Le contrôle de fidélité (`src/fidelity.js`) s'applique ensuite à tout CV, avec ou sans panel. La méthode du panel vient de `/hiring-panel`, par Alex Chen (@nocodealex, chen.media).

Les contributions aux prompts (`src/prompts.js`) doivent préserver les règles suivantes :

- Ne jamais inventer une expérience, formation, certification ou compétence.
- Ne jamais calculer une ancienneté absente du CV.
- Ne jamais ajouter une métrique, une équipe, un budget ou un résultat non mentionné.
- Conserver les employeurs, postes, établissements et dates.
- Adapter le titre du CV à la famille du poste sans copier exactement l’offre.
- Préférer une omission honnête à une supposition.

## Contribuer

Les contributions sont les bienvenues, notamment sur :

- la qualité et la robustesse des modèles LaTeX ;
- l’accessibilité et la navigation clavier ;
- l’amélioration de l’OCR ;
- les tests automatisés ;
- la réduction du bundle PDF/OCR ;
- les traductions ;
- la sécurité et la protection des données ;
- l’expérience PWA et hors connexion.

### Processus recommandé

1. Consultez les [issues existantes](https://github.com/bibalaye/pdf_adapter/issues).
2. Ouvrez une issue pour les changements importants avant de coder.
3. Créez une branche dédiée.
4. Limitez chaque pull request à un sujet cohérent.
5. Vérifiez le build avant l’envoi.

```bash
npm install
npm test
npm run build
```

Pour les changements visuels, ajoutez des captures desktop et mobile. Pour les modèles LaTeX, testez les intitulés longs, les périodes longues, les sections absentes et les CV sur deux pages.

`npm test` vérifie la structure du LaTeX généré, mais pas sa compilation. Après toute modification d’un modèle, compilez-les vraiment :

```bash
npm run check:latex            # tous les modèles, sans photo
npm run check:latex -- --photo # tous les modèles, avec une photo de test
npm run check:latex -- alta    # un seul modèle
```

Ce script envoie un CV fictif à TeXLive.net, puis enregistre les PDF et les journaux dans `latex-check/`.

### Ajouter un modèle

1. Ajoutez-le à `TEMPLATE_CATALOG` dans `src/cv-templates.js`, avec sa famille, ses faits (colonnes, photo) et sa source.
2. Écrivez sa fonction de rendu et son cas dans `generateCVTemplate`.
3. Si son aperçu demande une nouvelle mise en page, ajoutez-la dans `renderLiveCVPreview` et dans `src/style.css`.
4. Vérifiez sa licence et citez-la dans `THIRD_PARTY_NOTICES.md`. Une classe LaTeX copiée dans `public/` doit le rester sans modification si sa licence l’exige.
5. Lancez `npm test` puis `npm run check:latex`.

## Signaler un problème

Ouvrez une [issue GitHub](https://github.com/bibalaye/pdf_adapter/issues) avec :

- les étapes de reproduction ;
- le navigateur et le système utilisés ;
- le fournisseur IA sélectionné ;
- les messages de la console ;
- une capture si elle ne contient aucune donnée personnelle.

Ne publiez jamais une clé API, un CV réel ou des coordonnées personnelles dans une issue.

## Limites connues

- La compilation d’aperçu dépend de TeXLive.net et d’une connexion réseau.
- L’aperçu affiché dans l’application reste indicatif : seul le PDF fait foi.
- Les modèles en deux colonnes peuvent être moins bien lus par certains logiciels de tri.
- Les CV en alphabet non latin (cyrillique, arabe, chinois) ne bloquent plus la compilation, mais leur rendu n’est pas garanti.
- L’OCR peut perdre la structure des documents complexes ou fortement illustrés.
- La qualité de la sortie IA dépend du fournisseur, du modèle et de l’offre fournie.
- Le panel simule des relecteurs : il ne prédit ni un vrai filtre ATS, ni une décision d'embauche.
- Le contrôle de fidélité vérifie les chiffres, compétences, coordonnées et niveaux de séniorité. Il ne détecte pas une responsabilité exagérée sans chiffre : relisez toujours.
- Les documents générés doivent toujours être relus avant envoi.
- Le bundle client est relativement volumineux à cause des bibliothèques PDF et OCR.

## Identité de marque

Le brief complet de marque, les contraintes du logo et les prompts de génération sont disponibles dans [`BRAND_MASTER_PROMPT.md`](BRAND_MASTER_PROMPT.md).

## Licence

Ce dépôt ne contient pas encore de fichier `LICENSE`. En l’absence de licence explicite, le code reste soumis au droit d’auteur par défaut et aucune permission générale de copie, modification ou redistribution n’est accordée.

Une licence devra être choisie avant de présenter officiellement le projet comme open source.

---

<div align="center">
  <strong>AdaptaCV</strong><br>
  Aligner sans dénaturer.
</div>
