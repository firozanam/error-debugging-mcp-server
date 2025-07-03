// Test file for enhanced static analysis capabilities
// This file contains various code issues that should be detected

// Security vulnerabilities
const password = "hardcoded123"; // Should detect hardcoded credentials
const query = "SELECT * FROM users WHERE id = " + userId; // Should detect SQL injection
document.getElementById("content").innerHTML = userInput + "<script>"; // Should detect XSS

// Performance issues
function inefficientLoop() {
    const items = getItems();
    for (let i = 0; i < items.length; i++) { // Should detect inefficient loop
        console.log(items[i]); // Should detect console.log
    }
}

// Code quality issues
function veryLongFunctionNameThatDoesTooManyThingsAndShouldBeRefactored() {
    let unusedVariable = "never used"; // Should detect unused variable
    
    // Deep nesting - should detect excessive nesting
    if (true) {
        if (true) {
            if (true) {
                if (true) {
                    if (true) {
                        console.log("Too deep!");
                    }
                }
            }
        }
    }
    
    // Magic numbers
    const result = value * 3.14159 + 42 + 1000; // Should detect magic numbers
    
    // TODO comment
    // TODO: Fix this function - it's too complex
    
    // Long line that exceeds the recommended line length limit and should be broken up into multiple lines for better readability
    
    return result;
}

// Dangerous function usage
function dangerousCode() {
    eval("console.log('dangerous')"); // Should detect eval usage
}

// Memory leak potential
setInterval(() => {
    console.log("This might leak memory");
}, 1000); // Should detect setInterval without clearInterval

// Duplicate code
const duplicateLine = "This line appears multiple times";
const anotherVar = duplicateLine;
const yetAnother = "This line appears multiple times"; // Duplicate

// Weak cryptography
const crypto = require('crypto');
const hash = crypto.createHash('md5'); // Should detect weak crypto

// Command injection potential
const exec = require('child_process').exec;
exec('ls ' + userInput); // Should detect command injection

// Complex function with high cyclomatic complexity
function complexFunction(a, b, c, d) {
    if (a > 0) {
        if (b > 0) {
            if (c > 0) {
                if (d > 0) {
                    return a + b;
                } else if (d < 0) {
                    return a - b;
                } else {
                    return a * b;
                }
            } else if (c < 0) {
                return a / b;
            } else {
                return a % b;
            }
        } else if (b < 0) {
            return a ** b;
        } else {
            return Math.sqrt(a);
        }
    } else if (a < 0) {
        return Math.abs(a);
    } else {
        return 0;
    }
}

// Synchronous file operations
const fs = require('fs');
const data = fs.readFileSync('file.txt'); // Should detect sync operation

// Path traversal vulnerability
const path = require('path');
const filePath = path.join(baseDir, '../../../etc/passwd'); // Should detect path traversal
