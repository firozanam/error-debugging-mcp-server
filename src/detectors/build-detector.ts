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

    const errors: DetectedError[] = [];

    // If target is specified, check specific file/project
    if (target) {
      return await this.checkSpecificTarget(target);
    }

    // Try TypeScript compilation check if available
    if (this.typeScriptAvailable) {
      try {
        await this.runBuildCheck();
        const bufferedErrors = this.getBufferedErrors();
        errors.push(...bufferedErrors);
      } catch (error) {
        console.warn('TypeScript build check failed:', error instanceof Error ? error.message : error);
      }
    }

    // Always run static analysis regardless of TypeScript availability
    try {
      const staticErrors = await this.runStaticAnalysis();
      errors.push(...staticErrors);
    } catch (error) {
      console.warn('Static analysis failed:', error instanceof Error ? error.message : error);
    }

    // Temporarily disable process checking to prevent memory issues
    // TODO: Re-enable with proper resource limits
    // try {
    //   const processErrors = await this.checkBuildProcesses();
    //   errors.push(...processErrors);
    // } catch (error) {
    //   console.warn('Process check failed:', error instanceof Error ? error.message : error);
    // }

    return errors;
  }

  private async verifyTypeScriptAvailable(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Try npx first (for local installations)
      const tsc = spawn('npx', ['tsc', '--version'], {
        stdio: 'pipe',
        cwd: this.config.projectRoot,
        timeout: 10000 // Increase timeout to 10 seconds
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
              // Don't reject immediately - try alternative detection methods
              this.tryAlternativeTypeScriptDetection().then(resolve).catch(() => {
                reject(new Error('TypeScript compiler (tsc) not found. Please install TypeScript globally or locally.'));
              });
            });
          }
        }
      });

      tsc.on('error', () => {
        if (!resolved) {
          resolved = true;
          // Try global tsc as fallback
          this.tryGlobalTypeScript().then(resolve).catch(() => {
            // Try alternative detection methods
            this.tryAlternativeTypeScriptDetection().then(resolve).catch(() => {
              reject(new Error('TypeScript compiler (tsc) not found. Please install TypeScript globally or locally.'));
            });
          });
        }
      });

      // Increase timeout to 10 seconds
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          tsc.kill();
          // Try alternative detection before rejecting
          this.tryAlternativeTypeScriptDetection().then(resolve).catch(() => {
            reject(new Error('TypeScript verification timed out'));
          });
        }
      }, 10000);
    });
  }

  private async tryGlobalTypeScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      const tsc = spawn('tsc', ['--version'], {
        stdio: 'pipe',
        timeout: 5000
      });

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

  private async tryAlternativeTypeScriptDetection(): Promise<void> {
    try {
      // Check if TypeScript files exist in the project
      const tsconfigPath = resolve(this.config.projectRoot, this.config.tsconfigPath || 'tsconfig.json');
      await access(tsconfigPath);

      // Check if node_modules has TypeScript
      const nodeModulesTsc = resolve(this.config.projectRoot, 'node_modules', '.bin', 'tsc');
      try {
        await access(nodeModulesTsc);
        return; // TypeScript is available locally
      } catch {
        // Continue to package.json check
      }

      // Check package.json for TypeScript dependency
      const packageJsonPath = resolve(this.config.projectRoot, 'package.json');
      try {
        await access(packageJsonPath);
        const packageJson = JSON.parse(await import('fs').then(fs => fs.promises.readFile(packageJsonPath, 'utf8')));

        if (packageJson.dependencies?.typescript ||
            packageJson.devDependencies?.typescript ||
            packageJson.dependencies?.['@types/node'] ||
            packageJson.devDependencies?.['@types/node']) {
          return; // TypeScript project detected
        }
      } catch {
        // Continue to file-based detection
      }

      // Check for TypeScript files in the project
      const hasTypeScriptFiles = await this.checkForTypeScriptFiles();
      if (hasTypeScriptFiles) {
        return; // TypeScript files found, assume it's a TS project
      }

      throw new Error('No TypeScript installation or files detected');
    } catch (error) {
      throw new Error(`Alternative TypeScript detection failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  private async checkForTypeScriptFiles(): Promise<boolean> {
    try {
      const { readdir, stat } = await import('fs/promises');
      const { resolve } = await import('path');

      // Only check common TypeScript directories to avoid memory issues
      const dirsToCheck = ['src', 'lib', 'app', '.'];

      // Directories to exclude to prevent memory issues
      const excludeDirs = new Set([
        // Node.js / JavaScript
        'node_modules',
        '.next',
        '.nuxt',
        'dist',
        'build',
        'out',
        '.cache',

        // Python
        'venv',
        'env',
        '.venv',
        '.env',
        '__pycache__',
        '.pytest_cache',
        '.mypy_cache',
        'site-packages',

        // PHP
        'vendor',

        // Rust
        'target',

        // Go
        'bin',
        'pkg',

        // Java / Kotlin
        'target',
        'build',
        '.gradle',

        // C/C++
        'build',
        'cmake-build-debug',
        'cmake-build-release',

        // Ruby
        'vendor',
        '.bundle',

        // .NET
        'bin',
        'obj',
        'packages',

        // General
        'coverage',
        '.git',
        '.svn',
        '.hg',
        '.vscode',
        '.idea',
        '.vs',
        'tmp',
        'temp',
        'logs',
        'log'
      ]);

      for (const dir of dirsToCheck) {
        const dirPath = resolve(this.config.projectRoot, dir);
        try {
          const dirStat = await stat(dirPath);
          if (!dirStat.isDirectory()) continue;

          const files = await readdir(dirPath);

          // Filter out excluded directories and check for TypeScript files
          const hasTS = files.some(file =>
            !excludeDirs.has(file) &&
            (file.endsWith('.ts') || file.endsWith('.tsx')) &&
            !file.startsWith('.')
          );

          if (hasTS) return true;
        } catch {
          // Directory doesn't exist or can't be read, continue
          continue;
        }
      }

      return false;
    } catch {
      return false;
    }
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
      // First try project-wide TypeScript check
      const projectErrors = await this.runTypeScriptCheck();

      // Clear previous build errors and add new ones
      this.clearBuffer();

      for (const error of projectErrors) {
        const detectedError = this.convertTypeScriptErrorToDetectedError(error);
        this.addToBuffer(detectedError);
      }

      // Also check individual TypeScript files in the root directory that might not be in the project
      try {
        const { readdir } = await import('fs/promises');
        const rootFiles = await readdir(this.config.projectRoot);
        const tsFiles = rootFiles.filter(file => file.endsWith('.ts') || file.endsWith('.tsx'));

        for (const tsFile of tsFiles) {
          const filePath = join(this.config.projectRoot, tsFile);
          const fileErrors = await this.checkTypeScriptFile(filePath);

          for (const error of fileErrors) {
            const detectedError = this.convertTypeScriptErrorToDetectedError(error);
            this.addToBuffer(detectedError);
          }
        }
      } catch (error) {
        console.warn('Failed to check individual TypeScript files:', error instanceof Error ? error.message : error);
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
      // For individual files, don't use --project, just check the file directly
      const args: string[] = ['--noEmit', filePath];

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

  private async runStaticAnalysis(): Promise<DetectedError[]> {
    const errors: DetectedError[] = [];
    const MAX_ANALYSIS_TIME = 5000; // 5 seconds max for all static analysis

    try {
      // Use Promise.race to enforce timeout
      const analysisPromise = this.performLimitedStaticAnalysis();
      const timeoutPromise = new Promise<DetectedError[]>((_, reject) => {
        setTimeout(() => reject(new Error('Static analysis timeout')), MAX_ANALYSIS_TIME);
      });

      const analysisResults = await Promise.race([analysisPromise, timeoutPromise]);
      errors.push(...analysisResults);

    } catch (error) {
      console.warn('Static analysis error:', error instanceof Error ? error.message : error);
    }

    return errors;
  }

  private async performLimitedStaticAnalysis(): Promise<DetectedError[]> {
    const errors: DetectedError[] = [];

    try {
      // Only run syntax checks (most important)
      const syntaxErrors = await this.checkSyntaxErrors();
      errors.push(...syntaxErrors);

      // Skip dependency and config checks for now to prevent memory issues
      // These can be re-enabled later with proper resource limits

    } catch (error) {
      console.warn('Limited static analysis error:', error instanceof Error ? error.message : error);
    }

    return errors;
  }

  // Temporarily disabled to prevent memory issues
  /*
  private async checkBuildProcesses(): Promise<DetectedError[]> {
    const errors: DetectedError[] = [];

    try {
      // Check for hanging Node.js processes
      const hangingProcesses = await this.detectHangingProcesses();
      errors.push(...hangingProcesses);

      // Check for build tool issues
      const buildToolErrors = await this.checkBuildToolStatus();
      errors.push(...buildToolErrors);

    } catch (error) {
      console.warn('Process check error:', error instanceof Error ? error.message : error);
    }

    return errors;
  }
  */

  private async checkSyntaxErrors(): Promise<DetectedError[]> {
    const errors: DetectedError[] = [];
    const MAX_FILES = 10; // Limit to prevent memory issues
    const MAX_FILE_SIZE = 1024 * 1024; // 1MB limit per file
    let filesChecked = 0;

    try {
      // First, try TypeScript compilation if available
      if (this.typeScriptAvailable) {
        try {
          const tsErrors = await this.runTypeScriptCheck();
          for (const tsError of tsErrors) {
            errors.push(this.convertTypeScriptErrorToDetectedError(tsError));
          }

          // If TypeScript compilation found errors, return them
          if (errors.length > 0) {
            return errors;
          }
        } catch (error) {
          console.warn('TypeScript compilation check failed, falling back to basic syntax check:', error instanceof Error ? error.message : error);
        }
      }

      // Fallback to basic syntax checking for files
      const { readdir, readFile, stat } = await import('fs/promises');
      const { resolve } = await import('path');

      // Only check specific directories to avoid memory issues
      const dirsToCheck = ['src', 'lib', 'app', '.'];

      // Directories to exclude to prevent memory issues
      const excludeDirs = new Set([
        // Node.js / JavaScript
        'node_modules',
        '.next',
        '.nuxt',
        'dist',
        'build',
        'out',
        '.cache',

        // Python
        'venv',
        'env',
        '.venv',
        '.env',
        '__pycache__',
        '.pytest_cache',
        '.mypy_cache',
        'site-packages',

        // PHP
        'vendor',

        // Rust
        'target',

        // Go
        'bin',
        'pkg',

        // Java / Kotlin
        'target',
        'build',
        '.gradle',

        // C/C++
        'build',
        'cmake-build-debug',
        'cmake-build-release',

        // Ruby
        'vendor',
        '.bundle',

        // .NET
        'bin',
        'obj',
        'packages',

        // General
        'coverage',
        '.git',
        '.svn',
        '.hg',
        '.vscode',
        '.idea',
        '.vs',
        'tmp',
        'temp',
        'logs',
        'log'
      ]);

      for (const dir of dirsToCheck) {
        if (filesChecked >= MAX_FILES) break;

        const dirPath = resolve(this.config.projectRoot, dir);
        try {
          const files = await readdir(dirPath);

          for (const file of files) {
            if (filesChecked >= MAX_FILES) break;

            // Skip excluded directories
            if (excludeDirs.has(file)) continue;

            if ((file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) &&
                !file.startsWith('.')) {

              try {
                const filePath = resolve(dirPath, file);
                const fileStat = await stat(filePath);

                // Skip large files to prevent memory issues
                if (fileStat.size > MAX_FILE_SIZE) continue;

                const content = await readFile(filePath, 'utf8');
                const syntaxIssues = await this.performBasicSyntaxCheck(content, filePath);
                errors.push(...syntaxIssues);
                filesChecked++;
              } catch {
                // Skip files that can't be read
                continue;
              }
            }
          }
        } catch {
          // Directory doesn't exist, continue
          continue;
        }
      }
    } catch (error) {
      console.warn('Syntax check failed:', error instanceof Error ? error.message : error);
    }

    return errors;
  }

  private async performBasicSyntaxCheck(content: string, filePath: string): Promise<DetectedError[]> {
    const errors: DetectedError[] = [];
    const lines = content.split('\n');

    // For TypeScript files, try individual file compilation first
    if ((filePath.endsWith('.ts') || filePath.endsWith('.tsx')) && this.typeScriptAvailable) {
      try {
        // Use the existing checkTypeScriptFile method for individual files
        const tsErrors = await this.checkTypeScriptFile(filePath);
        for (const tsError of tsErrors) {
          errors.push(this.convertTypeScriptErrorToDetectedError(tsError));
        }

        // If TypeScript compilation found errors, return them
        if (errors.length > 0) {
          return errors;
        }
      } catch {
        // Fall back to basic syntax checking if TypeScript check fails
      }
    }

    // Basic syntax checking for non-TypeScript files or when TypeScript is not available
    this.performStringBasedSyntaxCheck(content, filePath, lines, errors);
    return errors;
  }

  private performStringBasedSyntaxCheck(_content: string, filePath: string, lines: string[], errors: DetectedError[]): void {
    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // Check for common syntax issues
      if (line.includes('Cannot find name') || line.includes('is not defined')) {
        errors.push(this.createSyntaxError('Undefined variable or function', filePath, lineNumber, line));
      }

      if (line.includes('Unexpected token') || line.includes('SyntaxError')) {
        errors.push(this.createSyntaxError('Syntax error detected', filePath, lineNumber, line));
      }

      // Check for missing imports
      if (line.trim().startsWith('import') && !line.includes('from')) {
        errors.push(this.createSyntaxError('Incomplete import statement', filePath, lineNumber, line));
      }

      // TypeScript-specific checks
      if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
        // Check for type annotation issues
        if (line.includes(': any') && !line.includes('// @ts-ignore')) {
          errors.push(this.createSyntaxError('Usage of "any" type detected', filePath, lineNumber, line));
        }

        // Check for missing type annotations on function parameters
        if (line.includes('function ') && line.includes('(') && !line.includes(':') && !line.includes('=>')) {
          errors.push(this.createSyntaxError('Missing type annotations on function', filePath, lineNumber, line));
        }
      }
    });
  }

  private createSyntaxError(message: string, filePath: string, line: number, content: string): DetectedError {
    const stackTrace: ErrorStackFrame[] = [{
      location: {
        file: filePath,
        line: line,
        column: 1,
        function: undefined
      },
      source: `${filePath}:${line}:1`
    }];

    const baseError = this.createBaseError(
      message,
      'SyntaxError',
      stackTrace
    );

    const context: ErrorContext = {
      timestamp: new Date(),
      environment: 'build',
      metadata: {
        tool: 'static-analysis',
        severity: 'error',
        file: filePath,
        line: line,
        content: content.trim()
      }
    };

    return {
      id: this.generateErrorId(),
      ...baseError,
      context,
      source: this.getSource()
    };
  }

  /*
  // Temporarily disabled to prevent memory issues
  private async checkMissingDependencies(): Promise<DetectedError[]> {
    const errors: DetectedError[] = [];

    try {
      const packageJsonPath = resolve(this.config.projectRoot, 'package.json');
      const { readFile } = await import('fs/promises');

      try {
        const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));

        // Check if TypeScript is listed but not installed
        if ((packageJson.dependencies?.typescript || packageJson.devDependencies?.typescript) && !this.typeScriptAvailable) {
          errors.push(this.createDependencyError('TypeScript is listed in package.json but not available', packageJsonPath));
        }

        // Check for common missing dependencies
        const commonDeps = ['@types/node', 'typescript', 'eslint'];
        for (const dep of commonDeps) {
          if (packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]) {
            try {
              await import('fs/promises').then(fs => fs.access(resolve(this.config.projectRoot, 'node_modules', dep)));
            } catch {
              errors.push(this.createDependencyError(`Dependency ${dep} is listed but not installed`, packageJsonPath));
            }
          }
        }
      } catch (parseError) {
        errors.push(this.createDependencyError('Invalid package.json format', packageJsonPath));
      }
    } catch {
      // No package.json found - not necessarily an error
    }

    return errors;
  }
  */

  /*
  // Temporarily disabled to prevent memory issues
  private async checkConfigurationIssues(): Promise<DetectedError[]> {
    const errors: DetectedError[] = [];

    try {
      // Check tsconfig.json issues
      const tsconfigPath = resolve(this.config.projectRoot, this.config.tsconfigPath || 'tsconfig.json');
      try {
        const { readFile } = await import('fs/promises');
        const tsconfigContent = await readFile(tsconfigPath, 'utf8');

        try {
          JSON.parse(tsconfigContent);
        } catch (parseError) {
          errors.push(this.createConfigError('Invalid tsconfig.json format', tsconfigPath));
        }
      } catch {
        // Check if TypeScript files exist but no tsconfig
        const hasTypeScriptFiles = await this.checkForTypeScriptFiles();
        if (hasTypeScriptFiles) {
          errors.push(this.createConfigError('TypeScript files found but no tsconfig.json', this.config.projectRoot));
        }
      }
    } catch (error) {
      console.warn('Configuration check failed:', error instanceof Error ? error.message : error);
    }

    return errors;
  }
  */

  /*
  // Temporarily disabled to prevent memory issues
  private async detectHangingProcesses(): Promise<DetectedError[]> {
    const errors: DetectedError[] = [];

    try {
      // Check for hanging Node.js processes
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      try {
        const { stdout } = await execAsync('ps aux | grep node | grep -v grep');
        const processes = stdout.split('\n').filter(line => line.trim());

        for (const process of processes) {
          if (process.includes('tsc') || process.includes('webpack') || process.includes('vite')) {
            // Check if process has been running for too long (more than 5 minutes)
            const parts = process.split(/\s+/);
            if (parts.length > 9) {
              const timeStr = parts[9]; // CPU time
              if (timeStr && timeStr.includes(':')) {
                const timeParts = timeStr.split(':');
                if (timeParts.length > 0 && timeParts[0] && parseInt(timeParts[0]) > 5) {
                  errors.push(this.createProcessError(`Long-running build process detected: ${process}`, 'hanging-process'));
                }
              }
            }
          }
        }
      } catch {
        // ps command failed - might be Windows or restricted environment
      }
    } catch (error) {
      console.warn('Process detection failed:', error instanceof Error ? error.message : error);
    }

    return errors;
  }

  private async checkBuildToolStatus(): Promise<DetectedError[]> {
    const errors: DetectedError[] = [];

    try {
      // Check for common build tool configuration files
      const buildFiles = ['webpack.config.js', 'vite.config.js', 'rollup.config.js', 'babel.config.js'];
      const { access } = await import('fs/promises');

      for (const buildFile of buildFiles) {
        try {
          const filePath = resolve(this.config.projectRoot, buildFile);
          await access(filePath);

          // If build file exists, check if the corresponding tool is available
          const toolNameParts = buildFile.split('.');
          if (toolNameParts.length > 0 && toolNameParts[0]) {
            const toolName = toolNameParts[0];
            try {
              await this.checkToolAvailability(toolName);
            } catch {
              errors.push(this.createConfigError(`${toolName} configuration found but tool not available`, filePath));
            }
          }
        } catch {
          // Build file doesn't exist - not an error
        }
      }
    } catch (error) {
      console.warn('Build tool check failed:', error instanceof Error ? error.message : error);
    }

    return errors;
  }

  private async checkToolAvailability(toolName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const tool = spawn('npx', [toolName, '--version'], {
        stdio: 'pipe',
        cwd: this.config.projectRoot,
        timeout: 3000
      });

      tool.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`${toolName} not available`));
        }
      });

      tool.on('error', () => {
        reject(new Error(`${toolName} not available`));
      });
    });
  }

  private createDependencyError(message: string, filePath: string): DetectedError {
    const stackTrace: ErrorStackFrame[] = [{
      location: {
        file: filePath,
        line: 1,
        column: 1,
        function: undefined
      },
      source: `${filePath}:1:1`
    }];

    const baseError = this.createBaseError(
      message,
      'DependencyError',
      stackTrace
    );

    const context: ErrorContext = {
      timestamp: new Date(),
      environment: 'build',
      metadata: {
        tool: 'dependency-check',
        severity: 'error',
        file: filePath
      }
    };

    return {
      id: this.generateErrorId(),
      ...baseError,
      context,
      source: this.getSource()
    };
  }

  private createConfigError(message: string, filePath: string): DetectedError {
    const stackTrace: ErrorStackFrame[] = [{
      location: {
        file: filePath,
        line: 1,
        column: 1,
        function: undefined
      },
      source: `${filePath}:1:1`
    }];

    const baseError = this.createBaseError(
      message,
      'ConfigurationError',
      stackTrace
    );

    const context: ErrorContext = {
      timestamp: new Date(),
      environment: 'build',
      metadata: {
        tool: 'config-check',
        severity: 'warning',
        file: filePath
      }
    };

    return {
      id: this.generateErrorId(),
      ...baseError,
      context,
      source: this.getSource()
    };
  }

  private createProcessError(message: string, type: string): DetectedError {
    const stackTrace: ErrorStackFrame[] = [{
      location: {
        file: this.config.projectRoot,
        line: 1,
        column: 1,
        function: undefined
      },
      source: `${this.config.projectRoot}:1:1`
    }];

    const baseError = this.createBaseError(
      message,
      'ProcessError',
      stackTrace
    );

    const context: ErrorContext = {
      timestamp: new Date(),
      environment: 'build',
      metadata: {
        tool: 'process-monitor',
        severity: 'warning',
        type: type
      }
    };

    return {
      id: this.generateErrorId(),
      ...baseError,
      context,
      source: this.getSource()
    };
  }
  */
}

// Alias for backward compatibility
export { BuildErrorDetector as BuildDetector };
