/**
 * Ordered registry of ecosystem detectors.
 * The first detector whose `matches()` returns true wins; otherwise `generic`.
 */
import nodeDetector from './node.js';
import pythonDetector from './python.js';
import rustDetector from './rust.js';
import goDetector from './go.js';
import genericDetector from './generic.js';

/** Order means priority. `generic` is the final fallback. */
export const detectors = [nodeDetector, pythonDetector, rustDetector, goDetector];

/**
 * Selects the appropriate detector.
 * @param {string} rootPath
 * @returns {Promise<import('./base.js').Detector>}
 */
export async function selectDetector(rootPath) {
  for (const d of detectors) {
    if (await d.matches(rootPath)) return d;
  }
  return genericDetector;
}
