# Public xoxd_spectrogram release asset

Authority: operator ruling (4), 2026-10-19, recorded on Linear initiative I-80
(comment 1b5d0304): xoxd_spectrogram becomes a public release asset of this
registry on the xoxd_theme 0.1.1 pattern, and its source repository stays
private. R-HOOK-CONVERGENCE-20261004, R-N13.

## Shape

Follows PR #126 (theme 0.1.1): one PR, two commits.

1. `modules/xoxd_spectrogram/1.0.1/{MODULE.bazel,source.json,presubmit.yml}`
   and `metadata.json`. source.json names the not-yet-published asset
   `xoxd-spectrogram-public-v1.0.1/xoxd_spectrogram-1.0.1.tar.gz` with the
   integrity of the deterministic export. MODULE.bazel is byte-identical to the
   archive's. 1.0.0 (private tarball) is unchanged; a new version was needed
   because shipped versions are immutable and the narrowed bytes differ.
2. `releases/xoxd-spectrogram-public-v1.0.1/{plan.json,NOTES.md}` with
   `registry_commit` set to commit 1, the workflow dispatch option, and the
   verifier's spectrogram-specific checks.

The exporter is `scripts/export-public.py` in xoxd-ai/xoxd-spectrogram, not in
site.scaffold: it reads the committed tree at the pinned revision (`git
ls-tree`/`cat-file`), so the working tree cannot leak into the archive, and it
applies the same normalization and audit as site.scaffold's
`export-public-frontend.py`. Plans select it with `"exporter": "spectrogram"`;
plans without the field keep the scaffold exporter, and the theme checkout runs
only when the plan pins a theme. The scaffold is still pinned (3e46b9e, the
site-scaffold-public-v0.1.1 source) because publication takes `gh` from its
public/template nixpkgs input. The source App token gains read-only access to
xoxd-spectrogram (tinyland-registry-reader is installed on all org repos).

## Pins and bytes

- spectrogram source: 8674ecd842221c81e15c998bea4b0d787b099f34 (xoxd-spectrogram
  branch `feat/spectrogram-1.0.1-public-asset-20261019`; it follows f755248 with an
  exporter-only hardening commit). The exporter is excluded from its own
  archive, so the bytes did not change. A regular merge keeps the pin an
  ancestor of main; if the branch changes before merge, re-export and refresh
  the plan (and source.json if the bytes move).
- asset: xoxd_spectrogram-1.0.1.tar.gz, 87 files, sha256
  ce9bd5ab604c973c7976a6a9f3977093479c51f09f9383eb7d30f2d290331de9, integrity
  sha256-zpvVq2BMlzx5dqap85dwk0ecUfCfk4PrfTDy0pAzHek=.

## Local proof (sting, diagnostic)

Two exports and a shallow-clone re-export through the workflow's own build step
are byte-identical. verify-public-frontend, its eight negative fixtures, the
four publication-admission fixtures, validate-registry (249 entries), source-host
and owner-rename fixtures, and the immutability gate pass. From the archive as an
external module (archive_override with the plan integrity, this registry and BCR,
no credential helper, no GH token), `@xoxd_spectrogram//:pkg` builds and `:test`,
`:svelte_check_test` and `:svelte_check_canary_test` pass on Bazel 9.2.0.

## Review fixes (2026-10-19)

- The workflow is two jobs. `export` (contents: read, source-only read token)
  checks out the pinned sources and runs their exporters with `python3 -I`, then
  uploads `public-assets` as an artifact. `release` (contents: write) starts from
  a fresh registry checkout no exporter touched, downloads the artifact, and
  verifies and publishes it. Exporter code can no longer rewrite the verifier,
  plan.json or NOTES.md that admit its output.
- The plan is validated before use: source keys must be in
  {scaffold, theme, xoxd, spectrogram}, scaffold must be pinned, every revision
  must be a 40-hex SHA, the exporter must be known and template_only must be a
  boolean. Values reach shell through `env:`, not `${{ }}` interpolation.
- Provenance: with `publish=true`, the run refuses unless each checked-out
  source pin is an ancestor of its repo's main and `registry_commit` is an
  ancestor of the dispatched main SHA. A dry run only warns, because the
  published 0.1.1 plans pin scaffold c62108b and theme 6c2e81a, which squash
  merges left off main. `xoxd` is a recorded pin; nothing checks it out.
- verify-public-frontend.py cross-checks every registered module's
  `modules/<module>/<version>/source.json` (url, integrity, strip_prefix) and
  MODULE.bazel against the plan and archive. It accepts all three committed
  plans, including the published 0.1.1 assets. Three new negative fixtures
  cover integrity, url and MODULE.bazel drift.
- The spectrogram exporter refuses a `--ref` other than HEAD or a 40-hex SHA
  and no longer uses `assert` for its guards.

## Follow-ups (not merge blockers)

- xoxd-spectrogram has no remote CI, Justfile or AGENTS.md (this predates the
  PR). The authority for its bytes is this workflow's re-export and verify; a
  `publish=false` dispatch after merge is the runner-side receipt. Bring the repo
  onto the Justfile contract (`just test`, `just export-public`) separately.
- The archive keeps internal references (TIN-5108 and TIN-5116, xoruby-2026
  paths, scripts/ruby-fixtures.rb). They are not secrets and match the theme
  0.1.1 audit level. Dropping them is an operator choice and would change the
  bytes, so it would need a new version.

## Remaining gates

1. xoxd-spectrogram PR #3 merges with a regular merge (not squash or rebase),
   so 8674ecd stays on main.
2. This PR merges with a regular merge, so registry_commit 1faea3a stays on main.
3. The operator dispatches `Public frontend release` on main with
   `release_tag=xoxd-spectrogram-public-v1.0.1` and `publish=true` (AGENTS.md:
   release publication needs an explicit operator go). The workflow refuses an
   existing tag, so do not create the release by hand.
4. Check anonymously that the asset URL returns 200 and hashes to the integrity.
