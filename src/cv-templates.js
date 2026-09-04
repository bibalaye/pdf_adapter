/**
 * CV Templates Collection
 * Each function returns a LaTeX string
 */

// Escape LaTeX special characters (duplicated here for independence, or could be imported)
export function escapeLatex(str) {
    if (!str) return '';
    return String(str)
        .replace(/\\/g, '\\textbackslash{}')
        .replace(/\{/g, '\\{')
        .replace(/\}/g, '\\}')
        .replace(/\$/g, '\\$')
        .replace(/&/g, '\\&')
        .replace(/#/g, '\\#')
        .replace(/\^/g, '\\textasciicircum{}')
        .replace(/_/g, '\\_')
        .replace(/~/g, '\\textasciitilde{}')
        .replace(/%/g, '\\%');
}

function escapeLatexArray(arr) {
    if (!arr || !Array.isArray(arr)) return [];
    return arr.map(escapeLatex);
}

/**
 * Standard templates (Classic, Modern, Executive, Bold)
 */
export function generateStandardTemplate(cvData, candidateName, template = 'classic', profilePhotoLatex = '') {
    const pi = cvData.personalInfo || {};
    const name = pi.fullName || candidateName || 'Candidat';

    let primaryColor = '40, 50, 110';
    if (template === 'modern') {
        primaryColor = '108, 92, 231';
    } else if (template === 'executive') {
        primaryColor = '26, 26, 46';
    } else if (template === 'bold') {
        primaryColor = '225, 112, 85';
    }

    let tex = `\\documentclass[11pt,a4paper,sans]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{lmodern}
\\usepackage{geometry}
\\geometry{left=1.5cm, right=1.5cm, top=1.8cm, bottom=1.8cm}
\\usepackage{xcolor}
\\usepackage{titlesec}
\\usepackage{enumitem}
\\usepackage{hyperref}
\\usepackage{parskip}
${profilePhotoLatex ? '\\usepackage{tikz}' : ''}

\\definecolor{primary}{RGB}{${primaryColor}}
\\definecolor{textdark}{RGB}{50, 50, 50}

\\hypersetup{
    colorlinks=true,
    linkcolor=primary,
    filecolor=primary,      
    urlcolor=primary,
    pdftitle={CV - ${escapeLatex(name)}},
}

% Section formatting
\\titleformat{\\section}{\\Large\\bfseries\\color{primary}}{}{0em}{}[\\titlerule]
\\titlespacing{\\section}{0pt}{10pt}{6pt}

\\renewcommand{\\familydefault}{\\sfdefault}

\\begin{document}
\\pagestyle{empty}

{\\begin{center}
${profilePhotoLatex ? `${profilePhotoLatex} \\\\[0.2cm]` : ''}
{\\Huge \\bfseries \\color{textdark} ${escapeLatex(name)}} \\\\[0.2cm]
`;

    if (pi.title) tex += `{\\Large \\color{primary} ${escapeLatex(pi.title)}} \\\\[0.3cm]\n`;
    
    let contactInfo = [];
    if (pi.email) contactInfo.push(`\\href{mailto:${pi.email}}{${escapeLatex(pi.email)}}`);
    if (pi.phone) contactInfo.push(`${escapeLatex(pi.phone)}`);
    if (pi.location) contactInfo.push(`${escapeLatex(pi.location)}`);
    if (pi.linkedin) {
        let ln = pi.linkedin.replace(/https?:\/\/(www\.)?linkedin\.com\/in\//, '');
        contactInfo.push(`\\href{${pi.linkedin}}{${escapeLatex(ln)}}`);
    }
    if (pi.github) {
        let gh = pi.github.replace(/https?:\/\/(www\.)?github\.com\//, '');
        contactInfo.push(`\\href{${pi.github}}{${escapeLatex(gh)}}`);
    }
    
    tex += `${contactInfo.join(' \\quad|\\quad ')}\n\\end{center}}\n\\vspace{0.4cm}\n\n`;

    if (cvData.summary) {
        tex += `\\section*{Profil}\n${escapeLatex(cvData.summary)}\n\n`;
    }

    if (cvData.keySkills && cvData.keySkills.length > 0) {
        tex += `\\section*{Compétences}\n`;
        tex += `\\noindent ${escapeLatexArray(cvData.keySkills).join(', ')}\n\n`;
    }

    if (cvData.experience && cvData.experience.length > 0) {
        tex += `\\section*{Expérience Professionnelle}\n`;
        cvData.experience.forEach(exp => {
            tex += `\\noindent\\textbf{${escapeLatex(exp.title || '')}} \\hfill \\textit{${escapeLatex(exp.period || '')}} \\\\\n`;
            tex += `\\noindent\\textbf{\\color{primary}${escapeLatex(exp.company || '')}} \\\\\n`;
            if (exp.description) {
                tex += `\\vspace{-0.2cm}\n\n\\textit{${escapeLatex(exp.description)}}\n\n`;
            }
            if (exp.bullets && exp.bullets.length > 0) {
                tex += `\\begin{itemize}[leftmargin=*, noitemsep, topsep=2pt]\n`;
                exp.bullets.forEach(bullet => {
                    tex += `  \\item ${escapeLatex(bullet)}\n`;
                });
                tex += `\\end{itemize}\n\\vspace{0.2cm}\n`;
            } else {
                tex += `\\vspace{0.2cm}\n`;
            }
        });
    }

    if (cvData.education && cvData.education.length > 0) {
        tex += `\\section*{Formation}\n`;
        cvData.education.forEach(edu => {
            tex += `\\noindent\\textbf{${escapeLatex(edu.degree || '')}} \\hfill \\textit{${escapeLatex(edu.period || '')}} \\\\\n`;
            tex += `\\noindent\\textbf{\\color{primary}${escapeLatex(edu.school || '')}} \\\\\n`;
            if (edu.description) tex += `${escapeLatex(edu.description)}\n`;
             tex += `\\vspace{0.2cm}\n\n`;
        });
    }

    if (cvData.projects && cvData.projects.length > 0) {
        tex += `\\section*{Projets}\n`;
        cvData.projects.forEach(proj => {
            tex += `\\noindent\\textbf{${escapeLatex(proj.name || '')}}`;
            if (proj.link) tex += ` -- \\href{${proj.link}}{Lien}`;
            tex += `\\\\\n`;
            tex += `${proj.description ? escapeLatex(proj.description) : ''}\n\\vspace{0.2cm}\n\n`;
        });
    }

    if (cvData.certifications && cvData.certifications.length > 0) {
        tex += `\\section*{Certifications}\n\\begin{itemize}[leftmargin=*, noitemsep, topsep=2pt]\n`;
        cvData.certifications.forEach(cert => {
            tex += `  \\item ${escapeLatex(cert)}\n`;
        });
        tex += `\\end{itemize}\n\n`;
    }

    if ((cvData.languages && cvData.languages.length > 0) || (cvData.interests && cvData.interests.length > 0)) {
         tex += `\\section*{Divers}\n`;
         if (cvData.languages && cvData.languages.length > 0) {
             tex += `\\textbf{Langues : } ${escapeLatexArray(cvData.languages).join(', ')} \\\\\n`;
         }
         if (cvData.interests && cvData.interests.length > 0) {
             tex += `\\textbf{Centres d'intérêt : } ${escapeLatexArray(cvData.interests).join(', ')} \\\\\n`;
         }
    }

    tex += `\\end{document}\n`;
    return tex;
}

/**
 * Twenty-Second CV Template
 */
export function generateTwentySecondTemplate(cvData, candidateName) {
    const pi = cvData.personalInfo || {};
    const name = pi.fullName || candidateName || 'Candidat';
    
    let tex = `\\begin{filecontents*}{twentysecondcv.cls}
\\ProvidesClass{twentysecondcv}[2015/02/28 CV class]
\\LoadClass{article}
\\NeedsTeXFormat{LaTeX2e}

\\RequirePackage[sfdefault]{ClearSans}
\\def\\arrow#1{\\pspicture[shift=2pt](#1,0)\\psline{->}(#1,0)\\endpspicture}
\\usepackage{fontawesome}
\\RequirePackage{tikz}
\\RequirePackage{xcolor}
\\RequirePackage[absolute,overlay]{textpos}
\\RequirePackage{ragged2e}
\\RequirePackage{etoolbox}
\\RequirePackage{ifmtarg}
\\RequirePackage{ifthen}
\\RequirePackage{pgffor}
\\RequirePackage{marvosym}
\\RequirePackage{parskip}
\\usepackage{enumitem}
\\setlist[itemize]{leftmargin=*}
\\RequirePackage[hidelinks]{hyperref}
\\hypersetup{colorlinks=false,allbordercolors=white}
\\DeclareOption*{\\PassOptionsToClass{\\CurrentOption}{article}}
\\ProcessOptions\\relax

\\definecolor{white}{RGB}{255,255,255}
\\definecolor{gray}{HTML}{4D4D4D}
\\definecolor{sidecolor}{HTML}{E7E7E7}
\\definecolor{mainblue}{HTML}{0E5484}
\\definecolor{maingray}{HTML}{B9B9B9}
\\definecolor{pblue}{HTML}{0395DE}
\\definecolor{test}{HTML}{0077be}
\\definecolor{yt}{HTML}{c71610}
\\definecolor{linkedin}{HTML}{0085AE}
\\colorlet{headercolor}{gray}

\\pagestyle{empty}
\\setlength{\\parindent}{0pt}
\\newcommand\\headingfont{\\sffamily\\bfseries}
\\setlength{\\TPHorizModule}{1cm}
\\setlength{\\TPVertModule}{1cm}
\\newcommand{\\profilesection}[2]{\\vspace{8pt}{\\color{black!80} \\huge #1 \\rule[0.15\\baselineskip]{#2}{1pt}}}
\\newcommand{\\cvdate}[1]{\\renewcommand{\\cvdate}{#1}}
\\newcommand{\\cvlinkedin}[1]{\\renewcommand{\\cvlinkedin}{#1}}
\\newcommand{\\cvgithub}[1]{\\renewcommand{\\cvgithub}{#1}}
\\newcommand{\\cvmail}[1]{\\renewcommand{\\cvmail}{#1}}
\\newcommand{\\cvnumberphone}[1]{\\renewcommand{\\cvnumberphone}{#1}}
\\newcommand{\\cvaddress}[1]{\\renewcommand{\\cvaddress}{#1}}
\\newcommand{\\cvsite}[1]{\\renewcommand{\\cvsite}{#1}}
\\newcommand{\\aboutme}[1]{\\renewcommand{\\aboutme}{#1}}
\\newcommand{\\profilepic}[1]{\\renewcommand{\\profilepic}{#1}}
\\newcommand{\\cvname}[1]{\\renewcommand{\\cvname}{#1}}
\\newcommand{\\cvjobtitle}[1]{\\renewcommand{\\cvjobtitle}{#1}}
\\newcommand*\\icon[1]{\\tikz[baseline=(char.base)]{\\node[shape=circle,draw,inner sep=1pt, fill=mainblue,mainblue,text=white] (char) {#1};}}

\\newcommand\\education[1]{ \\renewcommand{\\education}{ {#1} } }
\\newcommand\\skills[1]{ \\renewcommand{\\skills}{ {#1} } }

\\newcommand{\\makeprofile}{
  \\begin{tikzpicture}[remember picture,overlay]
      \\node [rectangle, fill=sidecolor, anchor=north, minimum width=9cm, minimum height=\\paperheight+1cm] (box) at (-5cm,0.5cm){};
  \\end{tikzpicture}
  \\begin{textblock}{6}(0.5, 0.2)
    \\vspace{4mm}
    {\\Huge\\color{pblue}\\cvname}
    \\vspace{2mm}
    {\\Large\\color{black!80}\\cvjobtitle}
    \\vspace{3mm}
    \\renewcommand{\\arraystretch}{2}
    \\begin{tabular}{p{1cm} @{\\hskip 0.5cm}p{5cm}}
      \\ifthenelse{\\equal{\\cvnumberphone}{}}{}{
        {$ \\begin{array}{l} \\hspace{4mm} \\huge \\textnormal{\\faMobile} \\end{array} $} & \\cvnumberphone\\\\}
      \\ifthenelse{\\equal{\\cvsite}{}}{}{
        {$ \\begin{array}{l} \\hspace{2.8mm} \\huge \\textnormal{\\textcolor{test}{\\faGlobe}} \\end{array} $} & \\href{http://\\cvsite}{\\cvsite} \\\\}
      \\ifthenelse{\\equal{\\cvmail}{}}{}{
        {$ \\begin{array}{l} \\hspace{2.5mm} \\huge \\textnormal{\\textcolor{yt}{\\faEnvelopeO}} \\end{array} $} & \\href{mailto:\\cvmail}{\\cvmail} \\\\}
      \\ifthenelse{\\equal{\\cvlinkedin}{}}{}{
        {$ \\begin{array}{l} \\hspace{3mm} \\huge \\textnormal{\\textcolor{linkedin}{\\faLinkedin}} \\end{array} $} & \\href{https://www.linkedin.com/in/\\cvlinkedin}{\\cvlinkedin} \\\\}  
      \\ifthenelse{\\equal{\\cvgithub}{}}{}{
        {$ \\begin{array}{l} \\hspace{3mm} \\huge \\textnormal{\\faGithub} \\end{array} $} & \\href{https://www.github.com/\\cvgithub}{\\cvgithub} \\\\}   
    \\end{tabular}
    \\vspace{3mm}
    \\profilesection{Comp\\'{e}tences}{1.2cm}
    \\vspace{2mm}
    \\skills
    \\vspace{3mm}
    \\profilesection{Contact}{3cm} 
    \\vspace{2mm}
    \\education
  \\end{textblock}
}

\\newcommand*\\round[2]{%
  \\tikz[baseline=(char.base)]\\node[anchor=north west, draw,rectangle, rounded corners, inner sep=1.6pt, minimum size=5.5mm, text height=3.6mm, fill=#2,#2,text=white](char){#1};%
}
\\def\\@sectioncolor#1#2#3{ {\\color{pblue}#1}#2#3 }
\\renewcommand{\\section}[1]{
  \\par\\vspace{\\parskip}
  {\\LARGE\\headingfont\\color{headercolor} \\@sectioncolor #1}
  \\par\\vspace{1mm}
}
\\setlength{\\tabcolsep}{0pt}
\\newenvironment{twenty}{ \\begin{tabular*}{\\textwidth}{@{\\extracolsep{\\fill}}ll} }{ \\end{tabular*} }
\\newcommand{\\twentyitem}[6]{
  #1&\\parbox[t]{0.83\\textwidth}{
    \\textbf{#3} \\hfill {\\footnotesize#4}}\\\\
  #2&\\parbox[t]{0.83\\textwidth}{
    \\ifblank{#5}{}{#5 \\\\}#6}\\\\
  \\multicolumn{2}{c}{}\\\\
}
\\RequirePackage[left=7.6cm,top=0.1cm,right=1cm,bottom=0.1cm,nohead,nofoot]{geometry}
\\end{filecontents*}

\\documentclass[]{twentysecondcv}
\\begin{document}
`;

    tex += `\\cvname{${escapeLatex(name)}}\n`;
    tex += `\\cvjobtitle{${escapeLatex(pi.title || '')}}\n`;
    tex += `\\cvmail{${escapeLatex(pi.email || '')}}\n`;
    tex += `\\cvnumberphone{${escapeLatex(pi.phone || '')}}\n`;
    tex += `\\cvsite{${escapeLatex(pi.location || '')}}\n`;

    let ln = (pi.linkedin || '').replace(/https?:\/\/(www\.)?linkedin\.com\/in\//, '');
    let gh = (pi.github || '').replace(/https?:\/\/(www\.)?github\.com\//, '');
    tex += `\\cvlinkedin{${escapeLatex(ln)}}\n\\cvgithub{${escapeLatex(gh)}}\n`;

    let skillsList = '';
    if (cvData.keySkills && cvData.keySkills.length > 0) {
        skillsList = '\\begin{itemize} ' + cvData.keySkills.map(s => '\\item ' + escapeLatex(s)).join(' ') + ' \\end{itemize}';
    }
    tex += `\\skills{${skillsList}}\n`;
    tex += `\\education{}\n`;
    
    tex += `\\makeprofile\n\n`;

    if (cvData.summary) {
        tex += `\\section{Profil}\n${escapeLatex(cvData.summary)}\n\n`;
    }

    if (cvData.experience && cvData.experience.length > 0) {
        tex += `\\section{Exp\\'{e}rience}\n\\begin{twenty}\n`;
        cvData.experience.forEach(exp => {
            let bullets = '';
            if (exp.bullets && exp.bullets.length > 0) {
                bullets = `\\vspace{1mm}\\begin{itemize}[noitemsep,topsep=0pt,leftmargin=*] ` + 
                          exp.bullets.map(b => `\\item ${escapeLatex(b)}`).join(' ') + 
                          ` \\end{itemize}`;
            }
            tex += `\\twentyitem{${escapeLatex(exp.period || '')}}{}{${escapeLatex(exp.company || '')}}{}{${escapeLatex(exp.title || '')}}{${escapeLatex(exp.description || '')} ${bullets}}\n`;
        });
        tex += `\\end{twenty}\n\n`;
    }

    if (cvData.education && cvData.education.length > 0) {
        tex += `\\section{Formation}\n\\begin{twenty}\n`;
        cvData.education.forEach(edu => {
            tex += `\\twentyitem{${escapeLatex(edu.period || '')}}{}{${escapeLatex(edu.degree || '')}}{}{${escapeLatex(edu.school || '')}}{${escapeLatex(edu.description || '')}}\n`;
        });
        tex += `\\end{twenty}\n\n`;
    }

    tex += `\\end{document}\n`;
    return tex;
}

/**
 * AltaCV "Marissa Mayer" Template
 */
export function generateAltaTemplate(cvData, candidateName) {
    const pi = cvData.personalInfo || {};
    const name = pi.fullName || candidateName || 'Candidat';
    const bs = '\\';

    const pif = [];
    if (pi.email)    pif.push(bs + 'email{' + pi.email + '}');
    if (pi.phone)    pif.push(bs + 'phone{' + escapeLatex(pi.phone) + '}');
    if (pi.location) pif.push(bs + 'location{' + escapeLatex(pi.location) + '}');
    if (pi.website || pi.homepage) pif.push(bs + 'homepage{' + escapeLatex(pi.website || pi.homepage) + '}');
    if (pi.linkedin) {
        const ln = pi.linkedin.replace(/https?:\/\/(www\.)?linkedin\.com\/in\//, '').replace(/\/$/, '');
        pif.push(bs + 'linkedin{' + escapeLatex(ln) + '}');
    }
    if (pi.github) {
        const gh = pi.github.replace(/https?:\/\/(www\.)?github\.com\//, '').replace(/\/$/, '');
        pif.push(bs + 'github{' + escapeLatex(gh) + '}');
    }

    const L = [];
    L.push('%% AltaCV "Marissa Mayer" style – LuaLaTeX + altacv.cls v1.7.4');
    L.push(bs + 'documentclass[10pt,a4paper,withhyper]{altacv}');
    L.push('');
    L.push(bs + 'geometry{left=1.25cm,right=1.25cm,top=1.5cm,bottom=1.5cm,columnsep=1.2cm}');
    L.push(bs + 'usepackage{paracol}');
    L.push('');
    L.push(bs + 'iftutex');
    L.push('  ' + bs + 'setmainfont{Lato}');
    L.push(bs + 'else');
    L.push('  ' + bs + 'usepackage[default]{lato}');
    L.push(bs + 'fi');
    L.push('');
    L.push(bs + 'definecolor{VividPurple}{HTML}{3E0097}');
    L.push(bs + 'definecolor{SlateGrey}{HTML}{2E2E2E}');
    L.push(bs + 'definecolor{LightGrey}{HTML}{666666}');
    L.push(bs + 'colorlet{heading}{VividPurple}');
    L.push(bs + 'colorlet{headingrule}{VividPurple}');
    L.push(bs + 'colorlet{accent}{VividPurple}');
    L.push(bs + 'colorlet{emphasis}{SlateGrey}');
    L.push(bs + 'colorlet{body}{LightGrey}');
    L.push('');
    L.push(bs + 'renewcommand{' + bs + 'cvItemMarker}{{' + bs + 'small' + bs + 'textbullet}}');
    L.push(bs + 'renewcommand{' + bs + 'cvRatingMarker}{' + bs + 'faCircle}');
    L.push('');

    L.push(bs + 'begin{document}');
    L.push(bs + 'name{' + escapeLatex(name) + '}');
    L.push(bs + 'tagline{' + escapeLatex(pi.title || '') + '}');
    L.push(bs + 'personalinfo{%');
    pif.forEach(f => L.push('  ' + f));
    L.push('}');
    L.push('');
    L.push(bs + 'makecvheader');
    L.push(bs + 'AtBeginEnvironment{itemize}{' + bs + 'small}');
    L.push('');
    L.push(bs + 'columnratio{0.6}');
    L.push(bs + 'begin{paracol}{2}');
    L.push('');

    if (cvData.experience && cvData.experience.length > 0) {
        L.push(bs + 'cvsection{Experience}');
        L.push('');
        cvData.experience.forEach((exp, idx) => {
            L.push(bs + 'cvevent{' + escapeLatex(exp.title || '') + '}{' +
                   escapeLatex(exp.company || '') + '}{' +
                   escapeLatex(exp.period || '') + '}{' +
                   escapeLatex(exp.location || '') + '}');
            if (exp.description || (exp.bullets && exp.bullets.length > 0)) {
                L.push(bs + 'begin{itemize}');
                if (exp.description) {
                    const sentences = exp.description.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 10);
                    sentences.slice(0, 4).forEach(s => L.push(bs + 'item ' + escapeLatex(s.trim())));
                }
                if (exp.bullets) exp.bullets.slice(0, 4).forEach(b => L.push(bs + 'item ' + escapeLatex(b)));
                L.push(bs + 'end{itemize}');
            }
            if (idx < cvData.experience.length - 1) {
                L.push('');
                L.push(bs + 'divider');
            }
            L.push('');
        });
    }

    if (cvData.projects && cvData.projects.length > 0) {
        L.push(bs + 'cvsection{Projets Cl\\\'{e}s}');
        L.push('');
        cvData.projects.forEach((proj, idx) => {
            L.push(bs + 'cvevent{' + escapeLatex(proj.name || '') + '}{}{}{}');
            if (proj.description) L.push(escapeLatex(proj.description));
            if (proj.technologies && proj.technologies.length > 0) {
                L.push('');
                proj.technologies.slice(0, 6).forEach(t => {
                    L.push(bs + 'cvtag{' + escapeLatex(t) + '}');
                });
            }
            if (idx < cvData.projects.length - 1) {
                L.push('');
                L.push(bs + 'divider');
            }
            L.push('');
        });
    }

    L.push(bs + 'switchcolumn');
    L.push('');

    if (cvData.summary) {
        L.push(bs + 'cvsection{Profil}');
        L.push(bs + 'begin{quote}');
        const q = escapeLatex(cvData.summary.slice(0, 240));
        L.push('``' + q + (cvData.summary.length > 240 ? '\\ldots' : '') + "''");
        L.push(bs + 'end{quote}');
        L.push('');
    }

    const achievements = [];
    if (cvData.achievements && cvData.achievements.length > 0) {
        cvData.achievements.forEach(a => achievements.push(a));
    } else if (cvData.experience && cvData.experience.length > 0) {
        cvData.experience.slice(0, 3).forEach(exp => {
            if (exp.title && exp.company) {
                achievements.push({ icon: 'faStar', title: escapeLatex(exp.title), detail: escapeLatex(exp.company) });
            }
        });
    }

    if (achievements.length > 0) {
        L.push(bs + 'cvsection{Points Forts}');
        L.push('');
        const icons = [bs + 'faTrophy', bs + 'faHeartbeat', bs + 'faChartLine', bs + 'faLightbulb'];
        achievements.slice(0, 4).forEach((a, idx) => {
            const icon = a.icon ? bs + a.icon : icons[idx % icons.length];
            const title = typeof a === 'string' ? escapeLatex(a) : escapeLatex(a.title || a.name || '');
            const detail = typeof a === 'string' ? '' : escapeLatex(a.detail || a.description || '');
            L.push(bs + 'cvachievement{' + icon + '}{' + title + '}{' + detail + '}');
            if (idx < Math.min(achievements.length, 4) - 1) L.push(bs + 'divider');
            L.push('');
        });
    }

    if (cvData.keySkills && cvData.keySkills.length > 0) {
        L.push(bs + 'cvsection{Comp\\\'{e}tences}');
        L.push('');
        const ratedSkills = cvData.keySkills.slice(0, 6);
        const ratingPattern = [5, 4.5, 4, 4, 3.5, 3.5];
        ratedSkills.forEach((s, idx) => {
            const skill = typeof s === 'string' ? s : (s.name || s);
            const rating = typeof s === 'object' && s.level ? s.level : ratingPattern[idx] || 3.5;
            L.push(bs + 'cvskill{' + escapeLatex(skill) + '}{' + rating + '}');
            if (idx < ratedSkills.length - 1) L.push(bs + 'divider');
        });
        L.push('');

        const tagSkills = cvData.keySkills.slice(6, 14);
        if (tagSkills.length > 0) {
            L.push(bs + 'divider' + bs + 'smallskip');
            L.push('');
            tagSkills.forEach(s => {
                const skill = typeof s === 'string' ? s : (s.name || s);
                L.push(bs + 'cvtag{' + escapeLatex(skill) + '}');
            });
            L.push('');
        }
    }

    if (cvData.languages && cvData.languages.length > 0) {
        L.push(bs + 'cvsection{Langues}');
        L.push('');
        const langRatings = { native: 5, fluent: 4.5, advanced: 4, intermediate: 3, basic: 2, beginner: 1.5 };
        cvData.languages.forEach((lang, idx) => {
            const langName = typeof lang === 'string' ? lang : (lang.language || lang.name || lang);
            const levelStr = (typeof lang === 'object' ? (lang.level || lang.proficiency || '') : '').toLowerCase();
            const rating = Object.entries(langRatings).find(([k]) => levelStr.includes(k))?.[1] || 3.5;
            L.push(bs + 'cvskill{' + escapeLatex(langName) + '}{' + rating + '}');
            if (idx < cvData.languages.length - 1) L.push(bs + 'divider');
        });
        L.push('');
    }

    if (cvData.education && cvData.education.length > 0) {
        L.push(bs + 'cvsection{Formation}');
        L.push('');
        cvData.education.forEach((edu, idx) => {
            L.push(bs + 'cvevent{' + escapeLatex(edu.degree || '') + '}{' +
                   escapeLatex(edu.school || edu.institution || '') + '}{' +
                   escapeLatex(edu.period || edu.year || '') + '}{}');
            if (edu.description) L.push(escapeLatex(edu.description));
            if (idx < cvData.education.length - 1) {
                L.push('');
                L.push(bs + 'divider');
            }
            L.push('');
        });
    }

    if (cvData.certifications && cvData.certifications.length > 0) {
        L.push(bs + 'cvsection{Certifications}');
        L.push('');
        cvData.certifications.forEach(c => {
            const cname = typeof c === 'string' ? c : (c.name || '');
            L.push(bs + 'cvtag{' + escapeLatex(cname) + '}');
        });
        L.push('');
    }

    L.push(bs + 'end{paracol}');
    L.push(bs + 'end{document}');

    return L.join('\n');
}

/**
 * Cover Letter Template
 */
export function generateCoverLetterTemplate(letterData, candidateName, jobTitle, companyName) {
    const name = letterData.candidateName || candidateName || '';
    const dateStr = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    const subject = letterData.subject || (jobTitle ? `Candidature au poste de ${jobTitle}` : '');
    
    const greetingPattern = /^\s*(?:(?:bonjour\s+)?madame\s*[,/&-]?\s*monsieur|(?:bonjour\s+)?monsieur\s*[,/&-]?\s*madame|madame|monsieur)[\s,:-]*/i;
    const signoffPattern = /\s*(?:bien\s+)?cordialement[,.]?\s*(?:\n\s*[^\n]{2,80})?\s*$/i;
    const cleanPart = (value) => String(value || '').replace(greetingPattern, '').replace(signoffPattern, '').trim();
    const rawGreeting = String(letterData.greeting || '').trim();
    const greeting = /(?:madame|monsieur).*(?:madame|monsieur)/i.test(rawGreeting)
        ? 'Madame, Monsieur,'
        : rawGreeting.split('\n')[0] || 'Madame, Monsieur,';
    const letterContent = [letterData.opening, letterData.body, letterData.closing]
        .map(cleanPart)
        .filter(Boolean)
        .join('\n\n');

    let tex = `\\documentclass[11pt,a4paper]{letter}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage[french]{babel}
\\usepackage{lmodern}

\\address{${escapeLatex(name)}}
\\signature{${escapeLatex(name)}}
\\date{${escapeLatex(dateStr)}}

\\begin{document}
\\begin{letter}{${escapeLatex(companyName)}}
`;

    if (subject) {
        tex += `\\textbf{Objet :} ${escapeLatex(subject)}\n\n`;
    }
    
    tex += `\\opening{${escapeLatex(greeting)}}

${escapeLatex(letterContent).replace(/\\n/g, '\n\n')}

\\closing{Cordialement,}

\\end{letter}
\\end{document}
`;

    return tex;
}

/**
 * MaltaCV Template
 */
export function generateMaltaTemplate(cvData, candidateName) {
    const pi = cvData.personalInfo || {};
    const name = pi.fullName || candidateName || 'Candidat';
    const names = name.split(' ');
    const firstName = names[0] || '';
    const familyName = names.slice(1).join(' ') || '';
    const bs = '\\';

    const pif = [];
    if (pi.email)    pif.push(bs + 'email{' + pi.email + '}');
    if (pi.phone)    pif.push(bs + 'phone{' + escapeLatex(pi.phone) + '}');
    if (pi.location) pif.push(bs + 'location{' + escapeLatex(pi.location) + '}');
    if (pi.linkedin) {
        const ln = pi.linkedin.replace(/https?:\/\/(www\.)?linkedin\.com\/in\//, '').replace(/\/$/, '');
        pif.push(bs + 'linkedin{' + escapeLatex(ln) + '}');
    }
    if (pi.github) {
        const gh = pi.github.replace(/https?:\/\/(www\.)?github\.com\//, '').replace(/\/$/, '');
        pif.push(bs + 'github{' + escapeLatex(gh) + '}');
    }

    const L = [];
    L.push('%% MaltaCV style – LuaLaTeX + maltacv.cls');
    L.push(bs + 'PassOptionsToPackage{dvipsnames}{xcolor}');
    L.push(bs + 'documentclass[10pt,a4paper,ragged2e]{maltacv}');
    L.push('');
    L.push(bs + 'usepackage[utf8]{inputenc}');
    L.push(bs + 'usepackage[T1]{fontenc}');
    L.push(bs + 'usepackage{tgheros}');
    L.push(bs + 'renewcommand*' + bs + 'familydefault{' + bs + 'sfdefault}');
    L.push(bs + 'usepackage{setspace}');
    L.push(bs + 'usepackage{mathpazo}');
    L.push(bs + 'usepackage{textcomp}');
    L.push(bs + 'usepackage{multicol}');
    L.push('');
    L.push(bs + 'setcolorscheme{raisinblack_flame}');
    L.push(bs + 'setlength' + bs + 'multicolsep{0pt}');
    L.push(bs + 'renewcommand{' + bs + 'itemmarker}{{\\small\\textbullet}}');
    L.push('');
    L.push(bs + 'name{' + escapeLatex(name) + '}');
    L.push(bs + 'firstname{' + escapeLatex(firstName) + '}');
    L.push(bs + 'familyname{' + escapeLatex(familyName) + '}');
    L.push('');
    L.push(bs + 'begin{document}');
    L.push(bs + 'tagline{' + escapeLatex(pi.title || '') + '}');
    L.push(bs + 'personalinfo{%');
    pif.forEach(f => L.push('  ' + f));
    L.push('}');
    L.push('');
    if (cvData.summary) {
        L.push(bs + 'bio{' + escapeLatex(cvData.summary) + '}');
    }
    L.push('');
    L.push(bs + 'makecvheader');
    L.push('');

    // Skills
    if (cvData.keySkills && cvData.keySkills.length > 0) {
        L.push(bs + 'cvsection{Skills}');
        L.push(bs + 'begin{center}');
        L.push('  ' + bs + 'begin{multicols}{4}');
        cvData.keySkills.forEach(skill => {
             L.push('    ' + bs + 'cvlistitem{' + escapeLatex(typeof skill === 'string' ? skill : (skill.name || skill)) + '}{}');
        });
        L.push('  ' + bs + 'end{multicols}');
        L.push(bs + 'end{center}');
        L.push('');
    }

    // Education
    if (cvData.education && cvData.education.length > 0) {
        L.push(bs + 'cvsection{Education}');
        L.push(bs + 'medskip');
        const middle = Math.ceil(cvData.education.length / 2);
        L.push(bs + 'begin{multicols}{2}');
        cvData.education.forEach((edu, idx) => {
            if (idx === middle && cvData.education.length > 1) {
                L.push('  ' + bs + 'vfill' + bs + 'null');
                L.push('  ' + bs + 'columnbreak');
            }
            L.push('  ' + bs + 'cvuniversity{' + escapeLatex(edu.degree || '') + '}{' + escapeLatex(edu.school || '') + '}{' + escapeLatex(edu.period || '') + '}{' + escapeLatex(edu.location || '') + '}');
            if (edu.description || (edu.bullets && edu.bullets.length > 0)) {
                L.push('  ' + bs + 'begin{itemize}');
                if (edu.description) L.push('      ' + bs + 'item ' + escapeLatex(edu.description));
                if (edu.bullets) edu.bullets.forEach(b => L.push('      ' + bs + 'item ' + escapeLatex(b)));
                L.push('  ' + bs + 'end{itemize}');
            }
        });
        L.push(bs + 'end{multicols}');
        L.push('');
    }

    // Experience
    if (cvData.experience && cvData.experience.length > 0) {
        L.push(bs + 'cvsection{Experience}');
        cvData.experience.forEach((exp, idx) => {
            const keywords = exp.technologies ? exp.technologies.join(', ') : '';
            L.push(bs + 'cvexperience{' + escapeLatex(exp.title || '') + '}{' + escapeLatex(exp.company || '') + '}{' + escapeLatex(exp.period || '') + '}{' + escapeLatex(exp.location || '') + '}{' + escapeLatex(keywords) + '}');
            if (exp.description || (exp.bullets && exp.bullets.length > 0)) {
                 L.push(bs + 'begin{itemize}');
                 if (exp.description) L.push('  ' + bs + 'item ' + escapeLatex(exp.description));
                 if (exp.bullets) exp.bullets.forEach(b => L.push('  ' + bs + 'item ' + escapeLatex(b)));
                 L.push(bs + 'end{itemize}');
            }
            if (idx < cvData.experience.length - 1) L.push(bs + 'divider');
        });
        L.push('');
    }

    // Projects / Awards / Languages as multicols
    if (cvData.projects && cvData.projects.length > 0) {
         L.push(bs + 'cvsection{Projets}');
         L.push(bs + 'begin{multicols}{3}');
         cvData.projects.forEach(proj => {
             L.push('  ' + bs + 'cvlistitem{' + escapeLatex(proj.name || '') + '}{' + escapeLatex(proj.description || '') + '}');
         });
         L.push(bs + 'end{multicols}');
         L.push('');
    }

    if (cvData.languages && cvData.languages.length > 0) {
        L.push(bs + 'cvsection{Langues}');
        L.push(bs + 'begin{multicols}{3}');
        cvData.languages.forEach(lang => {
            const lname = typeof lang === 'string' ? lang : (lang.language || lang.name || lang);
            const level = typeof lang === 'object' ? (lang.level || '') : '';
            L.push('  ' + bs + 'cvlistitem{' + escapeLatex(lname) + '}{' + escapeLatex(level) + '}');
        });
        L.push(bs + 'end{multicols}');
        L.push('');
    }

    L.push(bs + 'end{document}');
    return L.join('\n');
}

/**
 * MyCV Template (Salman Maq / Sarah Gardner style)
 */
export function generateMyCVTemplate(cvData, candidateName) {
    const pi = cvData.personalInfo || {};
    const name = pi.fullName || candidateName || 'Candidat';
    const names = name.split(' ');
    const firstName = names[0] || '';
    const familyName = names.slice(1).join(' ') || '';
    const bs = '\\';

    const L = [];
    L.push('%% MyCV style – pdfLaTeX + my_cv.cls');
    L.push(bs + 'documentclass{my_cv}');
    L.push(bs + 'usepackage[skins]{tcolorbox}');
    L.push('');
    L.push(bs + 'begin{document}');
    
    // Header Data
    const github = pi.github ? pi.github.replace(/https?:\/\/(www\.)?github\.com\//, '').replace(/\/$/, '') : '';
    const dob = pi.birthDate || ''; 

    L.push(bs + 'begin{multicols}{2}[');
    L.push('    ' + bs + 'titletext{' + escapeLatex(firstName) + '}%');
    L.push('        {' + escapeLatex(familyName) + '}%');
    L.push('        {' + escapeLatex(pi.title || '') + '}%');
    L.push('        {' + escapeLatex(dob) + '}%');
    L.push('        {' + escapeLatex(pi.email || '') + '}%');
    L.push('        {' + escapeLatex(pi.phone || '') + '}%');
    L.push('        {' + escapeLatex(github) + '}%');
    L.push(']');
    L.push('');

    // --- LEFT COLUMN ---
    
    // Work
    if (cvData.experience && cvData.experience.length > 0) {
        L.push(bs + 'section{' + bs + 'faPencil}{WORK}');
        cvData.experience.forEach(exp => {
            const roleAndDates = (exp.title || '') + ' / ' + (exp.period || '');
            const org = exp.company || '';
            const desc = exp.description || (exp.bullets ? exp.bullets.join(' ') : '');
            L.push(bs + 'work{' + escapeLatex(roleAndDates) + '}%');
            L.push('    {' + escapeLatex(org) + '}%');
            L.push('    {' + escapeLatex(desc) + '}');
            L.push('');
        });
    }

    // Skills
    if (cvData.keySkills && cvData.keySkills.length > 0) {
        L.push(bs + 'section{' + bs + 'faFileText}{SKILLS}');
        const skillsByType = {};
        cvData.keySkills.forEach(skill => {
            const type = typeof skill === 'string' ? 'Skills' : (skill.category || 'Skills');
            const name = typeof skill === 'string' ? skill : (skill.name || skill);
            if (!skillsByType[type]) skillsByType[type] = [];
            skillsByType[type].push(name);
        });
        
        Object.entries(skillsByType).forEach(([type, list]) => {
            L.push(bs + 'noindent' + bs + 'textbf{' + escapeLatex(type) + ':} ' + escapeLatex(list.join(', ')));
            L.push('');
        });
    }

    // Languages / Other
    if (cvData.languages && cvData.languages.length > 0) {
        L.push(bs + 'section{' + bs + 'faFileText}{LANGUAGES}');
        L.push(bs + 'noindent Languages: ' + escapeLatex(cvData.languages.join(', ')));
        L.push('');
    }

    L.push(bs + 'columnbreak');

    // --- RIGHT COLUMN ---

    // Education
    if (cvData.education && cvData.education.length > 0) {
        L.push(bs + 'section{' + bs + 'faGraduationCap}{EDUCATION}');
        cvData.education.forEach(edu => {
            const degreeInfo = (edu.degree || '') + ' / ' + (edu.period || '');
            const inst = edu.school || '';
            const thesis = edu.description || '';
            L.push(bs + 'work{' + escapeLatex(degreeInfo) + '}%');
            L.push('    {}%');
            L.push('    {' + escapeLatex(inst + (thesis ? ' - ' + thesis : '')) + '}');
            L.push('');
        });
    }

    // Activities / Interests
    if (cvData.interests && cvData.interests.length > 0) {
        L.push(bs + 'section{' + bs + 'faSoccerBallO}{ACTIVITIES / INTERESTS}');
        L.push(escapeLatex(cvData.interests.join(', ')));
        L.push('');
    }

    // Awards / Certificates
    if (cvData.certificates && cvData.certificates.length > 0) {
        L.push(bs + 'section{' + bs + 'faBook}{AWARDS}');
        cvData.certificates.forEach(cert => {
            const name = typeof cert === 'string' ? cert : (cert.name || cert);
            L.push(bs + 'work{' + escapeLatex(name) + '}{}{}');
            L.push('');
        });
    }

    // Projects
    if (cvData.projects && cvData.projects.length > 0) {
        L.push(bs + 'section{' + bs + 'faPaintBrush}{PROJECTS}');
        cvData.projects.forEach(proj => {
            const name = proj.name || '';
            const desc = proj.description || '';
            L.push(bs + 'work{' + escapeLatex(name) + '}{}%');
            L.push('    {' + escapeLatex(desc) + '}');
            L.push('');
        });
    }

    L.push(bs + 'end{multicols}');
    L.push(bs + 'end{document}');
    return L.join('\n');
}
