#!/usr/bin/env node

import { spawn } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import path from 'path';

async function testMCPStaticAnalysis() {
  console.log('🧪 Testing MCP Static Analysis Tool');
  console.log('===================================\n');

  // Create a test file with various issues
  const testCode = `
function complexFunction(data) {
    const password = "hardcoded123";
    console.log("Starting processing");
    
    if (data) {
        if (data.length > 0) {
            if (data[0]) {
                if (data[0].value) {
                    console.log("Deep nesting");
                    return data[0].value;
                }
            }
        }
    }
    
    // SQL injection vulnerability
    const query = "SELECT * FROM users WHERE id = " + userId;
    
    // XSS vulnerability
    document.getElementById("content").innerHTML = userInput + "<script>";
    
    return null;
}

// Duplicate code
if (true) {
    console.log("duplicate");
}

if (true) {
    console.log("duplicate");
}
`;

  const testFile = path.join(process.cwd(), 'mcp-test-file.js');
  writeFileSync(testFile, testCode);
  console.log('📁 Created test file:', testFile);

  try {
    // Test the MCP tool
    console.log('\n🔍 Testing detect-errors tool...');
    
    const mcpRequest = {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: "detect-errors",
        arguments: {
          source: "staticAnalysis",
          files: [testFile],
          includeWarnings: true
        }
      }
    };

    console.log('📤 Sending MCP request:', JSON.stringify(mcpRequest, null, 2));

    // Spawn the MCP server process
    const serverProcess = spawn('node', ['dist/index.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd()
    });

    let responseData = '';
    let errorData = '';

    serverProcess.stdout.on('data', (data) => {
      responseData += data.toString();
    });

    serverProcess.stderr.on('data', (data) => {
      errorData += data.toString();
    });

    // Send the request
    serverProcess.stdin.write(JSON.stringify(mcpRequest) + '\n');

    // Wait for response
    await new Promise((resolve) => {
      setTimeout(() => {
        serverProcess.kill();
        resolve();
      }, 5000);
    });

    console.log('\n📥 Server response:');
    if (responseData) {
      try {
        const response = JSON.parse(responseData);
        console.log(JSON.stringify(response, null, 2));
        
        if (response.result && response.result.content) {
          const content = response.result.content[0];
          if (content.text) {
            const errors = JSON.parse(content.text);
            console.log(`\n✅ Found ${errors.length} static analysis issues:`);
            errors.forEach((error, i) => {
              console.log(`  ${i + 1}. ${error.severity}: ${error.message}`);
              console.log(`     File: ${error.stackTrace[0]?.location?.file || 'unknown'}`);
              console.log(`     Line: ${error.stackTrace[0]?.location?.line || 'unknown'}`);
            });
          }
        }
      } catch (parseError) {
        console.log('Raw response:', responseData);
      }
    }

    if (errorData) {
      console.log('\n📋 Server logs:');
      console.log(errorData);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    // Clean up
    unlinkSync(testFile);
    console.log('\n🧹 Cleaned up test file');
  }
}

testMCPStaticAnalysis().catch(console.error);
