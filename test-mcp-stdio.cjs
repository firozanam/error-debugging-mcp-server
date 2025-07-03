#!/usr/bin/env node

const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

async function testStdio() {
  console.log('Testing stdio when spawned by MCP client...');
  
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['test-stdio-detection.js'],
    env: process.env
  });

  // Just start the transport to see what happens
  try {
    await transport.start();
    console.log('Transport started');
    
    // Read some data
    setTimeout(() => {
      transport.close();
      console.log('Transport closed');
    }, 2000);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testStdio().catch(console.error);
