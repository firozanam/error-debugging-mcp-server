#!/usr/bin/env node

const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

async function debugStaticAnalysis() {
  console.log('🔍 Debugging Static Analysis Configuration');
  console.log('==========================================\n');

  // Check if test file exists
  const testFilePath = path.join(__dirname, 'test-static-analysis.js');
  console.log(`📁 Test file path: ${testFilePath}`);
  
  try {
    const stats = fs.statSync(testFilePath);
    console.log(`✅ Test file exists (${stats.size} bytes)\n`);
  } catch (error) {
    console.log(`❌ Test file not found: ${error.message}\n`);
    return;
  }

  // Use StdioClientTransport to spawn and connect to server
  console.log('🚀 Starting MCP server...');

  const transport = new StdioClientTransport({
    command: 'node',
    args: ['dist/index.js'],
    env: { ...process.env, NODE_ENV: 'development' }
  });

  const client = new Client({
    name: 'debug-client',
    version: '1.0.0'
  }, {
    capabilities: {}
  });

  try {
    await client.connect(transport);
    console.log('✅ Connected to MCP server\n');

    // First, let's list available tools
    console.log('🔧 Listing available tools...');
    const toolsResult = await client.request({
      method: 'tools/list',
      params: {}
    });

    console.log('Available tools:', toolsResult.tools.map(t => t.name).join(', '));
    console.log('');

    // Test with minimal parameters first
    console.log('🔍 Testing detect-errors with minimal parameters...');
    
    const result1 = await client.request({
      method: 'tools/call',
      params: {
        name: 'detect-errors',
        arguments: {
          source: 'all'
        }
      }
    });

    console.log('📊 Result 1 (all sources):');
    if (result1.content && result1.content[0]) {
      const response1 = JSON.parse(result1.content[0].text);
      console.log(`   Found ${response1.errors?.length || 0} errors`);
      if (response1.errors?.length > 0) {
        console.log('   First few errors:');
        response1.errors.slice(0, 3).forEach((error, i) => {
          console.log(`   ${i + 1}. ${error.message} (${error.source})`);
        });
      }
    }
    console.log('');

    // Test with static-analysis source specifically
    console.log('🔍 Testing detect-errors with static-analysis source...');
    
    const result2 = await client.request({
      method: 'tools/call',
      params: {
        name: 'detect-errors',
        arguments: {
          source: 'static-analysis'
        }
      }
    });

    console.log('📊 Result 2 (static-analysis only):');
    if (result2.content && result2.content[0]) {
      const response2 = JSON.parse(result2.content[0].text);
      console.log(`   Found ${response2.errors?.length || 0} errors`);
      if (response2.errors?.length > 0) {
        console.log('   Static analysis errors:');
        response2.errors.slice(0, 5).forEach((error, i) => {
          console.log(`   ${i + 1}. ${error.message} (${error.file}:${error.line})`);
        });
      }
    }
    console.log('');

    // Test with specific file
    console.log('🔍 Testing detect-errors with specific file...');
    
    const result3 = await client.request({
      method: 'tools/call',
      params: {
        name: 'detect-errors',
        arguments: {
          source: 'static-analysis',
          files: [testFilePath]
        }
      }
    });

    console.log('📊 Result 3 (specific file):');
    if (result3.content && result3.content[0]) {
      const response3 = JSON.parse(result3.content[0].text);
      console.log(`   Found ${response3.errors?.length || 0} errors`);
      if (response3.errors?.length > 0) {
        console.log('   File-specific errors:');
        response3.errors.forEach((error, i) => {
          console.log(`   ${i + 1}. ${error.severity}: ${error.message}`);
          console.log(`      📍 ${error.file}:${error.line}`);
          console.log(`      🏷️  ${error.category || 'general'}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    try {
      await client.close();
    } catch (error) {
      console.log('Error closing client:', error.message);
    }
    console.log('\n✅ Debug session completed');
  }
}

debugStaticAnalysis().catch(console.error);
