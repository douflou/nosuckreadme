/**
 * Assemble le README final à partir des sections.
 * Rendu DÉTERMINISTE : même entrée → même sortie (pas d'horodatage, pas d'aléa).
 */
import { buildSections } from './sections.js';

/**
 * @param {import('./model.js').ProjectInfo} info
 * @returns {string} contenu Markdown du README, terminé par \n
 */
export function render(info) {
  const sections = buildSections(info);
  return sections
    .map((s) => s.markdown.trim())
    .join('\n\n')
    .replace(/\n{3,}/g, '\n\n')  // pas de triple saut de ligne
    .trim() + '\n';
}
