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

- spectrogram source: f755248e67285922ecb2c9cd01cdc8a0cbe3d9a2 (xoxd-spectrogram
  branch `feat/spectrogram-1.0.1-public-asset-20261019`). A regular merge keeps it
  an ancestor of main; if the branch changes before merge, re-export and refresh
  the plan and source.json.
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

## Remaining gates

1. xoxd-spectrogram PR merges (regular merge).
2. This PR merges.
3. The operator dispatches `Public frontend release` on main with
   `release_tag=xoxd-spectrogram-public-v1.0.1` and `publish=true` (AGENTS.md:
   release publication needs an explicit operator go). The workflow refuses an
   existing tag, so do not create the release by hand.
4. Check anonymously that the asset URL returns 200 and hashes to the integrity.
