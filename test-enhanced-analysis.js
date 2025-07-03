#!/usr/bin/env node

const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');
const { spawn } = require('child_process');
const path = require('path');

async function testEnhancedStaticAnalysis() {
  console.log('🔬 Testing Enhanced Static Analysis');
  console.log('===================================\n');

  // Start the MCP server
  const serverProcess = spawn('node', ['dist/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: __dirname,
    env: { ...process.env, NODE_ENV: 'development' }
  });

  const transport = new StdioClientTransport({
    reader: serverProcess.stdout,
    writer: serverProcess.stdin
  });

  const client = new Client({
    name: 'test-client',
    version: '1.0.0'
  }, {
    capabilities: {}
  });

  try {
    await client.connect(transport);
    console.log('✅ Connected to MCP server\n');

    // Test enhanced static analysis on our test file
    console.log('🔍 Testing enhanced static analysis on test-static-analysis.js...\n');
    
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'detect-errors',
        arguments: {
          source: 'all',
          files: ['test-static-analysis.js'],
          includeWarnings: true
        }
      }
    });

    console.log('📊 Analysis Results:');
    console.log('===================\n');

    if (result.content && result.content[0] && result.content[0].text) {
      const response = JSON.parse(result.content[0].text);
      
      if (response.errors && response.errors.length > 0) {
        console.log(`✅ Detected ${response.errors.length} issues:\n`);
        
        response.errors.forEach((error, index) => {
          console.log(`${index + 1}. ${error.severity.toUpperCase()}: ${error.message}`);
          console.log(`   📍 Location: ${error.file}:${error.line}:${error.column || 1}`);
          console.log(`   🏷️  Category: ${error.category || 'general'}`);
          console.log(`   🔧 Source: ${error.source}\n`);
        });

        // Analyze categories
        const categories = {};
        response.errors.forEach(error => {
          const cat = error.category || 'general';
          categories[cat] = (categories[cat] || 0) + 1;
        });

        console.log('📈 Issue Categories:');
        Object.entries(categories).forEach(([category, count]) => {
          console.log(`   • ${category}: ${count} issues`);
        });

      } else {
        console.log('❌ No issues detected (this might indicate a problem with the analysis)');
      }
    } else {
      console.log('❌ No response content received');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await client.close();
    serverProcess.kill();
    console.log('\n✅ Test completed');
  }
}

testEnhancedStaticAnalysis().catch(console.error);
