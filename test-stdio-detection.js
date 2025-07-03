#!/usr/bin/env node

console.log('Testing stdio detection...');
console.log('process.stdin.isTTY:', process.stdin.isTTY);
console.log('process.stdout.isTTY:', process.stdout.isTTY);
console.log('process.stderr.isTTY:', process.stderr.isTTY);

// Test writing to different streams
console.log('This goes to stdout');
console.error('This goes to stderr');
process.stdout.write('Direct stdout write\n');
process.stderr.write('Direct stderr write\n');
