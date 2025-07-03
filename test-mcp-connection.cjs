#!/usr/bin/env node

const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

async function testMCPConnection() {
  console.log('🔍 Testing MCP Connection');
  console.log('========================\n');

  const transport = new StdioClientTransport({
    command: 'node',
    args: ['dist/index.js'],
    env: { 
      ...process.env, 
      NODE_ENV: 'production',  // Use production to minimize logging
      MCP_LOG_LEVEL: 'error'   // Only log errors
    }
  });

  const client = new Client({
    name: 'test-client',
    version: '1.0.0'
  }, {
    capabilities: {}
  });

  try {
    console.log('🚀 Connecting to MCP server...');
    await client.connect(transport);
    console.log('✅ Connected to MCP server\n');

    // Test 1: List tools
    console.log('🔧 Test 1: Listing available tools...');
    const toolsResult = await client.request({
      method: 'tools/list',
      params: {}
    });

    console.log('✅ Tools listed successfully:');
    toolsResult.tools.forEach(tool => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });
    console.log('');

    // Test 2: Call detect-errors tool
    console.log('🔍 Test 2: Testing detect-errors tool...');
    const detectResult = await client.request({
      method: 'tools/call',
      params: {
        name: 'detect-errors',
        arguments: {
          source: 'all',
          includeWarnings: false
        }
      }
    });

    console.log('✅ detect-errors tool executed successfully');
    if (detectResult.content && detectResult.content[0]) {
      const response = JSON.parse(detectResult.content[0].text);
      console.log(`  Found ${response.errors?.length || 0} errors`);
    }
    console.log('');

    // Test 3: List resources
    console.log('📚 Test 3: Listing available resources...');
    const resourcesResult = await client.request({
      method: 'resources/list',
      params: {}
    });

    console.log('✅ Resources listed successfully:');
    resourcesResult.resources.forEach(resource => {
      console.log(`  - ${resource.uri}: ${resource.name}`);
    });
    console.log('');

    console.log('🎉 All MCP tests passed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    try {
      await client.close();
    } catch (error) {
      console.log('Error closing client:', error.message);
    }
    console.log('\n✅ Test session completed');
  }
}

testMCPConnection().catch(console.error);
