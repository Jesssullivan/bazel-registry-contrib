// Fixture-driven negative control for the source-host allowlist rule in
// scripts/validate-registry.mjs.
//
// validate-registry.mjs itself has no fixture data of its own -- CI proves it
// by running `npm run validate` straight against this repo's real modules/
// tree (the "positive control": 180 real source.json entries all pass). That
// leaves the refusal path unproven: nothing in the repo's real data uses a
// disallowed host, so a regression that silently dropped or weakened the
// allowlist check would go green forever.
//
// This script builds tiny throwaway registry fixtures (a valid one, plus one
// per disallowed-host shape) in a temp directory, runs validate-registry.mjs
// against each with `cwd` pointed at the fixture, and asserts the exit code
// and failure message are what the allowlist rule promises. It has no test
// framework dependency, matching this repo's existing scripts/*.mjs
// convention (plain node, run via an `npm run` script, invoked as its own
// step in .github/workflows/validate.yml).
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, '..');
const validatorPath = path.join(__dirname, 'validate-registry.mjs');
const bazelVersion = fs.readFileSync(path.join(repoRoot, '.bazelversion'), 'utf8').trim();

const MODULE_NAME = 'fixture_module';
const MODULE_VERSION = '0.1.0';
const GOOD_INTEGRITY = 'sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';
const RAW_COMMIT = '0123456789abcdef0123456789abcdef01234567';
const RAW_BASE = `https://raw.githubusercontent.com/xoxd-ai/bazel-payloads/${RAW_COMMIT}`;

function writeJson(filePath, value) {
	fs.mkdirSync(path.dirname(filePath), { recursive: true });
	fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n');
}

// Builds a minimal-but-complete one-module active registry fixture under a
// fresh temp directory, with `sourceUrl` as its module's source.json url.
// Every other field is a fixed known-good value so a failure can only ever
// be attributed to the url under test, or to `integrity` when a case sets it.
function buildFixtureRegistry(sourceUrl, integrity = GOOD_INTEGRITY) {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bazel-registry-fixture-'));

	writeJson(path.join(root, 'bazel_registry.json'), {
		mirrors: [],
		module_base_path: 'modules',
		status: 'active',
	});
	writeJson(path.join(root, 'package.json'), { bazelEstate: { version: bazelVersion } });
	fs.writeFileSync(path.join(root, '.bazelversion'), bazelVersion + '\n');

	const versionDir = path.join(root, 'modules', MODULE_NAME, MODULE_VERSION);
	writeJson(path.join(versionDir, 'source.json'), {
		url: sourceUrl,
		strip_prefix: `${MODULE_NAME}-${MODULE_VERSION}`,
		integrity,
	});
	writeJson(path.join(root, 'modules', MODULE_NAME, 'metadata.json'), {
		homepage: 'https://github.com/tinyland-inc/fixture-module',
		versions: [MODULE_VERSION],
		yanked_versions: {},
	});
	fs.writeFileSync(
		versionDir + '/MODULE.bazel',
		`module(\n    name = "${MODULE_NAME}",\n    version = "${MODULE_VERSION}",\n)\n`,
	);

	return root;
}

function runValidator(cwd) {
	const result = spawnSync(process.execPath, [validatorPath], { cwd, encoding: 'utf8' });
	return { status: result.status, stderr: result.stderr, stdout: result.stdout };
}

const cases = [
	{
		name: 'accepts a github.com release-tag archive url',
		url: 'https://github.com/tinyland-inc/fixture-module/archive/refs/tags/v0.1.0.tar.gz',
		expectPass: true,
	},
	{
		name: 'accepts an api.github.com repos tarball url',
		url: 'https://api.github.com/repos/tinyland-inc/fixture-module/tarball/abc123def456',
		expectPass: true,
	},
	{
		name: 'accepts a versioned public GitHub release asset',
		url: 'https://github.com/xoxd-ai/bazel-registry/releases/download/public-frontend-v0.1.1/xoxd_theme-0.1.1.tar.gz',
		expectPass: true,
	},
	{
		name: 'refuses a latest release alias',
		url: 'https://github.com/xoxd-ai/bazel-registry/releases/download/latest/xoxd_theme-0.1.1.tar.gz',
		expectPass: false,
		expectMessage: /does not match an allowed source host\/shape/,
	},
	{
		name: 'refuses an authenticated release API resource',
		url: 'https://api.github.com/repos/xoxd-ai/bazel-registry/releases/assets/12345',
		expectPass: false,
		expectMessage: /does not match an allowed source host\/shape/,
	},
	{
		name: 'accepts a raw.githubusercontent.com xoxd-ai blob at a 40-hex commit',
		url: `${RAW_BASE}/payloads/fixture_module/0.1.0/fixture_module-0.1.0.tar.gz`,
		expectPass: true,
	},
	{
		name: 'accepts a raw.githubusercontent.com xoxd-ai .tar.xz blob at a 40-hex commit',
		url: `${RAW_BASE}/node/v22.22.0/node-v22.22.0-linux-x64.tar.xz`,
		expectPass: true,
	},
	{
		name: 'refuses a raw.githubusercontent.com blob outside the xoxd-ai owner',
		url: `https://raw.githubusercontent.com/someone-else/bazel-payloads/${RAW_COMMIT}/payloads/fixture_module-0.1.0.tar.gz`,
		expectPass: false,
		expectMessage: /does not match an allowed source host\/shape/,
	},
	{
		name: 'refuses a raw.githubusercontent.com blob at a branch name',
		url: 'https://raw.githubusercontent.com/xoxd-ai/bazel-payloads/main/payloads/fixture_module-0.1.0.tar.gz',
		expectPass: false,
		expectMessage: /does not match an allowed source host\/shape/,
	},
	{
		name: 'refuses a raw.githubusercontent.com blob at a short commit',
		url: `https://raw.githubusercontent.com/xoxd-ai/bazel-payloads/${RAW_COMMIT.slice(0, 12)}/payloads/fixture_module-0.1.0.tar.gz`,
		expectPass: false,
		expectMessage: /does not match an allowed source host\/shape/,
	},
	{
		name: 'refuses a raw.githubusercontent.com blob at an uppercase commit',
		url: `https://raw.githubusercontent.com/xoxd-ai/bazel-payloads/${RAW_COMMIT.toUpperCase()}/payloads/fixture_module-0.1.0.tar.gz`,
		expectPass: false,
		expectMessage: /does not match an allowed source host\/shape/,
	},
	{
		name: 'refuses a raw.githubusercontent.com blob under refs/heads',
		url: `https://raw.githubusercontent.com/xoxd-ai/bazel-payloads/refs/heads/${RAW_COMMIT}/payloads/fixture_module-0.1.0.tar.gz`,
		expectPass: false,
		expectMessage: /does not match an allowed source host\/shape/,
	},
	{
		name: 'refuses a raw.githubusercontent.com blob with a dot-dot segment',
		url: `${RAW_BASE}/payloads/../fixture_module-0.1.0.tar.gz`,
		expectPass: false,
		expectMessage: /does not match an allowed source host\/shape/,
	},
	{
		name: 'refuses a raw.githubusercontent.com blob with an empty segment',
		url: `${RAW_BASE}/payloads//fixture_module-0.1.0.tar.gz`,
		expectPass: false,
		expectMessage: /does not match an allowed source host\/shape/,
	},
	{
		name: 'refuses a raw.githubusercontent.com blob with a query string',
		url: `${RAW_BASE}/payloads/fixture_module-0.1.0.tar.gz?token=x`,
		expectPass: false,
		expectMessage: /does not match an allowed source host\/shape/,
	},
	{
		name: 'refuses a raw.githubusercontent.com blob with a percent-encoded path',
		url: `${RAW_BASE}/payloads/%2e%2e/fixture_module-0.1.0.tar.gz`,
		expectPass: false,
		expectMessage: /does not match an allowed source host\/shape/,
	},
	{
		name: 'refuses a raw.githubusercontent.com blob over plain http',
		url: `http://raw.githubusercontent.com/xoxd-ai/bazel-payloads/${RAW_COMMIT}/payloads/fixture_module-0.1.0.tar.gz`,
		expectPass: false,
		expectMessage: /does not match an allowed source host\/shape/,
	},
	{
		name: 'refuses a raw.githubusercontent.com blob that is not a tar archive',
		url: `${RAW_BASE}/payloads/fixture_module-0.1.0.zip`,
		expectPass: false,
		expectMessage: /does not match an allowed source host\/shape/,
	},
	{
		name: 'refuses a raw.githubusercontent.com blob with a malformed sha256 integrity',
		url: `${RAW_BASE}/payloads/fixture_module/0.1.0/fixture_module-0.1.0.tar.gz`,
		integrity: 'sha256-AAAA',
		expectPass: false,
		expectMessage: /needs exactly one well-formed sha256 SRI integrity/,
	},
	{
		name: 'refuses a raw.githubusercontent.com blob with more than one integrity value',
		url: `${RAW_BASE}/payloads/fixture_module/0.1.0/fixture_module-0.1.0.tar.gz`,
		integrity: `${GOOD_INTEGRITY} sha512-AAAA`,
		expectPass: false,
		expectMessage: /needs exactly one well-formed sha256 SRI integrity/,
	},
	{
		name: 'refuses a raw.githubusercontent.com url embedded after a foreign host',
		url: `https://evil.example/https://raw.githubusercontent.com/xoxd-ai/bazel-payloads/${RAW_COMMIT}/payloads/fixture_module-0.1.0.tar.gz`,
		expectPass: false,
		expectMessage: /does not match an allowed source host\/shape/,
	},
	{
		name: 'refuses a lookalike raw-githubusercontent.com host',
		url: `https://raw-githubusercontent.com/xoxd-ai/bazel-payloads/${RAW_COMMIT}/payloads/fixture_module-0.1.0.tar.gz`,
		expectPass: false,
		expectMessage: /does not match an allowed source host\/shape/,
	},
	{
		name: 'refuses a lookalike raw.githubusercontent-com host',
		url: `https://raw.githubusercontent-com/xoxd-ai/bazel-payloads/${RAW_COMMIT}/payloads/fixture_module-0.1.0.tar.gz`,
		expectPass: false,
		expectMessage: /does not match an allowed source host\/shape/,
	},
	{
		name: 'refuses a raw.githubusercontent.com owner that only starts with xoxd-ai',
		url: `https://raw.githubusercontent.com/xoxd-ai-evil/bazel-payloads/${RAW_COMMIT}/payloads/fixture_module-0.1.0.tar.gz`,
		expectPass: false,
		expectMessage: /does not match an allowed source host\/shape/,
	},
	{
		name: 'refuses a raw.githubusercontent.com dot-dot repo segment',
		url: `https://raw.githubusercontent.com/xoxd-ai/../${RAW_COMMIT}/payloads/fixture_module-0.1.0.tar.gz`,
		expectPass: false,
		expectMessage: /does not match an allowed source host\/shape/,
	},
	{
		name: 'refuses a raw.githubusercontent.com dot repo segment',
		url: `https://raw.githubusercontent.com/xoxd-ai/./${RAW_COMMIT}/main/payloads/fixture_module-0.1.0.tar.gz`,
		expectPass: false,
		expectMessage: /does not match an allowed source host\/shape/,
	},
	{
		name: 'refuses a raw.githubusercontent.com percent-encoded repo segment',
		url: `https://raw.githubusercontent.com/xoxd-ai/%2e%2e/${RAW_COMMIT}/payloads/fixture_module-0.1.0.tar.gz`,
		expectPass: false,
		expectMessage: /does not match an allowed source host\/shape/,
	},
	{
		name: 'refuses a raw.githubusercontent.com 41-hex ref',
		url: `https://raw.githubusercontent.com/xoxd-ai/bazel-payloads/${RAW_COMMIT}a/payloads/fixture_module-0.1.0.tar.gz`,
		expectPass: false,
		expectMessage: /does not match an allowed source host\/shape/,
	},
	{
		name: 'refuses a raw.githubusercontent.com blob with a dot segment',
		url: `${RAW_BASE}/payloads/./fixture_module-0.1.0.tar.gz`,
		expectPass: false,
		expectMessage: /does not match an allowed source host\/shape/,
	},
	{
		name: 'refuses a raw.githubusercontent.com blob with a percent-encoded file name',
		url: `${RAW_BASE}/payloads/fixture_module%2D0.1.0.tar.gz`,
		expectPass: false,
		expectMessage: /does not match an allowed source host\/shape/,
	},
	{
		name: 'refuses a raw.githubusercontent.com blob with a fragment',
		url: `${RAW_BASE}/payloads/fixture_module-0.1.0.tar.gz#x`,
		expectPass: false,
		expectMessage: /does not match an allowed source host\/shape/,
	},
	{
		name: 'refuses a raw.githubusercontent.com .tgz blob',
		url: `${RAW_BASE}/payloads/fixture_module-0.1.0.tgz`,
		expectPass: false,
		expectMessage: /does not match an allowed source host\/shape/,
	},
	{
		name: 'refuses a raw.githubusercontent.com .tar.zst blob',
		url: `${RAW_BASE}/payloads/fixture_module-0.1.0.tar.zst`,
		expectPass: false,
		expectMessage: /does not match an allowed source host\/shape/,
	},
	{
		name: 'refuses a raw.githubusercontent.com blob whose well-formed sha256 follows another value',
		url: `${RAW_BASE}/payloads/fixture_module/0.1.0/fixture_module-0.1.0.tar.gz`,
		integrity: `sha256-AAAA ${GOOD_INTEGRITY}`,
		expectPass: false,
		expectMessage: /needs exactly one well-formed sha256 SRI integrity/,
	},
	{
		name: 'refuses a raw.githubusercontent.com blob whose sha256 integrity has trailing whitespace',
		url: `${RAW_BASE}/payloads/fixture_module/0.1.0/fixture_module-0.1.0.tar.gz`,
		integrity: `${GOOD_INTEGRITY} `,
		expectPass: false,
		expectMessage: /needs exactly one well-formed sha256 SRI integrity/,
	},
	{
		name: 'refuses registry.npmjs.org',
		url: 'https://registry.npmjs.org/fixture-module/-/fixture-module-0.1.0.tgz',
		expectPass: false,
		expectMessage: /refused package-registry host \(registry\.npmjs\.org\)/,
	},
	{
		name: 'refuses npm.pkg.github.com',
		url: 'https://npm.pkg.github.com/download/tinyland-inc/fixture-module/0.1.0',
		expectPass: false,
		expectMessage: /refused package-registry host \(npm\.pkg\.github\.com\)/,
	},
	{
		name: 'refuses an unlisted host even when it merely resembles an archive url',
		url: 'https://gitlab.com/tinyland-inc/fixture-module/-/archive/refs/tags/v0.1.0.tar.gz',
		expectPass: false,
		expectMessage: /does not match an allowed source host\/shape/,
	},
];

let failures = 0;

for (const testCase of cases) {
	const fixtureRoot = buildFixtureRegistry(testCase.url, testCase.integrity);
	try {
		const { status, stderr, stdout } = runValidator(fixtureRoot);
		const passed = status === 0;

		try {
			assert.equal(
				passed,
				testCase.expectPass,
				`expected validator ${testCase.expectPass ? 'to pass' : 'to fail'} for url ${testCase.url}, ` +
					`got exit ${status}\nstdout:\n${stdout}\nstderr:\n${stderr}`,
			);
			if (!testCase.expectPass && testCase.expectMessage) {
				assert.match(stderr, testCase.expectMessage);
			}
			console.log(`ok - ${testCase.name}`);
		} catch (error) {
			failures += 1;
			console.error(`not ok - ${testCase.name}`);
			console.error(error.message);
		}
	} finally {
		fs.rmSync(fixtureRoot, { recursive: true, force: true });
	}
}

if (failures > 0) {
	console.error(`\n${failures} of ${cases.length} source-host fixture case(s) failed`);
	process.exit(1);
}

console.log(`\nAll ${cases.length} source-host fixture cases behaved as expected.`);
