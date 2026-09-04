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

1. Importer un CV au format PDF.
2. Extraire son contenu localement, avec OCR si nécessaire.
3. Coller ou importer une offre d’emploi en PDF ou en image.
4. Choisir un modèle de CV et, éventuellement, une lettre de motivation.
5. Générer, prévisualiser et télécharger les documents LaTeX.

## Fonctionnalités

- Extraction de texte avec `pdfjs-dist`.
- OCR français et anglais avec Tesseract.js.
- Import des offres par texte, PDF, JPG, PNG ou WebP.
- Profil source mémorisé dans le stockage local du navigateur.
- Adaptation du CV avec Groq, Google Gemini ou Mistral AI.
- Prompts conçus pour limiter les inventions et préserver les informations factuelles.
- Lettre de motivation courte et optionnelle.
- Cinq modèles de CV différenciés : Clair, Moderne, Minimal, Exécutif et Créatif.
- Aperçu des modèles avec données d’exemple.
- Photo facultative conservée dans sa qualité originale.
- Historique local des candidatures.
- Génération de documents LaTeX et aperçu via TeXLive.net.
- PWA installable avec manifeste, icônes maskables et écran hors connexion.
- Interface responsive pour ordinateur et mobile.

## Confidentialité

AdaptaCV ne possède pas de serveur applicatif dans son état actuel.

- Le CV extrait, les réglages et l’historique sont mémorisés dans le navigateur avec `localStorage` ou `sessionStorage`.
- Lors d’une génération, le texte du CV et de l’offre est envoyé au fournisseur IA sélectionné avec la clé API renseignée par l’utilisateur.
- L’aperçu PDF LaTeX utilise le service externe TeXLive.net.
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
| IA | Groq, Gemini, Mistral |
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

La configuration est effectuée directement dans l’application avec le bouton **Réglages IA**.

| Fournisseur | Modèle actuel | Création de clé |
| --- | --- | --- |
| Groq | Llama 3.3 70B Versatile | [console.groq.com/keys](https://console.groq.com/keys) |
| Google | Gemini 2.5 Flash | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| Mistral AI | Mistral Small | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) |

La clé est enregistrée dans le stockage local du navigateur. Elle ne doit jamais être ajoutée au code, à Git ou à une capture d’écran publique.

## PWA

Le projet peut être installé comme application sur les navigateurs compatibles.

- Chrome et Android proposent le bouton **Installer**.
- Sur iPhone et iPad, utilisez **Partager**, puis **Sur l’écran d’accueil**.
- Le shell de l’application et une page hors connexion sont mis en cache.
- Une connexion reste nécessaire pour appeler les fournisseurs IA et compiler les aperçus distants.

Les icônes de marque peuvent être régénérées avec :

```bash
npm run brand:icons
```

## Structure du projet

```text
pdf_adapter/
├── index.html                  # Structure de l’application
├── src/
│   ├── main.js                 # État, navigation et interactions
│   ├── ai-service.js           # Prompts et appels aux fournisseurs IA
│   ├── pdf-parser.js           # Extraction PDF et OCR
│   ├── pdf-generator.js        # Orchestration LaTeX
│   ├── cv-templates.js         # Modèles de CV et lettre
│   ├── style.css               # Système visuel et responsive
│   └── toast.js                # Notifications
├── public/
│   ├── manifest.webmanifest    # Manifeste PWA
│   ├── service-worker.js       # Cache et mode hors connexion
│   ├── offline.html            # Écran hors connexion
│   └── icon-*.png              # Icônes installables
├── scripts/
│   └── generate-brand-icons.mjs
└── BRAND_MASTER_PROMPT.md      # Brief complet de branding
```

## Principes de génération

Les contributions aux prompts doivent préserver les règles suivantes :

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
npm run build
```

Pour les changements visuels, ajoutez des captures desktop et mobile. Pour les modèles LaTeX, testez les intitulés longs, les périodes longues, les sections absentes et les CV sur deux pages.

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
- L’OCR peut perdre la structure des documents complexes ou fortement illustrés.
- La qualité de la sortie IA dépend du fournisseur, du modèle et de l’offre fournie.
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
