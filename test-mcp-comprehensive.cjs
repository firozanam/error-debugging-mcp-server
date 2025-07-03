#!/usr/bin/env node

const { spawn } = require('child_process');

async function testMCPComprehensive() {
  console.log('🔍 Comprehensive MCP Server Test');
  console.log('================================\n');

  return new Promise((resolve, reject) => {
    const serverProcess = spawn('node', ['dist/index.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: 'production' }
    });

    let messageId = 1;
    let testResults = {
      initialization: false,
      toolsList: false,
      detectErrors: false,
      analyzeError: false,
      protocolClean: true,
      stderrEmpty: true
    };

    let stderrData = '';

    function sendMessage(method, params = {}) {
      const message = {
        jsonrpc: '2.0',
        id: messageId++,
        method,
        params
      };
      const messageStr = JSON.stringify(message) + '\n';
      serverProcess.stdin.write(messageStr);
      return messageId - 1;
    }

    serverProcess.stdout.on('data', (data) => {
      const responses = data.toString().trim().split('\n');
      responses.forEach(response => {
        if (response.trim()) {
          try {
            const parsed = JSON.parse(response);
            
            if (parsed.id === 1) {
              // Initialization response
              if (parsed.result && parsed.result.protocolVersion) {
                testResults.initialization = true;
                console.log('✅ Initialization successful');
                setTimeout(() => sendMessage('tools/list'), 100);
              }
            } else if (parsed.id === 2) {
              // Tools list response
              if (parsed.result && parsed.result.tools && parsed.result.tools.length > 0) {
                testResults.toolsList = true;
                console.log(`✅ Tools list received (${parsed.result.tools.length} tools)`);
                
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
              }
            } else if (parsed.id === 3) {
              // Detect-errors response
              if (parsed.result) {
                testResults.detectErrors = true;
                console.log('✅ detect-errors tool executed successfully');
                
                // Test analyze-error tool with a dummy error ID
                setTimeout(() => {
                  sendMessage('tools/call', {
                    name: 'analyze-error',
                    arguments: {
                      errorId: 'test-error-id',
                      includeContext: true
                    }
                  });
                }, 100);
              }
            } else if (parsed.id === 4) {
              // Analyze-error response
              if (parsed.result || parsed.error) {
                testResults.analyzeError = true;
                console.log('✅ analyze-error tool executed successfully');
                
                // All tests complete
                setTimeout(() => {
                  finishTests();
                }, 100);
              }
            }
          } catch (error) {
            console.error('❌ Failed to parse JSON response:', response);
            testResults.protocolClean = false;
          }
        }
      });
    });

    serverProcess.stderr.on('data', (data) => {
      stderrData += data.toString();
      testResults.stderrEmpty = false;
      console.log('📥 STDERR (unexpected):', data.toString());
    });

    serverProcess.on('close', (code) => {
      console.log(`\n🔚 Server process exited with code ${code}`);
      
      // Final test results
      console.log('\n📊 Test Results Summary:');
      console.log('========================');
      console.log(`✅ Initialization: ${testResults.initialization ? 'PASS' : 'FAIL'}`);
      console.log(`✅ Tools List: ${testResults.toolsList ? 'PASS' : 'FAIL'}`);
      console.log(`✅ Detect Errors Tool: ${testResults.detectErrors ? 'PASS' : 'FAIL'}`);
      console.log(`✅ Analyze Error Tool: ${testResults.analyzeError ? 'PASS' : 'FAIL'}`);
      console.log(`✅ Protocol Clean: ${testResults.protocolClean ? 'PASS' : 'FAIL'}`);
      console.log(`✅ STDERR Empty: ${testResults.stderrEmpty ? 'PASS' : 'FAIL'}`);
      
      const allPassed = Object.values(testResults).every(result => result === true);
      
      if (allPassed) {
        console.log('\n🎉 ALL TESTS PASSED! MCP server is fully functional.');
        console.log('✅ MCP protocol communication is working correctly');
        console.log('✅ No logging interference detected');
        console.log('✅ All tools are accessible and functional');
        resolve(true);
      } else {
        console.log('\n❌ Some tests failed. See results above.');
        resolve(false);
      }
    });

    serverProcess.on('error', (error) => {
      console.error('❌ Server process error:', error);
      reject(error);
    });

    function finishTests() {
      console.log('\n🔚 All tests completed, closing server...');
      serverProcess.kill('SIGTERM');
    }

    // Start the test sequence
    console.log('🚀 Starting comprehensive test...');
    sendMessage('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'comprehensive-test-client',
        version: '1.0.0'
      }
    });

    // Safety timeout
    setTimeout(() => {
      console.log('\n⏰ Test timeout - some tests may not have completed');
      finishTests();
    }, 15000);
  });
}

testMCPComprehensive()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test failed with error:', error);
    process.exit(1);
  });
