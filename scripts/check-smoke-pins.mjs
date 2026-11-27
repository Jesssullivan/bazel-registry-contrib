// The token-free consumer smokes in the root MODULE.bazel must build each
// module's newest published version, resolved from this checkout's own
// registry tree (TIN-8469). A new version of one of these modules therefore
// lands with its pin bump and the refreshed MODULE.bazel.lock in the same PR.
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const SMOKE_MODULES = ['xoxd_public_chrome', 'xoxd_theme', 'rules_tectonic', 'prompt_toon'];

function compareVersions(left, right) {
	const leftParts = left.split('.').map(Number);
	const rightParts = right.split('.').map(Number);
	for (let index = 0; index < Math.max(leftParts.length, rightParts.length); index += 1) {
		const delta = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
		if (delta !== 0) return delta;
	}
	return 0;
}

// The same selection as scripts/smoke-stage1-consumer-targets.mjs.
function latestPublishedVersion(root, moduleName) {
	const metadata = JSON.parse(fs.readFileSync(path.join(root, 'modules', moduleName, 'metadata.json'), 'utf8'));
	const yanked = new Set(Object.keys(metadata.yanked_versions ?? {}));
	return (metadata.versions ?? []).filter((version) => !yanked.has(version)).sort(compareVersions).at(-1);
}

const root = process.cwd();
const moduleText = fs.readFileSync(path.join(root, 'MODULE.bazel'), 'utf8');
let failures = 0;
for (const moduleName of SMOKE_MODULES) {
	const escaped = moduleName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const pins = [...moduleText.matchAll(new RegExp(`bazel_dep\\(\\s*name\\s*=\\s*"${escaped}"\\s*,\\s*version\\s*=\\s*"([^"]+)"`, 'g'))];
	const latest = latestPublishedVersion(root, moduleName);
	if (pins.length !== 1) {
		console.error(`MODULE.bazel must pin ${moduleName} exactly once; found ${pins.length}`);
		failures += 1;
		continue;
	}
	if (pins[0][1] !== latest) {
		console.error(`MODULE.bazel pins ${moduleName} ${pins[0][1]}; its newest published version is ${latest}. Bump the pin and refresh MODULE.bazel.lock.`);
		failures += 1;
	}
	const override = new RegExp(`single_version_override\\(\\s*module_name\\s*=\\s*"${escaped}"\\s*,\\s*registry\\s*=\\s*"file://%workspace%"\\s*,?\\s*\\)`);
	if (!override.test(moduleText)) {
		console.error(`MODULE.bazel must resolve ${moduleName} from this checkout: single_version_override(module_name = "${moduleName}", registry = "file://%workspace%")`);
		failures += 1;
	}
}
if (failures > 0) process.exit(1);
console.log(`Smoke pins name the newest published version of ${SMOKE_MODULES.join(', ')} from this checkout's registry`);
