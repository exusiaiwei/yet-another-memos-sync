import { transformMemoToMarkdown } from '../src/utils/memoTransformer';

// Test multi-line memo transformation
const testMemo = {
  timestamp: 1726221600, // 2024-09-13 12:00:00
  content: `测试多行内容
这是第二行
这是第三行

这是第五行（有空行）`,
  resources: []
};

const result = transformMemoToMarkdown(testMemo);
console.log('Transformed memo:');
console.log(result.content);
console.log('\nExpected format:');
console.log('- 🌅 12:00 测试多行内容 #daily-record ^1726221600');
console.log('  这是第二行');
console.log('  这是第三行');
console.log('  这是第五行（有空行）');
