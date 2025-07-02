# Error Debugging MCP Server - API Documentation

## Overview

The Error Debugging MCP Server provides a comprehensive API for error detection, debugging, and performance monitoring across multiple programming languages. This document covers all available tools, resources, and prompts.

## Table of Contents

- [MCP Tools](#mcp-tools)
- [MCP Resources](#mcp-resources)
- [MCP Prompts](#mcp-prompts)
- [Development Environment API](#development-environment-api)
- [Language Handlers](#language-handlers)
- [Error Detection](#error-detection)
- [Debug Sessions](#debug-sessions)
- [Performance Monitoring](#performance-monitoring)

## MCP Tools

### Error Detection Tools

#### `detect-errors`
Detects errors in source code using language-specific analyzers.

**Parameters:**
- `source` (string, required): Source code to analyze
- `language` (string, optional): Programming language (typescript, javascript, python, go, rust)
- `filePath` (string, optional): File path for context
- `options` (object, optional): Detection options

**Example:**
```json
{
  "name": "detect-errors",
  "arguments": {
    "source": "const x: string = 123;",
    "language": "typescript",
    "filePath": "src/example.ts"
  }
}
```

**Response:**
```json
{
  "errors": [
    {
      "message": "Type 'number' is not assignable to type 'string'",
      "severity": "error",
      "location": {
        "file": "src/example.ts",
        "line": 1,
        "column": 7
      },
      "source": "typescript",
      "code": "TS2322"
    }
  ]
}
```

#### `analyze-performance`
Analyzes code performance and provides optimization suggestions.

**Parameters:**
- `source` (string, required): Source code to analyze
- `language` (string, required): Programming language
- `options` (object, optional): Analysis options

**Example:**
```json
{
  "name": "analyze-performance",
  "arguments": {
    "source": "function fibonacci(n) { return n <= 1 ? n : fibonacci(n-1) + fibonacci(n-2); }",
    "language": "javascript"
  }
}
```

**Response:**
```json
{
  "complexity": 8,
  "suggestions": [
    "Consider using memoization to optimize recursive function",
    "Use iterative approach for better performance"
  ],
  "metrics": {
    "linesOfCode": 1,
    "cyclomaticComplexity": 3,
    "estimatedExecutionTime": "O(2^n)"
  }
}
```

### Debug Session Tools

#### `create-debug-session`
Creates a new debug session for a specific language.

**Parameters:**
- `language` (string, required): Programming language
- `config` (object, required): Debug configuration

**Example:**
```json
{
  "name": "create-debug-session",
  "arguments": {
    "language": "javascript",
    "config": {
      "type": "launch",
      "program": "src/app.js",
      "args": ["--debug"]
    }
  }
}
```

#### `set-breakpoint`
Sets a breakpoint in a debug session.

**Parameters:**
- `sessionId` (string, required): Debug session ID
- `file` (string, required): File path
- `line` (number, required): Line number
- `condition` (string, optional): Breakpoint condition

#### `step-over`, `step-into`, `step-out`
Control debug session execution.

**Parameters:**
- `sessionId` (string, required): Debug session ID

#### `evaluate-expression`
Evaluates an expression in the debug context.

**Parameters:**
- `sessionId` (string, required): Debug session ID
- `expression` (string, required): Expression to evaluate

### Performance Monitoring Tools

#### `start-performance-profile`
Starts a performance profiling session.

**Parameters:**
- `name` (string, required): Profile name
- `parentId` (string, optional): Parent profile ID

#### `record-metric`
Records a performance metric.

**Parameters:**
- `name` (string, required): Metric name
- `value` (number, required): Metric value
- `unit` (string, required): Unit (ms, bytes, count, percent)
- `tags` (object, optional): Additional tags

## MCP Resources

### Error Reports
- **URI Pattern:** `error-report://{sessionId}`
- **Description:** Provides detailed error reports for debugging sessions
- **MIME Type:** `application/json`

### Performance Reports
- **URI Pattern:** `performance-report://{profileId}`
- **Description:** Provides performance analysis reports
- **MIME Type:** `application/json`

### Debug Session State
- **URI Pattern:** `debug-session://{sessionId}/state`
- **Description:** Current state of a debug session
- **MIME Type:** `application/json`

### Language Handler Status
- **URI Pattern:** `language-handler://{language}/status`
- **Description:** Status and capabilities of language handlers
- **MIME Type:** `application/json`

## MCP Prompts

### Error Analysis
- **Name:** `analyze-error`
- **Description:** Provides AI-powered error analysis and suggestions
- **Arguments:**
  - `error` (object): Error details
  - `context` (string): Code context

### Performance Optimization
- **Name:** `optimize-performance`
- **Description:** Suggests performance optimizations
- **Arguments:**
  - `code` (string): Source code
  - `language` (string): Programming language
  - `metrics` (object): Performance metrics

### Debug Strategy
- **Name:** `debug-strategy`
- **Description:** Suggests debugging strategies
- **Arguments:**
  - `error` (object): Error details
  - `codeContext` (string): Surrounding code

## Development Environment API

### DevelopmentEnvironment Class

#### Constructor
```typescript
new DevelopmentEnvironment(config: DevelopmentEnvironmentConfig)
```

#### Methods

##### `start(): Promise<void>`
Starts the development environment with all configured components.

##### `stop(): Promise<void>`
Stops the development environment and cleans up resources.

##### `detectErrors(source: string, language?: SupportedLanguage, filePath?: string): Promise<LanguageError[]>`
Detects errors in source code.

##### `analyzePerformance(source: string, language: SupportedLanguage): Promise<PerformanceAnalysis>`
Analyzes code performance.

##### `createDebugSession(language: SupportedLanguage, config: LanguageDebugConfig): Promise<string>`
Creates a new debug session.

##### `getStatus(): EnvironmentStatus`
Returns current environment status.

##### `getStatistics(): object`
Returns comprehensive statistics.

### Configuration

```typescript
interface DevelopmentEnvironmentConfig {
  enablePerformanceMonitoring?: boolean;
  performanceMonitoringInterval?: number;
  enableDebugSessions?: boolean;
  enableErrorDetection?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  logFile?: string;
  enableMetrics?: boolean;
  enableProfiling?: boolean;
}
```

## Language Handlers

### Supported Languages

- **TypeScript** (`typescript`)
- **JavaScript** (`javascript`)
- **Python** (`python`)
- **Go** (`go`)
- **Rust** (`rust`)

### Language Handler Interface

```typescript
interface LanguageHandler {
  initialize(): Promise<void>;
  detectErrors(source: string, options?: DetectionOptions): Promise<LanguageError[]>;
  analyzePerformance(source: string): Promise<PerformanceAnalysis>;
  createDebugSession(config: LanguageDebugConfig): Promise<LanguageDebugSession>;
  getCapabilities(): LanguageCapabilities;
  dispose(): Promise<void>;
}
```

### Detection Options

```typescript
interface DetectionOptions {
  filePath?: string;
  enableLinting?: boolean;
  enableTypeChecking?: boolean;
  enableSyntaxCheck?: boolean;
  customRules?: string[];
}
```

## Error Detection

### Error Types

```typescript
interface LanguageError {
  message: string;
  severity: 'error' | 'warning' | 'info';
  location: ErrorLocation;
  source: string;
  code?: string;
  category?: string;
  suggestions?: string[];
}

interface ErrorLocation {
  file: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
}
```

### Error Categories

- **Syntax Errors**: Malformed code syntax
- **Type Errors**: Type mismatches and violations
- **Runtime Errors**: Potential runtime issues
- **Logic Errors**: Logical inconsistencies
- **Performance Issues**: Performance bottlenecks
- **Security Issues**: Security vulnerabilities

## Debug Sessions

### Debug Session Lifecycle

1. **Create Session**: `createDebugSession()`
2. **Set Breakpoints**: `setBreakpoint()`
3. **Start Debugging**: `continue()`
4. **Step Through Code**: `stepOver()`, `stepInto()`, `stepOut()`
5. **Inspect Variables**: `evaluateExpression()`
6. **Stop Session**: `stopSession()`

### Debug Session State

```typescript
interface DebugSessionInfo {
  id: string;
  language: SupportedLanguage;
  config: LanguageDebugConfig;
  status: 'starting' | 'running' | 'paused' | 'stopped' | 'error';
  createdAt: Date;
  lastActivity: Date;
}
```

### Breakpoint Management

```typescript
interface DebugBreakpoint {
  id: string;
  file: string;
  line: number;
  column: number;
  condition?: string;
  enabled: boolean;
  verified: boolean;
}
```

## Performance Monitoring

### Performance Metrics

```typescript
interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percent';
  timestamp: Date;
  tags?: Record<string, string>;
}
```

### Performance Profiles

```typescript
interface PerformanceProfile {
  id: string;
  name: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  metrics: PerformanceMetric[];
  children: PerformanceProfile[];
}
```

### System Monitoring

The performance monitor automatically tracks:
- **Memory Usage**: Heap usage, RSS, external memory
- **CPU Usage**: User time, system time, percentage
- **Operation Timing**: Function execution times
- **Custom Metrics**: Application-specific measurements

## Error Handling

All API methods follow consistent error handling patterns:

```typescript
try {
  const result = await api.method();
  // Handle success
} catch (error) {
  if (error instanceof LanguageNotSupportedError) {
    // Handle unsupported language
  } else if (error instanceof SessionNotFoundError) {
    // Handle missing session
  } else {
    // Handle general errors
  }
}
```

## Events

The system emits various events for real-time monitoring:

- `errorDetected`: When errors are found
- `sessionCreated`: When debug sessions are created
- `breakpointHit`: When breakpoints are triggered
- `performanceAlert`: When performance thresholds are exceeded
- `systemMetrics`: Regular system health updates

## Rate Limiting

API calls are subject to rate limiting:
- **Error Detection**: 100 requests per minute
- **Debug Sessions**: 10 concurrent sessions
- **Performance Profiling**: 50 profiles per session

## Authentication

Currently, the MCP server operates in trusted environments and does not require authentication. Future versions may include:
- API key authentication
- OAuth 2.0 integration
- Role-based access control
