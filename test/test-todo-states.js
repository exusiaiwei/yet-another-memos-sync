/**
 * Test cases for todo state management
 * Run with: node test-todo-states.js
 */

const { mergeTodoStates, isSameExceptTodoStates, extractTodoItems } = require('../src/utils/todoStateManager');

function runTests() {
  console.log('🧪 Testing Todo State Management...\n');

  // Test 1: Basic todo extraction
  console.log('Test 1: Extract todo items');
  const content1 = `Some text
- [ ] Task 1
- [x] Task 2
- [ ] Task 3
More text`;

  const todos1 = extractTodoItems(content1);
  console.log('Extracted todos:', Array.from(todos1.entries()));
  console.assert(todos1.get('Task 1') === false, 'Task 1 should be incomplete');
  console.assert(todos1.get('Task 2') === true, 'Task 2 should be complete');
  console.assert(todos1.get('Task 3') === false, 'Task 3 should be incomplete');
  console.log('✅ Test 1 passed\n');

  // Test 2: Same content except todo states
  console.log('Test 2: Compare content with different todo states');
  const local = `- [ ] Buy milk
- [x] Write report
- [ ] Call mom`;

  const remote = `- [ ] Buy milk
- [ ] Write report
- [ ] Call mom`;

  console.assert(isSameExceptTodoStates(local, remote), 'Should be same except todo states');
  console.log('✅ Test 2 passed\n');

  // Test 3: Merge todo states
  console.log('Test 3: Merge todo states');
  const localContent = `- [ ] Buy milk
- [x] Write report
- [ ] Call mom`;

  const remoteContent = `- [ ] Buy milk
- [ ] Write report
- [ ] Call mom
- [ ] New task`;

  const merged = mergeTodoStates(localContent, remoteContent);
  console.log('Local content:', localContent);
  console.log('Remote content:', remoteContent);
  console.log('Merged content:', merged);

  console.assert(merged.includes('- [x] Write report'), 'Should preserve completed status');
  console.assert(merged.includes('- [ ] New task'), 'Should include new tasks');
  console.log('✅ Test 3 passed\n');

  // Test 4: Real memo scenario
  console.log('Test 4: Real memo scenario');
  const localMemo = `🎯 Daily Tasks ^1634567890

- [ ] Review pull requests
- [x] Update documentation
- [ ] Fix bug #123

Planning to finish these today!`;

  const remoteMemo = `🎯 Daily Tasks ^1634567890

- [ ] Review pull requests
- [ ] Update documentation
- [ ] Fix bug #123
- [ ] Deploy to staging

Planning to finish these today!`;

  const mergedMemo = mergeTodoStates(localMemo, remoteMemo);
  console.log('Local memo:', localMemo);
  console.log('Remote memo:', remoteMemo);
  console.log('Merged memo:', mergedMemo);

  console.assert(mergedMemo.includes('- [x] Update documentation'), 'Should preserve completion');
  console.assert(mergedMemo.includes('- [ ] Deploy to staging'), 'Should include new task');
  console.log('✅ Test 4 passed\n');

  console.log('🎉 All tests passed!');
}

// Only run if this file is executed directly
if (require.main === module) {
  runTests();
}
