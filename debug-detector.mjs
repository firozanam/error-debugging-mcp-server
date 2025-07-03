#!/usr/bin/env node

import { StaticAnalysisDetector } from './dist/detectors/static-analysis-detector.js';
import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import path from 'path';

async function debugDetector() {
  console.log('🔧 Debugging Static Analysis Detector');
  console.log('=====================================\n');

  try {
    // Create detector instance with debug config
    const detector = new StaticAnalysisDetector({
      workspaceRoot: process.cwd(),
      config: {
        staticAnalysis: {
          enabled: true,
          astAnalysis: {
            enabled: true,
            complexityThreshold: 1  // Very low threshold to catch everything
          },
          patternAnalysis: {
            enabled: true,
            securityPatterns: true,
            performancePatterns: true
          },
          qualityMetrics: {
            enabled: true,
            cyclomaticComplexity: { threshold: 1 },
            functionLength: { threshold: 5 },
            nestingDepth: { threshold: 1 }
          }
        }
      }
    });

    console.log('✅ Detector created with debug config');

    // Start the detector
    await detector.start();
    console.log('✅ Detector started');

    // Test with a simple inline code first
    console.log('\n🧪 Testing with simple inline code...');
    
    const simpleCode = `
function testFunction() {
    const password = "secret123";
    if (true) {
        if (true) {
            console.log("nested");
        }
    }
}
`;

    // Write test code to a temporary file
    const tempFile = path.join(process.cwd(), 'temp-test.js');
    writeFileSync(tempFile, simpleCode);

    console.log('📁 Created temporary test file');
    console.log('📝 Code to analyze:');
    console.log(simpleCode);

    // Run detection
    console.log('\n🔍 Running analysis on simple code...');
    const errors1 = await detector.detectErrors(tempFile);
    console.log(`📊 Found ${errors1.length} issues in simple code`);

    if (errors1.length > 0) {
      errors1.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error.severity}: ${error.message}`);
        console.log(`     Category: ${error.category}`);
        console.log(`     Line: ${error.line}`);
      });
    }

    // Now test with the actual test file
    console.log('\n🔍 Testing with actual test file...');
    const testFilePath = path.join(process.cwd(), 'test-static-analysis.js');
    const errors2 = await detector.detectErrors(testFilePath);
    console.log(`📊 Found ${errors2.length} issues in test file`);

    if (errors2.length > 0) {
      errors2.slice(0, 10).forEach((error, i) => {
        console.log(`  ${i + 1}. ${error.severity}: ${error.message}`);
        console.log(`     Category: ${error.category}`);
        console.log(`     Line: ${error.line}`);
      });
    }

    // Test individual analysis methods
    console.log('\n🔬 Testing individual analysis methods...');
    
    const fileContent = readFileSync(testFilePath, 'utf-8');
    console.log(`📊 File content length: ${fileContent.length}`);

    // Check if the detector has the methods we expect
    console.log('\n🔍 Checking detector methods...');
    console.log('Has runStaticAnalysis:', typeof detector.runStaticAnalysis === 'function');
    console.log('Has detectErrors:', typeof detector.detectErrors === 'function');

    // Clean up
    unlinkSync(tempFile);
    await detector.stop();
    console.log('\n✅ Debug completed');

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

debugDetector().catch(console.error);
