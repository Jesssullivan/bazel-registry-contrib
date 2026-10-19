#!/usr/bin/env python3
"""Test the workflow's inline admission shell without any real publication."""
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import textwrap

if sys.flags.optimize:
    sys.exit("Refusing to run admission fixtures with assertions stripped (python -O or PYTHONOPTIMIZE).")

workflow = Path(__file__).resolve().parent.parent / ".github/workflows/public-frontend-release.yml"
body = workflow.read_text().split("<<'PUBLISH'\n", 1)[1].split("\n          PUBLISH", 1)[0]
script = textwrap.dedent(body)
bash = shutil.which("bash")
tag = "site-scaffold-public-v0.1.1"
stub = """#!/usr/bin/env bash
set -euo pipefail
case "$1" in
  --version)
    if [ "$ADMISSION_CASE" = tool-error ]; then exit 127; fi
    echo 'gh fixture'
    ;;
  api)
    case "$*" in
      *git/matching-refs/tags/*)
        if [ "$ADMISSION_CASE" = tag-api-error ]; then
          echo 'fixture tag lookup failed' >&2
          exit 1
        fi
        # matching-refs is a prefix match; a longer neighbour must not refuse.
        echo "refs/tags/${RELEASE_TAG}0"
        if [ "$ADMISSION_CASE" = existing-git-tag ]; then echo "refs/tags/$RELEASE_TAG"; fi
        ;;
      *)
        if [ "$ADMISSION_CASE" = api-error ]; then
          echo 'fixture API request failed' >&2
          exit 1
        fi
        echo 'public-frontend-v0.1.1'
        if [ "$ADMISSION_CASE" = existing-tag ]; then echo "$RELEASE_TAG"; fi
        ;;
    esac
    ;;
  release)
    test "$2" = create
    printf '%s\\n' "$@" > "$PUBLISH_CALL_LOG"
    ;;
  *) exit 64 ;;
esac
"""
cases = ["tool-error", "api-error", "existing-tag", "tag-api-error", "existing-git-tag", "absent-tag"]
for case in cases:
    with tempfile.TemporaryDirectory(prefix="release-admission-") as scratch:
        root = Path(scratch)
        tools = root / "bin"
        tools.mkdir()
        (tools / "gh").write_text(stub)
        (tools / "gh").chmod(0o755)
        assets = root / "public-assets"
        assets.mkdir()
        for name in [f"{tag.removesuffix('-v0.1.1')}-0.1.1.tar.gz", "SHA256SUMS", "manifest.json"]:
            (assets / name).touch()
        log = root / "publish-call"
        env = dict(os.environ, PATH=f"{tools}:/usr/bin:/bin", ADMISSION_CASE=case,
                   RELEASE_TAG=tag, GITHUB_REPOSITORY="fixture/registry",
                   GITHUB_SHA="a" * 40, GH_TOKEN="fixture", PUBLISH_CALL_LOG=str(log))
        result = subprocess.run([bash, "-euo", "pipefail"], input=script, text=True,
                                capture_output=True, cwd=root, env=env)
        if case == "absent-tag":
            assert result.returncode == 0, result.stderr
            args = log.read_text().splitlines()
            assert args[:3] == ["release", "create", tag]
            assert args[3:6] == ["public-assets/site-scaffold-public-0.1.1.tar.gz",
                                 "public-assets/SHA256SUMS", "public-assets/manifest.json"]
        else:
            assert result.returncode != 0, f"Admitted {case}"
            assert not log.exists(), f"Attempted publication for {case}"
            if case == "api-error":
                assert "Unable to verify existing releases" in result.stderr
            if case == "existing-tag":
                assert "Refusing to replace an existing frontend release" in result.stderr
            if case == "tag-api-error":
                assert "Unable to verify existing tags" in result.stderr
            if case == "existing-git-tag":
                assert "Refusing to publish onto a tag that already exists" in result.stderr
        print(f"ok - {case}: {'exact create arguments' if case == 'absent-tag' else 'no publication attempted'}")
print(f"All {len(cases)} inline release-admission fixtures passed without real API writes.")
