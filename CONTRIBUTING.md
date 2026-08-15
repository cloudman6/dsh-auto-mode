# Contributing to DSH Auto Mode

[简体中文](CONTRIBUTING.zh-CN.md)

DSH Auto Mode is in Phase 0 critical-path execution under an accepted specification and ADR set. Check `PROJECT_STATUS.md` for the current evidence gates and next action. Product code, dependencies, build configuration, CI, or release automation may be added only when the corresponding roadmap gate and implementation decision are explicitly open.

## Language

- English is the canonical language for repository content at default paths.
- Simplified Chinese translations are maintained as a first-class reader experience under `docs/zh-CN/` and in `*.zh-CN.md` root files.
- Commit messages, branch names, issue and pull request titles, and normative pull request descriptions use English.
- A pull request may include an additional Chinese explanation, but the English text remains authoritative.
- Maintainers may discuss development in Chinese. Confirmed outcomes must be recorded in canonical English documentation.

If canonical English and a translation disagree, follow the English document and report or fix the translation mismatch.

## Commit messages

Use Conventional Commits with an English subject and body:

```text
<type>[optional scope]: <description>

<optional body explaining why the change is needed>
```

Common types are `docs`, `feat`, `fix`, `refactor`, `test`, and `chore`. Keep one logical concern per commit. Do not duplicate the subject or body in two languages.

Example:

```text
docs(routing): clarify episode-level route transitions

Allows down-routing only after the active route floor has been
released by evidence defined in the episode release policy.
```

## Documentation changes

1. Update the canonical English document at its default path.
2. Update the corresponding Simplified Chinese document when practical.
3. After reviewing the translation, set `translation-source-blob` to the Git blob ID of the exact canonical source and mark it `current`.
4. If the translation cannot be updated in the same change, keep the blob ID of the source it was last reviewed against and mark it `outdated`. For a new untranslated document, maintainers add a locale stub with `translation-source-blob: none` and `translation-status: outdated`.
5. Update navigation, project status, open questions, or ADRs when their authoritative facts change.

External contributors are not required to write Chinese. An English-only contribution can be accepted when the corresponding locale file is correctly marked outdated; maintainers own creation of a new locale stub and translation follow-up.

See [`docs/localization.md`](docs/localization.md) for the full source-of-truth and synchronization policy.

## Design review order

1. Review [`docs/spec.md`](docs/spec.md).
2. Review [`docs/architecture.md`](docs/architecture.md) and the relevant topic document.
3. Review the ADR index in [`docs/decisions/README.md`](docs/decisions/README.md).
4. Check [`docs/open-questions.md`](docs/open-questions.md) before turning an assumption into a decision.

Do not change an ADR from `Proposed` to `Accepted` without explicit maintainer approval.
