/**
 * Interface d'un détecteur d'écosystème.
 *
 * @typedef {Object} Detector
 * @property {string} ecosystem
 * @property {(rootPath: string) => Promise<boolean>} matches  - le détecteur s'applique-t-il ?
 * @property {(info: import('../model.js').ProjectInfo, rootPath: string) => Promise<void>} enrich
 *           - complète `info` avec les faits propres à cet écosystème (mutation en place).
 */
export {};
