#!/usr/bin/env node

/**
 * Test script to interact with the Error Debugging MCP Server
 * This script simulates how an IDE would communicate with the MCP server
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MCPClient {
  constructor() {
    this.requestId = 1;
    this.server = null;
  }

  async startServer() {
    console.log('🚀 Starting MCP Server...');
    
    const serverPath = path.join(__dirname, 'dist', 'index.js');
    this.server = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: __dirname
    });

    this.server.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('📤 Server Output:', output);
    });

    this.server.stderr.on('data', (data) => {
      const error = data.toString();
      console.log('❌ Server Error:', error);
    });

    // Wait a moment for server to start
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('✅ MCP Server started');
  }

  async sendRequest(method, params = {}) {
    const request = {
      jsonrpc: '2.0',
      id: this.requestId++,
      method,
      params
    };

    console.log(`📨 Sending request: ${method}`);
    console.log('📋 Request details:', JSON.stringify(request, null, 2));

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, 10000);

      this.server.stdin.write(JSON.stringify(request) + '\n');

      const responseHandler = (data) => {
        clearTimeout(timeout);
        try {
          const response = JSON.parse(data.toString());
          console.log('📬 Response received:', JSON.stringify(response, null, 2));
          resolve(response);
        } catch (error) {
          reject(error);
        }
        this.server.stdout.off('data', responseHandler);
      };

      this.server.stdout.on('data', responseHandler);
    });
  }

  async testErrorDetection() {
    console.log('\n🔍 Testing Error Detection...');
    
    try {
      // Test 1: List available tools
      console.log('\n--- Test 1: List Tools ---');
      const toolsResponse = await this.sendRequest('tools/list');
      
      // Test 2: Detect errors in our test file
      console.log('\n--- Test 2: Detect Errors ---');
      const testFilePath = path.join(__dirname, 'test-project', 'test-errors.ts');
      const detectResponse = await this.sendRequest('tools/call', {
        name: 'detect-errors',
        arguments: {
          source: 'typescript',
          filePath: testFilePath
        }
      });

      // Test 3: Analyze a specific error
      console.log('\n--- Test 3: Analyze Error ---');
      const analyzeResponse = await this.sendRequest('tools/call', {
        name: 'analyze-error',
        arguments: {
          errorMessage: "Parameter 'userData' implicitly has an 'any' type.",
          file: testFilePath,
          line: 14,
          column: 21
        }
      });

      console.log('\n✅ All tests completed successfully!');
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
    }
  }

  async cleanup() {
    if (this.server) {
      console.log('\n🧹 Cleaning up...');
      this.server.kill();
      console.log('✅ Server stopped');
    }
  }
}

// Main execution
async function main() {
  console.log('🎯 MCP Server Integration Test');
  console.log('================================\n');

  const client = new MCPClient();

  try {
    await client.startServer();
    await client.testErrorDetection();
  } catch (error) {
    console.error('💥 Test suite failed:', error);
  } finally {
    await client.cleanup();
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n⚠️  Received SIGINT, cleaning up...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⚠️  Received SIGTERM, cleaning up...');
  process.exit(0);
});

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { MCPClient };
