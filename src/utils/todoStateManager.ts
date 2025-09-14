/**
 * Todo state preservation utilities
 * Handles merging todo checkbox states between local and remote content
 */

/**
 * Extract todo items with their states from content
 */
export function extractTodoItems(content: string): Map<string, boolean> {
  const todoMap = new Map<string, boolean>();
  const lines = content.split('\n');

  for (const line of lines) {
    // Match todo items: - [ ] or - [x] or - [X]
    const todoMatch = line.match(/^(\s*-\s*)\[([ xX])\]\s*(.+)$/);
    if (todoMatch) {
      const [, prefix, state, text] = todoMatch;
      const isCompleted = state.toLowerCase() === 'x';
      const normalizedText = text.trim();
      todoMap.set(normalizedText, isCompleted);
    }
  }

  return todoMap;
}

/**
 * Merge todo states: preserve local completion status when merging with remote content
 */
export function mergeTodoStates(localContent: string, remoteContent: string): string {
  const localTodos = extractTodoItems(localContent);

  if (localTodos.size === 0) {
    // No todos in local content, return remote as-is
    return remoteContent;
  }

  const lines = remoteContent.split('\n');
  const mergedLines: string[] = [];

  for (const line of lines) {
    const todoMatch = line.match(/^(\s*-\s*)\[([ xX])\]\s*(.+)$/);

    if (todoMatch) {
      const [, prefix, , text] = todoMatch;
      const normalizedText = text.trim();

      // Check if we have local state for this todo
      if (localTodos.has(normalizedText)) {
        const isCompleted = localTodos.get(normalizedText);
        const state = isCompleted ? 'x' : ' ';
        mergedLines.push(`${prefix}[${state}] ${text}`);
      } else {
        // New todo from remote, keep original state
        mergedLines.push(line);
      }
    } else {
      // Not a todo line, keep as-is
      mergedLines.push(line);
    }
  }

  return mergedLines.join('\n');
}

/**
 * Check if two memo contents are essentially the same except for todo states
 */
export function isSameExceptTodoStates(content1: string, content2: string): boolean {
  // Normalize todo states in both contents
  const normalize = (content: string) => {
    return content.replace(/^(\s*-\s*)\[([ xX])\](\s*.+)$/gm, '$1[ ]$3');
  };

  return normalize(content1) === normalize(content2);
}
