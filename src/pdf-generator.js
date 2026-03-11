/**
 * LaTeX Source Generator - Standard TeX Live compatible
 */
import { saveAs } from 'file-saver';

// Escape LaTeX special characters
function escapeLatex(str) {
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

// Helper to escape an array of strings
function escapeLatexArray(arr) {
    if (!arr || !Array.isArray(arr)) return [];
    return arr.map(escapeLatex);
}

// ============================================================
// PUBLIC API
// ============================================================

/**
 * Generate adapted CV in Standard LaTeX format
 * Guaranteed to compile with pdflatex
 */
export function generateAdaptedCVPDF(cvData, candidateName = '', profilePhotoDataURL = null, template = 'classic') {
    if (template === 'twentysecond') {
        return generateTwentySecondCVPDF(cvData, candidateName);
    }

    const pi = cvData.personalInfo || {};
    const name = pi.fullName || candidateName || 'Candidat';

    // Different templates can define different colors and font setups
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

    // Summary
    if (cvData.summary) {
        tex += `\\section*{Profil}\n${escapeLatex(cvData.summary)}\n\n`;
    }

    // Skills
    if (cvData.keySkills && cvData.keySkills.length > 0) {
        tex += `\\section*{Compétences}\n`;
        tex += `\\noindent ${escapeLatexArray(cvData.keySkills).join(', ')}\n\n`;
    }

    // Experience
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

    // Education
    if (cvData.education && cvData.education.length > 0) {
        tex += `\\section*{Formation}\n`;
        cvData.education.forEach(edu => {
            tex += `\\noindent\\textbf{${escapeLatex(edu.degree || '')}} \\hfill \\textit{${escapeLatex(edu.period || '')}} \\\\\n`;
            tex += `\\noindent\\textbf{\\color{primary}${escapeLatex(edu.school || '')}} \\\\\n`;
            if (edu.description) tex += `${escapeLatex(edu.description)}\n`;
             tex += `\\vspace{0.2cm}\n\n`;
        });
    }

    // Projects
    if (cvData.projects && cvData.projects.length > 0) {
        tex += `\\section*{Projets}\n`;
        cvData.projects.forEach(proj => {
            tex += `\\noindent\\textbf{${escapeLatex(proj.name || '')}}`;
            if (proj.link) tex += ` -- \\href{${proj.link}}{Lien}`;
            tex += `\\\\\n`;
            tex += `${proj.description ? escapeLatex(proj.description) : ''}\n\\vspace{0.2cm}\n\n`;
        });
    }

    // Certifications
    if (cvData.certifications && cvData.certifications.length > 0) {
        tex += `\\section*{Certifications}\n\\begin{itemize}[leftmargin=*, noitemsep, topsep=2pt]\n`;
        cvData.certifications.forEach(cert => {
            tex += `  \\item ${escapeLatex(cert)}\n`;
        });
        tex += `\\end{itemize}\n\n`;
    }

    // Languages and Interests
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
 * Generate cover letter in LaTeX format
 */
export function generateCoverLetterPDF(letterData, candidateName = '', jobTitle = '', companyName = '', template = 'formal') {
    const name = letterData.candidateName || candidateName || '';
    const dateStr = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    const subject = letterData.subject || (jobTitle ? `Candidature au poste de ${jobTitle}` : '');
    
    const letterContent = letterData.fullText || 
        [letterData.greeting, '', letterData.opening, '', letterData.body, '', letterData.closing, '', letterData.signature]
            .filter(p => p !== undefined).join('\n\n');

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
    
    tex += `\\opening{Madame, Monsieur,}

${escapeLatex(letterContent).replace(/\\n/g, '\n\n')}

\\closing{Cordialement,}

\\end{letter}
\\end{document}
`;

    return tex;
}

// ============================================================
// TWENTY-SECOND CV GENERATOR
// ============================================================

function generateTwentySecondCVPDF(cvData, candidateName) {
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
 * Download a LaTeX document (.tex)
 */
export function downloadPDF(texContent, filename) {
    // Replace .pdf with .tex if the filename ends with .pdf
    const texFilename = filename.replace(/\\.pdf$/, '.tex');
    const blob = new Blob([texContent], { type: "text/plain;charset=utf-8" });
    saveAs(blob, texFilename);
}
