/**
 * Ecosystem detector interface.
 *
 * @typedef {Object} Detector
 * @property {string} ecosystem
 * @property {(rootPath: string) => Promise<boolean>} matches  - does this detector apply?
 * @property {(info: import('../model.js').ProjectInfo, rootPath: string) => Promise<void>} enrich
 *           - completes `info` with ecosystem-specific facts (in-place mutation).
 */
export {};
