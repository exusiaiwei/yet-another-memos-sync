import { buildSync } from 'esbuild';
import { createRequire } from 'node:module';
import { strict as assert } from 'node:assert';
import { test } from 'node:test';

function load(file) {
  const { outputFiles } = buildSync({ entryPoints: [file], bundle: true, platform: 'node', format: 'cjs', write: false });
  const module = { exports: {} };
  new Function('module', 'exports', 'require', outputFiles[0].text)(module, module.exports, createRequire(import.meta.url));
  return module.exports;
}
const { insertTimelineEntry, validateTimelineHeader } = load('src/utils/timelineEntry.ts');
const { DailyNoteModifier } = load('src/utils/dailyNoteModifier.ts');
const date = new Date(2026, 8, 7, 17, 10);

test('blank, multiline and conflicting settings are rejected, including disabled profile titles', () => {
  assert.equal(validateTimelineHeader('', []), 'empty');
  assert.equal(validateTimelineHeader('A\nB', []), 'invalid');
  assert.equal(validateTimelineHeader('## Notes', ['# Notes']), 'conflict');
  assert.equal(validateTimelineHeader('Local', ['## Memos']), null);
});

test('create heading, preserve template and indent multiline input with cursor at end', () => {
  const original = '---\ntitle: Today\n---\n\n## Memos\n\n- memo ^1\n';
  const result = insertTimelineEntry(original, 'Local', ' First\nSecond ', date);
  assert.ok(result.content.startsWith(original));
  assert.ok(result.content.endsWith('## Local\n\n- 🌆 17:10 First\n  Second\n\n'));
  assert.equal(result.content.slice(result.cursor - 6, result.cursor), 'Second');
});

test('append to existing section, ignoring fake headings in code and preserving following sections', () => {
  const suffix = '## Later\n\nKeep this  \n';
  const original = '```md\n## Local\n```\n\n## Local\n\n- old\n\n' + suffix;
  const result = insertTimelineEntry(original, '## Local', 'new', date);
  assert.ok(result.content.endsWith(suffix));
  assert.ok(result.content.includes('- old\n- 🌆 17:10 new'));
  assert.throws(() => insertTimelineEntry('## Local\n## Local\n', 'Local', 'new', date), /duplicate/);
});

test('local date and emoji boundaries, CRLF notes', () => {
  for (const [hour, emoji] of [[0, '🌙'], [5, '🌅'], [12, '☀️'], [17, '🌆'], [21, '🌙']]) {
    const result = insertTimelineEntry('## Local\r\n', 'Local', 'note', new Date(2026, 8, 7, hour, 1));
    assert.ok(result.content.includes(`- ${emoji} ${String(hour).padStart(2, '0')}:01 note\r\n`));
  }
});

for (const incremental of [false, true]) {
  test(`${incremental ? 'incremental' : 'full'} sync preserves local section and timer byte for byte`, () => {
    const local = '## Local\n\n- 🌆 17:10 Activity 〖⏳00:12:34〗\n  continuation  \n\n## Other\nUntouched\n';
    const original = '# Today\n\n## Memos [me]\n\n- old ^1\n\n' + local;
    const modifier = new DailyNoteModifier('## Memos [me]');
    const result = modifier.modifyDailyNote(original, '2026-09-07', { 1: '- changed ^1', 2: '- new ^2' }, incremental);
    assert.ok(result.endsWith(local));
    assert.ok(result.startsWith('# Today\n\n## Memos [me]\n'));
    assert.equal((result.match(/## Local/g) || []).length, 1);
    assert.equal(modifier.modifyDailyNote(result, '2026-09-07', { 1: '- changed ^1', 2: '- new ^2' }, incremental), undefined);
    const before = local + '\n## Memos [me]\n\n- old ^1\n';
    assert.ok(modifier.modifyDailyNote(before, '2026-09-07', { 2: '- new ^2' }, incremental).startsWith(local));
  });
}

test('sync matches exact heading, not similar titles or fenced examples', () => {
  const prefix = '```\n## Memos\n```\n## Memos archive\nKeep\n';
  const original = prefix + '## Memos\n- old ^1\n## Local\nKeep local\n';
  const result = new DailyNoteModifier('## Memos').modifyDailyNote(original, 'today', { 2: '- new ^2' });
  assert.ok(result.startsWith(prefix));
  assert.ok(result.endsWith('## Local\nKeep local\n'));
});


test('repeated appends form a contiguous list, preserving multiline text and the next heading', () => {
  for (const eol of ['\n', '\r\n']) {
    const suffix = `## Later${eol}Keep${eol}`;
    const original = `## Local${eol}${eol}- old  ${eol}  continuation${eol}  ${eol}${eol}${suffix}`;
    const first = insertTimelineEntry(original, 'Local', 'one', date);
    const second = insertTimelineEntry(first.content, 'Local', 'two', date);
    assert.equal(second.content, `## Local${eol}${eol}- old  ${eol}  continuation${eol}- 🌆 17:10 one${eol}- 🌆 17:10 two${eol}${eol}${suffix}`);
    assert.equal(second.content.slice(0, second.cursor).endsWith('two'), true);
  }
});

test('empty sections and paragraphs retain a blank line before the new list', () => {
  for (const before of ['## Local', '## Local\n\n', '## Local\n\nParagraph\n\n']) {
    const result = insertTimelineEntry(before, 'Local', 'new', date);
    assert.ok(result.content.includes(`${before.trimEnd()}\n\n- 🌆 17:10 new`));
  }
});


const { createTimelineAnchor, locateTimelineCursor, waitForTimelineCursor } = load('src/utils/timelineCursor.ts');

test('cursor follows its record after preceding dataviewjs and sync content shifts', () => {
  const original = '```dataviewjs\ndv.table([])\n```\n\n## Memos\n- old\n\n## Local\n';
  const added = insertTimelineEntry(original, 'Local', 'new\ncontinued', date);
  const anchor = createTimelineAnchor(added.content, 'Local', added.entry);
  assert.equal(locateTimelineCursor(original, anchor), null);
  const updated = added.content.replace('- old', '- old\n- another synced memo\n- more');
  const position = locateTimelineCursor(updated, anchor);
  assert.equal(updated.split('\n')[position.line], '  continued');
  assert.equal(position.ch, '  continued'.length);
  assert.deepEqual(locateTimelineCursor(updated.replace(/\n/g, '\r\n'), anchor), position);
});

test('identical older records do not satisfy the newly inserted record anchor', () => {
  const first = insertTimelineEntry('## Local\n', 'Local', 'same', date);
  const second = insertTimelineEntry(first.content, 'Local', 'same', date);
  const anchor = createTimelineAnchor(second.content, 'Local', second.entry);
  assert.equal(locateTimelineCursor(first.content, anchor), null);
  const position = locateTimelineCursor(second.content, anchor);
  assert.equal(position.line, 3);
});

test('waits for the saved record to reach the live editor before returning a cursor', async () => {
  const original = '## Local\n';
  const added = insertTimelineEntry(original, 'Local', 'new', date);
  const anchor = createTimelineAnchor(added.content, 'Local', added.entry);
  const previousWindow = globalThis.window;
  globalThis.window = { setTimeout };
  try {
    let reads = 0;
    const position = await waitForTimelineCursor(() => ++reads < 3 ? original : added.content, anchor);
    assert.equal(reads, 3);
    assert.equal(added.content.split('\n')[position.line], added.entry);
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});
