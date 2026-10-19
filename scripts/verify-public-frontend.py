#!/usr/bin/env python3
"""Verify narrowed public assets against the committed release plan."""
import argparse
import base64
import hashlib
import json
from pathlib import Path
import re
import tarfile

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--artifacts", type=Path, required=True)
parser.add_argument("--plan", type=Path, required=True)
parser.add_argument("--registry", type=Path, default=Path(__file__).resolve().parent.parent, help="Registry root whose modules/ entries must match the plan (default: this checkout)")
args = parser.parse_args()
plan = json.loads(args.plan.read_text())
refused = {".git", ".github", ".agents", ".claude", ".gemini", ".codex", "node_modules", "docs", "config", "plugins", "tofu"}
names = {"AGENTS.md", "CLAUDE.md", "GEMINI.md", ".env", "credentials.json"}
patterns = [re.compile(rb"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"), re.compile(rb"\b(?:ghp|gho|ghu|ghs|github_pat)_[A-Za-z0-9_]{20,}\b"), re.compile(rb"\bAKIA[A-Z0-9]{16}\b"), re.compile(rb"(?:Great-Falls-Tool-Bus/meta|meta spec/|docs/agent-notes/|tinyland-nix|registry-credential-helper)")]

expected_assets = {artifact["asset"] for artifact in plan["artifacts"]}
actual_assets = {path.name for path in args.artifacts.glob("*.tar.gz")}
assert actual_assets == expected_assets, "Release directory must contain exactly its planned archives"
manifest = json.loads((args.artifacts / "manifest.json").read_text())
for field in ["tag", "repository", "registry_commit", "artifacts"]:
    assert manifest[field] == plan[field], f"Release manifest differs: {field}"
expected_sums = "".join(f"{artifact['sha256']}  {artifact['asset']}\n" for artifact in plan["artifacts"])
assert (args.artifacts / "SHA256SUMS").read_text() == expected_sums

for artifact in plan["artifacts"]:
    path = args.artifacts / artifact["asset"]
    digest = hashlib.sha256(path.read_bytes()).digest()
    assert digest.hex() == artifact["sha256"], f"Archive checksum differs: {path.name}"
    assert "sha256-" + base64.b64encode(digest).decode() == artifact["integrity"]
    with tarfile.open(path, "r:gz") as archive:
        members = archive.getmembers()
        assert len(members) == artifact["files"]
        assert len({member.name for member in members}) == len(members), "Duplicate archive member paths"
        assert [member.name for member in members] == sorted(member.name for member in members)
        public_files = set()
        archive_module_bazel = None
        for member in members:
            assert member.isfile() and not member.issym() and not member.islnk(), member.name
            relative = Path(member.name).relative_to(artifact["strip_prefix"])
            assert not relative.is_absolute() and ".." not in relative.parts
            assert not (set(relative.parts) & refused) and relative.name not in names, member.name
            assert member.uid == member.gid == member.mtime == 0, member.name
            assert member.mode in (0o644, 0o755), member.name
            data = archive.extractfile(member).read()
            if relative.suffix != ".woff2":
                assert not any(pattern.search(data) for pattern in patterns), f"Refused content in {relative}"
            public_files.add(relative.as_posix())
            if relative.as_posix() == "MODULE.bazel":
                archive_module_bazel = data
        assert {"LICENSE", "NOTICE", "MODULE.bazel", "BUILD.bazel"} <= public_files
        if artifact["module"] == "xoxd_theme":
            assert {"fonts/OFL.txt", "fonts/FiraCodeNerdFontMono-Regular.woff2", "fonts/FiraCodeNerdFontMono-Bold.woff2"} <= public_files
        if artifact["module"] == "xoxd_spectrogram":
            assert {"package.json", "pnpm-lock.yaml", "pnpm-workspace.yaml", ".npmrc", ".pnpmfile.cjs"} <= public_files
            assert not {".bazelrc", "MODULE.bazel.lock", "scripts/bazel/github-credential-helper.py"} & public_files, "Root-only or credential file in module archive"
        if artifact["module"] == "site-scaffold-public":
            assert {"flake.nix", "flake.lock", "Justfile", "pnpm-lock.yaml", "static/fonts/OFL.txt"} <= public_files
    # A registered module's entry must resolve to exactly these bytes, or the
    # published asset would fail its own source.json or ship a MODULE.bazel that
    # differs from the one Bazel resolves. Template-only assets have no entry.
    module_root = args.registry / "modules" / artifact["module"]
    if module_root.is_dir():
        entry = module_root / artifact["version"]
        assert entry.is_dir(), f"Registry has no entry for {artifact['module']} {artifact['version']}"
        source = json.loads((entry / "source.json").read_text())
        expected_url = f"https://github.com/{plan['repository']}/releases/download/{plan['tag']}/{artifact['asset']}"
        assert source.get("url") == expected_url, f"Registry source.json differs: url ({source.get('url')})"
        assert source.get("integrity") == artifact["integrity"], "Registry source.json differs: integrity"
        assert source.get("strip_prefix") == artifact["strip_prefix"], "Registry source.json differs: strip_prefix"
        assert (entry / "MODULE.bazel").read_bytes() == archive_module_bazel, "Registry MODULE.bazel differs from the archive"
    print(f"Verified {path.name}: {artifact['files']} audited files, sha256 {digest.hex()}")
