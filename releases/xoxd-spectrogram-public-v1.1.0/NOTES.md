Public xoxd_spectrogram 1.1.0: Svelte 5 spectrogram and ML-demo components with a
TypeScript DSP core, themed with xoxd_theme 0.1.1, under the MIT License (fft.js
4.0.4 bundled, MIT). The source repository remains private.

New in 1.1.0 (minor, non-breaking): a Svelte-free visualizer subpath,
@xoxd/spectrogram/render, with a raw WebGL2 mirrored band ring driven by PCEN bands
and spectral flux, a Canvas2D fallback, a WebGL2 probe, context-loss recovery, a
reduced-motion static frame and a frame-time budget that steps the backing store
down. The root, /core and /worker entries export what 1.0.1 did; the bundled worker
is now minified with unchanged behaviour. See CHANGELOG.md in the archive.

The archive is a deterministic, narrowed export of the committed module tree. It
leaves out the root-only .bazelrc and MODULE.bazel.lock and the GitHub credential
helper, and contains no agent directives, private CI, credentials or telemetry.
Modules 1.0.0 and 1.0.1 remain unchanged.

Use it through this registry with bazel_dep(name = "xoxd_spectrogram", version =
"1.1.0") and npm_link_package; no npm registry, GitHub token or credential helper
is required. Its in-house dependencies (xoxd_theme 0.1.1, tinyland-composables
1.0.0, tinyland-color-utils 1.0.0) are public sources too. SHA256SUMS and
manifest.json record the exact archive bytes.

Validated: two deterministic exports and a shallow re-export at the pinned
revision are byte-identical; verify-public-frontend and its negative admission
fixtures pass; @xoxd_spectrogram//:pkg builds and :test and :typecheck
pass from the archive as an external module with no credential helper.
