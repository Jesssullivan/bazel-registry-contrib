#!/usr/bin/env python3
"""Exercise public-release admission failures using isolated archive fixtures."""
import argparse
import base64
import copy
import hashlib
import io
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tarfile
import tempfile

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--artifacts", type=Path, required=True)
parser.add_argument("--plan", type=Path, required=True)
args = parser.parse_args()
original = json.loads(args.plan.read_text())
verifier = Path(__file__).with_name("verify-public-frontend.py")
registry = Path(__file__).resolve().parent.parent


def write_metadata(directory, plan):
    (directory / "plan.json").write_text(json.dumps(plan))
    manifest = {field: plan[field] for field in ["tag", "repository", "registry_commit", "artifacts"]}
    (directory / "manifest.json").write_text(json.dumps(manifest))
    (directory / "SHA256SUMS").write_text("".join(f"{item['sha256']}  {item['asset']}\n" for item in plan["artifacts"]))


def rewrite_archive(directory, plan, member_kind):
    item = plan["artifacts"][0]
    target = directory / item["asset"]
    with tarfile.open(target, "r:gz") as archive:
        members = [(member, archive.extractfile(member).read()) for member in archive.getmembers()]
    prefix = item["strip_prefix"]
    names = {
        "agent-file": f"{prefix}/AGENTS.md",
        "traversal": f"{prefix}/../outside.txt",
        "absolute": "/outside.txt",
        "symlink": f"{prefix}/outside-link",
        "duplicate": members[0][0].name,
    }
    injected = tarfile.TarInfo(names[member_kind])
    injected.mode = 0o644
    data = b"test fixture\n"
    if member_kind == "symlink":
        injected.type = tarfile.SYMTYPE
        injected.linkname = "../outside.txt"
        data = None
    else:
        injected.size = len(data)
    members.append((injected, data))
    with tarfile.open(target, "w:gz") as archive:
        for member, content in sorted(members, key=lambda pair: pair[0].name):
            archive.addfile(member, io.BytesIO(content) if content is not None else None)
    digest = hashlib.sha256(target.read_bytes()).digest()
    item.update(sha256=digest.hex(), integrity="sha256-" + base64.b64encode(digest).decode(), files=len(members))


def drift_registry(directory, plan, case):
    """Copy the first registered artifact's entry into a scratch registry and drift it."""
    item = plan["artifacts"][0]
    entry = directory / "registry" / "modules" / item["module"] / item["version"]
    shutil.copytree(registry / "modules" / item["module"] / item["version"], entry)
    if case == "registry-integrity":
        source = json.loads((entry / "source.json").read_text())
        source["integrity"] = "sha256-" + base64.b64encode(hashlib.sha256(b"drift").digest()).decode()
        (entry / "source.json").write_text(json.dumps(source))
    elif case == "registry-url":
        source = json.loads((entry / "source.json").read_text())
        source["url"] = source["url"].replace("/releases/download/", "/releases/download/unplanned-")
        (entry / "source.json").write_text(json.dumps(source))
    else:
        with (entry / "MODULE.bazel").open("a") as module:
            module.write("# drift\n")
    return directory / "registry"


cases = ["altered-bytes", "extra-archive", "manifest-mismatch", "agent-file", "traversal", "absolute", "symlink", "duplicate"]
# Registry-entry drift applies only when the plan's first asset is a registered module.
if (registry / "modules" / original["artifacts"][0]["module"]).is_dir():
    cases += ["registry-integrity", "registry-url", "registry-module-bazel"]
for case in cases:
    with tempfile.TemporaryDirectory(prefix="public-release-admission-") as scratch:
        directory = Path(scratch)
        plan = copy.deepcopy(original)
        for item in plan["artifacts"]:
            shutil.copyfile(args.artifacts / item["asset"], directory / item["asset"])
        if case == "altered-bytes":
            with (directory / plan["artifacts"][0]["asset"]).open("ab") as target:
                target.write(b"altered")
        elif case == "extra-archive":
            shutil.copyfile(directory / plan["artifacts"][0]["asset"], directory / "unplanned.tar.gz")
        elif case != "manifest-mismatch" and not case.startswith("registry-"):
            rewrite_archive(directory, plan, case)
        registry_args = ["--registry", str(drift_registry(directory, plan, case))] if case.startswith("registry-") else []
        write_metadata(directory, plan)
        if case == "manifest-mismatch":
            manifest = json.loads((directory / "manifest.json").read_text())
            manifest["tag"] = "unplanned-release"
            (directory / "manifest.json").write_text(json.dumps(manifest))
        result = subprocess.run([sys.executable, str(verifier), "--artifacts", str(directory), "--plan", str(directory / "plan.json"), *registry_args], capture_output=True, text=True)
        assert result.returncode != 0, f"Unexpectedly admitted {case}"
        expected = {
            "altered-bytes": "Archive checksum differs",
            "extra-archive": "exactly its planned archives",
            "manifest-mismatch": "Release manifest differs: tag",
            "duplicate": "Duplicate archive member paths",
            "registry-integrity": "Registry source.json differs: integrity",
            "registry-url": "Registry source.json differs: url",
            "registry-module-bazel": "Registry MODULE.bazel differs from the archive",
        }
        if case in expected:
            assert expected[case] in result.stderr, f"Wrong rejection for {case}: {result.stderr}"
        else:
            assert "Archive checksum differs" not in result.stderr, f"Unsafe member did not reach archive admission: {case}"
        print(f"ok - rejects {case}")
print(f"All {len(cases)} public-release admission fixtures passed.")
