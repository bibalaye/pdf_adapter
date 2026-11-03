import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enforceFidelity, applyRewrite, losesOfferTerms, keywordCoverage, findUnattestedNumbers, cvToText } from '../src/fidelity.js';

const SOURCE = `Camille Martin
Product Designer
camille.martin@example.com | +33 6 12 34 56 78 | Lyon
Product Designer, Atelier Numérique, Lyon (2021 - 2024)
- Tests utilisateurs sur le portail client auprès de 12 personnes
- Maintenance du design system
Master Design, Université de Lyon (2019)
Figma, Sketch, HTML, CSS, Accessibilité
Budget géré : 1 200 000 euros`;

const base = () => ({
  personalInfo: { fullName: 'Camille Martin', title: 'Designer produit', email: 'camille.martin@example.com', phone: '06 12 34 56 78', location: 'Lyon' },
  summary: 'Designer produit. Tests utilisateurs sur un portail client.',
  keySkills: ['Figma', 'Accessibilité'],
  experience: [{ title: 'Product Designer', company: 'Atelier Numérique', period: '2021 - 2024', description: '', bullets: ['Maintenance du design system'] }],
  education: [{ degree: 'Master Design', school: 'Université de Lyon', period: '2019', description: '' }],
});

test('keeps what the source supports', () => {
  const { cv, removed, warnings } = enforceFidelity(base(), SOURCE);
  assert.deepEqual(removed, []);
  assert.deepEqual(warnings, []);
  assert.equal(cv.personalInfo.phone, '06 12 34 56 78');
  assert.deepEqual(cv.keySkills, ['Figma', 'Accessibilité']);
});

test('removes a line with an invented number', () => {
  const input = base();
  input.experience[0].bullets = ['Maintenance du design system', 'Conversion en hausse de 40 %', 'Tests auprès de 12 personnes'];
  const { cv, removed } = enforceFidelity(input, SOURCE);
  assert.deepEqual(cv.experience[0].bullets, ['Maintenance du design system', 'Tests auprès de 12 personnes']);
  assert.equal(removed.length, 1);
  assert.match(removed[0].reason, /40/);
});

test('does not treat digits inside a word as figures, but catches 10k and 3x', () => {
  const input = base();
  input.experience[0].bullets = ['Produits B2B et modélisation 3D sur M365', 'Base de 10k clients', 'Trafic multiplié par 3x'];
  const { cv, removed } = enforceFidelity(input, SOURCE);
  assert.deepEqual(cv.experience[0].bullets, ['Produits B2B et modélisation 3D sur M365']);
  assert.equal(removed.length, 2);
});

test('accepts the same number written differently', () => {
  const input = base();
  input.experience[0].bullets = ['Budget de 1200000 euros', 'Budget de 1 200 000 euros', 'Budget de 1.200.000 euros'];
  const { cv, removed } = enforceFidelity(input, SOURCE);
  assert.equal(cv.experience[0].bullets.length, 3);
  assert.deepEqual(removed, []);
});

test('removes invented years of experience from the summary, keeps the rest', () => {
  const input = base();
  input.summary = 'Designer produit avec 8 ans d’expérience. Tests utilisateurs sur un portail client.';
  const { cv, removed } = enforceFidelity(input, SOURCE);
  assert.equal(cv.summary, 'Tests utilisateurs sur un portail client.');
  assert.equal(removed.length, 1);
});

test('removes an invented skill', () => {
  const input = base();
  input.keySkills = ['Figma', 'Kubernetes', 'Design system'];
  const { cv, removed } = enforceFidelity(input, SOURCE);
  assert.deepEqual(cv.keySkills, ['Figma', 'Design system']);
  assert.equal(removed[0].text, 'Kubernetes');
});

test('strips an invented seniority from the title', () => {
  const input = base();
  input.personalInfo.title = 'Senior Product Designer';
  const { cv, removed } = enforceFidelity(input, SOURCE);
  assert.equal(cv.personalInfo.title, 'Product Designer');
  assert.equal(removed.length, 1);
});

test('keeps a seniority that the source states', () => {
  const input = base();
  input.personalInfo.title = 'Product Manager';
  const { cv, removed } = enforceFidelity(input, `${SOURCE}\nProduct Manager`);
  assert.equal(cv.personalInfo.title, 'Product Manager');
  assert.deepEqual(removed, []);
});

test('removes invented contact details', () => {
  const input = base();
  input.personalInfo.email = 'autre@example.com';
  input.personalInfo.phone = '+33 7 99 99 99 99';
  input.personalInfo.linkedin = 'linkedin.com/in/invente';
  const { cv, removed } = enforceFidelity(input, SOURCE);
  assert.equal(cv.personalInfo.email, '');
  assert.equal(cv.personalInfo.phone, '');
  assert.equal(cv.personalInfo.linkedin, '');
  assert.equal(removed.length, 3);
});

test('removes placeholders', () => {
  const input = base();
  input.experience[0].bullets = ['Maintenance du design system', '[ADD: résultat]', 'Résultat à compléter'];
  const { cv } = enforceFidelity(input, SOURCE);
  assert.deepEqual(cv.experience[0].bullets, ['Maintenance du design system']);
});

test('flags an unknown employer or date without deleting them', () => {
  const input = base();
  input.experience[0].company = 'Entreprise Inventée';
  input.experience[0].period = '2015 - 2024';
  const { cv, warnings } = enforceFidelity(input, SOURCE);
  assert.equal(cv.experience[0].company, 'Entreprise Inventée');
  assert.equal(warnings.length, 2);
});

test('does not reject translated skills when the output language differs from the source', () => {
  const input = base();
  input.keySkills = ['User testing', 'Figma'];
  const { cv, removed } = enforceFidelity(input, SOURCE, { language: 'en' });
  assert.deepEqual(cv.keySkills, ['User testing', 'Figma']);
  assert.deepEqual(removed, []);
});

test('a rewrite cannot touch employers, dates or diplomas', () => {
  const rewritten = applyRewrite(base(), {
    title: 'Designer',
    summary: 'Nouveau résumé.',
    keySkills: ['Figma'],
    company: 'Inventée',
    education: [],
    experience: [{ index: 0, company: 'Inventée', period: '1990', bullets: ['Nouvelle mission'] }, { index: 9, bullets: ['Ignorée'] }],
  });
  assert.equal(rewritten.experience.length, 1);
  assert.equal(rewritten.experience[0].company, 'Atelier Numérique');
  assert.equal(rewritten.experience[0].period, '2021 - 2024');
  assert.deepEqual(rewritten.experience[0].bullets, ['Nouvelle mission']);
  assert.equal(rewritten.education.length, 1);
  assert.equal(rewritten.personalInfo.email, 'camille.martin@example.com');
});

test('a rewrite with empty fields keeps the base', () => {
  const rewritten = applyRewrite(base(), { keySkills: [], experience: [{ index: 0, bullets: [] }] });
  assert.deepEqual(rewritten.keySkills, ['Figma', 'Accessibilité']);
  assert.deepEqual(rewritten.experience[0].bullets, ['Maintenance du design system']);
});

test('a rewrite cannot duplicate the job header in a description', () => {
  const rewritten = applyRewrite(base(), { experience: [{ index: 0, description: 'Product Designer, Atelier Numérique', bullets: ['Mission'] }] });
  assert.equal(rewritten.experience[0].description, '');
});

test('a summary that recaps the whole CV is refused', () => {
  const long = Array.from({ length: 120 }, (_, i) => `mot${i}`).join(' ');
  assert.equal(applyRewrite(base(), { summary: long }).summary, base().summary);
  assert.equal(applyRewrite(base(), { summary: 'Court et utile.' }).summary, 'Court et utile.');
});

test('detects a rewrite that loses offer terms', () => {
  const keywords = ['design system', 'Figma'];
  assert.equal(losesOfferTerms(base(), applyRewrite(base(), { experience: [{ index: 0, bullets: ['Autre chose'] }] }), keywords), true);
  assert.equal(losesOfferTerms(base(), applyRewrite(base(), { experience: [{ index: 0, bullets: ['Évolution du design system'] }] }), keywords), false);
  assert.equal(losesOfferTerms(base(), base(), undefined), false);
});

test('measures keyword coverage, ignoring case and accents', () => {
  const coverage = keywordCoverage(SOURCE, ['FIGMA', 'accessibilite', 'B2B', 'design system', 'figma']);
  assert.equal(coverage.total, 4);
  assert.deepEqual(coverage.missing, ['B2B']);
});

test('finds numbers absent from both the CV and the offer', () => {
  assert.deepEqual(findUnattestedNumbers('Une équipe de 12, et 30 % de plus sur 200 clients.', SOURCE, 'Une équipe de 200 clients.'), ['30']);
});

test('numbers the experiences for the rebuild prompt', () => {
  const text = cvToText(base(), { numbered: true });
  assert.match(text, /\[0\] Product Designer, Atelier Numérique/);
  assert.doesNotMatch(cvToText(base()), /\[0\]/);
});
