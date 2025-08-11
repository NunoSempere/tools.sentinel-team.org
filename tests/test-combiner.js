// Test script for markdown combiner
import { combineMarkdownFiles } from '../src/deps/markdown-combiner.js';
import fs from 'fs';

// Read test markdown files
const file1 = fs.readFileSync('tests/file1.md', 'utf8');
const file2 = fs.readFileSync('tests/file2.md', 'utf8');
const file3 = fs.readFileSync('tests/file3.md', 'utf8');

console.log('Testing markdown combiner...');
console.log('================================');

// Test combining all three files
const result = combineMarkdownFiles([file1, file2, file3]);

if (result.error) {
  console.error('Error:', result.error);
} else {
  console.log(result.message);
  console.log('\nCombined markdown:');
  console.log('==================');
  console.log(result.combined);
  
  // Write combined result to file
  fs.writeFileSync('tests/combined-output.md', result.combined);
  console.log('\nCombined markdown saved to tests/combined-output.md');
}

// Test error cases
console.log('\nTesting error cases:');
console.log('====================');

// Test with empty array
const emptyResult = combineMarkdownFiles([]);
console.log('Empty array test:', emptyResult.error);

// Test with non-string content
const invalidResult = combineMarkdownFiles(['valid', 123, 'also valid']);
console.log('Invalid content test:', invalidResult.error);