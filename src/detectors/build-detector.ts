/**
 * Build error detector for capturing errors from build tools
 */

import { spawn, type ChildProcess } from 'child_process';
import { watch, type FSWatcher } from 'fs';
import { access } from 'fs/promises';
import { resolve, join } from 'path';
import type {
  DetectedError,
  ErrorSource,
  ErrorContext,
  ErrorStackFrame
} from '@/types/index.js';
import { BaseErrorDetector, type ErrorDetectorOptions, type ErrorDetectorCapabilities } from './base-detector.js';

interface BuildConfig {
  projectRoot: string;
  tsconfigPath?: string;
  buildCommand?: string;
  watchMode: boolean;
  pollInterval: number;
}

interface TypeScriptError {
  file: string;
  line: number;
  column: number;
  code: string;
  message: string;
  severity: 'error' | 'warning';
}

export class BuildErrorDetector extends BaseErrorDetector {
  private config: BuildConfig;
  private buildProcess?: ChildProcess | undefined;
  private fileWatcher?: FSWatcher | undefined;
  private pollingTimer?: NodeJS.Timeout | undefined;
  private lastBuildTime = 0;
  private typeScriptAvailable: boolean = false;

  constructor(options: ErrorDetectorOptions, config?: Partial<BuildConfig>) {
    super(options);

    this.config = {
      projectRoot: process.cwd(),
      tsconfigPath: 'tsconfig.json',
      buildCommand: 'tsc',
      watchMode: false,
      pollInterval: 5000,
      ...config
    };
  }

  getSource(): ErrorSource {
    return {
      type: 'build',
      tool: 'build-detector',
      version: '1.0.0',
    };
  }

  getCapabilities(): ErrorDetectorCapabilities {
    return {
      supportsRealTime: true,
      supportsPolling: true,
      supportsFileWatching: true,
      supportedLanguages: ['javascript', 'typescript', 'python', 'go', 'rust'],
      supportedFrameworks: ['tsc', 'webpack', 'vite', 'rollup', 'parcel', 'esbuild', 'babel'],
    };
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    try {
      // Try to verify TypeScript is available
      try {
        await this.verifyTypeScriptAvailable();
        this.typeScriptAvailable = true;
      } catch (error) {
        console.warn('TypeScript not available, build detector will run in limited mode:', error instanceof Error ? error.message : error);
        this.typeScriptAvailable = false;
      }

      // Start file watching if enabled and TypeScript is available
      if (this.options.realTime && this.typeScriptAvailable) {
        try {
          await this.startFileWatching();
        } catch (error) {
          console.warn('File watching disabled:', error instanceof Error ? error.message : error);
        }
      }

      // Start polling if enabled
      if (this.options.polling) {
        this.startPolling();
      }

      // Run initial build check if TypeScript is available
      if (this.typeScriptAvailable) {
        try {
          await this.runBuildCheck();
        } catch (error) {
          console.warn('Initial build check failed:', error instanceof Error ? error.message : error);
        }
      }

      this.emit('detector-started');
    } catch (error) {
      this.isRunning = false;
      this.emit('detector-error', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    // Stop build process
    if (this.buildProcess) {
      this.buildProcess.kill();
      this.buildProcess = undefined;
    }

    // Stop file watcher
    if (this.fileWatcher) {
      this.fileWatcher.close();
      this.fileWatcher = undefined;
    }

    // Stop polling
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = undefined;
    }

    this.emit('detector-stopped');
  }

  async detectErrors(target?: string): Promise<DetectedError[]> {
    if (!this.isRunning) {
      await this.start();
    }

    // If TypeScript is not available, return empty array
    if (!this.typeScriptAvailable) {
      return [];
    }

    // If target is specified, check specific file/project
    if (target) {
      return await this.checkSpecificTarget(target);
    }

    // Otherwise run full build check
    try {
      await this.runBuildCheck();
    } catch (error) {
      console.warn('Build check failed:', error instanceof Error ? error.message : error);
    }
    return this.getBufferedErrors();
  }

  private async verifyTypeScriptAvailable(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Try npx first (for local installations)
      const tsc = spawn('npx', ['tsc', '--version'], {
        stdio: 'pipe',
        cwd: this.config.projectRoot
      });

      let resolved = false;

      tsc.on('close', (code) => {
        if (!resolved) {
          resolved = true;
          if (code === 0) {
            resolve();
          } else {
            // Try global tsc as fallback
            this.tryGlobalTypeScript().then(resolve).catch(() => {
              reject(new Error('TypeScript compiler (tsc) not found. Please install TypeScript globally or locally.'));
            });
          }
        }
      });

      tsc.on('error', () => {
        if (!resolved) {
          resolved = true;
          // Try global tsc as fallback
          this.tryGlobalTypeScript().then(resolve).catch(() => {
            reject(new Error('TypeScript compiler (tsc) not found. Please install TypeScript globally or locally.'));
          });
        }
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          tsc.kill();
          reject(new Error('TypeScript verification timed out'));
        }
      }, 5000);
    });
  }

  private async tryGlobalTypeScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      const tsc = spawn('tsc', ['--version'], { stdio: 'pipe' });

      tsc.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error('Global TypeScript not available'));
        }
      });

      tsc.on('error', () => {
        reject(new Error('Global TypeScript not available'));
      });
    });
  }

  private async startFileWatching(): Promise<void> {
    const tsconfigPath = resolve(this.config.projectRoot, this.config.tsconfigPath!);

    try {
      await access(tsconfigPath);

      // Watch for changes in TypeScript files and tsconfig
      this.fileWatcher = watch(this.config.projectRoot, { recursive: true }, (_eventType, filename) => {
        if (filename && (filename.endsWith('.ts') || filename.endsWith('.tsx') || filename.includes('tsconfig'))) {
          // Debounce file changes
          const now = Date.now();
          if (now - this.lastBuildTime > 1000) {
            this.lastBuildTime = now;
            setTimeout(() => this.runBuildCheck(), 500);
          }
        }
      });

    } catch (error) {
      throw new Error(`TypeScript config file not found at ${tsconfigPath}`);
    }
  }

  private startPolling(): void {
    if (this.options.polling?.interval) {
      this.pollingTimer = setInterval(() => {
        this.runBuildCheck().catch(error => {
          this.emit('detector-error', error);
        });
      }, this.options.polling.interval);
    }
  }

  private async runBuildCheck(): Promise<void> {
    try {
      const errors = await this.runTypeScriptCheck();

      // Clear previous build errors and add new ones
      this.clearBuffer();

      for (const error of errors) {
        const detectedError = this.convertTypeScriptErrorToDetectedError(error);
        this.addToBuffer(detectedError);
      }

    } catch (error) {
      this.emit('detector-error', error);
    }
  }

  private async runTypeScriptCheck(): Promise<TypeScriptError[]> {
    return new Promise((resolve, reject) => {
      const tsconfigPath = join(this.config.projectRoot, this.config.tsconfigPath || 'tsconfig.json');
      const args: string[] = ['--noEmit', '--project', tsconfigPath];

      const tsc = spawn('npx', ['tsc', ...args], {
        cwd: this.config.projectRoot,
        stdio: ['pipe', 'pipe', 'pipe']
      }) as ChildProcess;

      let stdout = '';
      let stderr = '';

      tsc.stdout?.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      tsc.stderr?.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      tsc.on('close', (_code: number | null) => {
        // TypeScript returns non-zero exit code when there are errors
        const output = stderr || stdout;
        const errors = this.parseTypeScriptOutput(output);
        resolve(errors);
      });

      tsc.on('error', (error: Error) => {
        reject(new Error(`Failed to run TypeScript check: ${error.message}`));
      });
    });
  }

  private parseTypeScriptOutput(output: string): TypeScriptError[] {
    const errors: TypeScriptError[] = [];
    const lines = output.split('\n');

    for (const line of lines) {
      const error = this.parseTypeScriptErrorLine(line);
      if (error) {
        errors.push(error);
      }
    }

    return errors;
  }

  private parseTypeScriptErrorLine(line: string): TypeScriptError | null {
    // TypeScript error format: file(line,column): error TS#### message
    // Example: src/index.ts(10,5): error TS2304: Cannot find name 'foo'.
    const errorRegex = /^(.+?)\((\d+),(\d+)\):\s+(error|warning)\s+TS(\d+):\s+(.+)$/;
    const match = line.match(errorRegex);

    if (match) {
      const [, file, line, column, severity, code, message] = match;
      return {
        file: resolve(this.config.projectRoot, file || ''),
        line: parseInt(line || '1', 10),
        column: parseInt(column || '1', 10),
        code: `TS${code || '0000'}`,
        message: (message || '').trim(),
        severity: (severity as 'error' | 'warning') || 'error'
      };
    }

    return null;
  }

  private convertTypeScriptErrorToDetectedError(tsError: TypeScriptError): DetectedError {
    const stackTrace: ErrorStackFrame[] = [{
      location: {
        file: tsError.file,
        line: tsError.line,
        column: tsError.column,
        function: undefined
      },
      source: `${tsError.file}:${tsError.line}:${tsError.column}`
    }];

    const baseError = this.createBaseError(
      `${tsError.code}: ${tsError.message}`,
      'TypeScriptError',
      stackTrace
    );

    const context: ErrorContext = {
      timestamp: new Date(),
      environment: 'build',
      metadata: {
        tool: 'tsc',
        code: tsError.code,
        severity: tsError.severity,
        file: tsError.file,
        line: tsError.line,
        column: tsError.column
      }
    };

    return {
      id: this.generateErrorId(),
      ...baseError,
      context,
      source: this.getSource()
    };
  }

  private async checkSpecificTarget(target: string): Promise<DetectedError[]> {
    const errors: DetectedError[] = [];

    try {
      // If target is a TypeScript file, check it specifically
      if (target.endsWith('.ts') || target.endsWith('.tsx')) {
        const tsErrors = await this.checkTypeScriptFile(target);
        for (const tsError of tsErrors) {
          errors.push(this.convertTypeScriptErrorToDetectedError(tsError));
        }
      }
      // If target is a directory, check all TypeScript files in it
      else {
        await this.runBuildCheck();
        return this.getBufferedErrors();
      }
    } catch (error) {
      this.emit('detector-error', error);
    }

    return errors;
  }

  private async checkTypeScriptFile(filePath: string): Promise<TypeScriptError[]> {
    return new Promise((resolve, reject) => {
      const tsconfigPath = join(this.config.projectRoot, this.config.tsconfigPath || 'tsconfig.json');
      const args: string[] = ['--noEmit', '--project', tsconfigPath, filePath];

      const tsc = spawn('npx', ['tsc', ...args], {
        cwd: this.config.projectRoot,
        stdio: ['pipe', 'pipe', 'pipe']
      }) as ChildProcess;

      let stdout = '';
      let stderr = '';

      tsc.stdout?.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      tsc.stderr?.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      tsc.on('close', () => {
        const output = stderr || stdout;
        const errors = this.parseTypeScriptOutput(output);
        resolve(errors);
      });

      tsc.on('error', (error: Error) => {
        reject(new Error(`Failed to check TypeScript file: ${error.message}`));
      });
    });
  }
}

// Alias for backward compatibility
export { BuildErrorDetector as BuildDetector };
