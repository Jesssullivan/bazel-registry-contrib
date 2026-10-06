# Standalone public template release

Authority: user-approved DSA convergence, R-HOOK-CONVERGENCE-20261004,
TIN-3692 comment 98cf680c-7299-4949-bfb2-60079053ad43, R-N12/R-N13.

The existing frontend release lane gains a standalone immutable template
revision rather than replacing previously published assets. The committed
site-scaffold-public-v0.1.1 plan contains exactly one archive and explicitly
supersedes only template 0.1.0. Chrome 0.1.0, theme 0.1.1 and registry metadata
6d008c192d1ef25f37e747fa1659109bcadb6666 remain unchanged.

Source pin 3e46b9ede560cddbbfa91eb0157f09b89319c648 is signed and retained as
an ancestor by source PR199's regular merge. Its exact re-export matches the
35-file candidate SHA256
9d834297fbd8103f30758ac58364c59ba628c8b09d6114b093cc68d5a5acf9a4.
The existing theme source pin remains 6c2e81a57dc0a71d5fff209b728309492222e50a.

Preparation and publication require the canonical registry main branch.
Only the existing source read token, scoped to site.scaffold/xoxd-theme, is
used for extraction. The template-only flag emits no duplicate chrome/theme
assets. Publication re-verifies the exact committed archive set and refuses
an existing release tag. The old release remains reproducible from its
original source pins. No fork PR secret projection or additional source/
runtime credential scope is introduced.

Validation: 191 static registry entries; all eight source-host fixtures;
owner-rename shape/rewrite fixtures; exact old three-asset and new one-asset
archive/manifest/SHA256SUMS verification. Both plans pass eight isolated
negative admission cases: altered bytes, extra archive, manifest mismatch,
agent directive file, path traversal, absolute path, symlink and duplicate
member path. Unsafe-member fixtures update their own checksums/manifest so
rejection exercises archive admission rather than only checksum failure.
YAML parses and canonical-main, narrow read-token, immutable-publish and
finite admission-fixture guards pass. No hosted source gate is claimed.

The exact public template archive's own Nix/Just setup/check/build and live/
static-preview browser proofs were completed in the source contribution.
LICENSE, NOTICE, fonts OFL and gitleaks checks pass; no agent/private-doc/CI/
credential content is exported. Source repositories stay private. Root owns
registry PR review, merge and release publication after this signed handoff.
