set shell := ["bash", "-euo", "pipefail", "-c"]
root := justfile_directory()

_default:
    @just --list

validate:
    cd {{ root }} && node scripts/validate-registry.mjs

test-source-hosts:
    cd {{ root }} && node scripts/test-validate-registry-source-hosts.mjs

verify-public-release artifacts:
    cd {{ root }} && python3 scripts/verify-public-frontend.py --artifacts {{ quote(artifacts) }} --plan releases/public-frontend-v0.1.1/plan.json
