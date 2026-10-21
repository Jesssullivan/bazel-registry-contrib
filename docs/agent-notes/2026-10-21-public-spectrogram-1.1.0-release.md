# Public xoxd_spectrogram 1.1.0 release asset

Authority: operator ruling, Linear initiative I-80 comment 9cdb9602: the
roachbait.band RB-065 WebGL2 visualizer lands upstream in xoxd-spectrogram
(xoxd-ai/xoxd-spectrogram#5), then ships as a 1.1.0 release of this registry.
TIN-6740. R-HOOK-CONVERGENCE-20261004, R-N13.

## Shape

Same as 1.0.1 (#207, see `2026-10-19-public-spectrogram-release.md`): one PR,
two commits, merged with a regular merge so `registry_commit` stays an ancestor
of main.

1. `modules/xoxd_spectrogram/1.1.0/{MODULE.bazel,source.json,presubmit.yml}`
   and `1.1.0` in `metadata.json`. source.json names the not-yet-published asset
   `xoxd-spectrogram-public-v1.1.0/xoxd_spectrogram-1.1.0.tar.gz`. MODULE.bazel
   is byte-identical to the archive's. 1.0.0 and 1.0.1 are unchanged.
2. `releases/xoxd-spectrogram-public-v1.1.0/{plan.json,NOTES.md}` with
   `registry_commit` set to commit 1, the workflow dispatch option and this
   note. The workflow, exporter selection and verifier are otherwise unchanged:
   the #207 two-job workflow and verifier are plan-generic.

## Pins and bytes

- spectrogram source: `6bd187efd756b104c1bcf1041ee99b49366bcd4c`, the reviewed
  head of xoxd-spectrogram#5. #5 merged by regular merge as `6fbabec` (first
  parent `f27cf8e`, the #3 merge; main had not moved), so 6bd187e is an
  ancestor of main and its tree equals 6fbabec's (`b26ee6ec`). The pin follows
  #207, which pinned the PR head (8674ecd) rather than the merge commit. Both
  candidates export byte-identical archives, because the exporter reads only
  the committed tree.
- scaffold: `3e46b9e` as before (publication takes `gh` from its template
  nixpkgs input).
- asset: `xoxd_spectrogram-1.1.0.tar.gz`, 100 files, sha256
  `850013b723e5334c5bf6b7a16e52c56e733d70a72b69f7a64f6566c1021a9320`, integrity
  `sha256-hQATtyPlM0xb9rehblLFbnM9cKcrafemT2VmwQIakyA=`.
- 1.1.0 changes from 1.0.1: a new `@xoxd/spectrogram/render` subpath (WebGL2
  ring renderer, Canvas2D fallback, probe, budget) and a minified bundled
  worker. MODULE.bazel differs only in the version; package dependencies,
  pnpm-lock.yaml, LICENSE and NOTICE are unchanged.

## Local proof (sting, diagnostic, not landing proof)

- Two exports at 6bd187e and a re-export from a depth-1 clone through the
  workflow's own build step are byte-identical (archive, SHA256SUMS,
  manifest.json). An export at 6fbabec gives the same archive.
- `verify-public-frontend.py` accepts the plan; its 12 negative fixtures, the 6
  publication-admission fixtures, `validate-registry` (250 entries), the
  source-host and owner-rename fixtures and the immutability gate pass. The
  published 1.0.1 assets, downloaded anonymously, still verify on this branch.
- From the archive as an external module (`archive_override` with the plan
  integrity, this branch's registry and BCR, no credential helper, no GitHub
  token, Bazel 9.2.0): `@xoxd_spectrogram//:pkg` builds and `:test`,
  `:typecheck`, `:svelte_check_test` and `:svelte_check_canary_test` pass.

## Remaining gates

1. Merge this PR with "Create a merge commit" so registry_commit `eca6731`
   stays on main. If it lands squashed or rebased, do not touch
   `modules/xoxd_spectrogram/1.1.0`; re-pin `registry_commit` in plan.json in a
   follow-up PR and re-verify the unchanged sha256.
2. The operator dispatches `Public frontend release` on main with
   `release_tag=xoxd-spectrogram-public-v1.1.0` and `publish=true` (AGENTS.md:
   release publication needs an explicit operator go). The workflow refuses an
   existing tag, so do not create the tag or release by hand.
3. Check anonymously that the asset URL returns 200 and hashes to the
   integrity. Consumers (roachbait.band) then re-pin this registry to a main
   commit containing 1.1.0 and bump `bazel_dep` to 1.1.0.
