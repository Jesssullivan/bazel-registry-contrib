// Immutability gate over an authenticated Git history window (TIN-8469).
//
// A published modules/<name>/<version>/ directory is frozen. If the window's
// changes, taken together, edit, add or delete any file inside a version
// directory that already existed at the window's base, the gate fails. Minting
// a new version directory is allowed. Editing modules/<name>/metadata.json
// (the version index) is allowed, since that is how a new version is
// registered.
//
// One allowance, and only one: a shipped source.json may be re-recorded to
// follow a GitHub owner rename listed in registry-owner-renames.json.
// scripts/owner-rename-record.mjs judges each such file against its content at
// the base; anything it refuses is a violation like any other.
//
// Input. GloriousFlywheel's head work writes gf_history_inputs/ into the
// workspace before Bazel runs (lanes.json row immutability-gate, source_input
// git-history): history-NNNNNN.patch files holding `git log -p -U0` records of
// every commit in base..head, newest first, and files base, head and count.
// `just immutability-gate` stages the same window from a local checkout. The
// test reads no Git object database: it starts from the head tree it was given
// (the modules/ files in its runfiles) and undoes each commit's patch to
// recover the base tree of every path the window touched.
//
// Exit status: 0 passes, 1 is a violation, 2 is an incomplete or unreadable
// window.
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { judgeRenameRecord } from './owner-rename-record.mjs';

export class HistoryError extends Error {}

const COMMIT = /^commit ([0-9a-f]{40})(?: .*)?\n$/;
const HUNK = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/;
const NO_NEWLINE = '\\ No newline at end of file\n';

function splitLines(text) {
	const lines = [];
	let start = 0;
	while (start < text.length) {
		const end = text.indexOf('\n', start);
		if (end === -1) {
			lines.push(text.slice(start));
			break;
		}
		lines.push(text.slice(start, end + 1));
		start = end + 1;
	}
	return lines;
}

function headerPath(value, side) {
	const text = value.replace(/\n$/, '');
	if (text === '/dev/null') return null;
	if (text.startsWith('"')) throw new HistoryError(`quoted path in history is not supported: ${text}`);
	const prefix = `${side}/`;
	if (!text.startsWith(prefix)) throw new HistoryError(`unexpected ${side}-side path: ${text}`);
	return text.slice(prefix.length).replace(/\t$/, '');
}

function diffGitPaths(line) {
	const rest = line.slice('diff --git '.length).replace(/\n$/, '');
	if (rest.startsWith('"')) throw new HistoryError(`quoted path in history is not supported: ${rest}`);
	if ((rest.length - 5) % 2 === 0) {
		const length = (rest.length - 5) / 2;
		const candidate = rest.slice(2, 2 + length);
		if (rest === `a/${candidate} b/${candidate}`) return { a: candidate, b: candidate };
	}
	return { a: undefined, b: undefined };
}

// Parses `git log --format=medium -p -U0` text into commits, each a list of
// file changes in the order Git printed them.
export function parseHistory(text) {
	const lines = splitLines(text);
	const commits = [];
	let commit = null;
	let index = 0;
	while (index < lines.length) {
		const line = lines[index];
		const commitMatch = COMMIT.exec(line);
		if (commitMatch) {
			commit = { sha: commitMatch[1], merge: false, files: [] };
			commits.push(commit);
			index += 1;
			continue;
		}
		if (!commit) {
			if (line.trim() === '') {
				index += 1;
				continue;
			}
			throw new HistoryError('history does not start with a commit record');
		}
		if (line.startsWith('Merge: ') && commit.files.length === 0) {
			commit.merge = true;
			index += 1;
			continue;
		}
		if (!line.startsWith('diff --git ')) {
			// Author, Date, the indented message and blank lines.
			index += 1;
			continue;
		}
		const paths = diffGitPaths(line);
		const file = {
			a: paths.a,
			b: paths.b,
			status: 'modify',
			oldMode: null,
			newMode: null,
			binary: false,
			hunks: [],
		};
		index += 1;
		while (index < lines.length) {
			const header = lines[index];
			if (header.startsWith('diff --git ') || COMMIT.test(header) || header.startsWith('@@ ')) break;
			if (header.startsWith('new file mode ')) {
				file.status = 'add';
				file.newMode = header.slice('new file mode '.length).trim();
			} else if (header.startsWith('deleted file mode ')) {
				file.status = 'delete';
				file.oldMode = header.slice('deleted file mode '.length).trim();
			} else if (header.startsWith('old mode ')) {
				file.oldMode = header.slice('old mode '.length).trim();
			} else if (header.startsWith('new mode ')) {
				file.newMode = header.slice('new mode '.length).trim();
			} else if (header.startsWith('rename from ')) {
				file.status = 'rename';
				file.a = header.slice('rename from '.length).replace(/\n$/, '');
			} else if (header.startsWith('rename to ')) {
				file.b = header.slice('rename to '.length).replace(/\n$/, '');
			} else if (header.startsWith('copy from ')) {
				file.status = 'copy';
				file.a = header.slice('copy from '.length).replace(/\n$/, '');
			} else if (header.startsWith('copy to ')) {
				file.b = header.slice('copy to '.length).replace(/\n$/, '');
			} else if (header.startsWith('--- ')) {
				const a = headerPath(header.slice(4), 'a');
				if (a !== null) file.a = a;
			} else if (header.startsWith('+++ ')) {
				const b = headerPath(header.slice(4), 'b');
				if (b !== null) file.b = b;
			} else if (header.startsWith('Binary files ') || header.startsWith('GIT binary patch')) {
				file.binary = true;
			} else if (header.trim() === '') {
				break;
			}
			index += 1;
		}
		while (index < lines.length && lines[index].startsWith('@@ ')) {
			const match = HUNK.exec(lines[index]);
			if (!match) throw new HistoryError(`malformed hunk header: ${lines[index].trimEnd()}`);
			const hunk = {
				oldStart: Number(match[1]),
				oldCount: match[2] === undefined ? 1 : Number(match[2]),
				newStart: Number(match[3]),
				newCount: match[4] === undefined ? 1 : Number(match[4]),
				removed: [],
				added: [],
			};
			index += 1;
			let last = null;
			while (index < lines.length) {
				const body = lines[index];
				if (body === NO_NEWLINE || body === NO_NEWLINE.trimEnd()) {
					if (!last) throw new HistoryError('no-newline marker without a line');
					last.list[last.list.length - 1] = last.list[last.list.length - 1].replace(/\n$/, '');
					index += 1;
					continue;
				}
				const full = hunk.removed.length === hunk.oldCount && hunk.added.length === hunk.newCount;
				if (full) break;
				if (body.startsWith('-') && hunk.removed.length < hunk.oldCount && hunk.added.length === 0) {
					hunk.removed.push(body.slice(1).endsWith('\n') ? body.slice(1) : `${body.slice(1)}\n`);
					last = { list: hunk.removed };
				} else if (body.startsWith('+') && hunk.added.length < hunk.newCount) {
					hunk.added.push(body.slice(1).endsWith('\n') ? body.slice(1) : `${body.slice(1)}\n`);
					last = { list: hunk.added };
				} else {
					throw new HistoryError(`hunk body does not match its header in ${file.b ?? file.a}`);
				}
				index += 1;
			}
			if (hunk.removed.length !== hunk.oldCount || hunk.added.length !== hunk.newCount) {
				throw new HistoryError(`truncated hunk in ${file.b ?? file.a}`);
			}
			file.hunks.push(hunk);
		}
		if (file.a === undefined && file.status !== 'add') throw new HistoryError(`cannot read the path of a change in ${commit.sha}`);
		if (file.b === undefined && file.status !== 'delete') throw new HistoryError(`cannot read the path of a change in ${commit.sha}`);
		if (file.status === 'add') file.a = null;
		if (file.status === 'delete') file.b = null;
		commit.files.push(file);
	}
	return commits;
}

function tracked(filePath) {
	return typeof filePath === 'string' && filePath.startsWith('modules/');
}

// Undoes one file's hunks on the lines of its new side, bottom hunk first so
// every header's new-side position still holds. Returns null when the lines do
// not match: two merged branches changed the same file, so its content at the
// base is unknown and the gate counts it as changed.
function undoHunks(lines, hunks) {
	if (lines === null) return null;
	const result = lines.slice();
	const ordered = hunks.slice().sort((left, right) => right.newStart - left.newStart);
	for (const hunk of ordered) {
		const at = hunk.newCount === 0 ? hunk.newStart : hunk.newStart - 1;
		const current = result.slice(at, at + hunk.newCount);
		if (current.length !== hunk.added.length || current.some((line, offset) => line !== hunk.added[offset])) {
			return null;
		}
		result.splice(at, hunk.newCount, ...hunk.removed);
	}
	return result;
}

// headFiles maps every modules/ path at the head to its text. Returns the
// gate's verdict for the window.
export function evaluate({ commits, headFiles, renames }) {
	const state = new Map();
	const read = (filePath) => {
		if (!state.has(filePath)) {
			const exists = headFiles.has(filePath);
			state.set(filePath, {
				exists,
				lines: exists ? splitLines(headFiles.get(filePath)) : [],
				mode: 'HEAD',
				headMode: null,
			});
		}
		return state.get(filePath);
	};
	const noteNewMode = (entry, mode) => {
		if (mode && entry.mode === 'HEAD') entry.headMode = mode;
	};

	for (const commit of commits) {
		if (commit.merge) continue;
		for (const file of commit.files) {
			if (file.status === 'add') {
				if (!tracked(file.b)) continue;
				const entry = read(file.b);
				noteNewMode(entry, file.newMode);
				state.set(file.b, { exists: false, lines: [], mode: null, headMode: entry.headMode });
				continue;
			}
			if (file.status === 'delete') {
				if (!tracked(file.a)) continue;
				const entry = read(file.a);
				const before = file.binary ? null : undoHunks([], file.hunks);
				state.set(file.a, { exists: true, lines: before, mode: file.oldMode, headMode: entry.headMode });
				continue;
			}
			// modify, rename or copy: the new side is file.b.
			let after;
			if (tracked(file.b)) {
				after = read(file.b);
			} else {
				after = { exists: true, lines: null, mode: 'HEAD', headMode: null };
			}
			noteNewMode(after, file.newMode);
			const before = file.binary || !after.exists ? null : undoHunks(after.lines, file.hunks);
			const beforeMode = file.oldMode ?? (after.mode === 'HEAD' ? null : after.mode);
			if (file.status === 'modify') {
				if (tracked(file.b)) {
					state.set(file.b, {
						exists: true,
						lines: before,
						mode: file.oldMode ?? after.mode,
						headMode: after.headMode,
					});
				}
				continue;
			}
			if (file.status === 'rename' && tracked(file.b)) {
				state.set(file.b, { exists: false, lines: [], mode: null, headMode: after.headMode });
			}
			if (file.status === 'copy' && tracked(file.b)) {
				state.set(file.b, { exists: false, lines: [], mode: null, headMode: after.headMode });
			}
			if (file.status === 'rename' && tracked(file.a)) {
				const source = read(file.a);
				state.set(file.a, { exists: true, lines: before, mode: beforeMode, headMode: source.headMode });
			}
		}
	}

	const baseExists = (filePath) => (state.has(filePath) ? state.get(filePath).exists : headFiles.has(filePath));
	const versionDirOf = (filePath) => {
		const parts = filePath.split('/');
		return parts.length >= 4 && parts[0] === 'modules' ? parts.slice(0, 3).join('/') : null;
	};
	const frozen = new Set();
	for (const filePath of new Set([...headFiles.keys(), ...state.keys()])) {
		const directory = versionDirOf(filePath);
		if (directory && baseExists(filePath)) frozen.add(directory);
	}

	const violations = [];
	const rerecorded = [];
	for (const filePath of [...state.keys()].sort()) {
		const directory = versionDirOf(filePath);
		if (!directory || !frozen.has(directory)) continue;
		const entry = state.get(filePath);
		const headExists = headFiles.has(filePath);
		const headText = headExists ? headFiles.get(filePath) : null;
		const baseText = entry.exists && entry.lines !== null ? entry.lines.join('') : null;
		const modeChanged =
			entry.exists && headExists && entry.mode !== 'HEAD' && entry.mode !== null && entry.headMode !== null && entry.mode !== entry.headMode;
		const contentKnown = !entry.exists || entry.lines !== null;
		const changed = entry.exists !== headExists || !contentKnown || (headExists && baseText !== headText) || modeChanged;
		if (!changed) continue;
		if (path.posix.basename(filePath) === 'source.json' && entry.exists && headExists && baseText !== null && !modeChanged) {
			let verdict;
			try {
				verdict = judgeRenameRecord(JSON.parse(baseText), JSON.parse(headText), renames);
			} catch (error) {
				verdict = { allowed: false, reason: `not JSON: ${error.message}` };
			}
			if (verdict.allowed) {
				rerecorded.push({ path: filePath, reason: verdict.reason });
				continue;
			}
			violations.push({ path: filePath, reason: verdict.reason });
			continue;
		}
		const reason = !headExists ? 'deleted' : !entry.exists ? 'added to a shipped version' : modeChanged ? 'mode changed' : 'edited';
		violations.push({ path: filePath, reason });
	}
	return { violations, rerecorded, frozenCount: frozen.size };
}

function listTree(root, relative, out) {
	const directory = path.join(root, relative);
	if (!fs.existsSync(directory)) return out;
	for (const name of fs.readdirSync(directory).sort()) {
		const childRelative = path.posix.join(relative, name);
		const stat = fs.statSync(path.join(root, childRelative));
		if (stat.isDirectory()) listTree(root, childRelative, out);
		else if (stat.isFile()) out.set(childRelative, fs.readFileSync(path.join(root, childRelative), 'utf8'));
	}
	return out;
}

function incomplete(message) {
	process.stderr.write(`immutability-gate: authenticated Git history is incomplete: ${message}\n`);
	return 2;
}

function main() {
	const root = process.cwd();
	const historyDir = path.join(root, 'gf_history_inputs');
	const field = (name) => {
		const file = path.join(historyDir, name);
		return fs.existsSync(file) ? fs.readFileSync(file, 'utf8').trim() : undefined;
	};
	const head = field('head');
	const base = field('base');
	const count = field('count');
	if (head === undefined || base === undefined || count === undefined) return incomplete('head, base or count is missing');
	if (!/^[0-9a-f]{40}$/.test(head)) return incomplete('head is not a commit');
	if (base !== '' && !/^[0-9a-f]{40}$/.test(base)) return incomplete('base is not a commit');
	if (!/^(0|[1-9][0-9]{0,5})$/.test(count)) return incomplete('count is not a number');
	const total = Number(count);
	const entries = fs.readdirSync(historyDir);
	if (entries.length !== total + 3) return incomplete('the window holds files it does not count');
	let text = '';
	for (let index = 0; index < total; index += 1) {
		const file = path.join(historyDir, `history-${String(index).padStart(6, '0')}.patch`);
		if (!fs.existsSync(file)) return incomplete(`${path.basename(file)} is missing`);
		text += fs.readFileSync(file, 'utf8');
		if (!text.endsWith('\n')) text += '\n';
	}

	let verdict;
	try {
		const renames = JSON.parse(fs.readFileSync(path.join(root, 'registry-owner-renames.json'), 'utf8')).renames;
		verdict = evaluate({ commits: parseHistory(text), headFiles: listTree(root, 'modules', new Map()), renames });
	} catch (error) {
		if (error instanceof HistoryError) return incomplete(error.message);
		throw error;
	}
	process.stdout.write(`immutability-gate: window ${base || '(root)'}..${head}, ${total} patch file(s), ${verdict.frozenCount} version directories frozen at base\n`);
	if (verdict.rerecorded.length > 0) {
		process.stdout.write('immutability-gate: re-recorded under a listed owner rename:\n');
		for (const item of verdict.rerecorded) process.stdout.write(`  - ${item.path}: ${item.reason}\n`);
	}
	if (verdict.violations.length > 0) {
		process.stderr.write('immutability-gate: FAIL - a shipped module version directory was modified.\n');
		process.stderr.write('Shipped versions are frozen. Mint a new version directory instead.\nOffending files:\n');
		for (const item of verdict.violations) process.stderr.write(`  - ${item.path} (${item.reason})\n`);
		return 1;
	}
	process.stdout.write('immutability-gate: OK - no shipped version directory was modified.\n');
	return 0;
}

// Bazel runs the entry point through a runfiles symlink, so compare real paths.
function isEntryPoint() {
	if (!process.argv[1]) return false;
	try {
		return fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url));
	} catch {
		return false;
	}
}

if (isEntryPoint()) {
	process.exit(main());
}
