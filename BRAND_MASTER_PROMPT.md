# AdaptaCV Brand Master Prompt

Copiez ce prompt dans un modèle de stratégie de marque ou de génération visuelle. Il couvre le positionnement, le logo, le favicon, la PWA, les supports sociaux et la voix éditoriale.

```text
RÔLE
Agis comme une équipe de branding d’élite réunissant stratégie de marque, direction artistique, identité visuelle, typographie, iconographie, product design, motion design, accessibilité et copywriting français. Crée une identité distinctive, cohérente et directement exploitable en production pour AdaptaCV. Chaque décision doit découler du produit, jamais d’une tendance graphique générique liée à l’IA.

PRODUIT
AdaptaCV est une application web française respectueuse de la vie privée. L’utilisateur enregistre localement un CV source, colle ou importe une offre d’emploi, puis l’IA adapte fidèlement le CV et peut produire une lettre de motivation concise. L’application ne doit jamais inventer une expérience, une formation, un certificat, une compétence, une séniorité ou une métrique. Elle réorganise et reformule uniquement les faits vérifiés.

PUBLIC
- Candidats francophones postulant à des emplois qualifiés.
- Candidats internationaux utilisant une sortie en anglais.
- Contexte émotionnel : stress, manque de temps, peur de mal se présenter ou d’exposer ses données.
- Sentiment recherché : « Mon parcours reste authentique, mais il est maintenant clair et pertinent pour cette offre. »

POSITIONNEMENT
- Catégorie : assistant privé de candidature alimenté par IA.
- Promesse : un profil honnête, clairement adapté à chaque opportunité pertinente.
- Différence : adaptation fidèle sans fabrication de références.
- Personnalité : précise, rassurante, intelligente, discrète, utile, contemporaine.
- Territoire verbal central : « Aligner sans dénaturer. »

INTERDITS
Pas de robot, cerveau, réseau neuronal, baguette magique, étoiles décoratives, bouclier comme logo principal, plume calligraphique, fusée, poignée de main, cible, dégradé violet-bleu, halo néon, statistiques de réussite inventées, promesse d’obtenir un emploi, jargon de recruteur ou esthétique générique de startup IA.

NOM
AdaptaCV. Conserver exactement cette orthographe. Ne jamais couper le nom sur deux lignes. Dans le logotype, « Adapta » peut être en couleur encre et « CV » en vert de marque.

IDÉE VISUELLE
Relier trois notions : document source, vérification et alignement. Concevoir un « A » abstrait à partir d’une feuille pliée et d’un trait de validation. Le symbole doit rester reconnaissable sans texte à 16 px et pouvoir être redessiné de mémoire.

CONTRAINTES DU SYMBOLE
- Maximum trois éléments géométriques significatifs.
- Aucun détail fragile ou trait inférieur à 2 px à une taille de 32 px.
- Aucune lettre ou aucun texte dans l’icône d’application.
- Fonctionner en monochrome, inversé blanc et version couleur.
- Contenu essentiel dans les 66 % centraux pour l’icône maskable.
- Lisible sur fond clair, sombre, cercle Android, squircle et carré arrondi iOS.

PALETTE VERROUILLÉE
- Vert de marque : #2E6B4F
- Vert profond : #20513B
- Encre : #17201B
- Fond : #F4F6F1
- Surface : #FFFFFF
- Vert doux : #DCEADE
- Texte secondaire : #68716B
- Bordure : #DCE2DC
- Erreur : #A84242
Ne pas ajouter de violet, bleu électrique, cyan, or ou dégradé multicolore. Vérifier WCAG AA.

TYPOGRAPHIE
- Manrope ou une sans-serif géométrique humaniste équivalente.
- Titres compacts, solides, avec léger tracking négatif.
- Corps neutre, lisible et calme.
- Dates, périodes et métadonnées parfaitement alignées.
- Ne pas ajouter une serif décorative uniquement pour simuler un rendu premium.

VOIX
- Français d’abord, direct, calme, factuel.
- Exemples recommandés : « Votre CV est prêt », « Profil mémorisé localement », « Adapter à cette offre ».
- Exemples interdits : « Révolutionnez votre carrière », « CV parfait », « Décrochez le poste à coup sûr », « Notre IA magique ».
- Ne jamais promettre un résultat d’embauche.
- Rester transparent : le profil est mémorisé localement, mais la génération utilise le fournisseur IA configuré.

LOGO À PRODUIRE
1. Verrouillage horizontal principal.
2. Symbole seul.
3. Version monochrome.
4. Version inversée.
5. Correction optique pour 16, 24 et 32 px.
6. Zone de protection et tailles minimales.
7. Grille de construction et justification géométrique.
8. Exemples de mauvais usages.
9. Description vectorielle compatible SVG, sans filtre.

FAVICON ET ICÔNE D’APPLICATION
- Tailles : 1024, 512, 384, 192, 180, 128, 64, 48, 32 et 16 px.
- Versions standard et maskable PWA.
- Fond #2E6B4F, premier plan #F7FAF7, pli éventuel #DCEADE.
- À 16 px : simplifier en silhouette document/A avec une seule encoche de validation.
- Aucun wordmark dans l’icône.

LIVRABLES PWA ET MARKETING
- Famille de favicons.
- Apple Touch Icon.
- Icône maskable Android.
- Concept monochrome pour notifications.
- Direction des écrans de démarrage.
- Illustration d’état hors connexion utilisant uniquement la géométrie de marque.
- Carte Open Graph 1200 × 630 avec un seul titre et un visuel de document.
- Direction artistique des captures desktop et mobile pour les stores.

MOTION
Les mouvements doivent exprimer l’alignement et la validation. Animation suggérée : deux bords de document s’alignent, puis le trait de validation forme le A. Durée 600 à 900 ms. Aucun halo perpétuel, particule flottante ou rebond décoratif. Respecter prefers-reduced-motion.

ACCESSIBILITÉ ET PRODUCTION
- Tester le symbole à 16 px et en niveaux de gris.
- Contraste WCAG AA minimum.
- SVG avec viewBox, chemins simples, sans raster ni filtre.
- Fournir des tokens sémantiques, pas seulement des valeurs hexadécimales.
- Distinguer clairement le logo des icônes Material Symbols de l’interface.

FORMAT DE SORTIE OBLIGATOIRE
1. Résumé stratégique en cinq points.
2. Concept de marque et justification.
3. Trois pistes d’identité réellement distinctes avec nom, construction, typographie, couleurs, avantages et risques.
4. Matrice de décision notée et recommandation finale.
5. Spécification finale du logo et instructions vectorielles.
6. Tokens couleur et typographie.
7. Principes de voix avec bons et mauvais exemples.
8. Douze signatures françaises de 2 à 7 mots, puis trois finalistes.
9. Spécification favicon et app icon par taille.
10. Direction PWA, sociale et store.
11. Motion design.
12. Checklist accessibilité et production.
13. Prompts finaux séparés pour symbole, logo horizontal, app icon, maskable icon, carte sociale, illustration hors connexion et captures store.

EXIGENCE QUALITÉ
Le résultat doit être crédible à côté des meilleurs produits français de productivité et de recherche d’emploi, tout en restant immédiatement identifiable comme AdaptaCV. Si une proposition peut être réutilisée sans modification pour une application générique de rédaction IA, la rejeter et recommencer.
```

## Prompt court pour générer l’icône

```text
Icône d’application vectorielle premium pour AdaptaCV, assistant privé d’adaptation de CV. Construire un A abstrait à partir d’une feuille pliée et d’une coche d’alignement. Fond vert forêt #2E6B4F, premier plan blanc cassé #F7FAF7, coin plié vert pâle #DCEADE. Géométrie plate, maximum trois éléments, espace négatif fort, aucun texte, aucun dégradé, aucun halo, aucun robot, aucune étoile, aucune plume, aucun bouclier. Garder toute la géométrie essentielle dans les 66 % centraux pour une icône maskable. Reconnaissable à 16 px, compatible cercle Android, squircle et carré arrondi iOS. Format carré 1:1, chemins simples compatibles SVG, équilibre optique précis.
```
