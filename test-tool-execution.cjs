#!/usr/bin/env node

const { spawn } = require('child_process');

async function testToolExecution() {
  console.log('🔍 Testing Tool Execution');
  console.log('=========================\n');

  return new Promise((resolve) => {
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
      console.log(`📤 Sending: ${method} (id: ${messageId - 1})`);
      serverProcess.stdin.write(messageStr);
      return messageId - 1;
    }

    serverProcess.stdout.on('data', (data) => {
      const responses = data.toString().trim().split('\n');
      responses.forEach(response => {
        if (response.trim()) {
          try {
            const parsed = JSON.parse(response);
            console.log(`📥 Response (id: ${parsed.id}):`, {
              hasResult: !!parsed.result,
              hasError: !!parsed.error,
              resultType: parsed.result ? typeof parsed.result : 'none',
              errorMessage: parsed.error ? parsed.error.message : 'none'
            });
            
            if (parsed.id === 1) {
              console.log('✅ Initialization complete, sending tools/list...');
              setTimeout(() => sendMessage('tools/list'), 100);
            } else if (parsed.id === 2) {
              console.log('✅ Tools list complete, testing detect-errors...');
              setTimeout(() => {
                sendMessage('tools/call', {
                  name: 'detect-errors',
                  arguments: {
                    source: 'console',
                    includeWarnings: false
                  }
                });
              }, 100);
            } else if (parsed.id === 3) {
              console.log('✅ detect-errors tool completed!');
              if (parsed.result && parsed.result.content) {
                console.log('Tool result preview:', parsed.result.content[0]?.text?.substring(0, 100) + '...');
              }
              
              setTimeout(() => {
                console.log('\n🎉 Tool execution test successful!');
                serverProcess.kill('SIGTERM');
              }, 100);
            }
          } catch (error) {
            console.error('❌ JSON parse error:', error.message);
            console.error('Raw response:', response);
          }
        }
      });
    });

    serverProcess.stderr.on('data', (data) => {
      console.log('📥 STDERR:', data.toString());
    });

    serverProcess.on('close', (code) => {
      console.log(`\n🔚 Server exited with code ${code}`);
      resolve();
    });

    serverProcess.on('error', (error) => {
      console.error('❌ Process error:', error);
      resolve();
    });

    // Start test
    console.log('🚀 Starting tool execution test...');
    sendMessage('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'tool-test-client',
        version: '1.0.0'
      }
    });

    // Extended timeout for tool execution
    setTimeout(() => {
      console.log('\n⏰ Extended timeout reached');
      serverProcess.kill('SIGTERM');
    }, 30000);
  });
}

testToolExecution().catch(console.error);
