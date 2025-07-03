#!/usr/bin/env node

// Test the security patterns directly
const testCode = `
const password = "secret123";
console.log("debug");
document.getElementById("content").innerHTML = userInput + "<script>";
`;

console.log('🧪 Testing Security Patterns');
console.log('============================\n');

// Test hardcoded credentials pattern
const credentialsPattern = /(?:password|pwd|pass|secret|key|token)\s*[:=]\s*["'][^"']{3,}["']/gi;
console.log('🔍 Testing credentials pattern...');
console.log('Pattern:', credentialsPattern);
console.log('Test code:', testCode);

const credentialsMatch = testCode.match(credentialsPattern);
console.log('Credentials match:', credentialsMatch);

// Test XSS pattern
const xssPattern = /innerHTML\s*=\s*.*\+|document\.write\s*\(.*\+|\.html\s*\(.*\+/gi;
console.log('\n🔍 Testing XSS pattern...');
console.log('Pattern:', xssPattern);

const xssMatch = testCode.match(xssPattern);
console.log('XSS match:', xssMatch);

// Test console.log pattern (should be in performance patterns)
console.log('\n🔍 Testing console.log detection...');
const consoleMatch = testCode.includes('console.log');
console.log('Console.log found:', consoleMatch);

// Test line-by-line matching
console.log('\n🔍 Testing line-by-line matching...');
const lines = testCode.split('\n');
lines.forEach((line, index) => {
  console.log(`Line ${index + 1}: "${line.trim()}"`);
  
  if (credentialsPattern.test(line)) {
    console.log(`  ✅ Credentials pattern matches line ${index + 1}`);
  }
  
  if (xssPattern.test(line)) {
    console.log(`  ✅ XSS pattern matches line ${index + 1}`);
  }
  
  if (line.includes('console.log')) {
    console.log(`  ✅ Console.log found in line ${index + 1}`);
  }
});

console.log('\n✅ Pattern testing completed');
