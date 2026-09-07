import { getTimeEmoji } from './timeEmoji';
import { headingTitle, markdownHeadings } from './markdownSections';

export function validateTimelineHeader(header: string, syncHeaders: string[]): 'empty' | 'invalid' | 'conflict' | null {
  if (!header.trim()) return 'empty';
  if (/[\r\n]/.test(header) || !headingTitle(header) || /^#+$/.test(headingTitle(header))) return 'invalid';
  if (syncHeaders.some(value => headingTitle(value) === headingTitle(header))) return 'conflict';
  return null;
}

/** Append a record, normalizing only trailing section spacing; the cursor follows the input. */
export function insertTimelineEntry(content: string, header: string, text: string, date: Date): { content: string; cursor: number } {
  const title = headingTitle(header);
  const headings = markdownHeadings(content);
  const matches = headings.filter(h => h.level === 2 && h.title === title);
  if (matches.length > 1) throw new Error('duplicate');
  const heading = matches[0];
  const eol = content.includes('\r\n') ? '\r\n' : '\n';
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  const body = text.trim().replace(/\r\n?/g, '\n').split('\n').join(`${eol}  `);
  const entry = `- ${getTimeEmoji(date.getHours())} ${time} ${body}`;
  // Stop at any heading, keeping entries directly under the configured heading.
  const end = heading ? (headings.find(h => h.start >= heading.end)?.start ?? content.length) : content.length;
  let prefix = content.slice(0, end);
  if (heading) {
    const section = content.slice(heading.end, end);
    // An indented continuation belongs to its preceding list item. A plain
    // paragraph needs a blank line before the new list instead.
    const lastTopLevelLine = section.split(/\r?\n/).filter(line => /^(\S)/.test(line)).pop();
    const followsList = !!lastTopLevelLine && /^(?:[-*+]|\d+[.)])\s/.test(lastTopLevelLine);
    prefix = prefix.replace(/(?:\r?\n[ \t]*)+$/, '');
    prefix += followsList ? eol : eol + eol;
  } else {
    if (!prefix.endsWith(eol) && prefix) prefix += eol;
    if (!prefix.endsWith(eol + eol) && prefix) prefix += eol;
    prefix += `## ${title}${eol}${eol}`;
  }
  const inserted = prefix + entry;
  return { content: inserted + eol + eol + content.slice(end), cursor: inserted.length };
}
