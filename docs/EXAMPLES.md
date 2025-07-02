# Error Debugging MCP Server - Examples

## Table of Contents

- [Basic Examples](#basic-examples)
- [Error Detection Examples](#error-detection-examples)
- [Debug Session Examples](#debug-session-examples)
- [Performance Monitoring Examples](#performance-monitoring-examples)
- [Integration Examples](#integration-examples)
- [Real-World Use Cases](#real-world-use-cases)

## Basic Examples

### Simple Error Detection

```typescript
import { DevelopmentEnvironment } from 'error-debugging-mcp-server';

async function basicErrorDetection() {
  const devEnv = new DevelopmentEnvironment({
    enableErrorDetection: true,
    logLevel: 'info'
  });

  await devEnv.start();

  // TypeScript code with errors
  const typescriptCode = `
    interface User {
      name: string;
      age: number;
    }

    const user: User = {
      name: "John",
      age: "30" // Type error: string instead of number
    };

    function greetUser(user: User) {
      console.log(\`Hello, \${user.name}!\`);
      return user.nonExistentProperty; // Property doesn't exist
    }
  `;

  try {
    const errors = await devEnv.detectErrors(typescriptCode, 'typescript', 'user.ts');
    
    console.log(`Found ${errors.length} errors:`);
    errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.severity.toUpperCase()}: ${error.message}`);
      console.log(`   Location: Line ${error.location.line}, Column ${error.location.column}`);
      console.log(`   Source: ${error.source}`);
      if (error.suggestions?.length) {
        console.log(`   Suggestions: ${error.suggestions.join(', ')}`);
      }
      console.log('');
    });
  } catch (error) {
    console.error('Error detection failed:', error);
  } finally {
    await devEnv.dispose();
  }
}

basicErrorDetection();
```

### Performance Monitoring Setup

```typescript
import { DevelopmentEnvironment } from 'error-debugging-mcp-server';

async function performanceMonitoringExample() {
  const devEnv = new DevelopmentEnvironment({
    enablePerformanceMonitoring: true,
    performanceMonitoringInterval: 5000,
    logLevel: 'debug'
  });

  await devEnv.start();

  const perfMonitor = devEnv.getPerformanceMonitor();

  // Start system monitoring
  perfMonitor.startMonitoring(2000);

  // Record custom metrics
  perfMonitor.recordTiming('database-query', 45, { table: 'users' });
  perfMonitor.recordCounter('api-requests', 1, { endpoint: '/api/users', method: 'GET' });
  perfMonitor.recordMemoryUsage('cache-size', 1024 * 1024, { type: 'redis' });

  // Create a performance profile
  const profileId = perfMonitor.startProfile('data-processing');

  // Simulate some work
  await new Promise(resolve => setTimeout(resolve, 100));
  perfMonitor.addMetric(profileId, 'items-processed', 1000, 'count');

  const profile = perfMonitor.endProfile(profileId);
  console.log(`Profile completed in ${profile?.duration}ms`);

  // Get statistics
  const stats = perfMonitor.getStatistics();
  console.log('Performance Statistics:', JSON.stringify(stats, null, 2));

  await devEnv.dispose();
}

performanceMonitoringExample();
```

## Error Detection Examples

### Multi-Language Error Detection

```typescript
async function multiLanguageDetection() {
  const devEnv = new DevelopmentEnvironment({
    enableErrorDetection: true
  });

  await devEnv.start();

  const codeExamples = [
    {
      language: 'javascript',
      code: `
        function calculateTotal(items) {
          let total = 0;
          for (let i = 0; i <= items.length; i++) { // Off-by-one error
            total += items[i].price; // Potential undefined access
          }
          return total;
        }
        
        const result = calculateTotal(); // Missing argument
      `,
      file: 'calculator.js'
    },
    {
      language: 'typescript',
      code: `
        interface Product {
          id: number;
          name: string;
          price: number;
        }

        function processProducts(products: Product[]): number {
          return products.reduce((sum, product) => {
            return sum + product.cost; // Property 'cost' doesn't exist
          }, 0);
        }

        const products: Product[] = [
          { id: 1, name: "Widget", price: "10.99" } // Type error
        ];
      `,
      file: 'products.ts'
    },
    {
      language: 'python',
      code: `
def calculate_average(numbers):
    if len(numbers) = 0:  # Syntax error: assignment instead of comparison
        return 0
    return sum(numbers) / len(numbers)

def process_data(data)  # Missing colon
    result = []
    for item in data:
        result.append(item.upper())
    return result

# Usage
numbers = [1, 2, 3, 4, 5]
average = calculate_average(numbers)
print(f"Average: {average}")
      `,
      file: 'calculator.py'
    }
  ];

  for (const example of codeExamples) {
    console.log(`\n=== ${example.language.toUpperCase()} ANALYSIS ===`);
    
    try {
      const errors = await devEnv.detectErrors(
        example.code, 
        example.language as any, 
        example.file
      );

      if (errors.length === 0) {
        console.log('✅ No errors found!');
      } else {
        console.log(`❌ Found ${errors.length} issue(s):`);
        errors.forEach((error, index) => {
          console.log(`  ${index + 1}. [${error.severity}] ${error.message}`);
          console.log(`     📍 ${error.location.file}:${error.location.line}:${error.location.column}`);
          if (error.code) {
            console.log(`     🔍 Code: ${error.code}`);
          }
        });
      }
    } catch (error) {
      console.log(`❌ Analysis failed: ${error.message}`);
    }
  }

  await devEnv.dispose();
}

multiLanguageDetection();
```

### Real-Time Error Monitoring

```typescript
import { watch } from 'fs';
import { readFile } from 'fs/promises';

async function realTimeErrorMonitoring() {
  const devEnv = new DevelopmentEnvironment({
    enableErrorDetection: true,
    logLevel: 'info'
  });

  await devEnv.start();

  // Watch for file changes
  const watchedFiles = ['src/**/*.ts', 'src/**/*.js'];
  
  devEnv.on('errorsDetected', (errors, language, filePath) => {
    console.log(`\n🔍 File changed: ${filePath}`);
    
    if (errors.length === 0) {
      console.log('✅ No errors detected');
    } else {
      console.log(`❌ Found ${errors.length} error(s):`);
      errors.forEach(error => {
        console.log(`  • ${error.message} (Line ${error.location.line})`);
      });
    }
  });

  // Simulate file watching (in real implementation, use chokidar or similar)
  const checkFile = async (filePath: string) => {
    try {
      const content = await readFile(filePath, 'utf8');
      const language = filePath.endsWith('.ts') ? 'typescript' : 'javascript';
      await devEnv.detectErrors(content, language as any, filePath);
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error.message);
    }
  };

  // Example: Check a file every 5 seconds
  setInterval(() => {
    checkFile('src/example.ts');
  }, 5000);

  console.log('Real-time error monitoring started. Press Ctrl+C to stop.');
}

realTimeErrorMonitoring();
```

## Debug Session Examples

### Node.js Debugging

```typescript
async function nodeJsDebugging() {
  const devEnv = new DevelopmentEnvironment({
    enableDebugSessions: true,
    enableErrorDetection: true
  });

  await devEnv.start();

  const debugManager = devEnv.getDebugSessionManager();

  try {
    // Create debug session for Node.js application
    const sessionId = await devEnv.createDebugSession('javascript', {
      type: 'launch',
      program: 'src/app.js',
      args: ['--port', '3000'],
      env: {
        NODE_ENV: 'development',
        DEBUG: 'app:*'
      },
      cwd: process.cwd()
    });

    console.log(`Debug session created: ${sessionId}`);

    // Set breakpoints
    const breakpoint1 = await debugManager.setBreakpoint(sessionId, 'src/app.js', 15);
    const breakpoint2 = await debugManager.setBreakpoint(
      sessionId, 
      'src/routes/users.js', 
      25, 
      1, 
      'req.user.id === "admin"' // Conditional breakpoint
    );

    console.log(`Breakpoints set: ${breakpoint1}, ${breakpoint2}`);

    // Start debugging
    await debugManager.continue(sessionId);

    // Simulate hitting a breakpoint
    setTimeout(async () => {
      try {
        // Get stack trace
        const stackTrace = await debugManager.getStackTrace(sessionId);
        console.log('Stack trace:', stackTrace);

        // Evaluate expressions
        const userVar = await debugManager.evaluateExpression(sessionId, 'req.user');
        console.log('User variable:', userVar);

        const calculation = await debugManager.evaluateExpression(sessionId, '2 + 2');
        console.log('Calculation result:', calculation);

        // Step through code
        await debugManager.stepOver(sessionId);
        await debugManager.stepInto(sessionId);

      } catch (error) {
        console.error('Debug operation failed:', error);
      }
    }, 2000);

  } catch (error) {
    console.error('Debug session failed:', error);
  }

  // Cleanup after 10 seconds
  setTimeout(async () => {
    await devEnv.dispose();
  }, 10000);
}

nodeJsDebugging();
```

### TypeScript Debugging with Source Maps

```typescript
async function typeScriptDebugging() {
  const devEnv = new DevelopmentEnvironment({
    enableDebugSessions: true
  });

  await devEnv.start();

  const debugManager = devEnv.getDebugSessionManager();

  try {
    const sessionId = await devEnv.createDebugSession('typescript', {
      type: 'launch',
      program: 'src/main.ts',
      outFiles: ['dist/**/*.js'],
      sourceMaps: true,
      smartStep: true,
      skipFiles: ['node_modules/**'],
      env: {
        TS_NODE_PROJECT: 'tsconfig.json'
      }
    });

    // Set breakpoints in TypeScript source
    await debugManager.setBreakpoint(sessionId, 'src/services/userService.ts', 42);
    await debugManager.setBreakpoint(sessionId, 'src/models/User.ts', 18);

    // Advanced debugging features
    const session = debugManager.getSession(sessionId);
    if (session) {
      console.log(`Debug session for ${session.language} is ${session.status}`);
    }

    // Monitor session events
    debugManager.on('sessionPaused', (sessionInfo) => {
      console.log(`Session ${sessionInfo.id} paused`);
    });

    debugManager.on('breakpointHit', (sessionId, breakpoint) => {
      console.log(`Breakpoint hit: ${breakpoint.file}:${breakpoint.line}`);
    });

  } catch (error) {
    console.error('TypeScript debugging failed:', error);
  }
}

typeScriptDebugging();
```

## Performance Monitoring Examples

### Application Performance Profiling

```typescript
async function applicationProfiling() {
  const devEnv = new DevelopmentEnvironment({
    enablePerformanceMonitoring: true,
    performanceMonitoringInterval: 1000
  });

  await devEnv.start();

  const perfMonitor = devEnv.getPerformanceMonitor();

  // Profile a complete application workflow
  const appProfileId = perfMonitor.startProfile('application-startup');

  // Database initialization
  const dbProfileId = perfMonitor.startProfile('database-init', appProfileId);
  await simulateAsyncOperation('database-connection', 150);
  await simulateAsyncOperation('schema-migration', 300);
  perfMonitor.endProfile(dbProfileId);

  // Cache initialization
  const cacheProfileId = perfMonitor.startProfile('cache-init', appProfileId);
  await simulateAsyncOperation('redis-connection', 50);
  await simulateAsyncOperation('cache-warmup', 200);
  perfMonitor.endProfile(cacheProfileId);

  // Server startup
  const serverProfileId = perfMonitor.startProfile('server-startup', appProfileId);
  await simulateAsyncOperation('route-registration', 25);
  await simulateAsyncOperation('middleware-setup', 75);
  perfMonitor.endProfile(serverProfileId);

  const appProfile = perfMonitor.endProfile(appProfileId);
  
  console.log('Application Startup Profile:');
  console.log(`Total time: ${appProfile?.duration}ms`);
  console.log(`Child profiles: ${appProfile?.children.length}`);

  // Analyze performance
  const metrics = perfMonitor.getMetrics();
  const timingMetrics = metrics.filter(m => m.unit === 'ms');
  
  console.log('\nPerformance Metrics:');
  timingMetrics.forEach(metric => {
    console.log(`${metric.name}: ${metric.value}ms`);
  });

  await devEnv.dispose();
}

async function simulateAsyncOperation(name: string, duration: number) {
  const start = Date.now();
  await new Promise(resolve => setTimeout(resolve, duration));
  const actualDuration = Date.now() - start;
  
  // Record the actual timing
  const perfMonitor = new (await import('error-debugging-mcp-server')).PerformanceMonitor();
  perfMonitor.recordTiming(name, actualDuration);
}

applicationProfiling();
```

### Memory and CPU Monitoring

```typescript
async function systemMonitoring() {
  const devEnv = new DevelopmentEnvironment({
    enablePerformanceMonitoring: true,
    performanceMonitoringInterval: 2000
  });

  await devEnv.start();

  const perfMonitor = devEnv.getPerformanceMonitor();

  // Set up system monitoring
  perfMonitor.on('systemMetrics', (metrics) => {
    const { memory, cpu } = metrics;
    
    console.log('\n📊 System Metrics:');
    console.log(`Memory - Heap Used: ${(memory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Memory - Heap Total: ${(memory.heapTotal / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Memory - RSS: ${(memory.rss / 1024 / 1024).toFixed(2)} MB`);
    console.log(`CPU - User: ${cpu.user}μs, System: ${cpu.system}μs`);
    
    // Alert on high memory usage
    if (memory.heapUsed > 100 * 1024 * 1024) { // 100MB
      console.log('⚠️  High memory usage detected!');
    }
  });

  // Simulate memory-intensive operations
  const memoryIntensiveWork = async () => {
    const profileId = perfMonitor.startProfile('memory-intensive-operation');
    
    // Create large arrays to simulate memory usage
    const largeArrays = [];
    for (let i = 0; i < 10; i++) {
      largeArrays.push(new Array(100000).fill(Math.random()));
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    perfMonitor.addMetric(profileId, 'arrays-created', largeArrays.length, 'count');
    perfMonitor.addMetric(profileId, 'memory-allocated', largeArrays.length * 100000 * 8, 'bytes');
    
    const profile = perfMonitor.endProfile(profileId);
    console.log(`Memory operation completed in ${profile?.duration}ms`);
    
    // Cleanup
    largeArrays.length = 0;
  };

  // Run memory-intensive work
  await memoryIntensiveWork();

  // Keep monitoring for 30 seconds
  setTimeout(async () => {
    const stats = perfMonitor.getStatistics();
    console.log('\n📈 Final Statistics:', JSON.stringify(stats, null, 2));
    await devEnv.dispose();
  }, 30000);
}

systemMonitoring();
```

## Integration Examples

### Express.js Middleware Integration

```typescript
import express from 'express';
import { DevelopmentEnvironment } from 'error-debugging-mcp-server';

async function expressIntegration() {
  const app = express();
  
  const devEnv = new DevelopmentEnvironment({
    enableErrorDetection: true,
    enablePerformanceMonitoring: true
  });

  await devEnv.start();

  // Error detection middleware
  app.use('/api/validate', async (req, res, next) => {
    const { code, language } = req.body;
    
    if (!code || !language) {
      return res.status(400).json({ error: 'Code and language are required' });
    }

    try {
      const errors = await devEnv.detectErrors(code, language);
      res.json({
        valid: errors.length === 0,
        errors: errors.map(error => ({
          message: error.message,
          line: error.location.line,
          column: error.location.column,
          severity: error.severity
        }))
      });
    } catch (error) {
      res.status(500).json({ error: 'Validation failed' });
    }
  });

  // Performance monitoring middleware
  app.use((req, res, next) => {
    const perfMonitor = devEnv.getPerformanceMonitor();
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      perfMonitor.recordTiming('http-request', duration, {
        method: req.method,
        path: req.path,
        status: res.statusCode.toString()
      });
    });
    
    next();
  });

  // Sample routes
  app.get('/health', (req, res) => {
    const stats = devEnv.getStatistics();
    res.json({
      status: 'healthy',
      environment: stats.environment,
      performance: stats.performance
    });
  });

  app.listen(3000, () => {
    console.log('Server running on port 3000');
    console.log('Try: POST /api/validate with { "code": "const x = 1;", "language": "javascript" }');
  });
}

expressIntegration();
```

### VS Code Extension Integration

```typescript
// VS Code extension example
import * as vscode from 'vscode';
import { DevelopmentEnvironment } from 'error-debugging-mcp-server';

export function activate(context: vscode.ExtensionContext) {
  const devEnv = new DevelopmentEnvironment({
    enableErrorDetection: true,
    logLevel: 'info'
  });

  let isActive = false;

  // Command to start error detection
  const startCommand = vscode.commands.registerCommand('errorDebugging.start', async () => {
    if (!isActive) {
      await devEnv.start();
      isActive = true;
      vscode.window.showInformationMessage('Error Debugging MCP Server started');
    }
  });

  // Command to analyze current file
  const analyzeCommand = vscode.commands.registerCommand('errorDebugging.analyze', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('No active editor');
      return;
    }

    const document = editor.document;
    const language = document.languageId;
    const source = document.getText();

    try {
      const errors = await devEnv.detectErrors(source, language as any, document.fileName);
      
      // Clear existing diagnostics
      const diagnostics: vscode.Diagnostic[] = [];
      
      // Convert errors to VS Code diagnostics
      errors.forEach(error => {
        const range = new vscode.Range(
          error.location.line - 1,
          error.location.column - 1,
          error.location.endLine ? error.location.endLine - 1 : error.location.line - 1,
          error.location.endColumn ? error.location.endColumn - 1 : error.location.column
        );

        const severity = error.severity === 'error' 
          ? vscode.DiagnosticSeverity.Error
          : error.severity === 'warning'
          ? vscode.DiagnosticSeverity.Warning
          : vscode.DiagnosticSeverity.Information;

        const diagnostic = new vscode.Diagnostic(range, error.message, severity);
        diagnostic.source = 'Error Debugging MCP';
        diagnostic.code = error.code;

        diagnostics.push(diagnostic);
      });

      // Update diagnostics
      const diagnosticCollection = vscode.languages.createDiagnosticCollection('errorDebugging');
      diagnosticCollection.set(document.uri, diagnostics);

      vscode.window.showInformationMessage(`Found ${errors.length} issue(s)`);

    } catch (error) {
      vscode.window.showErrorMessage(`Analysis failed: ${error.message}`);
    }
  });

  context.subscriptions.push(startCommand, analyzeCommand);

  // Auto-start
  startCommand();
}

export function deactivate() {
  // Cleanup
}
```

## Real-World Use Cases

### CI/CD Pipeline Integration

```typescript
// GitHub Actions / CI pipeline integration
import { DevelopmentEnvironment } from 'error-debugging-mcp-server';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

async function ciPipelineIntegration() {
  const devEnv = new DevelopmentEnvironment({
    enableErrorDetection: true,
    enablePerformanceMonitoring: true,
    logLevel: 'info'
  });

  await devEnv.start();

  const results = {
    totalFiles: 0,
    totalErrors: 0,
    errorsByFile: {} as Record<string, number>,
    errorsBySeverity: { error: 0, warning: 0, info: 0 }
  };

  // Scan project files
  const scanDirectory = async (dir: string): Promise<string[]> => {
    const files: string[] = [];
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        files.push(...await scanDirectory(fullPath));
      } else if (entry.isFile() && /\.(ts|js|py|go|rs)$/.test(entry.name)) {
        files.push(fullPath);
      }
    }

    return files;
  };

  const files = await scanDirectory('src');
  results.totalFiles = files.length;

  console.log(`🔍 Analyzing ${files.length} files...`);

  for (const file of files) {
    try {
      const content = await readFile(file, 'utf8');
      const ext = file.split('.').pop();
      const language = ext === 'ts' ? 'typescript' 
                    : ext === 'js' ? 'javascript'
                    : ext === 'py' ? 'python'
                    : ext === 'go' ? 'go'
                    : ext === 'rs' ? 'rust'
                    : null;

      if (language) {
        const errors = await devEnv.detectErrors(content, language as any, file);
        
        results.errorsByFile[file] = errors.length;
        results.totalErrors += errors.length;

        errors.forEach(error => {
          results.errorsBySeverity[error.severity]++;
        });

        if (errors.length > 0) {
          console.log(`❌ ${file}: ${errors.length} issue(s)`);
          errors.forEach(error => {
            console.log(`   ${error.severity}: ${error.message} (Line ${error.location.line})`);
          });
        }
      }
    } catch (error) {
      console.error(`Failed to analyze ${file}:`, error.message);
    }
  }

  // Generate report
  console.log('\n📊 Analysis Summary:');
  console.log(`Files analyzed: ${results.totalFiles}`);
  console.log(`Total issues: ${results.totalErrors}`);
  console.log(`Errors: ${results.errorsBySeverity.error}`);
  console.log(`Warnings: ${results.errorsBySeverity.warning}`);
  console.log(`Info: ${results.errorsBySeverity.info}`);

  // Exit with error code if critical issues found
  const exitCode = results.errorsBySeverity.error > 0 ? 1 : 0;
  
  await devEnv.dispose();
  process.exit(exitCode);
}

// Run in CI environment
if (process.env.CI) {
  ciPipelineIntegration();
}
```

This comprehensive examples document demonstrates practical usage patterns and real-world integration scenarios for the Error Debugging MCP Server. Each example is complete and runnable, showing how to leverage the full capabilities of the system.
