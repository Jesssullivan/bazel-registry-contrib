set shell := ["bash", "-euo", "pipefail", "-c"]
root := justfile_directory()

# GloriousFlywheel (GF) runs every check: each recipe below that calls Bazel
# passes --config=gf (see .bazelrc), the same targets that a pushed head's
# .github/lanes.json rows run. Log in once per eight hours first:
#   gf-reapi-credhelper login https://gf.xoxd.ai

_default:
    @just --list

# The validate row: static registry contracts and the token-free consumer smokes.
check:
    cd {{ root }} && bazelisk test --config=gf $(jq -r '.actions.validate.targets[]' .github/lanes.json)

# The immutability-gate row over base..HEAD, staged from this checkout the way
# GF's head work stages a pushed window: `git log -p -U0` of every commit in
# the window, newest first, into the untracked gf_history_inputs/.
immutability-gate base="origin/main":
    #!/usr/bin/env bash
    set -euo pipefail
    cd {{ root }}
    [[ ! -e gf_history_inputs ]] || { echo "gf_history_inputs/ already exists; remove it first" >&2; exit 2; }
    trap 'rm -rf gf_history_inputs' EXIT
    mkdir gf_history_inputs
    base_sha="$(git rev-parse --verify {{ quote(base) }}^{commit})"
    head_sha="$(git rev-parse --verify HEAD^{commit})"
    mapfile -t commits < <(git rev-list "${base_sha}..${head_sha}" --)
    count=0
    if (( ${#commits[@]} > 0 )); then
        git log --no-walk=unsorted --format=medium --no-color --no-decorate --no-show-signature \
            --no-ext-diff --no-textconv -p -U0 "${commits[@]}" -- > gf_history_inputs/history-000000.patch
        count=1
    fi
    printf '%s\n' "$base_sha" > gf_history_inputs/base
    printf '%s\n' "$head_sha" > gf_history_inputs/head
    printf '%s\n' "$count" > gf_history_inputs/count
    bazelisk test --config=gf $(jq -r '.actions."immutability-gate".targets[]' .github/lanes.json)

validate:
    cd {{ root }} && bazelisk test --config=gf //:validate_registry_test

test-source-hosts:
    cd {{ root }} && bazelisk test --config=gf //:source_hosts_test

verify-public-release artifacts release_tag="public-frontend-v0.1.1":
    cd {{ root }} && python3 scripts/verify-public-frontend.py --artifacts {{ quote(artifacts) }} --plan releases/{{ quote(release_tag) }}/plan.json

test-public-release artifacts release_tag="public-frontend-v0.1.1":
    cd {{ root }} && python3 scripts/test-verify-public-frontend.py --artifacts {{ quote(artifacts) }} --plan releases/{{ quote(release_tag) }}/plan.json

test-publication-admission:
    cd {{ root }} && python3 scripts/test-release-publication-admission.py
