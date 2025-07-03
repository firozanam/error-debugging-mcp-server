#!/usr/bin/env node

const { spawn } = require('child_process');

async function debugMCPProtocol() {
  console.log('🔍 Debugging MCP Protocol Communication');
  console.log('======================================\n');

  const serverProcess = spawn('node', ['dist/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, NODE_ENV: 'production' }
  });

  let stdoutData = '';
  let stderrData = '';

  serverProcess.stdout.on('data', (data) => {
    const chunk = data.toString();
    stdoutData += chunk;
    console.log('📤 STDOUT:', JSON.stringify(chunk));
  });

  serverProcess.stderr.on('data', (data) => {
    const chunk = data.toString();
    stderrData += chunk;
    console.log('📥 STDERR:', JSON.stringify(chunk));
  });

  serverProcess.on('close', (code) => {
    console.log(`\n🔚 Server process exited with code ${code}`);
    console.log('\n📊 Summary:');
    console.log('STDOUT length:', stdoutData.length);
    console.log('STDERR length:', stderrData.length);
    
    if (stdoutData) {
      console.log('\n📤 Complete STDOUT:');
      console.log(stdoutData);
    }
    
    if (stderrData) {
      console.log('\n📥 Complete STDERR:');
      console.log(stderrData);
    }
  });

  // Send MCP initialization message
  console.log('🚀 Sending MCP initialization...');
  const initMessage = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    }
  };

  const initMessageStr = JSON.stringify(initMessage) + '\n';
  console.log('📤 Sending:', initMessageStr);
  serverProcess.stdin.write(initMessageStr);

  // Wait a bit then send tools/list
  setTimeout(() => {
    console.log('\n🔧 Sending tools/list request...');
    const toolsMessage = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {}
    };
    
    const toolsMessageStr = JSON.stringify(toolsMessage) + '\n';
    console.log('📤 Sending:', toolsMessageStr);
    serverProcess.stdin.write(toolsMessageStr);
    
    // Close after a delay
    setTimeout(() => {
      console.log('\n🔚 Closing server...');
      serverProcess.kill('SIGTERM');
    }, 3000);
  }, 2000);
}

debugMCPProtocol().catch(console.error);
