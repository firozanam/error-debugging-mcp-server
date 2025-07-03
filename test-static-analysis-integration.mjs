#!/usr/bin/env node

import { writeFileSync, unlinkSync } from 'fs';
import path from 'path';

// Import the detector directly for integration testing
import { StaticAnalysisDetector } from './dist/detectors/static-analysis-detector.js';

async function testStaticAnalysisIntegration() {
  console.log('🧪 Testing Static Analysis Integration');
  console.log('=====================================\n');

  // Create a comprehensive test file with various issues
  const testCode = `
function complexFunction(data) {
    const password = "hardcoded123";
    const apiKey = "sk-1234567890abcdef";
    console.log("Starting processing");
    
    // Deep nesting (4+ levels)
    if (data) {
        if (data.length > 0) {
            if (data[0]) {
                if (data[0].value) {
                    if (data[0].value.nested) {
                        console.log("Very deep nesting");
                        return data[0].value.nested;
                    }
                }
            }
        }
    }
    
    // SQL injection vulnerability
    const query = "SELECT * FROM users WHERE id = " + userId;
    
    // XSS vulnerability
    document.getElementById("content").innerHTML = userInput + "<script>";
    
    // Performance issues
    for (let i = 0; i < array.length; i++) {
        console.log(array[i]);
    }
    
    // Unused variable
    const unusedVar = "never used";
    
    return null;
}

// Duplicate code blocks
if (true) {
    console.log("duplicate block");
}

if (true) {
    console.log("duplicate block");
}

// Long function (this will be over the threshold)
function veryLongFunction() {
    console.log("line 1");
    console.log("line 2");
    console.log("line 3");
    console.log("line 4");
    console.log("line 5");
    console.log("line 6");
    console.log("line 7");
    console.log("line 8");
    console.log("line 9");
    console.log("line 10");
    console.log("line 11");
    console.log("line 12");
}

// Eval usage (dangerous)
eval("console.log('dangerous')");
`;

  const testFile = path.join(process.cwd(), 'integration-test.js');
  writeFileSync(testFile, testCode);
  console.log('📁 Created comprehensive test file:', testFile);

  try {
    // Create detector with production-like configuration
    const detectorOptions = {
      enabled: true,
      includeWarnings: true,
      filters: {
        severities: [],
        categories: [],
        excludeFiles: [],
        excludePatterns: []
      },
      bufferSize: 1000,
      realTime: false
    };

    const staticAnalysisConfig = {
      enabled: true,
      astAnalysis: {
        enabled: true,
        maxFileSize: 1024 * 1024,
        timeout: 5000
      },
      patternAnalysis: {
        enabled: true,
        securityPatterns: true,
        performancePatterns: true,
        qualityPatterns: true
      },
      qualityMetrics: {
        enabled: true,
        cyclomaticComplexity: { threshold: 3 },
        functionLength: { threshold: 10 },
        nestingDepth: { threshold: 3 }
      }
    };

    console.log('🔧 Creating detector with production configuration...');
    const detector = new StaticAnalysisDetector(detectorOptions, staticAnalysisConfig);

    console.log('🚀 Starting detector...');
    await detector.start();

    console.log('🔍 Running static analysis...');
    const errors = await detector.detectErrors(testFile);

    console.log(`\n✅ Static Analysis Complete - Found ${errors.length} issues:\n`);

    // Group errors by category
    const errorsByCategory = {};
    errors.forEach(error => {
      const category = error.category;
      if (!errorsByCategory[category]) {
        errorsByCategory[category] = [];
      }
      errorsByCategory[category].push(error);
    });

    // Display results by category
    Object.keys(errorsByCategory).forEach(category => {
      console.log(`📋 ${category.toUpperCase()} Issues (${errorsByCategory[category].length}):`);
      errorsByCategory[category].forEach((error, i) => {
        const line = error.stackTrace[0]?.location?.line || error.context?.metadata?.line || 'unknown';
        const file = path.basename(error.stackTrace[0]?.location?.file || error.context?.metadata?.file || 'unknown');
        console.log(`  ${i + 1}. [${error.severity}] ${error.message}`);
        console.log(`     📍 ${file}:${line}`);
      });
      console.log('');
    });

    // Test specific issue types
    console.log('🔍 Verification of specific issue detection:');
    
    const hasSecurityIssues = errors.some(e => e.message.includes('credentials') || e.message.includes('injection') || e.message.includes('XSS'));
    console.log(`  🔒 Security issues detected: ${hasSecurityIssues ? '✅' : '❌'}`);
    
    const hasComplexityIssues = errors.some(e => e.message.includes('complexity'));
    console.log(`  🧮 Complexity issues detected: ${hasComplexityIssues ? '✅' : '❌'}`);
    
    const hasPerformanceIssues = errors.some(e => e.message.includes('performance') || e.message.includes('length'));
    console.log(`  ⚡ Performance issues detected: ${hasPerformanceIssues ? '✅' : '❌'}`);
    
    const hasCodeQualityIssues = errors.some(e => e.message.includes('unused') || e.message.includes('console.log'));
    console.log(`  📝 Code quality issues detected: ${hasCodeQualityIssues ? '✅' : '❌'}`);
    
    const hasNestingIssues = errors.some(e => e.message.includes('nesting'));
    console.log(`  🏗️  Nesting issues detected: ${hasNestingIssues ? '✅' : '❌'}`);

    await detector.stop();
    console.log('\n🛑 Detector stopped');

  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    // Clean up
    unlinkSync(testFile);
    console.log('🧹 Cleaned up test file');
  }
}

testStaticAnalysisIntegration().catch(console.error);
