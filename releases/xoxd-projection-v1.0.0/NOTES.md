xoxd_projection 1.0.0 is the consumer side of the xoxd-projection/v2 contract. It verifies a signed manifest against a pinned ed25519 key, recomputes each approval hash, checks every blob and fails the build on any mismatch. The archive is MIT licensed and built from site.scaffold commit 635fefe326be412e18fd6617485581d7abfe6700. The source repository remains private.

The archive contains no agent directives, private CI, private documentation, credentials or telemetry.

Use it through this registry: `bazel_dep(name = "xoxd_projection", version = "1.0.0")`. It supplies `@xoxd_projection//:pkg`, linked as `@xoxd/projection`, and the fetch tool `@xoxd_projection//:fetch`. No npm registry or authentication is needed. SHA256SUMS and manifest.json record the exact archive bytes: sha256 ed65ac36d5b4393b44edcf2dac193539558b26fd6b11e63dc2d0a6b43094f053, 93 files.

Validated: deterministic normalized archive. The registry verifier and its admission fixtures pass. Verify the published asset downloads anonymously after publication.
