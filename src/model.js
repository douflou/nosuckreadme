/**
 * Modèle de données central de nosuckreadme.
 *
 * Tout transite par un seul objet `ProjectInfo`. Les détecteurs le remplissent
 * avec des FAITS RÉELS uniquement ; le rendu le consomme. Un champ inconnu vaut
 * `null` ou `[]` — jamais une valeur inventée.
 *
 * @typedef {Object} Entrypoint
 * @property {string} name    - commande / binaire exposé
 * @property {string} target  - module:fonction, script npm, ou chemin
 *
 * @typedef {Object} Badge
 * @property {string} label              - ex. "license"
 * @property {string} imgUrl             - URL de l'image (shields.io)
 * @property {string|null} linkUrl       - lien cliquable, ou null
 * @property {string} reason             - POURQUOI ce badge existe (fait justificatif)
 *
 * @typedef {Object} ProjectInfo
 * @property {string} name
 * @property {string|null} description
 * @property {("node"|"python"|"rust"|"go"|"generic")} ecosystem
 * @property {string|null} version
 * @property {string|null} license               - identifiant SPDX, ex. "MIT"
 * @property {Array<[string, number]>} languages - [["JavaScript", 1240], ...] (octets), trié desc
 * @property {string|null} installCmd
 * @property {Entrypoint[]} entrypoints
 * @property {string|null} usageExample
 * @property {string[]} examples                 - chemins/snippets détectés
 * @property {boolean} hasCI                      - .github/workflows/*.yml présent
 * @property {string|null} ciWorkflowFile         - nom du premier fichier workflow détecté
 * @property {boolean} hasTests
 * @property {boolean} hasContributing
 * @property {string|null} repoUrl                - git remote origin, normalisé https
 * @property {string|null} runtimeRequires        - engines.node / requires-python / ...
 * @property {string[]} todos                     - TODO/FIXME collectés → roadmap
 * @property {string[]} limitations               - limites inférées automatiquement
 * @property {Badge[]} badges
 */

/**
 * Crée un ProjectInfo aux valeurs par défaut sûres (rien d'inventé).
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
