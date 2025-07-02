/**
 * Tool registry for managing MCP tools
 */

import type { MCPTool, MCPToolResult } from '@/types/index.js';
import type { ErrorDetectorManager } from '@/detectors/error-detector-manager.js';
import { Logger } from '@/utils/logger.js';

export type ToolHandler = (args: Record<string, unknown>) => Promise<MCPToolResult>;

export class ToolRegistry {
  private tools: Map<string, MCPTool> = new Map();
  private handlers: Map<string, ToolHandler> = new Map();
  private errorDetectorManager: ErrorDetectorManager | null = null;
  private logger = new Logger('info', { logFile: undefined });

  async registerTool(tool: MCPTool, handler?: ToolHandler): Promise<void> {
    this.logger.debug(`Registering tool: ${tool.name}`, {
      toolName: tool.name,
      description: tool.description,
      hasCustomHandler: !!handler,
      inputSchema: tool.inputSchema
    });

    if (this.tools.has(tool.name)) {
      const error = new Error(`Tool ${tool.name} is already registered`);
      this.logger.error('Tool registration failed - already exists', {
        toolName: tool.name,
        error: error.message
      });
      throw error;
    }

    this.tools.set(tool.name, tool);

    if (handler) {
      this.handlers.set(tool.name, handler);
      this.logger.debug(`Registered custom handler for tool: ${tool.name}`);
    } else {
      // Register default handler based on tool name
      this.handlers.set(tool.name, this.createDefaultHandler(tool.name));
      this.logger.debug(`Registered default handler for tool: ${tool.name}`);
    }

    this.logger.info(`Tool registered successfully: ${tool.name}`, {
      totalTools: this.tools.size,
      toolName: tool.name
    });
  }

  async unregisterTool(name: string): Promise<void> {
    this.tools.delete(name);
    this.handlers.delete(name);
  }

  listTools(): MCPTool[] {
    return Array.from(this.tools.values());
  }

  getTool(name: string): MCPTool | undefined {
    return this.tools.get(name);
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<MCPToolResult> {
    const startTime = Date.now();
    this.logger.debug(`Calling tool: ${name}`, {
      toolName: name,
      args: Object.keys(args),
      argsCount: Object.keys(args).length
    });

    const handler = this.handlers.get(name);
    if (!handler) {
      const error = new Error(`No handler registered for tool: ${name}`);
      this.logger.error('Tool call failed - no handler', {
        toolName: name,
        availableTools: Array.from(this.handlers.keys()),
        error: error.message
      });
      throw error;
    }

    try {
      const result = await handler(args);
      const executionTime = Date.now() - startTime;

      this.logger.logPerformance(`tool-${name}-execution`, executionTime);
      this.logger.debug(`Tool executed successfully: ${name}`, {
        toolName: name,
        executionTime,
        hasResult: !!result,
        resultType: result?.content?.[0]?.type
      });

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const message = error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(`Tool execution failed: ${name}`, {
        toolName: name,
        executionTime,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error,
        args: Object.keys(args)
      });

      return {
        content: [{
          type: 'text',
          text: `Error executing tool ${name}: ${message}`,
        }],
        isError: true,
      };
    }
  }

  private createDefaultHandler(toolName: string): ToolHandler {
    return async (args: Record<string, unknown>): Promise<MCPToolResult> => {
      switch (toolName) {
        case 'detect-errors':
          return this.handleDetectErrors(args);
        
        case 'analyze-error':
          return this.handleAnalyzeError(args);
        
        case 'suggest-fixes':
          return this.handleSuggestFixes(args);
        
        case 'set-breakpoint':
          return this.handleSetBreakpoint(args);
        
        case 'inspect-variables':
          return this.handleInspectVariables(args);
        
        case 'profile-performance':
          return this.handleProfilePerformance(args);
        
        case 'track-memory':
          return this.handleTrackMemory(args);
        
        default:
          throw new Error(`No default handler available for tool: ${toolName}`);
      }
    };
  }

  private async handleDetectErrors(args: Record<string, unknown>): Promise<MCPToolResult> {
    const source = args['source'] as string;
    const language = args['language'] as string;
    const files = args['files'] as string[] || [];
    const includeWarnings = args['includeWarnings'] as boolean || false;
    const realTime = args['realTime'] as boolean || false;

    try {
      if (!this.errorDetectorManager) {
        throw new Error('Error detector manager not initialized');
      }

      // Detect errors using the error detector manager
      const detectionOptions: {
        source?: string;
        target?: string;
        includeBuffered?: boolean;
      } = {
        includeBuffered: true,
      };

      if (source !== 'all') {
        detectionOptions.source = source;
      }

      if (files.length > 0) {
        detectionOptions.target = files.join(',');
      }

      const errors = await this.errorDetectorManager.detectErrors(detectionOptions);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            source,
            language,
            files,
            includeWarnings,
            realTime,
            errors: errors.map(error => ({
              id: error.id,
              message: error.message,
              type: error.type,
              category: error.category,
              severity: error.severity,
              file: error.stackTrace[0]?.location.file || 'unknown',
              line: error.stackTrace[0]?.location.line || 0,
              column: error.stackTrace[0]?.location.column || 0,
              timestamp: error.context.timestamp,
              source: error.source,
            })),
            stats: this.errorDetectorManager.getDetectionStats(),
            timestamp: new Date().toISOString(),
          }, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error detecting errors: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }],
        isError: true,
      };
    }
  }

  private async handleAnalyzeError(args: Record<string, unknown>): Promise<MCPToolResult> {
    const errorId = args['errorId'] as string;
    const includeContext = args['includeContext'] as boolean || false;
    const includeSuggestions = args['includeSuggestions'] as boolean || false;
    const includeHistory = args['includeHistory'] as boolean || false;

    // TODO: Implement actual error analysis logic
    const mockAnalysis = {
      errorId,
      rootCause: {
        type: 'code-issue',
        description: 'Attempting to access property on undefined variable',
        confidence: 0.95,
      },
      context: includeContext ? {
        codeSnippet: 'const result = data.length;',
        surroundingCode: ['// Previous lines', 'const data = getData();', 'const result = data.length;', '// Following lines'],
      } : undefined,
      suggestions: includeSuggestions ? [
        {
          description: 'Add null check before accessing property',
          confidence: 0.9,
          code: 'const result = data?.length || 0;',
        },
      ] : undefined,
      history: includeHistory ? {
        occurrences: 3,
        lastSeen: '2024-01-15T10:30:00Z',
        trend: 'increasing',
      } : undefined,
    };

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(mockAnalysis, null, 2),
      }],
    };
  }

  private async handleSuggestFixes(args: Record<string, unknown>): Promise<MCPToolResult> {
    const errorId = args['errorId'] as string;
    const maxSuggestions = args['maxSuggestions'] as number || 5;
    const confidenceThreshold = args['confidenceThreshold'] as number || 0.7;

    // TODO: Implement actual fix suggestion logic
    const mockSuggestions = [
      {
        id: 'fix-001',
        description: 'Add optional chaining to safely access property',
        confidence: 0.95,
        type: 'code-change',
        changes: [{
          file: 'src/utils/helper.ts',
          startLine: 42,
          endLine: 42,
          originalCode: 'const result = data.length;',
          suggestedCode: 'const result = data?.length || 0;',
          explanation: 'Use optional chaining to prevent TypeError when data is undefined',
        }],
      },
    ];

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          errorId,
          maxSuggestions,
          confidenceThreshold,
          suggestions: mockSuggestions,
        }, null, 2),
      }],
    };
  }

  private async handleSetBreakpoint(args: Record<string, unknown>): Promise<MCPToolResult> {
    const file = args['file'] as string;
    const line = args['line'] as number;
    const condition = args['condition'] as string;
    const logMessage = args['logMessage'] as string;
    const temporary = args['temporary'] as boolean || false;

    // TODO: Implement actual breakpoint setting logic
    const breakpointId = `bp-${Date.now()}`;

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          breakpointId,
          file,
          line,
          condition,
          logMessage,
          temporary,
          status: 'set',
        }, null, 2),
      }],
    };
  }

  private async handleInspectVariables(args: Record<string, unknown>): Promise<MCPToolResult> {
    const sessionId = args['sessionId'] as string;
    const scope = args['scope'] as string || 'local';
    const frameId = args['frameId'] as number || 0;

    // TODO: Implement actual variable inspection logic
    const mockVariables = [
      { name: 'data', value: 'undefined', type: 'undefined' },
      { name: 'result', value: 'null', type: 'object' },
      { name: 'index', value: '0', type: 'number' },
    ];

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          sessionId,
          scope,
          frameId,
          variables: mockVariables,
        }, null, 2),
      }],
    };
  }

  private async handleProfilePerformance(args: Record<string, unknown>): Promise<MCPToolResult> {
    const duration = args['duration'] as number || 10000;
    const sampleRate = args['sampleRate'] as number || 100;
    const includeMemory = args['includeMemory'] as boolean || true;
    const includeCpu = args['includeCpu'] as boolean || true;

    // TODO: Implement actual performance profiling logic
    const profileId = `profile-${Date.now()}`;

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          profileId,
          duration,
          sampleRate,
          includeMemory,
          includeCpu,
          status: 'started',
        }, null, 2),
      }],
    };
  }

  private async handleTrackMemory(args: Record<string, unknown>): Promise<MCPToolResult> {
    const duration = args['duration'] as number || 60000;
    const threshold = args['threshold'] as number || 100 * 1024 * 1024; // 100MB
    const detectLeaks = args['detectLeaks'] as boolean || true;

    // TODO: Implement actual memory tracking logic
    const trackingId = `memory-${Date.now()}`;

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          trackingId,
          duration,
          threshold,
          detectLeaks,
          status: 'started',
        }, null, 2),
      }],
    };
  }

  setErrorDetectorManager(manager: ErrorDetectorManager): void {
    this.errorDetectorManager = manager;
  }
}
