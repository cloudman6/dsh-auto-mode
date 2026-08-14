# ADR-005: Use English as the canonical documentation language

[简体中文](../zh-CN/decisions/0005-english-canonical-documentation.md)

## Status

Accepted

## Date

2026-08-14

## Context

DSH Auto Mode is developed through Chinese discussion, but it is intended to be a public open-source plugin for a global developer audience. The repository needs complete Chinese documentation without making international contributors depend on Chinese or creating two conflicting normative document sets.

Git history, default repository entry points, public APIs, and contribution workflows also need one shared language. Writing every commit and document section in both languages would make review noisy and would still not define which wording controls when translations diverge.

## Decision

English documents at default repository paths are canonical. Simplified Chinese is maintained as a first-class translation in `docs/zh-CN/` and root `*.zh-CN.md` files.

Development discussion and drafting may use Chinese. Confirmed outcomes must be captured in canonical English. Public Git metadata, code identifiers, code comments, schemas, and configuration keys use English. Commit messages follow Conventional Commits and are not duplicated in Chinese.

Chinese translations record the repository-relative source path, the source Git blob ID, and a translation status. When English and Chinese conflict, English controls and the translation is corrected.

## Alternatives considered

### Make Chinese canonical and translate to English

Rejected. It optimizes for current maintainer workflow but imposes a language barrier on the intended global contributor base and makes default GitHub entry points non-normative translations.

### Treat English and Chinese as equally canonical

Rejected. Two normative sources can disagree without a deterministic resolution rule, forcing every semantic change to become a cross-language consensus problem.

### Put both languages in every file and commit message

Rejected. It doubles document and history noise, degrades review and navigation, and does not eliminate semantic drift.

### Publish English only

Rejected. Chinese is the maintainer's primary development language and a valuable reader experience. Removing it would discard useful accessibility without solving a technical constraint.

## Consequences

- Existing Chinese documents move to locale-specific paths and receive English canonical counterparts.
- Maintainers normally update both languages in one change; external contributors may submit English-only changes if the translation is marked outdated.
- Translation freshness can be verified from source blob metadata without tying content to a future commit hash.
- Repository rules and contributor guidance must define English Git metadata and the translation workflow.
- Translation quality remains a review responsibility; AI translation reduces effort but is not evidence of semantic equivalence.

## References

- [GitHub Docs contribution and translation model](https://docs.github.com/en/contributing/collaborating-on-github-docs/about-contributing-to-github-docs)
- [Kubernetes documentation localization](https://kubernetes.io/docs/contribute/localization/)
- [Vue documentation translations](https://vuejs.org/translations/)
- [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/)
