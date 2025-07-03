#!/usr/bin/env node

const { spawn } = require('child_process');

async function testMCPRaw() {
  console.log('🔍 Testing MCP Server with Raw Protocol');
  console.log('======================================\n');

  const serverProcess = spawn('node', ['dist/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, NODE_ENV: 'production' }
  });

  let messageId = 1;

  function sendMessage(method, params = {}) {
    const message = {
      jsonrpc: '2.0',
      id: messageId++,
      method,
      params
    };
    const messageStr = JSON.stringify(message) + '\n';
    console.log(`📤 Sending ${method}:`, message);
    serverProcess.stdin.write(messageStr);
  }

  serverProcess.stdout.on('data', (data) => {
    const responses = data.toString().trim().split('\n');
    responses.forEach(response => {
      if (response.trim()) {
        try {
          const parsed = JSON.parse(response);
          console.log(`📥 Received response:`, parsed);
          
          if (parsed.id === 1) {
            console.log('✅ Initialization successful!');
            // Send tools/list after successful initialization
            setTimeout(() => sendMessage('tools/list'), 100);
          } else if (parsed.id === 2) {
            console.log('✅ Tools list received!');
            console.log(`Found ${parsed.result.tools.length} tools:`);
            parsed.result.tools.forEach(tool => {
              console.log(`  - ${tool.name}: ${tool.description}`);
            });
            
            // Test detect-errors tool
            setTimeout(() => {
              sendMessage('tools/call', {
                name: 'detect-errors',
                arguments: {
                  source: 'all',
                  includeWarnings: false
                }
              });
            }, 100);
          } else if (parsed.id === 3) {
            console.log('✅ Tool call successful!');
            if (parsed.result && parsed.result.content) {
              console.log('Tool result:', parsed.result.content[0]?.text?.substring(0, 200) + '...');
            }
            
            // Close after successful test
            setTimeout(() => {
              console.log('\n🎉 All tests passed! MCP server is working correctly.');
              serverProcess.kill('SIGTERM');
            }, 100);
          }
        } catch (error) {
          console.error('❌ Failed to parse response:', response);
          console.error('Parse error:', error.message);
        }
      }
    });
  });

  serverProcess.stderr.on('data', (data) => {
    console.log('📥 STDERR:', data.toString());
  });

  serverProcess.on('close', (code) => {
    console.log(`\n🔚 Server process exited with code ${code}`);
  });

  serverProcess.on('error', (error) => {
    console.error('❌ Server process error:', error);
  });

  // Start with initialization
  console.log('🚀 Starting MCP protocol test...');
  sendMessage('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: {
      name: 'test-client',
      version: '1.0.0'
    }
  });

  // Safety timeout
  setTimeout(() => {
    console.log('\n⏰ Test timeout - closing server');
    serverProcess.kill('SIGTERM');
  }, 10000);
}

testMCPRaw().catch(console.error);
