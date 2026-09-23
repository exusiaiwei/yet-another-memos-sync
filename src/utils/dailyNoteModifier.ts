/**
 * Daily Note Modifier - handles updating daily notes with memos
 */

import { mergeTodoStates, isSameExceptTodoStates } from './todoStateManager';

import { headingTitle, markdownHeadings } from './markdownSections';

export class DailyNoteModifier {
  private dailyMemosHeader: string;

  constructor(dailyMemosHeader: string) {
    this.dailyMemosHeader = dailyMemosHeader;
  }

  /**
   * Modify daily note content with fetched memos
   * Uses smart incremental update strategy to minimize file changes
   */
  modifyDailyNote(
    originFileContent: string,
    today: string,
    fetchedRecordList: Record<string, string>,
  ): string | undefined {
    const header = this.dailyMemosHeader;
    const headings = markdownHeadings(originFileContent);
    const level = header.trim().match(/^(#{1,6})\s/)?.[1].length ?? 1;
    const matches = headings.filter(h => h.level === level && h.title === headingTitle(header));
    if (matches.length !== 1) {
      console.warn(`Expected one header "${header}" for ${today}.`);
      return;
    }
    const section = matches[0];
    const from = section.end;
    const to = headings.find(h => h.start >= from)?.start ?? originFileContent.length;
    const localRecordContent = originFileContent.slice(from, to).trim();
    const prefix = originFileContent.slice(0, from);
    const suffix = originFileContent.slice(to);

    // Parse existing memos in the file
    const existingMemos = new Map<string, string>();
    if (localRecordContent) {
      const memoRegex = /\^(\d+)/g;
      let match;
      while ((match = memoRegex.exec(localRecordContent)) !== null) {
        const timestamp = match[1];
        // Find the full memo content for this timestamp
        const memoStartIndex = localRecordContent.lastIndexOf('\n', match.index);
        const memoEndIndex = localRecordContent.indexOf('\n- ', match.index);
        const fullMemoEndIndex = localRecordContent.indexOf('\n\n', match.index);

        let memoEnd = memoEndIndex !== -1 ? memoEndIndex : fullMemoEndIndex;
        if (memoEnd === -1) memoEnd = localRecordContent.length;

        const memoStart = memoStartIndex !== -1 ? memoStartIndex + 1 : 0;
        const memoContent = localRecordContent.slice(memoStart, memoEnd).trim();

        if (memoContent) {
          existingMemos.set(timestamp, memoContent);
        }
      }
    }

    // Determine what needs to be updated
    const updates = new Map<string, string>();
    const additions = new Map<string, string>();
    const deletions = new Set<string>();

    // Find additions and updates
    for (const [timestamp, content] of Object.entries(fetchedRecordList)) {
      const existingContent = existingMemos.get(timestamp);
      if (existingContent !== undefined) {
        const remoteContent = content;

        // Check if contents are the same except for todo states
        if (isSameExceptTodoStates(existingContent, remoteContent)) {
          // Merge todo states: preserve local completion status
          const mergedContent = mergeTodoStates(existingContent, remoteContent);
          if (mergedContent !== existingContent) {
            updates.set(timestamp, mergedContent);
          }
          // If merged content is same as existing, no update needed
        } else if (existingContent !== remoteContent) {
          // Content has changed beyond just todo states
          // Still merge todo states but update the content
          const mergedContent = mergeTodoStates(existingContent, remoteContent);
          updates.set(timestamp, mergedContent);
        }
        // If contents are exactly the same, no update needed
      } else {
        additions.set(timestamp, content);
      }
    }

    // Find deletions (existing memos not in fetched list). Safe to run
    // unconditionally: the caller always fetches the complete state for
    // this day within the sync window (see SimpleMemosPaginator /
    // DailyNoteManager.processMemos), so fetchedRecordList is authoritative
    // for `today`, not a partial/incremental slice.
    for (const timestamp of existingMemos.keys()) {
      if (!fetchedRecordList[timestamp]) {
        deletions.add(timestamp);
      }
    }

    // If no changes needed, return undefined to indicate no update
    if (updates.size === 0 && additions.size === 0 && deletions.size === 0) {
      return undefined;
    }

    // Create the updated content
    const allMemos = new Map<string, string>();

    // Keep existing memos that weren't deleted or updated
    for (const [timestamp, content] of existingMemos) {
      if (!deletions.has(timestamp) && !updates.has(timestamp)) {
        allMemos.set(timestamp, content);
      }
    }

    // Add updated memos
    for (const [timestamp, content] of updates) {
      allMemos.set(timestamp, content);
    }

    // Add new memos
    for (const [timestamp, content] of additions) {
      allMemos.set(timestamp, content);
    }

    // Sort by timestamp and create final content
    const sortedMemos = Array.from(allMemos.entries())
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([_, content]) => content)
      .join("\n");

    const modifiedFileContent = prefix + (prefix.endsWith("\n") ? "" : "\n") + `\n${sortedMemos}\n\n` + suffix;
    return modifiedFileContent;
  }
}
