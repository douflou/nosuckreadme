/**
 * Assemble the final README from the sections.
 * Deterministic output: same input -> same output (no timestamps, no randomness).
 */
import { buildSections } from './sections.js';

/**
 * @param {import('./model.js').ProjectInfo} info
 * @returns {string} Markdown README content, ending with \n
 */
export function render(info) {
  const sections = buildSections(info);
  return sections
    .map((s) => s.markdown.trim())
    .join('\n\n')
    .replace(/\n{3,}/g, '\n\n')  // no triple line breaks
    .trim() + '\n';
}
