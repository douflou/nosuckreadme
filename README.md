# nosuckreadme

> Generate a GitHub README that doesn't suck - honest badges, real install/usage, known limitations.

[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
![version](https://img.shields.io/badge/version-0.1.0-informational)
![JavaScript](https://img.shields.io/badge/JavaScript-yellow)
![node](https://img.shields.io/badge/node-%3E%3D18-339933)

Most small GitHub projects ship a README that's either three lines long or stuffed
with decorative badges that mean nothing. `nosuckreadme` scans your repo and writes
a **real** one: the install command that actually matches your ecosystem, usage
pulled from your real entry points, a roadmap built from your own `TODO`s - and
**only the badges it can back with a fact**. No fake "build passing". No "downloads"
it can't verify. When it doesn't know something, it leaves a visible `<!-- TODO -->`
instead of making it up.

It runs offline, needs zero config, no API key, and the output is deterministic.

<!-- Replace this GIF: record `npx nosuckreadme . --dry-run` with vhs (see demo.tape). -->
![demo](assets/demo.gif)

## Table of contents

- [Why](#why)
- [Installation](#installation)
- [Usage](#usage)
- [Before / After](#before--after)
- [How It Decides (Nothing Invented)](#how-it-decides-nothing-invented)
- [Roadmap](#roadmap)
- [Known Limitations](#known-limitations)
- [Contributing](#contributing)
- [License](#license)

## Why

A good README is what turns an abandoned repo into something people try.
Writing it by hand is tedious, and existing generators often make things worse:
they throw in a row of "PRs welcome / made with love" badges and an empty
skeleton to fill in.

`nosuckreadme` starts from the opposite: **only write what you can prove from the repo.**
The rest stays a visible hole, not a lie.

## Installation

Without installing anything:

```sh
npx nosuckreadme
```

Or globally:

```sh
npm install -g nosuckreadme
```

## Usage

```sh
# Preview the current repo without writing anything
npx nosuckreadme . --dry-run

# Write the result (refuses to overwrite an existing README.md)
npx nosuckreadme . -o README.md

# Force overwrite
npx nosuckreadme . -o README.md --force
```

| Option | Effect |
|--------|--------|
| `[path]` | Repo to scan (default: `.`) |
| `-o, --output <file>` | Write to a file instead of stdout |
| `--stdout` | Force standard output |
| `--force` | Allow overwriting an existing `README.md` |
| `--dry-run` | Show a preview, write nothing |
| `--explain` | Show the justification for each badge and section |
| `--name <name>` | Force the project name |
| `--description <text>` | Force the description |

> **Safety:** without `--force`, `nosuckreadme` will never overwrite an existing
> `README.md` - it writes next to it as `README.generated.md` and exits with code `2`.

## Before / After

**Before** — a typical small-project README:

```markdown
# my-tool
my tool

![build](https://img.shields.io/badge/build-passing-brightgreen)  ← no CI in the repo
![PRs](https://img.shields.io/badge/PRs-welcome-blue)             ← decorative
```

**After** — what `nosuckreadme` generates instead:

```markdown
# my-tool

A real one-line description, pulled from your manifest.

![license](https://img.shields.io/badge/license-MIT-blue) ![JavaScript](…) ![node](https://img.shields.io/badge/node-%3E%3D18-339933)
↑ only badges backed by a fact: no CI in the repo → no build badge

## Installation

    npx my-tool

## Roadmap

<!-- TODO(nosuckreadme): add the next steps -->
↑ an honest hole to fill in, never an invented one
```

Every badge maps to something real in the repo (a `LICENSE` file, a measured
language, a declared runtime). What it can't prove, it leaves as a visible stub.

## How It Decides (Nothing Invented)

`--explain` shows, for each badge and section, the fact that justifies it:

```sh
$ npx nosuckreadme . --explain --dry-run

Badges generated:
  license              LICENSE file present and identified as MIT
  version              Version 0.1.0 declared in the manifest
  JavaScript           JavaScript is the main detected language (51185 bytes)
  node >=18            Runtime requirement >=18 declared in the manifest
```

No `LICENSE` file? No license badge. No `.github/workflows/`? No CI badge. That's
the whole philosophy.

**Recognized ecosystems:** Node (`package.json`), Python (`pyproject.toml`),
Rust (`Cargo.toml`), Go (`go.mod`), plus a generic fallback mode.

## Roadmap

- [ ] `nosuckreadme lint`: audit an existing README and list its "suck factors"
- [ ] Optional `--enhance` mode (LLM) to rewrite description/usage, off by default
- [ ] Additional detectors: Ruby, PHP, Java, Deno
- [ ] Opt-in online verification of npm/PyPI status for exact version badges

## Known Limitations

- TODO/FIXME extraction reads text, not the AST: a `// TODO:` inside a string may
  appear in the roadmap.
- License detection covers common SPDX licenses (MIT, Apache-2.0, GPL, BSD, ISC,
  MPL, AGPL...); an exotic license falls back to a stub.
- The CI badge assumes a workflow named `ci.yml` and a **GitHub** repo.
- Description and examples often still need manual polishing - the tool lays honest
  foundations, not final prose.

## Contributing

PRs are welcome. Run the test suite before submitting a change:

```sh
npm test
```

## License

Distributed under the [MIT](LICENSE) license.

---

<sub>Bootstrapped with itself: the first version of this README was generated by
`nosuckreadme`, then hand-polished - exactly the intended workflow.</sub>
