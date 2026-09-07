/** Heading offsets outside fenced code and YAML frontmatter. */
export interface Heading {
  level: number;
  title: string;
  start: number;
  end: number;
}

export function headingTitle(value: string): string {
  return value.trim().replace(/^#{1,6}\s+/, '').replace(/\s+#+\s*$/, '').trim();
}

export function markdownHeadings(content: string): Heading[] {
  const headings: Heading[] = [];
  let offset = 0;
  let fence = '';
  let frontmatter = false;
  for (const line of content.split('\n')) {
    const text = line.replace(/\r$/, '');
    const end = Math.min(content.length, offset + line.length + 1);
    if (offset === 0 && text === '---') frontmatter = true;
    else if (frontmatter && /^(---|\.\.\.)$/.test(text)) frontmatter = false;
    else if (!frontmatter) {
      const marker = text.match(/^ {0,3}(`{3,}|~{3,})/);
      if (fence) {
        if (marker && marker[1][0] === fence[0] && marker[1].length >= fence.length && text.trim() === marker[1]) fence = '';
      } else if (marker) fence = marker[1];
      else {
        const match = text.match(/^ {0,3}(#{1,6})\s+(.+?)\s*$/);
        if (match) headings.push({ level: match[1].length, title: headingTitle(match[2]), start: offset, end });
      }
    }
    offset = end;
  }
  return headings;
}
