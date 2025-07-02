# Error Debugging MCP Server - User Guide

## Table of Contents

- [Getting Started](#getting-started)
- [Basic Usage](#basic-usage)
- [Error Detection](#error-detection)
- [Debug Sessions](#debug-sessions)
- [Performance Monitoring](#performance-monitoring)
- [IDE Integration](#ide-integration)
- [Advanced Features](#advanced-features)
- [Troubleshooting](#troubleshooting)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supported language tools (optional but recommended):
  - TypeScript: `npm install -g typescript`
  - ESLint: `npm install -g eslint`
  - Python: Python 3.8+ with pylint
  - Go: Go 1.19+ with go vet
  - Rust: Rust 1.70+ with clippy

### Installation

#### From npm (Recommended)
```bash
npm install -g error-debugging-mcp-server
```

#### From Source
```bash
git clone https://github.com/your-org/error-debugging-mcp-server.git
cd error-debugging-mcp-server
npm install
npm run build
npm link
```

### Quick Start

1. **Start the MCP Server**
```bash
error-debugging-mcp-server --port 3000
```

2. **Connect from your IDE**
Configure your MCP-compatible IDE to connect to `http://localhost:3000`

3. **Test Error Detection**
```javascript
// Create a file with intentional errors
const x: string = 123; // Type error
console.log(undefinedVariable); // Reference error
```

## Basic Usage

### Starting the Development Environment

```typescript
import { DevelopmentEnvironment } from 'error-debugging-mcp-server';

const devEnv = new DevelopmentEnvironment({
  enableErrorDetection: true,
  enablePerformanceMonitoring: true,
  enableDebugSessions: true,
  logLevel: 'info'
});

await devEnv.start();
```

### Detecting Errors

#### Simple Error Detection
```typescript
const errors = await devEnv.detectErrors(`
  const x: string = 123;
  function test() {
    return undefinedVariable;
  }
`, 'typescript', 'example.ts');

console.log('Found errors:', errors.length);
errors.forEach(error => {
  console.log(`${error.severity}: ${error.message} at line ${error.location.line}`);
});
```

#### Language-Specific Detection
```typescript
// JavaScript with ESLint
const jsErrors = await devEnv.detectErrors(`
  var x = 1;
  if (x = 2) { // Assignment instead of comparison
    console.log("This is wrong");
  }
`, 'javascript');

// Python with pylint
const pyErrors = await devEnv.detectErrors(`
def hello_world()
    print("Missing colon")
    return undefined_variable
`, 'python');
```

## Error Detection

### Supported Error Types

#### Syntax Errors
- Missing semicolons, brackets, or parentheses
- Invalid language constructs
- Malformed expressions

#### Type Errors (TypeScript)
- Type mismatches
- Missing type annotations
- Invalid type assertions

#### Linting Issues
- Code style violations
- Potential bugs
- Best practice violations

#### Runtime Errors
- Undefined variables
- Null pointer dereferences
- Array bounds violations

### Configuration Options

```typescript
const detectionOptions = {
  filePath: 'src/example.ts',
  enableLinting: true,
  enableTypeChecking: true,
  enableSyntaxCheck: true,
  customRules: ['no-console', 'prefer-const']
};

const errors = await devEnv.detectErrors(source, 'typescript', detectionOptions);
```

### Error Filtering

```typescript
// Filter by severity
const criticalErrors = errors.filter(e => e.severity === 'error');

// Filter by category
const typeErrors = errors.filter(e => e.category === 'type');

// Filter by location
const fileErrors = errors.filter(e => e.location.file === 'src/main.ts');
```

## Debug Sessions

### Creating Debug Sessions

#### JavaScript/Node.js
```typescript
const sessionId = await devEnv.createDebugSession('javascript', {
  type: 'launch',
  program: 'src/app.js',
  args: ['--debug'],
  env: { NODE_ENV: 'development' }
});
```

#### TypeScript
```typescript
const sessionId = await devEnv.createDebugSession('typescript', {
  type: 'launch',
  program: 'src/app.ts',
  outFiles: ['dist/**/*.js'],
  sourceMaps: true
});
```

#### Python
```typescript
const sessionId = await devEnv.createDebugSession('python', {
  type: 'launch',
  program: 'src/app.py',
  args: ['--verbose'],
  pythonPath: '/usr/bin/python3'
});
```

### Managing Breakpoints

```typescript
const debugManager = devEnv.getDebugSessionManager();

// Set a simple breakpoint
const breakpointId = await debugManager.setBreakpoint(
  sessionId, 
  'src/app.js', 
  25
);

// Set a conditional breakpoint
const conditionalBreakpointId = await debugManager.setBreakpoint(
  sessionId,
  'src/app.js',
  30,
  5,
  'x > 10'
);

// Remove breakpoint
await debugManager.removeBreakpoint(sessionId, breakpointId);

// List all breakpoints
const breakpoints = debugManager.getBreakpoints(sessionId);
```

### Controlling Execution

```typescript
// Continue execution
await debugManager.continue(sessionId);

// Step over current line
await debugManager.stepOver(sessionId);

// Step into function
await debugManager.stepInto(sessionId);

// Step out of function
await debugManager.stepOut(sessionId);
```

### Variable Inspection

```typescript
// Get current stack trace
const stackTrace = await debugManager.getStackTrace(sessionId);

// Evaluate expressions
const result = await debugManager.evaluateExpression(sessionId, 'x + y');
console.log('Expression result:', result.value);

// Inspect variables
const variables = await debugManager.getVariables(sessionId, stackTrace[0].id);
```

## Performance Monitoring

### Basic Performance Tracking

```typescript
const perfMonitor = devEnv.getPerformanceMonitor();

// Start monitoring
perfMonitor.startMonitoring(5000); // 5-second intervals

// Record custom metrics
perfMonitor.recordTiming('api-call', 150, { endpoint: '/users' });
perfMonitor.recordCounter('requests', 1, { status: '200' });
perfMonitor.recordMemoryUsage('heap-used', process.memoryUsage().heapUsed);
```

### Performance Profiling

```typescript
// Start a performance profile
const profileId = perfMonitor.startProfile('database-operations');

// Your code here
await performDatabaseOperations();

// End the profile
const profile = perfMonitor.endProfile(profileId);
console.log(`Operation took ${profile.duration}ms`);
```

### Measuring Function Performance

```typescript
// Measure async function
const result = await perfMonitor.measureAsync('fetch-data', async () => {
  return await fetch('/api/data');
}, { source: 'external-api' });

// Measure sync function
const computed = perfMonitor.measureSync('calculate', () => {
  return heavyComputation();
}, { algorithm: 'v2' });
```

### Performance Analysis

```typescript
// Analyze code performance
const analysis = await devEnv.analyzePerformance(`
  function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
  }
`, 'javascript');

console.log('Complexity:', analysis.complexity);
console.log('Suggestions:', analysis.suggestions);
```

## IDE Integration

### VS Code Integration

1. **Install the MCP Extension**
```bash
code --install-extension mcp-protocol
```

2. **Configure Settings**
```json
{
  "mcp.servers": [
    {
      "name": "error-debugging",
      "command": "error-debugging-mcp-server",
      "args": ["--port", "3000"],
      "env": {
        "LOG_LEVEL": "info"
      }
    }
  ]
}
```

3. **Use Error Detection**
- Open any supported file
- Errors will appear in the Problems panel
- Hover over errors for detailed information

### Cursor IDE Integration

```json
{
  "mcp": {
    "servers": {
      "error-debugging": {
        "command": "error-debugging-mcp-server",
        "args": ["--config", "cursor-config.json"]
      }
    }
  }
}
```

### Custom IDE Integration

Implement the MCP protocol client:

```typescript
import { MCPClient } from '@modelcontextprotocol/client';

const client = new MCPClient();
await client.connect('http://localhost:3000');

// Use tools
const result = await client.callTool('detect-errors', {
  source: sourceCode,
  language: 'typescript'
});
```

## Advanced Features

### Custom Error Detectors

```typescript
import { BaseDetector } from 'error-debugging-mcp-server';

class CustomDetector extends BaseDetector {
  async detectErrors(source: string): Promise<DetectedError[]> {
    // Custom detection logic
    return [];
  }
}

// Register custom detector
const errorManager = devEnv.getErrorDetectorManager();
errorManager.registerDetector('custom', new CustomDetector());
```

### Performance Optimization

```typescript
// Configure performance thresholds
const config = {
  performance: {
    monitoring: {
      thresholds: {
        memory: 512 * 1024 * 1024, // 512MB
        cpu: 80, // 80%
        responseTime: 1000 // 1 second
      }
    }
  }
};

const devEnv = new DevelopmentEnvironment(config);
```

### Event Handling

```typescript
// Listen for events
devEnv.on('errorsDetected', (errors, language, filePath) => {
  console.log(`Found ${errors.length} errors in ${filePath}`);
});

devEnv.on('debugSessionCreated', (sessionId, language) => {
  console.log(`Debug session ${sessionId} created for ${language}`);
});

devEnv.on('performanceAlert', (metric, threshold) => {
  console.log(`Performance alert: ${metric.name} exceeded threshold`);
});
```

### Batch Processing

```typescript
// Process multiple files
const files = ['src/app.ts', 'src/utils.ts', 'src/api.ts'];
const results = await Promise.all(
  files.map(async (file) => {
    const source = await fs.readFile(file, 'utf8');
    return {
      file,
      errors: await devEnv.detectErrors(source, 'typescript', file)
    };
  })
);

// Generate report
const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
console.log(`Total errors found: ${totalErrors}`);
```

## Troubleshooting

### Common Issues

#### "Language tools not available"
```bash
# Install missing tools
npm install -g typescript eslint
pip install pylint
```

#### "Debug session failed to start"
- Check that the target program exists
- Verify file paths are correct
- Ensure proper permissions

#### "Performance monitoring not working"
- Check system permissions
- Verify Node.js version compatibility
- Review log files for errors

### Debug Logging

```typescript
// Enable debug logging
const devEnv = new DevelopmentEnvironment({
  logLevel: 'debug',
  logFile: 'debug.log'
});
```

### Performance Issues

```typescript
// Optimize for large codebases
const devEnv = new DevelopmentEnvironment({
  enablePerformanceMonitoring: false, // Disable if not needed
  performanceMonitoringInterval: 10000, // Increase interval
});
```

### Memory Management

```typescript
// Regular cleanup
setInterval(async () => {
  await devEnv.cleanup();
}, 30 * 60 * 1000); // Every 30 minutes
```

### Getting Help

1. **Check the logs**: Look for error messages in the console or log files
2. **Review configuration**: Ensure all settings are correct
3. **Test with minimal examples**: Isolate the issue
4. **Check GitHub issues**: Look for similar problems
5. **Contact support**: Create an issue with detailed information

### Configuration Examples

#### Minimal Configuration
```typescript
const devEnv = new DevelopmentEnvironment({
  enableErrorDetection: true
});
```

#### Full-Featured Configuration
```typescript
const devEnv = new DevelopmentEnvironment({
  enablePerformanceMonitoring: true,
  performanceMonitoringInterval: 5000,
  enableDebugSessions: true,
  enableErrorDetection: true,
  logLevel: 'debug',
  logFile: 'error-debugging.log',
  enableMetrics: true,
  enableProfiling: true
});
```

#### Production Configuration
```typescript
const devEnv = new DevelopmentEnvironment({
  enablePerformanceMonitoring: true,
  performanceMonitoringInterval: 30000,
  enableDebugSessions: false,
  enableErrorDetection: true,
  logLevel: 'warn',
  enableMetrics: true,
  enableProfiling: false
});
```
