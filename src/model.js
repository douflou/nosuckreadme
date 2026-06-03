/**
 * Central data model for nosuckreadme.
 *
 * Everything flows through a single `ProjectInfo` object. Detectors fill it
 * with real facts only, and the renderer consumes it. An unknown field is
 * `null` or `[]`, never an invented value.
 *
 * @typedef {Object} Entrypoint
 * @property {string} name    - exposed command / binary
 * @property {string} target  - module:function, npm script, or path
 *
 * @typedef {Object} Badge
 * @property {string} label              - ex. "license"
 * @property {string} imgUrl             - image URL (shields.io)
 * @property {string|null} linkUrl       - clickable link, or null
 * @property {string} reason             - why this badge exists (supporting fact)
 *
 * @typedef {Object} ProjectInfo
 * @property {string} name
 * @property {string|null} description
 * @property {("node"|"python"|"rust"|"go"|"generic")} ecosystem
 * @property {string|null} version
 * @property {string|null} license               - SPDX identifier, e.g. "MIT"
 * @property {Array<[string, number]>} languages - [["JavaScript", 1240], ...] (bytes), sorted desc
 * @property {string|null} installCmd
 * @property {Entrypoint[]} entrypoints
 * @property {string|null} usageExample
 * @property {string[]} examples                 - detected paths/snippets
 * @property {boolean} hasCI                      - .github/workflows/*.yml present
 * @property {string|null} ciWorkflowFile         - name of the first detected workflow file
 * @property {boolean} hasTests
 * @property {boolean} hasContributing
 * @property {string|null} repoUrl                - git remote origin, normalized to https
 * @property {string|null} runtimeRequires        - engines.node / requires-python / ...
 * @property {string[]} todos                     - collected TODO/FIXME items -> roadmap
 * @property {string[]} limitations               - automatically inferred limitations
 * @property {Badge[]} badges
 */

/**
 * Creates a ProjectInfo with safe defaults (nothing invented).
 * @param {Partial<ProjectInfo>} [overrides]
 * @returns {ProjectInfo}
 */
export function createProjectInfo(overrides = {}) {
  return {
    name: '',
    description: null,
    ecosystem: 'generic',
    version: null,
    license: null,
    languages: [],
    installCmd: null,
    entrypoints: [],
    usageExample: null,
    examples: [],
    hasCI: false,
    ciWorkflowFile: null,
    hasTests: false,
    hasContributing: false,
    repoUrl: null,
    runtimeRequires: null,
    todos: [],
    limitations: [],
    badges: [],
    ...overrides,
  };
}
