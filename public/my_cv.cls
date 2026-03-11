\NeedsTeXFormat{LaTeX2e}
\ProvidesClass{my_cv}[2020/01/04 My CV class]

\LoadClass[a4paper]{article}
\RequirePackage{fontawesome}  % fonts
\RequirePackage{titlesec}     % for editing sections
\RequirePackage{xcolor}
\RequirePackage[default]{raleway}
\RequirePackage{relsize}
\RequirePackage{ifthen}
\RequirePackage[margin=1.5cm,footskip=0.25in]{geometry}
\RequirePackage{multicol}
\RequirePackage[skins]{tcolorbox}
\RequirePackage{tikz}
\RequirePackage{enumitem}
\RequirePackage{hyperref}

%% Page Settings
\setlength\columnsep{1cm}
\pagestyle{empty}
\setlist[itemize]{leftmargin=*}
\setlist{nolistsep}

%% Define Custom Colors
\definecolor{cvblue}{rgb}{0.32, 0.68, 0.89}

%% Reliability Fixes for Fonts (Standard LaTeX / pdfLaTeX)
\providecommand{\ralewayextra}{\fontseries{eb}\selectfont}
\providecommand{\ralewaythin}{\fontseries{l}\selectfont}

%%% Edit Section Format
% Circled Icons
\newcommand*{\circled}[1]{
    \tikz[baseline=(char.base)]{
        \node[shape=circle,fill=black,inner sep=2pt,minimum size=23pt] (char) {\textcolor{white}{#1}};
    }
}

% Different Section Styles
\titleformat{\section}         
  {\ralewayextra\bfseries\raggedright\color{cvblue}} 
  {}{0em}  
  {\hspace{-0.8em}}  

\titleformat{\subsection}         
  {\large\bfseries} 
  {}{0em}  
  {}  
  
\titlespacing*{\subsection}{0pt}{0.7\baselineskip}{0.4\baselineskip}
\titlespacing*{\section}{0pt}{1.8\baselineskip}{0.4\baselineskip}

% Section with symbol besides
\let\oldsection\section
\renewcommand*{\section}[2]{%
  \oldsection[#2]{\circled{#1} {\larger[2] #2}}%
}

% #1: Header (Role/Date), #2: Subheader (Company), #3: Body (Description)
\newcommand*{\work}[3]{%
  \subsection{#1}%
  \ifthenelse{\equal{#2}{}}{}{\textbf{#2}\\}%
  #3
}

% #1: First Name, #2: Last Name, #3: Professional Title
% #4: Date of birth, #5: Email, #6: Phone, #7: Social/Github
\newcommand*{\titletext}[7]{%
    \begin{multicols}{2}
    {\ralewayextra\bfseries\fontsize{40}{40}\selectfont \hspace{13pt} #1}\vspace{-12pt}\\
    {\ralewaythin\fontsize{45}{45}\selectfont #2}
    
    \vspace{5pt}
    {\raleway\small \hspace{15pt} #3}
    \columnbreak
    
    \begin{flushright}
    \vspace*{-5pt}    
    {\ralewayextra Date of birth:} \textbf{#4}\\
    {\ralewayextra Email:} \textbf{#5}\\
    {\ralewayextra Phone:} \textbf{#6}\\
    \ifthenelse{\equal{#7}{}}{}{{\ralewayextra Github:} \textbf{#7}}%
    \end{flushright}
    \end{multicols}
}

\renewcommand{\baselinestretch}{1.15}