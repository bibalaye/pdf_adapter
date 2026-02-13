/**
 * PDF Generator — Multiple templates for CV and cover letter
 * Uses jsPDF — Templates: classic, modern, minimal, formal, creative
 */
import { jsPDF } from 'jspdf';

const PAGE_W = 210;
const PAGE_H = 297;

// ============================================================
// Shared helpers
// ============================================================

function addInvisibleATSKeywords(doc, keywords) {
    if (!keywords || keywords.length === 0) return;
    // White text on white background — invisible to humans, readable by ATS
    doc.setFontSize(1);
    doc.setTextColor(255, 255, 255);
    const kwText = keywords.join(', ');
    const lines = doc.splitTextToSize(kwText, PAGE_W - 20);
    let y = PAGE_H - 3;
    for (const line of lines) {
        doc.text(line, 10, y);
        y -= 1;
        if (y < PAGE_H - 10) break;
    }
}

// ============================================================
// CV TEMPLATE: CLASSIC
// ============================================================
function generateClassicCV(doc, cvData, name, photoDataURL) {
    const margin = 22;
    const contentW = PAGE_W - 2 * margin;
    let y = margin;

    const C = {
        primary: [45, 55, 120],
        accent: [67, 56, 202],
        text: [35, 35, 50],
        secondary: [90, 90, 115],
        muted: [140, 140, 160],
        line: [210, 210, 225],
    };

    // Top accent bar
    doc.setFillColor(...C.accent);
    doc.rect(0, 0, PAGE_W, 4, 'F');

    // Photo (if provided, top-left)
    if (photoDataURL) {
        try {
            const photoS = 28;
            doc.addImage(photoDataURL, 'JPEG', margin, y, photoS, photoS);
            doc.setDrawColor(...C.accent);
            doc.setLineWidth(0.8);
            doc.circle(margin + photoS / 2, y + photoS / 2, photoS / 2 + 0.5, 'S');

            // Name to the right of photo
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...C.primary);
            doc.text(name, margin + photoS + 8, y + 10);

            if (cvData.personalInfo?.title) {
                doc.setFontSize(11);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(...C.accent);
                doc.text(cvData.personalInfo.title, margin + photoS + 8, y + 18);
            }
            y += photoS + 6;
        } catch (e) {
            console.warn('Photo error:', e);
            y = renderClassicHeader(doc, name, cvData, margin, y, C);
        }
    } else {
        y = renderClassicHeader(doc, name, cvData, margin, y, C);
    }

    // Contact line
    const pi = cvData.personalInfo || {};
    const contacts = [pi.email, pi.phone, pi.location, pi.linkedin].filter(Boolean);
    if (contacts.length) {
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...C.secondary);
        doc.text(contacts.join('  •  '), margin, y);
        y += 6;
    }

    // Divider
    doc.setDrawColor(...C.accent);
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin + contentW, y);
    y += 8;

    function sectionTitle(title) {
        checkPage(16);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...C.accent);
        doc.text(title.toUpperCase(), margin, y);
        y += 2;
        doc.setDrawColor(...C.accent);
        doc.setLineWidth(0.4);
        doc.line(margin, y, margin + 30, y);
        doc.setDrawColor(...C.line);
        doc.setLineWidth(0.1);
        doc.line(margin + 31, y, margin + contentW, y);
        y += 6;
    }

    function checkPage(need = 15) {
        if (y + need > PAGE_H - 15) {
            doc.addPage();
            y = margin;
        }
    }

    // Summary
    if (cvData.summary) {
        sectionTitle('Profil');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(...C.secondary);
        const lines = doc.splitTextToSize(cvData.summary, contentW);
        for (const l of lines) { checkPage(4.5); doc.text(l, margin, y); y += 4.2; }
        y += 4;
    }

    // Skills
    if (cvData.keySkills?.length) {
        sectionTitle('Compétences');
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...C.text);
        const skillText = cvData.keySkills.join('  •  ');
        const lines = doc.splitTextToSize(skillText, contentW);
        for (const l of lines) { checkPage(4); doc.text(l, margin, y); y += 4; }
        y += 4;
    }

    // Experience
    if (cvData.experience?.length) {
        sectionTitle('Expérience Professionnelle');
        for (const exp of cvData.experience) {
            checkPage(18);
            doc.setFontSize(10.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...C.text);
            doc.text(exp.title || '', margin, y);
            y += 4.5;
            doc.setFontSize(8.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...C.accent);
            doc.text([exp.company, exp.period].filter(Boolean).join('  —  '), margin, y);
            y += 5;
            if (exp.bullets?.length) {
                for (const b of exp.bullets) {
                    checkPage(5);
                    doc.setFillColor(...C.accent);
                    doc.circle(margin + 1.5, y - 1, 0.5, 'F');
                    doc.setFontSize(8.5);
                    doc.setTextColor(...C.text);
                    const bl = doc.splitTextToSize(b, contentW - 6);
                    for (let i = 0; i < bl.length; i++) { if (i > 0) checkPage(4); doc.text(bl[i], margin + 5, y); y += 3.8; }
                    y += 0.5;
                }
            }
            y += 4;
        }
    }

    // Education
    if (cvData.education?.length) {
        sectionTitle('Formation');
        for (const edu of cvData.education) {
            checkPage(12);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...C.text);
            doc.text(edu.degree || '', margin, y);
            y += 4.5;
            doc.setFontSize(8.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...C.accent);
            doc.text([edu.school, edu.period].filter(Boolean).join('  —  '), margin, y);
            y += 6;
        }
    }

    // Languages
    if (cvData.languages?.length) {
        sectionTitle('Langues');
        doc.setFontSize(8.5);
        doc.setTextColor(...C.text);
        doc.text(cvData.languages.join('  •  '), margin, y);
        y += 6;
    }

    // Invisible ATS keywords
    addInvisibleATSKeywords(doc, cvData.addedKeywords);
}

function renderClassicHeader(doc, name, cvData, margin, y, C) {
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.primary);
    doc.text(name, margin, y);
    y += 8;
    if (cvData.personalInfo?.title) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...C.accent);
        doc.text(cvData.personalInfo.title, margin, y);
        y += 6;
    }
    return y;
}

// ============================================================
// CV TEMPLATE: MODERN (2-column sidebar)
// ============================================================
function generateModernCV(doc, cvData, name, photoDataURL) {
    const SIDEBAR_W = 65;
    const MAIN_X = SIDEBAR_W + 8;
    const MAIN_W = PAGE_W - MAIN_X - 12;
    const M = 8;

    const S = {
        bg: [35, 40, 75],
        accent: [99, 102, 241],
        text: [220, 220, 240],
        muted: [160, 165, 195],
        title: [140, 160, 255],
        tagBg: [55, 60, 105],
    };
    const Main = {
        text: [35, 35, 50],
        accent: [67, 56, 202],
        secondary: [100, 100, 130],
        line: [225, 225, 240],
    };

    let sideY = 12;
    let mainY = 12;

    function drawSidebar() {
        doc.setFillColor(...S.bg);
        doc.rect(0, 0, SIDEBAR_W, PAGE_H, 'F');
        doc.setFillColor(...S.accent);
        doc.rect(0, 0, SIDEBAR_W, 3, 'F');
    }

    drawSidebar();

    // Photo
    if (photoDataURL) {
        try {
            const ps = 36;
            const px = (SIDEBAR_W - ps) / 2;
            doc.addImage(photoDataURL, 'JPEG', px, sideY, ps, ps);
            doc.setDrawColor(...S.accent);
            doc.setLineWidth(1);
            doc.circle(px + ps / 2, sideY + ps / 2, ps / 2 + 0.5, 'S');
            sideY += ps + 8;
        } catch (e) { console.warn(e); }
    }

    // Sidebar name
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...S.text);
    const nl = doc.splitTextToSize(name, SIDEBAR_W - 2 * M);
    for (const n of nl) { doc.text(n, SIDEBAR_W / 2, sideY, { align: 'center' }); sideY += 4.5; }
    sideY += 2;

    function sideSection(title) {
        sideY += 5;
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...S.title);
        doc.text(title.toUpperCase(), M, sideY);
        sideY += 1.5;
        doc.setDrawColor(...S.accent);
        doc.setLineWidth(0.4);
        doc.line(M, sideY, SIDEBAR_W - M, sideY);
        sideY += 4;
    }

    // Contact
    const pi = cvData.personalInfo || {};
    const contacts = [];
    if (pi.email) contacts.push({ icon: '✉', val: pi.email });
    if (pi.phone) contacts.push({ icon: '☎', val: pi.phone });
    if (pi.location) contacts.push({ icon: '📍', val: pi.location });
    if (pi.linkedin) contacts.push({ icon: '🔗', val: pi.linkedin });

    if (contacts.length) {
        sideSection('Contact');
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...S.muted);
        for (const c of contacts) {
            const cl = doc.splitTextToSize(c.val, SIDEBAR_W - 2 * M - 4);
            for (let i = 0; i < cl.length; i++) {
                doc.text(i === 0 ? `${c.icon}  ${cl[i]}` : `     ${cl[i]}`, M, sideY);
                sideY += 3.5;
            }
            sideY += 1;
        }
    }

    // Skills
    if (cvData.keySkills?.length) {
        sideSection('Compétences');
        doc.setFontSize(6.8);
        for (const skill of cvData.keySkills) {
            if (sideY > PAGE_H - 15) break;
            const tw = Math.min(doc.getTextWidth(skill) + 6, SIDEBAR_W - 2 * M);
            doc.setFillColor(...S.tagBg);
            doc.roundedRect(M, sideY - 3.5, tw, 5, 1.5, 1.5, 'F');
            doc.setTextColor(...S.text);
            doc.text(skill, M + 3, sideY);
            sideY += 7;
        }
    }

    // Languages
    if (cvData.languages?.length) {
        sideSection('Langues');
        doc.setFontSize(7.5);
        doc.setTextColor(...S.muted);
        for (const lang of cvData.languages) {
            if (sideY > PAGE_H - 15) break;
            doc.text('•  ' + lang, M, sideY);
            sideY += 4.5;
        }
    }

    // Certifications
    if (cvData.certifications?.length) {
        sideSection('Certifications');
        doc.setFontSize(7);
        doc.setTextColor(...S.muted);
        for (const cert of cvData.certifications) {
            if (sideY > PAGE_H - 15) break;
            const cl = doc.splitTextToSize('•  ' + cert, SIDEBAR_W - 2 * M);
            for (const c of cl) { doc.text(c, M, sideY); sideY += 3.5; }
            sideY += 1;
        }
    }

    // === MAIN CONTENT ===
    function mainCheck(need = 20) {
        if (mainY + need > PAGE_H - 12) { doc.addPage(); drawSidebar(); mainY = 12; }
    }

    function mainTitle(title) {
        mainCheck(16);
        mainY += 3;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...Main.accent);
        doc.text(title.toUpperCase(), MAIN_X, mainY);
        mainY += 1.5;
        doc.setDrawColor(...Main.accent);
        doc.setLineWidth(0.5);
        doc.line(MAIN_X, mainY, MAIN_X + 35, mainY);
        doc.setDrawColor(...Main.line);
        doc.setLineWidth(0.12);
        doc.line(MAIN_X + 36, mainY, MAIN_X + MAIN_W, mainY);
        mainY += 5;
    }

    // Name main side
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...Main.text);
    doc.text(name, MAIN_X, mainY);
    mainY += 7;
    if (pi.title) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...Main.accent);
        doc.text(pi.title, MAIN_X, mainY);
        mainY += 6;
    }
    doc.setDrawColor(...Main.accent);
    doc.setLineWidth(0.6);
    doc.line(MAIN_X, mainY, MAIN_X + MAIN_W, mainY);
    mainY += 7;

    // Summary
    if (cvData.summary) {
        mainTitle('Profil');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(...Main.secondary);
        const sl = doc.splitTextToSize(cvData.summary, MAIN_W);
        for (const s of sl) { mainCheck(4.5); doc.text(s, MAIN_X, mainY); mainY += 4.2; }
        mainY += 3;
    }

    // Experience
    if (cvData.experience?.length) {
        mainTitle('Expérience Professionnelle');
        for (const exp of cvData.experience) {
            mainCheck(20);
            doc.setFontSize(10.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...Main.text);
            doc.text(exp.title || '', MAIN_X, mainY);
            mainY += 4.5;
            doc.setFontSize(8.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...Main.accent);
            doc.text([exp.company, exp.period].filter(Boolean).join('  —  '), MAIN_X, mainY);
            mainY += 5;
            if (exp.bullets?.length) {
                for (const b of exp.bullets) {
                    mainCheck(5);
                    doc.setFillColor(...Main.accent);
                    doc.circle(MAIN_X + 1.5, mainY - 1, 0.5, 'F');
                    doc.setFontSize(8.5);
                    doc.setTextColor(...Main.text);
                    const bl = doc.splitTextToSize(b, MAIN_W - 7);
                    for (let i = 0; i < bl.length; i++) { if (i > 0) mainCheck(4); doc.text(bl[i], MAIN_X + 5, mainY); mainY += 3.8; }
                    mainY += 0.5;
                }
            }
            mainY += 3;
        }
    }

    // Education
    if (cvData.education?.length) {
        mainTitle('Formation');
        for (const edu of cvData.education) {
            mainCheck(14);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...Main.text);
            doc.text(edu.degree || '', MAIN_X, mainY);
            mainY += 4.5;
            doc.setFontSize(8.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...Main.accent);
            doc.text([edu.school, edu.period].filter(Boolean).join('  —  '), MAIN_X, mainY);
            mainY += 6;
        }
    }

    // Invisible ATS keywords
    addInvisibleATSKeywords(doc, cvData.addedKeywords);
}

// ============================================================
// CV TEMPLATE: MINIMAL
// ============================================================
function generateMinimalCV(doc, cvData, name, photoDataURL) {
    const margin = 25;
    const contentW = PAGE_W - 2 * margin;
    let y = 28;

    const C = {
        text: [30, 30, 40],
        accent: [80, 70, 160],
        secondary: [100, 100, 120],
        muted: [150, 150, 165],
        line: [220, 220, 230],
    };

    const pi = cvData.personalInfo || {};

    function checkPage(need = 12) {
        if (y + need > PAGE_H - 15) { doc.addPage(); y = margin; }
    }

    // Photo centered
    if (photoDataURL) {
        try {
            const ps = 30;
            const px = (PAGE_W - ps) / 2;
            doc.addImage(photoDataURL, 'JPEG', px, y, ps, ps);
            doc.setDrawColor(...C.accent);
            doc.setLineWidth(0.8);
            doc.circle(px + ps / 2, y + ps / 2, ps / 2 + 0.5, 'S');
            y += ps + 6;
        } catch (e) { console.warn(e); }
    }

    // Name centered
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.text);
    doc.text(name, PAGE_W / 2, y, { align: 'center' });
    y += 8;

    // Title centered
    if (pi.title) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...C.accent);
        doc.text(pi.title, PAGE_W / 2, y, { align: 'center' });
        y += 6;
    }

    // Contact centered
    const contacts = [pi.email, pi.phone, pi.location].filter(Boolean);
    if (contacts.length) {
        doc.setFontSize(8);
        doc.setTextColor(...C.muted);
        doc.text(contacts.join('  |  '), PAGE_W / 2, y, { align: 'center' });
        y += 5;
        if (pi.linkedin) {
            doc.text(pi.linkedin, PAGE_W / 2, y, { align: 'center' });
            y += 5;
        }
    }

    // Thin separator
    y += 2;
    doc.setDrawColor(...C.line);
    doc.setLineWidth(0.2);
    doc.line(margin + 30, y, PAGE_W - margin - 30, y);
    y += 10;

    function sectionTitle(title) {
        checkPage(14);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...C.accent);
        doc.text(title.toUpperCase(), margin, y);
        y += 2;
        doc.setDrawColor(...C.accent);
        doc.setLineWidth(0.3);
        doc.line(margin, y, margin + 20, y);
        y += 6;
    }

    // Summary
    if (cvData.summary) {
        sectionTitle('Profil');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(...C.secondary);
        const sl = doc.splitTextToSize(cvData.summary, contentW);
        for (const s of sl) { checkPage(4.5); doc.text(s, margin, y); y += 4.2; }
        y += 6;
    }

    // Skills as inline
    if (cvData.keySkills?.length) {
        sectionTitle('Compétences');
        doc.setFontSize(8.5);
        doc.setTextColor(...C.text);
        const txt = cvData.keySkills.join('  •  ');
        const sl = doc.splitTextToSize(txt, contentW);
        for (const s of sl) { checkPage(4); doc.text(s, margin, y); y += 4; }
        y += 6;
    }

    // Experience
    if (cvData.experience?.length) {
        sectionTitle('Expérience');
        for (const exp of cvData.experience) {
            checkPage(16);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...C.text);
            doc.text(exp.title || '', margin, y);
            // Period right-aligned
            if (exp.period) {
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(...C.muted);
                doc.text(exp.period, margin + contentW, y, { align: 'right' });
            }
            y += 4.5;
            doc.setFontSize(8.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...C.accent);
            doc.text(exp.company || '', margin, y);
            y += 5;
            if (exp.bullets?.length) {
                for (const b of exp.bullets) {
                    checkPage(5);
                    doc.setFontSize(8.5);
                    doc.setTextColor(...C.text);
                    const bl = doc.splitTextToSize('—  ' + b, contentW - 4);
                    for (const l of bl) { doc.text(l, margin + 2, y); y += 3.8; }
                    y += 0.5;
                }
            }
            y += 4;
        }
    }

    // Education
    if (cvData.education?.length) {
        sectionTitle('Formation');
        for (const edu of cvData.education) {
            checkPage(10);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...C.text);
            doc.text(edu.degree || '', margin, y);
            if (edu.period) {
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(...C.muted);
                doc.text(edu.period, margin + contentW, y, { align: 'right' });
            }
            y += 4.5;
            doc.setFontSize(8.5);
            doc.setTextColor(...C.accent);
            doc.text(edu.school || '', margin, y);
            y += 6;
        }
    }

    // Languages
    if (cvData.languages?.length) {
        sectionTitle('Langues');
        doc.setFontSize(8.5);
        doc.setTextColor(...C.text);
        doc.text(cvData.languages.join('  •  '), margin, y);
        y += 6;
    }

    // Invisible ATS keywords
    addInvisibleATSKeywords(doc, cvData.addedKeywords);
}

// ============================================================
// COVER LETTER TEMPLATE: FORMAL
// ============================================================
function generateFormalLetter(doc, letterData, candidateName, jobTitle, companyName) {
    const margin = 25;
    const contentW = PAGE_W - 2 * margin;
    let y = margin;

    const C = {
        primary: [40, 50, 110],
        text: [40, 40, 55],
        secondary: [100, 100, 130],
        line: [210, 210, 225],
    };

    // No accent — clean formal look
    const name = letterData.candidateName || candidateName || '';

    // Name
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.primary);
    doc.text(name, margin, y);
    y += 10;

    // Date
    const dateStr = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.secondary);
    doc.text(dateStr, margin, y);
    y += 10;

    // Subject
    const subject = letterData.subject || (jobTitle ? `Candidature au poste de ${jobTitle}` : '');
    if (subject) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...C.text);
        const ol = doc.splitTextToSize(`Objet : ${subject}`, contentW);
        for (const l of ol) { doc.text(l, margin, y); y += 5; }
        y += 5;
    }

    // Divider
    doc.setDrawColor(...C.line);
    doc.setLineWidth(0.3);
    doc.line(margin, y, margin + contentW, y);
    y += 10;

    // Body
    const letterContent = letterData.fullText ||
        [letterData.greeting, '', letterData.opening, '', letterData.body, '', letterData.closing, '', letterData.signature]
            .filter(p => p !== undefined).join('\n');

    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.text);

    for (const para of letterContent.split('\n')) {
        if (!para.trim()) { y += 4; continue; }
        const lines = doc.splitTextToSize(para.trim(), contentW);
        for (const l of lines) {
            if (y > PAGE_H - margin - 10) { doc.addPage(); y = margin; }
            doc.text(l, margin, y);
            y += 5.5;
        }
        y += 2;
    }
}

// ============================================================
// COVER LETTER TEMPLATE: CREATIVE
// ============================================================
function generateCreativeLetter(doc, letterData, candidateName, jobTitle, companyName) {
    const margin = 25;
    const contentW = PAGE_W - 2 * margin;
    let y = 0;

    const C = {
        primary: [67, 56, 202],
        warm: [225, 112, 85],
        text: [35, 35, 50],
        secondary: [80, 80, 105],
        muted: [140, 140, 160],
    };

    // Top accent gradient bar
    doc.setFillColor(...C.primary);
    doc.rect(0, 0, PAGE_W, 5, 'F');
    // Add warm accent stripe
    doc.setFillColor(...C.warm);
    doc.rect(0, 5, PAGE_W * 0.35, 1.5, 'F');

    y = margin + 4;

    const name = letterData.candidateName || candidateName || '';

    // Name with accent
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.primary);
    doc.text(name, margin, y);
    y += 8;

    // Subject as featured line
    const subject = letterData.subject || (jobTitle ? `Candidature au poste de ${jobTitle}` : '');
    if (subject) {
        // Subject background highlight
        doc.setFontSize(10);
        const subjectLines = doc.splitTextToSize(subject, contentW - 16);
        const subjectH = subjectLines.length * 5.5 + 6;
        doc.setFillColor(245, 243, 255);
        doc.roundedRect(margin, y - 3, contentW, subjectH, 2, 2, 'F');
        doc.setDrawColor(...C.primary);
        doc.setLineWidth(0.3);
        doc.roundedRect(margin, y - 3, contentW, subjectH, 2, 2, 'S');

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...C.primary);
        doc.text('Objet', margin + 6, y + 2);
        y += 6;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...C.text);
        for (const l of subjectLines) {
            doc.text(l, margin + 6, y);
            y += 5.5;
        }
        y += 6;
    }

    // Date right-aligned
    const dateStr = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.muted);
    doc.text(dateStr, margin + contentW, y, { align: 'right' });
    y += 10;

    // Body
    const letterContent = letterData.fullText ||
        [letterData.greeting, '', letterData.opening, '', letterData.body, '', letterData.closing, '', letterData.signature]
            .filter(p => p !== undefined).join('\n');

    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.text);

    for (const para of letterContent.split('\n')) {
        if (!para.trim()) { y += 4; continue; }
        const lines = doc.splitTextToSize(para.trim(), contentW);
        for (const l of lines) {
            if (y > PAGE_H - margin - 10) {
                doc.addPage();
                doc.setFillColor(...C.primary);
                doc.rect(0, 0, PAGE_W, 3, 'F');
                y = margin;
            }
            doc.text(l, margin, y);
            y += 5.5;
        }
        y += 2;
    }

    // Bottom accent line
    doc.setFillColor(...C.primary);
    doc.rect(0, PAGE_H - 3, PAGE_W, 3, 'F');
}

// ============================================================
// CV TEMPLATE: EXECUTIVE
// ============================================================
function generateExecutiveCV(doc, cvData, name, photoDataURL) {
    const margin = 20;
    const contentW = PAGE_W - 2 * margin;
    let y = 0;

    const C = {
        band: [26, 26, 46],
        accent: [130, 140, 200],
        gold: [200, 175, 120],
        text: [35, 35, 50],
        secondary: [90, 90, 115],
        muted: [140, 140, 160],
        line: [200, 200, 215],
    };

    // Dark header band
    const bandH = 48;
    doc.setFillColor(...C.band);
    doc.rect(0, 0, PAGE_W, bandH, 'F');

    // Gold accent line
    doc.setFillColor(...C.gold);
    doc.rect(0, bandH, PAGE_W, 1.5, 'F');

    y = 16;

    // Photo in band
    if (photoDataURL) {
        try {
            const ps = 26;
            doc.addImage(photoDataURL, 'JPEG', margin, y - 2, ps, ps);
            doc.setDrawColor(...C.gold);
            doc.setLineWidth(0.8);
            doc.circle(margin + ps / 2, y - 2 + ps / 2, ps / 2 + 0.5, 'S');

            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(240, 240, 250);
            doc.text(name, margin + ps + 10, y + 6);

            if (cvData.personalInfo?.title) {
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(...C.accent);
                doc.text(cvData.personalInfo.title, margin + ps + 10, y + 14);
            }
        } catch (e) {
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(240, 240, 250);
            doc.text(name, margin, y + 6);
            if (cvData.personalInfo?.title) {
                doc.setFontSize(10);
                doc.setTextColor(...C.accent);
                doc.text(cvData.personalInfo.title, margin, y + 14);
            }
        }
    } else {
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(240, 240, 250);
        doc.text(name, margin, y + 6);
        if (cvData.personalInfo?.title) {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...C.accent);
            doc.text(cvData.personalInfo.title, margin, y + 14);
        }
    }

    y = bandH + 10;

    // Contact
    const pi = cvData.personalInfo || {};
    const contacts = [pi.email, pi.phone, pi.location, pi.linkedin].filter(Boolean);
    if (contacts.length) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...C.secondary);
        doc.text(contacts.join('  •  '), margin, y);
        y += 8;
    }

    function sectionTitle(title) { checkPage(14); doc.setFontSize(10.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.band); doc.text(title.toUpperCase(), margin, y); y += 2; doc.setDrawColor(...C.gold); doc.setLineWidth(0.5); doc.line(margin, y, margin + 25, y); doc.setDrawColor(...C.line); doc.setLineWidth(0.1); doc.line(margin + 26, y, margin + contentW, y); y += 6; }
    function checkPage(need = 15) { if (y + need > PAGE_H - 12) { doc.addPage(); y = margin; } }

    if (cvData.summary) { sectionTitle('Profil'); doc.setFontSize(9); doc.setFont('helvetica', 'italic'); doc.setTextColor(...C.secondary); const sl = doc.splitTextToSize(cvData.summary, contentW); for (const s of sl) { checkPage(4.5); doc.text(s, margin, y); y += 4.2; } y += 4; }

    if (cvData.keySkills?.length) { sectionTitle('Compétences'); doc.setFontSize(8.5); doc.setTextColor(...C.text); const sl = doc.splitTextToSize(cvData.keySkills.join('  •  '), contentW); for (const s of sl) { checkPage(4); doc.text(s, margin, y); y += 4; } y += 4; }

    if (cvData.experience?.length) { sectionTitle('Expérience'); for (const exp of cvData.experience) { checkPage(18); doc.setFontSize(10.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.text); doc.text(exp.title || '', margin, y); y += 4.5; doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.gold); doc.text([exp.company, exp.period].filter(Boolean).join('  —  '), margin, y); y += 5; if (exp.bullets?.length) { for (const b of exp.bullets) { checkPage(5); doc.setFillColor(...C.gold); doc.circle(margin + 1.5, y - 1, 0.5, 'F'); doc.setFontSize(8.5); doc.setTextColor(...C.text); const bl = doc.splitTextToSize(b, contentW - 6); for (let i = 0; i < bl.length; i++) { if (i > 0) checkPage(4); doc.text(bl[i], margin + 5, y); y += 3.8; } y += 0.5; } } y += 3; } }

    if (cvData.education?.length) { sectionTitle('Formation'); for (const edu of cvData.education) { checkPage(12); doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.text); doc.text(edu.degree || '', margin, y); y += 4.5; doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.gold); doc.text([edu.school, edu.period].filter(Boolean).join('  —  '), margin, y); y += 6; } }

    if (cvData.languages?.length) { sectionTitle('Langues'); doc.setFontSize(8.5); doc.setTextColor(...C.text); doc.text(cvData.languages.join('  •  '), margin, y); y += 6; }

    addInvisibleATSKeywords(doc, cvData.addedKeywords);
}

// ============================================================
// CV TEMPLATE: BOLD (Créatif)
// ============================================================
function generateBoldCV(doc, cvData, name, photoDataURL) {
    const SIDEBAR_W = 65;
    const MAIN_X = SIDEBAR_W + 8;
    const MAIN_W = PAGE_W - MAIN_X - 12;
    const M = 8;

    const S = { bg1: [108, 92, 231], bg2: [162, 155, 254], text: [255, 255, 255], muted: [220, 215, 255], tagBg: [255, 255, 255, 0.2] };
    const Main = { text: [35, 35, 50], accent: [108, 92, 231], secondary: [100, 100, 130], line: [225, 225, 240] };

    let sideY = 12;
    let mainY = 12;

    function drawSidebar() {
        const grd = doc.linearGradient(0, 0, 0, PAGE_H);
        grd.addColorStop(0, '#6c5ce7');
        grd.addColorStop(1, '#a29bfe');
        try { doc.setFillColor(108, 92, 231); doc.rect(0, 0, SIDEBAR_W, PAGE_H, 'F'); /* Gradient fallback */ } catch (e) { doc.setFillColor(108, 92, 231); doc.rect(0, 0, SIDEBAR_W, PAGE_H, 'F'); }
        // Bottom gradient overlay
        doc.setFillColor(162, 155, 254);
        doc.rect(0, PAGE_H * 0.5, SIDEBAR_W, PAGE_H * 0.5, 'F');
    }

    drawSidebar();

    if (photoDataURL) {
        try {
            const ps = 36;
            const px = (SIDEBAR_W - ps) / 2;
            doc.addImage(photoDataURL, 'JPEG', px, sideY, ps, ps);
            doc.setDrawColor(255, 255, 255);
            doc.setLineWidth(1.2);
            doc.circle(px + ps / 2, sideY + ps / 2, ps / 2 + 0.5, 'S');
            sideY += ps + 8;
        } catch (e) { console.warn(e); }
    }

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...S.text);
    const nl = doc.splitTextToSize(name, SIDEBAR_W - 2 * M);
    for (const n of nl) { doc.text(n, SIDEBAR_W / 2, sideY, { align: 'center' }); sideY += 4.5; }
    sideY += 3;

    function sideSection(title) { sideY += 5; doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...S.muted); doc.text(title.toUpperCase(), M, sideY); sideY += 1.5; doc.setDrawColor(255, 255, 255); doc.setLineWidth(0.3); doc.line(M, sideY, SIDEBAR_W - M, sideY); sideY += 4; }

    const pi = cvData.personalInfo || {};
    const contacts = [];
    if (pi.email) contacts.push('✉  ' + pi.email);
    if (pi.phone) contacts.push('☎  ' + pi.phone);
    if (pi.location) contacts.push('📍  ' + pi.location);

    if (contacts.length) { sideSection('Contact'); doc.setFontSize(6.8); doc.setTextColor(...S.muted); for (const c of contacts) { const cl = doc.splitTextToSize(c, SIDEBAR_W - 2 * M); for (const l of cl) { doc.text(l, M, sideY); sideY += 3.5; } sideY += 1; } }

    if (cvData.keySkills?.length) { sideSection('Compétences'); doc.setFontSize(6.5); for (const skill of cvData.keySkills) { if (sideY > PAGE_H - 15) break; doc.setFillColor(255, 255, 255); doc.setGState(new doc.GState({ opacity: 0.15 })); const tw = Math.min(doc.getTextWidth(skill) + 6, SIDEBAR_W - 2 * M); doc.roundedRect(M, sideY - 3.5, tw, 5, 1.5, 1.5, 'F'); doc.setGState(new doc.GState({ opacity: 1 })); doc.setTextColor(255, 255, 255); doc.text(skill, M + 3, sideY); sideY += 7; } }

    if (cvData.languages?.length) { sideSection('Langues'); doc.setFontSize(7.5); doc.setTextColor(...S.muted); for (const lang of cvData.languages) { if (sideY > PAGE_H - 15) break; doc.text('•  ' + lang, M, sideY); sideY += 4.5; } }

    // Main content
    function mainCheck(need = 20) { if (mainY + need > PAGE_H - 12) { doc.addPage(); drawSidebar(); mainY = 12; } }
    function mainTitle(title) { mainCheck(16); mainY += 3; doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(...Main.accent); doc.text(title.toUpperCase(), MAIN_X, mainY); mainY += 1.5; doc.setDrawColor(...Main.accent); doc.setLineWidth(0.5); doc.line(MAIN_X, mainY, MAIN_X + 35, mainY); mainY += 5; }

    doc.setFontSize(20); doc.setFont('helvetica', 'bold'); doc.setTextColor(...Main.text); doc.text(name, MAIN_X, mainY); mainY += 7;
    if (pi.title) { doc.setFontSize(11); doc.setFont('helvetica', 'normal'); doc.setTextColor(...Main.accent); doc.text(pi.title, MAIN_X, mainY); mainY += 6; }
    doc.setDrawColor(...Main.accent); doc.setLineWidth(0.6); doc.line(MAIN_X, mainY, MAIN_X + MAIN_W, mainY); mainY += 7;

    if (cvData.summary) { mainTitle('Profil'); doc.setFontSize(9); doc.setFont('helvetica', 'italic'); doc.setTextColor(...Main.secondary); const sl = doc.splitTextToSize(cvData.summary, MAIN_W); for (const s of sl) { mainCheck(4.5); doc.text(s, MAIN_X, mainY); mainY += 4.2; } mainY += 3; }

    if (cvData.experience?.length) { mainTitle('Expérience'); for (const exp of cvData.experience) { mainCheck(20); doc.setFontSize(10.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...Main.text); doc.text(exp.title || '', MAIN_X, mainY); mainY += 4.5; doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...Main.accent); doc.text([exp.company, exp.period].filter(Boolean).join('  —  '), MAIN_X, mainY); mainY += 5; if (exp.bullets?.length) { for (const b of exp.bullets) { mainCheck(5); doc.setFillColor(...Main.accent); doc.circle(MAIN_X + 1.5, mainY - 1, 0.5, 'F'); doc.setFontSize(8.5); doc.setTextColor(...Main.text); const bl = doc.splitTextToSize(b, MAIN_W - 7); for (let i = 0; i < bl.length; i++) { if (i > 0) mainCheck(4); doc.text(bl[i], MAIN_X + 5, mainY); mainY += 3.8; } mainY += 0.5; } } mainY += 3; } }

    if (cvData.education?.length) { mainTitle('Formation'); for (const edu of cvData.education) { mainCheck(14); doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...Main.text); doc.text(edu.degree || '', MAIN_X, mainY); mainY += 4.5; doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...Main.accent); doc.text([edu.school, edu.period].filter(Boolean).join('  —  '), MAIN_X, mainY); mainY += 6; } }

    addInvisibleATSKeywords(doc, cvData.addedKeywords);
}

// ============================================================
// COVER LETTER TEMPLATE: ELEGANT
// ============================================================
function generateElegantLetter(doc, letterData, candidateName, jobTitle, companyName) {
    const margin = 28;
    const contentW = PAGE_W - 2 * margin;
    let y = 0;

    const C = {
        primary: [67, 56, 202],
        frame: [162, 155, 254],
        text: [40, 40, 55],
        secondary: [90, 90, 120],
        muted: [140, 140, 160],
    };

    // Decorative border frame
    doc.setDrawColor(...C.frame);
    doc.setLineWidth(0.8);
    doc.rect(12, 12, PAGE_W - 24, PAGE_H - 24, 'S');
    doc.setLineWidth(0.3);
    doc.rect(14, 14, PAGE_W - 28, PAGE_H - 28, 'S');

    y = 32;

    const name = letterData.candidateName || candidateName || '';

    // Name centered
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.primary);
    doc.text(name, PAGE_W / 2, y, { align: 'center' });
    y += 6;

    // Decorative separator
    doc.setDrawColor(...C.frame);
    doc.setLineWidth(0.4);
    doc.line(PAGE_W / 2 - 20, y, PAGE_W / 2 + 20, y);
    y += 10;

    // Date centered
    const dateStr = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.muted);
    doc.text(dateStr, PAGE_W / 2, y, { align: 'center' });
    y += 10;

    // Subject
    const subject = letterData.subject || (jobTitle ? `Candidature au poste de ${jobTitle}` : '');
    if (subject) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...C.text);
        const sl = doc.splitTextToSize(`Objet : ${subject}`, contentW);
        for (const l of sl) { doc.text(l, margin, y); y += 5; }
        y += 6;
    }

    // Body
    const letterContent = letterData.fullText ||
        [letterData.greeting, '', letterData.opening, '', letterData.body, '', letterData.closing, '', letterData.signature]
            .filter(p => p !== undefined).join('\n');

    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.text);

    for (const para of letterContent.split('\n')) {
        if (!para.trim()) { y += 4; continue; }
        const lines = doc.splitTextToSize(para.trim(), contentW);
        for (const l of lines) {
            if (y > PAGE_H - margin - 16) {
                doc.addPage();
                doc.setDrawColor(...C.frame);
                doc.setLineWidth(0.8);
                doc.rect(12, 12, PAGE_W - 24, PAGE_H - 24, 'S');
                doc.setLineWidth(0.3);
                doc.rect(14, 14, PAGE_W - 28, PAGE_H - 28, 'S');
                y = 28;
            }
            doc.text(l, margin, y);
            y += 5.5;
        }
        y += 2;
    }
}

// ============================================================
// PUBLIC API
// ============================================================

/**
 * Generate adapted CV PDF with chosen template
 * @param {Object} cvData
 * @param {string} candidateName
 * @param {string|null} profilePhotoDataURL
 * @param {'classic'|'modern'|'minimal'|'executive'|'bold'} template
 * @returns {jsPDF}
 */
export function generateAdaptedCVPDF(cvData, candidateName = '', profilePhotoDataURL = null, template = 'classic') {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pi = cvData.personalInfo || {};
    const name = pi.fullName || candidateName || 'Candidat';

    switch (template) {
        case 'modern':
            generateModernCV(doc, cvData, name, profilePhotoDataURL);
            break;
        case 'minimal':
            generateMinimalCV(doc, cvData, name, profilePhotoDataURL);
            break;
        case 'executive':
            generateExecutiveCV(doc, cvData, name, profilePhotoDataURL);
            break;
        case 'bold':
            generateBoldCV(doc, cvData, name, profilePhotoDataURL);
            break;
        case 'classic':
        default:
            generateClassicCV(doc, cvData, name, profilePhotoDataURL);
            break;
    }

    return doc;
}

/**
 * Generate cover letter PDF with chosen template
 * @param {Object} letterData
 * @param {string} candidateName
 * @param {string} jobTitle
 * @param {string} companyName
 * @param {'formal'|'creative'|'elegant'} template
 * @returns {jsPDF}
 */
export function generateCoverLetterPDF(letterData, candidateName = '', jobTitle = '', companyName = '', template = 'formal') {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    switch (template) {
        case 'creative':
            generateCreativeLetter(doc, letterData, candidateName, jobTitle, companyName);
            break;
        case 'elegant':
            generateElegantLetter(doc, letterData, candidateName, jobTitle, companyName);
            break;
        case 'formal':
        default:
            generateFormalLetter(doc, letterData, candidateName, jobTitle, companyName);
            break;
    }

    return doc;
}

/**
 * Download a jsPDF document
 */
export function downloadPDF(doc, filename) {
    doc.save(filename);
}
