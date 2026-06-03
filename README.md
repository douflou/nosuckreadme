# nosuckreadme

> Generate a GitHub README that doesn't suck — honest badges, real install/usage, known limitations.

[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
![version](https://img.shields.io/badge/version-0.1.0-informational)
![JavaScript](https://img.shields.io/badge/JavaScript-yellow)
![node](https://img.shields.io/badge/node-%3E%3D18-339933)

Most small GitHub projects ship a README that's either three lines long or stuffed
with decorative badges that mean nothing. `nosuckreadme` scans your repo and writes
a **real** one: the install command that actually matches your ecosystem, usage
pulled from your real entry points, a roadmap built from your own `TODO`s — and
**only the badges it can back with a fact**. No fake "build passing". No "downloads"
it can't verify. When it doesn't know something, it leaves a visible `<!-- TODO -->`
instead of making it up.

It runs offline, needs zero config, no API key, and the output is deterministic.

<!-- Remplace ce GIF : enregistre `npx nosuckreadme . --dry-run` avec vhs (voir demo.tape). -->
![demo](assets/demo.gif)

## Table des matières

- [Pourquoi](#pourquoi)
- [Installation](#installation)
- [Usage](#usage)
- [Avant / après](#avant--apres)
- [Comment il décide (rien d'inventé)](#comment-il-decide-rien-dinvente)
- [Roadmap](#roadmap)
- [Limites connues](#limites-connues)
- [Contributing](#contributing)
- [Licence](#licence)

## Pourquoi

Un bon README, c'est ce qui transforme un repo abandonné en projet qu'on essaie.
Mais l'écrire à la main est fastidieux, et les générateurs existants font souvent
pire que mieux : ils balancent une rangée de badges « PRs welcome / made with love »
et un squelette vide à remplir.

`nosuckreadme` part de l'inverse : **n'écris que ce que tu peux prouver à partir du repo.**
Le reste reste un trou visible, pas un mensonge.

## Installation

Sans rien installer :

```sh
npx nosuckreadme
```

Ou globalement :

```sh
npm install -g nosuckreadme
```

## Usage

```sh
# Aperçu coloré sur le repo courant, sans rien écrire
npx nosuckreadme . --dry-run

# Écrire le résultat (refuse d'écraser un README.md existant)
npx nosuckreadme . -o README.md

# Forcer l'écrasement
npx nosuckreadme . -o README.md --force
```

| Option | Effet |
|--------|-------|
| `[path]` | Dépôt à scanner (défaut : `.`) |
| `-o, --output <file>` | Écrit dans un fichier au lieu de stdout |
| `--stdout` | Force la sortie standard |
| `--force` | Autorise l'écrasement d'un `README.md` existant |
| `--dry-run` | Affiche un aperçu, n'écrit rien |
| `--explain` | Détaille la justification de chaque badge et section |
| `--name <name>` | Force le nom du projet |
| `--description <text>` | Force la description |

> **Sécurité :** sans `--force`, `nosuckreadme` n'écrasera jamais un `README.md`
> existant — il écrit à côté dans `README.generated.md` et sort avec le code `2`.

## Avant / après

Un README typique de petit projet :

```markdown
# my-tool
my tool

![build](https://img.shields.io/badge/build-passing-brightgreen)  ← aucun CI dans le repo
![PRs](https://img.shields.io/badge/PRs-welcome-blue)             ← décoratif
```

Ce que `nosuckreadme` produit à la place : un titre + description, **uniquement les
badges réels** (licence détectée dans `LICENSE`, langage mesuré, runtime déclaré),
une installation et un usage tirés du manifeste, une roadmap depuis tes `TODO:`, et
une section « Limites connues » honnête.

## Comment il décide (rien d'inventé)

`--explain` montre, pour chaque badge et section, le fait qui le justifie :

```sh
$ npx nosuckreadme . --explain --dry-run

Badges générés :
  license              Fichier LICENSE présent et identifié comme MIT
  version              Version 0.1.0 déclarée dans le manifeste
  JavaScript           JavaScript est le langage principal détecté (51185 octets)
  node >=18            Requirement runtime >=18 déclaré dans le manifeste
```

Pas de fichier `LICENSE` ? Pas de badge licence. Pas de `.github/workflows/` ? Pas de
badge CI. C'est toute la philosophie.

**Écosystèmes reconnus :** Node (`package.json`), Python (`pyproject.toml`),
Rust (`Cargo.toml`), Go (`go.mod`), plus un mode générique en repli.

## Roadmap

- [ ] `nosuckreadme lint` : auditer un README existant et lister ses « suck factors »
- [ ] Mode `--enhance` optionnel (LLM) pour reformuler description/usage, off par défaut
- [ ] Détecteurs supplémentaires : Ruby, PHP, Java, Deno
- [ ] Vérification en ligne (opt-in) du statut npm/PyPI pour des badges version exacts

## Limites connues

- L'extraction des `TODO`/`FIXME` lit le texte, pas l'AST : un `// TODO:` à l'intérieur
  d'une chaîne de caractères peut apparaître dans la roadmap.
- La détection de licence couvre les licences SPDX courantes (MIT, Apache-2.0, GPL,
  BSD, ISC, MPL, AGPL…) ; une licence exotique ressort en stub.
- Le badge CI suppose un workflow nommé `ci.yml` et un dépôt **GitHub**.
- La description et les exemples restent souvent à enrichir à la main — l'outil pose
  les fondations honnêtes, pas la prose finale.

## Contributing

Les PR sont bienvenues. Lance la suite de tests avant de proposer un changement :

```sh
npm test
```

## Licence

Distribué sous licence [MIT](LICENSE).

---

<sub>🥾 Bootstrapé avec lui-même : la première version de ce README a été générée par
`nosuckreadme`, puis peaufinée à la main — exactement le workflow prévu.</sub>
