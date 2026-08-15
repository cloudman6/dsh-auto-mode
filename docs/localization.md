# Documentation localization policy

[简体中文](zh-CN/localization.md)

## Status

Accepted by [ADR-005](decisions/0005-english-canonical-documentation.md).

## Source of truth

English documents at the repository's default paths are canonical. Simplified Chinese is a maintained, first-class translation:

| Canonical English | Simplified Chinese |
|---|---|
| `README.md` | `README.zh-CN.md` |
| `CONTRIBUTING.md` | `CONTRIBUTING.zh-CN.md` |
| `PROJECT_STATUS.md` | `PROJECT_STATUS.zh-CN.md` |
| `AGENTS.md` | `AGENTS.zh-CN.md` |
| `docs/<path>.md` | `docs/zh-CN/<path>.md` |

Default paths stay English so repository entry points, external links, code review, and tool integrations resolve to the normative text without a locale-specific path.

English being canonical does not constrain authoring or discussion. Maintainers may reason, draft, and collaborate in Chinese. Before a decision is complete, its normative result must be represented in the canonical English document.

## Translation metadata

Every maintained Chinese translation begins with this metadata:

```markdown
<!--
translation-source: docs/example.md
translation-source-blob: <Git blob ID last reviewed against, or none>
translation-status: <current or outdated>
-->
```

The source path is repository-relative. Obtain the blob ID from the final source content:

```bash
git hash-object docs/example.md
```

The metadata tracks source content rather than a commit, so source and translation can be updated atomically in one commit without a circular commit-hash dependency. The blob ID means “the exact canonical source this translation was last reviewed against,” not merely the latest source observed by automation.

Allowed status values are:

- `current`: the translation has been reviewed against the exact source blob, and the recorded blob equals the current canonical source.
- `outdated`: the canonical source changed and the translation has not caught up. Preserve the last reviewed blob ID; use `none` only when no reviewed translation exists.

Missing metadata means the translation is unverified, not current.

## Synchronization rules

- Maintainer-authored changes update English and Chinese in the same change by default.
- An English-only external contribution may be accepted; the corresponding locale file must be marked `outdated`. Maintainers add a locale stub for a new untranslated document.
- Core user-facing documentation—README, installation, configuration, security, public API, migration, and release notes—must be current before a release.
- A translation never changes product semantics independently. Semantic corrections start in English and then propagate to Chinese.
- When the languages disagree, English controls. The mismatch is a documentation defect.
- Internal links in a translation should remain within the same locale when a translated target exists.

## Repository language

- Public Git metadata uses English: commit messages, branch names, issue and pull request titles, and normative pull request descriptions.
- Code identifiers, schemas, configuration keys, API names, and code comments use English.
- Chinese development discussion is allowed. A public discussion may include Chinese context, but decisions must be available in English.
- Commit messages are not bilingual. Localization belongs in documents, not duplicated Git history.

## Validation

Until automated documentation tooling is introduced, each documentation task must verify:

1. Every canonical Markdown document has a corresponding Chinese locale file that points to an existing canonical source.
2. Every `current` translation records the actual `git hash-object` value of that source; every `outdated` file records its last reviewed source blob or `none`.
3. Canonical and translated local links resolve.
4. New canonical documents are translated or have a locale stub explicitly marked `outdated`.
5. Markdown files end with exactly one newline and contain no conflict markers.
