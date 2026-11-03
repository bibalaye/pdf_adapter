# Modèles de CV : sources et licences

Les modèles de CV d'AdaptaCV s'appuient sur des bibliothèques LaTeX libres. Cette page indique lesquelles, et sous quelle licence.

## Bibliothèques utilisées

| Modèles | Bibliothèque | Licence | Mode d'utilisation |
| --- | --- | --- | --- |
| Banque, Héritage, Éditorial, Contemporain, Raffiné | [moderncv](https://ctan.org/pkg/moderncv), par Xavier Danaux et les mainteneurs de moderncv | [LPPL 1.3c](https://www.latex-project.org/lppl/lppl-1-3c/) | Non copiée dans ce dépôt : la classe est fournie par TeX Live au moment de la compilation |
| Alta | [AltaCV](https://github.com/liantze/AltaCV), par LianTze Lim | [LPPL 1.3](https://www.latex-project.org/lppl/) | Fichier `public/altacv.cls` non modifié, intégré aux documents générés |
| Compact | [Jake's Resume](https://github.com/jakegut/resume), par Jake Gutierrez | MIT (ci-dessous) | Préambule adapté : format A4, encodage T1, titres sur plusieurs lignes, sans babel |

## Inspiration, sans reprise de code

Ces modèles sont écrits pour AdaptaCV et reprennent seulement une idée de présentation.

| Modèle | Inspiration | Pourquoi la bibliothèque n'est pas utilisée directement |
| --- | --- | --- |
| Impact | [Awesome-CV](https://github.com/posquit0/Awesome-CV) (LPPL 1.3c) : titres dont les premières lettres sont colorées | Exige LuaLaTeX et des polices système absentes de TeX Live |
| Académique | [McDowell CV](https://github.com/dnl-blkv/mcdowell-cv) (MIT) : mise en page sobre à empattements | Dépend d'une police système via fontspec |
| Panneau | [Twenty Seconds CV](https://github.com/spagnuolocarmine/TwentySecondsCurriculumVitae-LaTex) (MIT) : colonne latérale claire | Libellés anglais figés, et titres de section incompatibles avec une initiale accentuée |

## Licence MIT de Jake's Resume

```text
MIT License

Copyright (c) 2020 Jake Gutierrez

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
