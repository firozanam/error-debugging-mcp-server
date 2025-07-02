/**
 * Performance benchmarks for Error Debugging MCP Server
 */

import { performance } from 'perf_hooks';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { DevelopmentEnvironment } from '../src/debug/development-environment.js';
import { SupportedLanguage } from '../src/types/languages.js';

interface BenchmarkResult {
  name: string;
  duration: number;
  memoryUsage: {
    before: NodeJS.MemoryUsage;
    after: NodeJS.MemoryUsage;
    peak: number;
  };
  operations: number;
  opsPerSecond: number;
}

class PerformanceBenchmark {
  private results: BenchmarkResult[] = [];
  private devEnv?: DevelopmentEnvironment;

  async setup(): Promise<void> {
    console.log('🚀 Setting up performance benchmarks...');
    
    this.devEnv = new DevelopmentEnvironment({
      enableErrorDetection: true,
      enablePerformanceMonitoring: true,
      enableDebugSessions: true,
      logLevel: 'warn' // Reduce logging overhead
    });

    await this.devEnv.start();
    console.log('✅ Development environment started');
  }

  async cleanup(): Promise<void> {
    if (this.devEnv) {
      await this.devEnv.dispose();
    }
    console.log('🧹 Cleanup completed');
  }

  async runBenchmark(
    name: string,
    operation: () => Promise<void>,
    iterations: number = 100
  ): Promise<BenchmarkResult> {
    console.log(`\n📊 Running benchmark: ${name} (${iterations} iterations)`);

    // Warm up
    for (let i = 0; i < Math.min(10, iterations); i++) {
      await operation();
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    const memoryBefore = process.memoryUsage();
    let peakMemory = memoryBefore.heapUsed;

    const startTime = performance.now();

    for (let i = 0; i < iterations; i++) {
      await operation();
      
      // Track peak memory usage
      const currentMemory = process.memoryUsage().heapUsed;
      if (currentMemory > peakMemory) {
        peakMemory = currentMemory;
      }
    }

    const endTime = performance.now();
    const memoryAfter = process.memoryUsage();

    const duration = endTime - startTime;
    const opsPerSecond = (iterations / duration) * 1000;

    const result: BenchmarkResult = {
      name,
      duration,
      memoryUsage: {
        before: memoryBefore,
        after: memoryAfter,
        peak: peakMemory
      },
      operations: iterations,
      opsPerSecond
    };

    this.results.push(result);

    console.log(`   Duration: ${duration.toFixed(2)}ms`);
    console.log(`   Ops/sec: ${opsPerSecond.toFixed(2)}`);
    console.log(`   Memory delta: ${((memoryAfter.heapUsed - memoryBefore.heapUsed) / 1024 / 1024).toFixed(2)}MB`);

    return result;
  }

  async benchmarkErrorDetection(): Promise<void> {
    if (!this.devEnv) throw new Error('Environment not initialized');

    const testCodes = {
      typescript: `
        interface User {
          name: string;
          age: number;
        }
        const user: User = {
          name: "John",
          age: "30" // Type error
        };
        function greet(user: User) {
          return user.nonExistentProperty; // Property error
        }
      `,
      javascript: `
        function calculate(items) {
          let total = 0;
          for (let i = 0; i <= items.length; i++) { // Off-by-one error
            total += items[i].price; // Potential undefined access
          }
          return total;
        }
        const result = calculate(); // Missing argument
      `,
      python: `
def calculate_average(numbers):
    if len(numbers) = 0:  # Syntax error
        return 0
    return sum(numbers) / len(numbers)

def process_data(data)  # Missing colon
    result = []
    for item in data:
        result.append(item.upper())
    return result
      `
    };

    // Benchmark TypeScript error detection
    await this.runBenchmark(
      'TypeScript Error Detection',
      async () => {
        await this.devEnv!.detectErrors(testCodes.typescript, SupportedLanguage.TYPESCRIPT, 'test.ts');
      },
      50
    );

    // Benchmark JavaScript error detection
    await this.runBenchmark(
      'JavaScript Error Detection',
      async () => {
        await this.devEnv!.detectErrors(testCodes.javascript, SupportedLanguage.JAVASCRIPT, 'test.js');
      },
      100
    );

    // Benchmark Python error detection
    await this.runBenchmark(
      'Python Error Detection',
      async () => {
        await this.devEnv!.detectErrors(testCodes.python, SupportedLanguage.PYTHON, 'test.py');
      },
      50
    );

    // Benchmark concurrent error detection
    await this.runBenchmark(
      'Concurrent Error Detection',
      async () => {
        const promises = [
          this.devEnv!.detectErrors(testCodes.typescript, SupportedLanguage.TYPESCRIPT, 'test1.ts'),
          this.devEnv!.detectErrors(testCodes.javascript, SupportedLanguage.JAVASCRIPT, 'test2.js'),
          this.devEnv!.detectErrors(testCodes.python, SupportedLanguage.PYTHON, 'test3.py')
        ];
        await Promise.all(promises);
      },
      25
    );
  }

  async benchmarkPerformanceMonitoring(): Promise<void> {
    if (!this.devEnv) throw new Error('Environment not initialized');

    const perfMonitor = this.devEnv.getPerformanceMonitor();

    // Benchmark metric recording
    await this.runBenchmark(
      'Performance Metric Recording',
      async () => {
        perfMonitor.recordTiming('test-operation', Math.random() * 100);
        perfMonitor.recordCounter('test-counter', Math.floor(Math.random() * 10));
        perfMonitor.recordMemoryUsage('test-memory', Math.random() * 1024 * 1024);
      },
      1000
    );

    // Benchmark profile creation and completion
    await this.runBenchmark(
      'Performance Profile Lifecycle',
      async () => {
        const profileId = perfMonitor.startProfile('test-profile');
        await new Promise(resolve => setTimeout(resolve, 1)); // Simulate work
        perfMonitor.endProfile(profileId);
      },
      500
    );

    // Benchmark nested profiles
    await this.runBenchmark(
      'Nested Performance Profiles',
      async () => {
        const parentId = perfMonitor.startProfile('parent-profile');
        const childId = perfMonitor.startProfile('child-profile', parentId);
        await new Promise(resolve => setTimeout(resolve, 1));
        perfMonitor.endProfile(childId);
        perfMonitor.endProfile(parentId);
      },
      200
    );
  }

  async benchmarkDebugSessions(): Promise<void> {
    if (!this.devEnv) throw new Error('Environment not initialized');

    const debugManager = this.devEnv.getDebugSessionManager();

    // Benchmark debug session creation and cleanup
    await this.runBenchmark(
      'Debug Session Lifecycle',
      async () => {
        try {
          const sessionId = await this.devEnv!.createDebugSession(SupportedLanguage.JAVASCRIPT, {
            type: 'launch',
            program: 'test.js'
          });
          await debugManager.stopSession(sessionId);
        } catch (error) {
          // Expected to fail in test environment, but we measure the overhead
        }
      },
      10
    );
  }

  generateReport(): void {
    console.log('\n📈 Performance Benchmark Report');
    console.log('================================');

    const totalDuration = this.results.reduce((sum, result) => sum + result.duration, 0);
    const avgOpsPerSecond = this.results.reduce((sum, result) => sum + result.opsPerSecond, 0) / this.results.length;

    console.log(`\nOverall Statistics:`);
    console.log(`Total benchmark time: ${totalDuration.toFixed(2)}ms`);
    console.log(`Average ops/second: ${avgOpsPerSecond.toFixed(2)}`);

    console.log(`\nDetailed Results:`);
    this.results.forEach(result => {
      console.log(`\n${result.name}:`);
      console.log(`  Duration: ${result.duration.toFixed(2)}ms`);
      console.log(`  Operations: ${result.operations}`);
      console.log(`  Ops/second: ${result.opsPerSecond.toFixed(2)}`);
      console.log(`  Memory delta: ${((result.memoryUsage.after.heapUsed - result.memoryUsage.before.heapUsed) / 1024 / 1024).toFixed(2)}MB`);
      console.log(`  Peak memory: ${(result.memoryUsage.peak / 1024 / 1024).toFixed(2)}MB`);
    });

    // Save results to file
    try {
      mkdirSync('benchmarks/results', { recursive: true });
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `benchmark-${timestamp}.json`;
      const filepath = join('benchmarks/results', filename);
      
      writeFileSync(filepath, JSON.stringify({
        timestamp: new Date().toISOString(),
        environment: {
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
          memory: process.memoryUsage()
        },
        summary: {
          totalDuration,
          avgOpsPerSecond,
          totalOperations: this.results.reduce((sum, r) => sum + r.operations, 0)
        },
        results: this.results
      }, null, 2));

      console.log(`\n💾 Results saved to: ${filepath}`);
    } catch (error) {
      console.error('Failed to save results:', error);
    }
  }
}

async function main(): Promise<void> {
  const benchmark = new PerformanceBenchmark();

  try {
    await benchmark.setup();

    console.log('\n🔍 Running Error Detection Benchmarks...');
    await benchmark.benchmarkErrorDetection();

    console.log('\n📊 Running Performance Monitoring Benchmarks...');
    await benchmark.benchmarkPerformanceMonitoring();

    console.log('\n🐛 Running Debug Session Benchmarks...');
    await benchmark.benchmarkDebugSessions();

    benchmark.generateReport();

  } catch (error) {
    console.error('❌ Benchmark failed:', error);
    process.exit(1);
  } finally {
    await benchmark.cleanup();
  }
}

// Run benchmarks if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
