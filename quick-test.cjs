#!/usr/bin/env node

const { spawn } = require('child_process');

async function quickTest() {
  console.log('🔍 Quick Static Analysis Test');
  console.log('=============================\n');

  // Start the server process
  const server = spawn('node', ['dist/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: __dirname,
    env: { ...process.env, NODE_ENV: 'development' }
  });

  let serverOutput = '';

  // Collect server output
  server.stdout.on('data', (data) => {
    const output = data.toString();
    serverOutput += output;
    console.log('📤 Server:', output.trim());
  });

  server.stderr.on('data', (data) => {
    const error = data.toString();
    console.log('📤 Server stderr:', error.trim());
  });

  // Wait for server to start and show enabled detectors
  console.log('⏳ Waiting for server to start...');
  await new Promise(resolve => setTimeout(resolve, 8000));

  // Kill the server
  server.kill('SIGTERM');
  
  console.log('\n📊 Analysis:');
  if (serverOutput.includes('staticAnalysis')) {
    console.log('✅ Static Analysis detector is enabled!');
  } else {
    console.log('❌ Static Analysis detector is NOT enabled');
  }
  
  if (serverOutput.includes('enabledDetectors')) {
    const match = serverOutput.match(/"enabledDetectors":\[(.*?)\]/);
    if (match) {
      console.log('🔧 Enabled detectors:', match[1]);
    }
  }
}

quickTest().catch(console.error);
