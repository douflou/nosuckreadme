/**
 * Registre ordonné des détecteurs par écosystème.
 * Le premier dont `matches()` est vrai gagne ; sinon `generic`.
 */
import nodeDetector from './node.js';
import pythonDetector from './python.js';
import rustDetector from './rust.js';
import goDetector from './go.js';
import genericDetector from './generic.js';

/** Ordre = priorité. `generic` est le fallback final. */
export const detectors = [nodeDetector, pythonDetector, rustDetector, goDetector];

/**
 * Sélectionne le détecteur approprié.
 * @param {string} rootPath
 * @returns {Promise<import('./base.js').Detector>}
 */
export async function selectDetector(rootPath) {
  for (const d of detectors) {
    if (await d.matches(rootPath)) return d;
  }
  return genericDetector;
}
