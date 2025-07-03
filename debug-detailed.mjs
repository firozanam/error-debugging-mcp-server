#!/usr/bin/env node

import { StaticAnalysisDetector } from './dist/detectors/static-analysis-detector.js';
import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import path from 'path';

async function debugDetailed() {
  console.log('🔬 Detailed Static Analysis Debug');
  console.log('=================================\n');

  try {
    // Create detector instance with debug config
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
        complexityThreshold: 1  // Very low threshold
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
    };

    const detector = new StaticAnalysisDetector(detectorOptions, staticAnalysisConfig);

    console.log('✅ Detector created');

    // Check initial buffer state
    console.log('📊 Initial buffer size:', detector.getBufferedErrors().length);

    // Start the detector
    await detector.start();
    console.log('✅ Detector started');
    console.log('📊 Buffer after start:', detector.getBufferedErrors().length);

    // Create a very simple test file that should definitely trigger issues
    const simpleCode = `
function test() {
    const password = "secret123";
    console.log("debug");
    if (true) {
        if (true) {
            if (true) {
                console.log("nested");
            }
        }
    }
}
`;

    const tempFile = path.join(process.cwd(), 'debug-temp.js');
    writeFileSync(tempFile, simpleCode);
    console.log('📁 Created test file:', tempFile);

    // Clear buffer before analysis
    detector.clearBuffer();
    console.log('🧹 Cleared buffer');

    // Test the analysis directly
    console.log('\n🔍 Running detectErrors...');
    const errors = await detector.detectErrors(tempFile);
    console.log(`📊 detectErrors returned: ${errors.length} errors`);

    if (errors.length > 0) {
      console.log('\n✅ Found issues:');
      errors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error.severity}: ${error.message}`);
        console.log(`     Category: ${error.category}`);
        console.log(`     Line: ${error.stackTrace[0]?.location?.line || error.context?.metadata?.line || 'unknown'}`);
        console.log(`     File: ${error.stackTrace[0]?.location?.file || error.context?.metadata?.file || 'unknown'}`);
      });
    } else {
      console.log('\n❌ No issues found');
      
      // Check buffer state
      console.log('📊 Buffer size after analysis:', detector.getBufferedErrors().length);
      
      // Try to manually test the analysis methods
      console.log('\n🧪 Testing analysis methods manually...');
      
      // Check if the detector has the enhanced methods
      console.log('Has analyzeWithAST:', typeof detector.analyzeWithAST === 'function');
      console.log('Has analyzeWithPatterns:', typeof detector.analyzeWithPatterns === 'function');
      console.log('Has analyzeCodeQuality:', typeof detector.analyzeCodeQuality === 'function');
      
      // Check configuration
      console.log('\n🔧 Configuration check:');
      console.log('AST analysis enabled:', detector.config?.astAnalysis?.enabled);
      console.log('Pattern analysis enabled:', detector.config?.patternAnalysis?.enabled);
      console.log('Quality metrics enabled:', detector.config?.qualityMetrics?.enabled);
    }

    // Clean up
    unlinkSync(tempFile);
    await detector.stop();
    console.log('\n✅ Debug completed');

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

debugDetailed().catch(console.error);
