Public xoxd_spectrogram 1.0.1: Svelte 5 spectrogram and ML-demo components with a
TypeScript DSP core, themed with xoxd_theme 0.1.1, under the MIT License (fft.js
4.0.4 bundled, MIT). The source repository remains private.

The archive is a deterministic, narrowed export of the committed module tree. It
leaves out the root-only .bazelrc and MODULE.bazel.lock and the GitHub credential
helper, and contains no agent directives, private CI, credentials or telemetry.
Module 1.0.0 remains unchanged.

Use it through this registry with bazel_dep(name = "xoxd_spectrogram", version =
"1.0.1") and npm_link_package; no npm registry, GitHub token or credential helper
is required. Its in-house dependencies (xoxd_theme 0.1.1, tinyland-composables
1.0.0, tinyland-color-utils 1.0.0) are public sources too. SHA256SUMS and
manifest.json record the exact archive bytes.

Validated: two deterministic exports and a shallow re-export at the pinned
revision are byte-identical; verify-public-frontend and its negative admission
fixtures pass; @xoxd_spectrogram//:pkg builds and :test and :typecheck
pass from the archive as an external module with no credential helper.
