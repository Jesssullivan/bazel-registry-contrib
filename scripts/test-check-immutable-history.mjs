// Fixture windows for scripts/check-immutable-history.mjs (TIN-8469). Each
// case is a `git log -p -U0` window that git recorded over a one-module
// registry, with the modules/ tree after it. The gate must pass, fail or allow
// a re-record exactly as each case says. Plain node, no framework, matching
// this repo's scripts/*.mjs convention.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { evaluate, parseHistory } from './check-immutable-history.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(here, '..', 'tests', 'fixtures', 'immutability-history.json');
const { cases } = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
const renames = [{ from: 'tinyland-inc', to: 'xoxd-ai', recorded: '2026-09-21' }];

assert.ok(cases.length >= 10, 'every fixture case is present');
for (const fixture of cases) {
	const verdict = evaluate({
		commits: parseHistory(fixture.patch),
		headFiles: new Map(Object.entries(fixture.head)),
		renames,
		head: fixture.head_commit,
	});
	const outcome = verdict.violations.length > 0 ? 'fail' : verdict.rerecorded.length > 0 ? 'rerecord' : 'pass';
	assert.equal(outcome, fixture.expect, `${fixture.name}: expected ${fixture.expect}, got ${outcome} ${JSON.stringify(verdict)}`);
}

// An empty window passes and freezes what the head holds.
const empty = evaluate({ commits: parseHistory(''), headFiles: new Map(Object.entries(cases[0].head)), renames });
assert.equal(empty.violations.length, 0, 'an empty window passes');
assert.ok(empty.frozenCount > 0, 'an empty window still sees the shipped versions');

// Without a recorded rename, the owner rename case is an edit.
const renameCase = cases.find((fixture) => fixture.expect === 'rerecord');
const unrecorded = evaluate({
	commits: parseHistory(renameCase.patch),
	headFiles: new Map(Object.entries(renameCase.head)),
	renames: [],
});
assert.equal(unrecorded.violations.length, 1, 'no recorded rename means no allowance');

// A merge with no parent record cannot be judged, so the window is refused.
const evil = cases.find((fixture) => fixture.name === 'merge that edits a shipped source.json');
const unparented = evil.patch.replace(/^commit ([0-9a-f]{40})(?: [0-9a-f]{40})+$/gm, 'commit $1\nMerge: a b');
assert.throws(
	() => evaluate({ commits: parseHistory(unparented), headFiles: new Map(Object.entries(evil.head)), renames }),
	/no parent record/,
	'a merge without parents is refused',
);

process.stdout.write(`check-immutable-history: ${cases.length} fixture windows and 3 controls behave as recorded\n`);
