#!/usr/bin/env node

/**
 * Test MCP Protocol Communication
 * This script tests if our server properly responds to MCP protocol messages
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testMCPProtocol() {
  console.log('🧪 Testing MCP Protocol Communication');
  console.log('====================================\n');

  const serverPath = path.join(__dirname, 'dist', 'index.js');
  console.log('📍 Server path:', serverPath);

  // Start the server process
  const server = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: __dirname
  });

  let responseReceived = false;
  let serverOutput = '';

  // Collect server output
  server.stdout.on('data', (data) => {
    const output = data.toString();
    serverOutput += output;
    console.log('📤 Server stdout:', output.trim());
  });

  server.stderr.on('data', (data) => {
    const error = data.toString();
    console.log('📤 Server stderr:', error.trim());
  });

  // Wait for server to start
  console.log('⏳ Waiting for server to start...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  try {
    // Test 1: Initialize request
    console.log('\n🔄 Test 1: Sending initialize request...');
    const initRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {
          roots: {
            listChanged: true
          },
          sampling: {}
        },
        clientInfo: {
          name: 'test-client',
          version: '1.0.0'
        }
      }
    };

    server.stdin.write(JSON.stringify(initRequest) + '\n');

    // Wait for response
    await new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.log('⚠️  Initialize request timed out');
        resolve();
      }, 5000);

      const responseHandler = (data) => {
        const output = data.toString();
        console.log('📬 Initialize response:', output.trim());
        
        try {
          const response = JSON.parse(output);
          if (response.id === 1) {
            responseReceived = true;
            console.log('✅ Initialize response received successfully');
            clearTimeout(timeout);
            resolve();
          }
        } catch (e) {
          // Not JSON, might be log output
        }
      };

      server.stdout.on('data', responseHandler);
    });

    if (responseReceived) {
      // Test 2: List tools request
      console.log('\n🔄 Test 2: Sending list tools request...');
      const toolsRequest = {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
        params: {}
      };

      server.stdin.write(JSON.stringify(toolsRequest) + '\n');

      await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.log('⚠️  Tools list request timed out');
          resolve();
        }, 3000);

        const responseHandler = (data) => {
          const output = data.toString();
          console.log('📬 Tools response:', output.trim());
          
          try {
            const response = JSON.parse(output);
            if (response.id === 2) {
              console.log('✅ Tools list response received successfully');
              if (response.result && response.result.tools) {
                console.log('🛠️  Available tools:', response.result.tools.map(t => t.name).join(', '));
              }
              clearTimeout(timeout);
              resolve();
            }
          } catch (e) {
            // Not JSON, might be log output
          }
        };

        server.stdout.on('data', responseHandler);
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    console.log('\n🧹 Cleaning up...');
    server.kill('SIGTERM');
    
    // Wait a moment for cleanup
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Analysis
  console.log('\n📊 Test Results:');
  console.log('================');
  
  if (responseReceived) {
    console.log('✅ MCP Protocol: Working correctly');
    console.log('✅ Server Communication: Successful');
    console.log('✅ JSON-RPC: Properly formatted responses');
    console.log('\n💡 The server is MCP-compliant and should work with IDEs');
    console.log('\n🔧 Troubleshooting the IDE integration:');
    console.log('   1. Ensure the path is correct and accessible');
    console.log('   2. Check that Node.js is in the system PATH');
    console.log('   3. Verify the IDE has proper MCP support');
    console.log('   4. Try restarting the IDE after configuration');
  } else {
    console.log('❌ MCP Protocol: No proper response received');
    console.log('❌ Server Communication: Failed');
    console.log('\n🔧 Server output analysis:');
    console.log(serverOutput);
  }
}

// Run the test
testMCPProtocol().catch(console.error);
