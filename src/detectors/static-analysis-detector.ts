/**
 * Static analysis error detector for capturing errors from static analysis tools
 */

import type { ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import { extname } from 'path';
import { watch, type FSWatcher } from 'chokidar';

import type {
  DetectedError,
  ErrorSource
} from '@/types/index.js';
import { BaseErrorDetector, type ErrorDetectorOptions, type ErrorDetectorCapabilities } from './base-detector.js';
import { ErrorSeverity } from '@/types/errors.js';

export interface StaticAnalysisConfig {
  sonarjs?: {
    enabled: boolean;
    configPath?: string;
    rules?: string[];
  };
  bandit?: {
    enabled: boolean;
    configPath?: string;
    severity?: string;
  };
  gosec?: {
    enabled: boolean;
    configPath?: string;
    severity?: string;
  };
  cargoAudit?: {
    enabled: boolean;
    database?: string;
  };
  workspaceRoot?: string;
}

export class StaticAnalysisDetector extends BaseErrorDetector {
  private config: StaticAnalysisConfig;
  private analysisProcess: ChildProcess | undefined;
  private fileWatcher: FSWatcher | undefined;
  private pollingTimer: NodeJS.Timeout | undefined;
  private lastAnalysisTime = 0;

  constructor(options: ErrorDetectorOptions, config: Partial<StaticAnalysisConfig> = {}) {
    super(options);
    this.config = {
      sonarjs: { enabled: true },
      bandit: { enabled: true },
      gosec: { enabled: true },
      cargoAudit: { enabled: true },
      workspaceRoot: process.cwd(),
      ...config,
    };
  }

  getSource(): ErrorSource {
    return {
      type: 'static-analysis',
      tool: 'static-analysis-detector',
      version: '1.0.0',
    };
  }

  getCapabilities(): ErrorDetectorCapabilities {
    return {
      supportsRealTime: false,
      supportsPolling: true,
      supportsFileWatching: true,
      supportedLanguages: ['javascript', 'typescript', 'python', 'go', 'rust'],
      supportedFrameworks: ['sonarjs', 'bandit', 'gosec', 'cargo-audit'],
    };
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    try {
      // Verify analysis tools are available
      await this.verifyToolsAvailable();

      // Start file watching if enabled
      if (this.options.realTime) {
        await this.startFileWatching();
      }

      // Start polling if enabled
      if (this.options.polling) {
        this.startPolling();
      }

      // Run initial analysis
      await this.runStaticAnalysis();

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

    // Stop analysis process
    if (this.analysisProcess) {
      this.analysisProcess.kill();
      this.analysisProcess = undefined;
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

    // If target is specified, analyze specific file/directory
    if (target) {
      return await this.analyzeSpecificTarget(target);
    }

    // Otherwise run full static analysis
    await this.runStaticAnalysis();
    return this.getBufferedErrors();
  }

  private async verifyToolsAvailable(): Promise<void> {
    const tools = [];

    if (this.config.sonarjs?.enabled) {
      tools.push('sonar-scanner');
    }
    if (this.config.bandit?.enabled) {
      tools.push('bandit');
    }
    if (this.config.gosec?.enabled) {
      tools.push('gosec');
    }
    if (this.config.cargoAudit?.enabled) {
      tools.push('cargo');
    }

    // For now, we'll proceed without strict tool verification
    // In a production environment, you'd check if tools are installed
  }

  private async startFileWatching(): Promise<void> {
    if (!this.config.workspaceRoot) {
      return;
    }

    this.fileWatcher = watch(this.config.workspaceRoot, {
      ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**'],
      persistent: true,
      ignoreInitial: true,
    });

    this.fileWatcher.on('change', async (filePath: string) => {
      if (this.shouldAnalyzeFile(filePath)) {
        await this.analyzeFile(filePath);
      }
    });

    this.fileWatcher.on('add', async (filePath: string) => {
      if (this.shouldAnalyzeFile(filePath)) {
        await this.analyzeFile(filePath);
      }
    });
  }

  private shouldAnalyzeFile(filePath: string): boolean {
    const ext = extname(filePath);
    const supportedExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.go', '.rs'];
    return supportedExtensions.includes(ext);
  }

  private startPolling(): void {
    if (!this.options.polling) {
      return;
    }

    this.pollingTimer = setInterval(async () => {
      try {
        await this.runStaticAnalysis();
      } catch (error) {
        this.emit('detector-error', error);
      }
    }, this.options.polling.interval);
  }

  private async runStaticAnalysis(): Promise<void> {
    const now = Date.now();
    if (now - this.lastAnalysisTime < 5000) {
      // Avoid running analysis too frequently
      return;
    }

    this.lastAnalysisTime = now;

    try {
      const analysisPromises: Promise<DetectedError[]>[] = [];

      // Run JavaScript/TypeScript analysis
      if (this.config.sonarjs?.enabled) {
        analysisPromises.push(this.runSonarJSAnalysis());
      }

      // Run Python analysis
      if (this.config.bandit?.enabled) {
        analysisPromises.push(this.runBanditAnalysis());
      }

      // Run Go analysis
      if (this.config.gosec?.enabled) {
        analysisPromises.push(this.runGosecAnalysis());
      }

      // Run Rust analysis
      if (this.config.cargoAudit?.enabled) {
        analysisPromises.push(this.runCargoAuditAnalysis());
      }

      const results = await Promise.allSettled(analysisPromises);

      for (const result of results) {
        if (result.status === 'fulfilled') {
          for (const error of result.value) {
            this.addToBuffer(error);
          }
        }
      }
    } catch (error) {
      this.emit('detector-error', error);
    }
  }

  private async runSonarJSAnalysis(): Promise<DetectedError[]> {
    const errors: DetectedError[] = [];

    try {
      // Simulate SonarJS analysis - in production, you'd run actual sonar-scanner
      const jsFiles = await this.findFiles(['**/*.js', '**/*.ts', '**/*.jsx', '**/*.tsx']);

      for (const file of jsFiles.slice(0, 5)) { // Limit for demo
        const content = await fs.readFile(file, 'utf-8');

        // Simple static analysis checks
        const issues = this.performBasicJSAnalysis(content, file);
        errors.push(...issues);
      }
    } catch (error) {
      // Tool not available or failed - continue silently
    }

    return errors;
  }

  private async runBanditAnalysis(): Promise<DetectedError[]> {
    const errors: DetectedError[] = [];

    try {
      // Simulate Bandit analysis for Python files
      const pyFiles = await this.findFiles(['**/*.py']);

      for (const file of pyFiles.slice(0, 5)) { // Limit for demo
        const content = await fs.readFile(file, 'utf-8');

        // Simple security analysis checks
        const issues = this.performBasicPythonSecurityAnalysis(content, file);
        errors.push(...issues);
      }
    } catch (error) {
      // Tool not available or failed - continue silently
    }

    return errors;
  }

  private async runGosecAnalysis(): Promise<DetectedError[]> {
    const errors: DetectedError[] = [];

    try {
      // Simulate Gosec analysis for Go files
      const goFiles = await this.findFiles(['**/*.go']);

      for (const file of goFiles.slice(0, 5)) { // Limit for demo
        const content = await fs.readFile(file, 'utf-8');

        // Simple security analysis checks
        const issues = this.performBasicGoSecurityAnalysis(content, file);
        errors.push(...issues);
      }
    } catch (error) {
      // Tool not available or failed - continue silently
    }

    return errors;
  }

  private async runCargoAuditAnalysis(): Promise<DetectedError[]> {
    const errors: DetectedError[] = [];

    try {
      // Simulate Cargo audit analysis for Rust projects
      const cargoFiles = await this.findFiles(['**/Cargo.toml']);

      for (const file of cargoFiles.slice(0, 3)) { // Limit for demo
        const content = await fs.readFile(file, 'utf-8');

        // Simple dependency analysis
        const issues = this.performBasicRustDependencyAnalysis(content, file);
        errors.push(...issues);
      }
    } catch (error) {
      // Tool not available or failed - continue silently
    }

    return errors;
  }

  private async findFiles(patterns: string[]): Promise<string[]> {
    const files: string[] = [];

    if (!this.config.workspaceRoot) {
      return files;
    }

    try {
      const { glob } = await import('fast-glob');
      const foundFiles = await glob(patterns, {
        cwd: this.config.workspaceRoot,
        ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**'],
        absolute: true,
      });
      files.push(...foundFiles);
    } catch (error) {
      // Fallback to basic file finding if fast-glob is not available
    }

    return files;
  }

  private performBasicJSAnalysis(content: string, filePath: string): DetectedError[] {
    const errors: DetectedError[] = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Check for potential security issues
      if (line.includes('eval(') && !line.includes('//')) {
        errors.push(this.createStaticAnalysisError(
          'Use of eval() is potentially dangerous',
          'security',
          filePath,
          index + 1,
          ErrorSeverity.HIGH
        ));
      }

      // Check for console.log in production code
      if (line.includes('console.log') && !line.includes('//')) {
        errors.push(this.createStaticAnalysisError(
          'Console.log statement found - consider removing for production',
          'code-quality',
          filePath,
          index + 1,
          ErrorSeverity.LOW
        ));
      }

      // Check for TODO comments
      if (line.includes('TODO') || line.includes('FIXME')) {
        errors.push(this.createStaticAnalysisError(
          'TODO/FIXME comment found',
          'maintainability',
          filePath,
          index + 1,
          ErrorSeverity.LOW
        ));
      }
    });

    return errors;
  }

  private performBasicPythonSecurityAnalysis(content: string, filePath: string): DetectedError[] {
    const errors: DetectedError[] = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Check for potential security issues
      if (line.includes('exec(') && !line.includes('#')) {
        errors.push(this.createStaticAnalysisError(
          'Use of exec() is potentially dangerous',
          'security',
          filePath,
          index + 1,
          ErrorSeverity.HIGH
        ));
      }

      if (line.includes('subprocess.call') && line.includes('shell=True')) {
        errors.push(this.createStaticAnalysisError(
          'subprocess.call with shell=True is potentially dangerous',
          'security',
          filePath,
          index + 1,
          ErrorSeverity.HIGH
        ));
      }
    });

    return errors;
  }

  private performBasicGoSecurityAnalysis(content: string, filePath: string): DetectedError[] {
    const errors: DetectedError[] = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Check for potential security issues
      if (line.includes('os.Exec') && !line.includes('//')) {
        errors.push(this.createStaticAnalysisError(
          'Use of os.Exec may be dangerous',
          'security',
          filePath,
          index + 1,
          ErrorSeverity.MEDIUM
        ));
      }
    });

    return errors;
  }

  private performBasicRustDependencyAnalysis(content: string, filePath: string): DetectedError[] {
    const errors: DetectedError[] = [];

    // Simple check for outdated dependencies (this would be more sophisticated in real implementation)
    if (content.includes('[dependencies]')) {
      errors.push(this.createStaticAnalysisError(
        'Consider running cargo audit to check for security vulnerabilities',
        'security',
        filePath,
        1,
        ErrorSeverity.LOW
      ));
    }

    return errors;
  }

  private createStaticAnalysisError(
    message: string,
    type: string,
    filePath: string,
    line: number,
    severity: ErrorSeverity
  ): DetectedError {
    const baseError = this.createBaseError(message, type);

    return {
      ...baseError,
      id: this.generateErrorId(),
      severity,
      context: {
        timestamp: new Date(),
        environment: 'static-analysis',
        metadata: {
          tool: 'static-analysis-detector',
          file: filePath,
          line,
        },
      },
      source: this.getSource(),
      stackTrace: [{
        location: {
          file: filePath,
          line,
          column: 1,
          function: 'static-analysis',
        },
        source: message,
      }],
    };
  }

  private async analyzeSpecificTarget(target: string): Promise<DetectedError[]> {
    try {
      const stat = await fs.stat(target);

      if (stat.isFile()) {
        await this.analyzeFile(target);
      } else if (stat.isDirectory()) {
        // Analyze all files in directory
        const files = await this.findFiles(['**/*']);
        for (const file of files.slice(0, 10)) { // Limit for performance
          if (this.shouldAnalyzeFile(file)) {
            await this.analyzeFile(file);
          }
        }
      }
    } catch (error) {
      // Target doesn't exist or can't be accessed
    }

    return this.getBufferedErrors();
  }

  private async analyzeFile(filePath: string): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const ext = extname(filePath);

      let issues: DetectedError[] = [];

      switch (ext) {
        case '.js':
        case '.ts':
        case '.jsx':
        case '.tsx':
          issues = this.performBasicJSAnalysis(content, filePath);
          break;
        case '.py':
          issues = this.performBasicPythonSecurityAnalysis(content, filePath);
          break;
        case '.go':
          issues = this.performBasicGoSecurityAnalysis(content, filePath);
          break;
        case '.rs':
          // For Rust files, we'd typically analyze Cargo.toml instead
          break;
      }

      for (const issue of issues) {
        this.addToBuffer(issue);
      }
    } catch (error) {
      // File can't be read or analyzed
    }
  }
}

// The class is already named StaticAnalysisDetector, so no alias needed
