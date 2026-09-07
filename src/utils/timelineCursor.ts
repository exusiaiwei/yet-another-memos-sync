import { headingTitle, markdownHeadings } from './markdownSections';

export interface TimelineAnchor {
  header: string;
  entry: string;
  occurrence: number;
}

function entryOffsets(content: string, header: string, entry: string): number[] {
  const headings = markdownHeadings(content);
  const matches = headings.filter(h => h.level === 2 && h.title === headingTitle(header));
  if (matches.length !== 1) return [];
  const start = matches[0].end;
  const end = headings.find(h => h.start >= start)?.start ?? content.length;
  const offsets: number[] = [];
  for (let offset = content.indexOf(entry, start); offset !== -1 && offset + entry.length <= end; offset = content.indexOf(entry, offset + entry.length)) {
    if ((offset === 0 || content[offset - 1] === '\n') &&
        (offset + entry.length === content.length || content[offset + entry.length] === '\n')) offsets.push(offset);
  }
  return offsets;
}

export function createTimelineAnchor(content: string, header: string, entry: string): TimelineAnchor {
  const normalizedEntry = entry.replace(/\r\n/g, '\n');
  return { header, entry: normalizedEntry, occurrence: entryOffsets(content.replace(/\r\n/g, '\n'), header, normalizedEntry).length };
}

/** Resolve against the live editor, not a byte/character offset from the saved file. */
export function locateTimelineCursor(content: string, anchor: TimelineAnchor): { line: number; ch: number } | null {
  const normalized = content.replace(/\r\n/g, '\n');
  const offsets = entryOffsets(normalized, anchor.header, anchor.entry);
  const offset = offsets[anchor.occurrence - 1];
  if (offset === undefined) return null;
  const before = normalized.slice(0, offset + anchor.entry.length).split('\n');
  return { line: before.length - 1, ch: before[before.length - 1].length };
}

/** openFile can resolve before an already-open editor receives a vault update. */
export async function waitForTimelineCursor(read: () => string, anchor: TimelineAnchor): Promise<{ line: number; ch: number }> {
  for (let attempt = 0; attempt < 80; attempt++) {
    const position = locateTimelineCursor(read(), anchor);
    if (position) return position;
    await new Promise<void>(resolve => window.setTimeout(resolve, 25));
  }
  throw new Error('Timeline entry is not yet visible in the editor.');
}
