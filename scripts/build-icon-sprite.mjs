/**
 * Generates public/icons.svg from Material Symbols Rounded.
 * Add a name to ICONS, then run: npm run brand:sprite
 */
import { writeFile } from 'node:fs/promises';

const ICONS = [
  'add', 'add_a_photo', 'arrow_back', 'arrow_forward', 'attach_file', 'check', 'check_circle', 'chevron_right',
  'close', 'code', 'content_copy', 'content_paste', 'delete', 'description', 'draft', 'edit_note', 'error', 'fact_check', 'groups', 'help',
  'keyboard_arrow_down', 'folder_open', 'history', 'info', 'mobile_arrow_down', 'key', 'label', 'language', 'lightbulb',
  'lock', 'open_in_new', 'palette', 'picture_as_pdf', 'progress_activity', 'restart_alt', 'search', 'tune',
  'upload_file', 'verified_user', 'visibility', 'visibility_off', 'work',
];

const BASE = 'https://cdn.jsdelivr.net/npm/@material-symbols/svg-500@0.48.2/rounded';
const SAFE_PATH = /^[-\d.,\sA-Za-z]+$/;

const symbols = await Promise.all(ICONS.map(async (name) => {
  const response = await fetch(`${BASE}/${name}.svg`);
  if (!response.ok) throw new Error(`Icône introuvable : ${name} (${response.status})`);
  const path = (await response.text()).match(/<path d="([^"]+)"/)?.[1];
  if (!path || !SAFE_PATH.test(path)) throw new Error(`Tracé invalide : ${name}`);
  return `  <symbol id="${name}" viewBox="0 -960 960 960"><path d="${path}"/></symbol>`;
}));

const sprite = `<svg xmlns="http://www.w3.org/2000/svg">\n${symbols.join('\n')}\n</svg>\n`;
await writeFile(new URL('../public/icons.svg', import.meta.url), sprite);
console.log(`${ICONS.length} icônes écrites dans public/icons.svg`);
