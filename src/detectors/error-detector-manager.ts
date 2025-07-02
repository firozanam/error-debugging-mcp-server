/**
 * Error detector manager for coordinating multiple error detectors
 */

import { EventEmitter } from 'events';

import type {
  DetectedError,
  ErrorDetectionConfig
} from '@/types/index.js';
import { BaseErrorDetector, type ErrorDetectorOptions } from './base-detector.js';
import { ConsoleErrorDetector } from './console-detector.js';
import { RuntimeErrorDetector } from './runtime-detector.js';
import { BuildErrorDetector } from './build-detector.js';
import { LinterErrorDetector } from './linter-detector.js';
import { IDEErrorDetector } from './ide-detector.js';
import { StaticAnalysisDetector } from './static-analysis-detector.js';
import { TestErrorDetector } from './test-detector.js';
import { Logger } from '@/utils/logger.js';

export interface DetectorManagerOptions {
  config: ErrorDetectionConfig;
  workspaceRoot?: string;
}

export class ErrorDetectorManager extends EventEmitter {
  private detectors: Map<string, BaseErrorDetector> = new Map();
  private config: ErrorDetectionConfig;
  // private _workspaceRoot: string; // Reserved for future use
  private isRunning = false;
  private aggregatedErrors: DetectedError[] = [];
  private logger = new Logger('info', { logFile: undefined });

  constructor(options: DetectorManagerOptions) {
    super();
    this.config = options.config;
    // this._workspaceRoot = options.workspaceRoot || process.cwd();
    this.initializeDetectors();
  }

  private initializeDetectors(): void {
    const detectorOptions: ErrorDetectorOptions = {
      enabled: this.config.enabled,
      includeWarnings: true, // Will be filtered later
      filters: this.config.filters,
      polling: this.config.polling,
      bufferSize: this.config.bufferSize,
      realTime: this.config.realTime,
    };

    // Initialize console detector
    if (this.config.sources.console) {
      const consoleDetector = new ConsoleErrorDetector(detectorOptions);
      this.registerDetector('console', consoleDetector);
    }

    // Initialize runtime detector
    if (this.config.sources.runtime) {
      const runtimeDetector = new RuntimeErrorDetector(detectorOptions);
      this.registerDetector('runtime', runtimeDetector);
    }

    // Initialize build detector
    if (this.config.sources.build) {
      const buildDetector = new BuildErrorDetector(detectorOptions);
      this.registerDetector('build', buildDetector);
    }

    // Initialize linter detector
    if (this.config.sources.linter) {
      const linterDetector = new LinterErrorDetector(detectorOptions);
      this.registerDetector('linter', linterDetector);
    }

    // Initialize IDE detector
    if (this.config.sources.ide) {
      const ideDetector = new IDEErrorDetector(detectorOptions);
      this.registerDetector('ide', ideDetector);
    }

    // Initialize static analysis detector
    if (this.config.sources.staticAnalysis) {
      const staticAnalysisDetector = new StaticAnalysisDetector(detectorOptions);
      this.registerDetector('staticAnalysis', staticAnalysisDetector);
    }

    // Initialize test detector
    if (this.config.sources.test) {
      const testDetector = new TestErrorDetector(detectorOptions);
      this.registerDetector('test', testDetector);
    }
  }

  private registerDetector(name: string, detector: BaseErrorDetector): void {
    this.detectors.set(name, detector);

    // Forward detector events
    detector.on('error-detected', (error: DetectedError) => {
      this.handleDetectedError(name, error);
    });

    detector.on('detector-error', (error: Error) => {
      this.emit('detector-error', { detector: name, error });
    });

    detector.on('detector-started', () => {
      this.emit('detector-started', { detector: name });
    });

    detector.on('detector-stopped', () => {
      this.emit('detector-stopped', { detector: name });
    });
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.debug('Error detector manager already running, skipping start');
      return;
    }

    const startTime = Date.now();
    this.logger.info('Starting error detector manager...', {
      totalDetectors: this.detectors.size,
      enabledDetectors: Array.from(this.detectors.keys()).filter(name => this.isDetectorEnabled(name))
    });

    this.isRunning = true;

    // Start all enabled detectors
    const startPromises: Promise<void>[] = [];
    const enabledDetectors: string[] = [];

    for (const [name, detector] of this.detectors) {
      if (this.isDetectorEnabled(name)) {
        this.logger.debug(`Starting detector: ${name}`);
        const detectorStartTime = Date.now();

        const startPromise = detector.start().then(() => {
          this.logger.logPerformance(`detector-${name}-start`, Date.now() - detectorStartTime);
          this.logger.debug(`Detector ${name} started successfully`);
        }).catch((error) => {
          this.logger.error(`Failed to start detector ${name}`, {
            detector: name,
            error: error instanceof Error ? {
              name: error.name,
              message: error.message,
              stack: error.stack
            } : error
          });
          throw error;
        });

        startPromises.push(startPromise);
        enabledDetectors.push(name);
      } else {
        this.logger.debug(`Detector ${name} is disabled, skipping`);
      }
    }

    await Promise.all(startPromises);

    const totalStartTime = Date.now() - startTime;
    this.logger.info('Error detector manager started successfully', {
      startedDetectors: enabledDetectors,
      totalStartTime,
      memoryUsage: process.memoryUsage()
    });

    this.emit('manager-started');
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    // Stop all detectors
    const stopPromises: Promise<void>[] = [];
    for (const detector of this.detectors.values()) {
      if (detector.isDetectorRunning()) {
        stopPromises.push(detector.stop());
      }
    }

    await Promise.all(stopPromises);
    this.emit('manager-stopped');
  }

  async detectErrors(options: {
    source?: string;
    target?: string;
    includeBuffered?: boolean;
  } = {}): Promise<DetectedError[]> {
    const { source, target, includeBuffered = true } = options;
    const errors: DetectedError[] = [];

    if (source) {
      // Detect errors from specific source
      const detector = this.detectors.get(source);
      if (detector) {
        const sourceErrors = await detector.detectErrors(target);
        errors.push(...sourceErrors);
      }
    } else {
      // Detect errors from all sources
      const detectionPromises: Promise<DetectedError[]>[] = [];
      for (const [name, detector] of this.detectors) {
        if (this.isDetectorEnabled(name)) {
          detectionPromises.push(detector.detectErrors(target));
        }
      }

      const results = await Promise.all(detectionPromises);
      for (const result of results) {
        errors.push(...result);
      }
    }

    // Include buffered errors if requested
    if (includeBuffered) {
      errors.push(...this.aggregatedErrors);
    }

    // Apply global filters and deduplication
    return this.filterAndDeduplicateErrors(errors);
  }

  private handleDetectedError(detectorName: string, error: DetectedError): void {
    // Add detector source information
    error.source = {
      ...error.source,
      configuration: { detector: detectorName },
    };

    // Apply global filters
    if (this.shouldIncludeError(error)) {
      this.aggregatedErrors.push(error);

      // Maintain buffer size
      if (this.aggregatedErrors.length > this.config.maxErrorsPerSession) {
        this.aggregatedErrors.shift();
      }

      // Emit aggregated error event
      this.emit('error-detected', error);
    }
  }

  private shouldIncludeError(error: DetectedError): boolean {
    const { filters } = this.config;

    // Check severity filter
    if (filters.severities.length > 0) {
      if (!filters.severities.includes(error.severity)) {
        return false;
      }
    }

    // Check category filter
    if (filters.categories.length > 0) {
      if (!filters.categories.includes(error.category)) {
        return false;
      }
    }

    // Check file exclusions
    if (filters.excludeFiles.length > 0) {
      const errorFile = error.stackTrace[0]?.location.file;
      if (errorFile && this.matchesPatterns(errorFile, filters.excludeFiles)) {
        return false;
      }
    }

    // Check pattern exclusions
    if (filters.excludePatterns.length > 0) {
      if (this.matchesPatterns(error.message, filters.excludePatterns)) {
        return false;
      }
    }

    return true;
  }

  private matchesPatterns(text: string, patterns: string[]): boolean {
    return patterns.some(pattern => {
      if (pattern.includes('*') || pattern.includes('?')) {
        // Convert glob pattern to regex
        const regexPattern = pattern
          .replace(/\*/g, '.*')
          .replace(/\?/g, '.');
        return new RegExp(`^${regexPattern}$`).test(text);
      }
      return text.includes(pattern);
    });
  }

  private filterAndDeduplicateErrors(errors: DetectedError[]): DetectedError[] {
    // Remove duplicates based on message and location
    const seen = new Set<string>();
    const filtered: DetectedError[] = [];

    for (const error of errors) {
      const key = this.generateErrorKey(error);
      if (!seen.has(key)) {
        seen.add(key);
        filtered.push(error);
      }
    }

    // Sort by timestamp (newest first)
    return filtered.sort((a, b) => 
      b.context.timestamp.getTime() - a.context.timestamp.getTime()
    );
  }

  private generateErrorKey(error: DetectedError): string {
    const location = error.stackTrace[0]?.location;
    const locationKey = location ? 
      `${location.file}:${location.line}:${location.column}` : 
      'unknown';
    
    return `${error.message}:${locationKey}:${error.type}`;
  }

  private isDetectorEnabled(detectorName: string): boolean {
    switch (detectorName) {
      case 'console':
        return this.config.sources.console;
      case 'runtime':
        return this.config.sources.runtime;
      case 'build':
        return this.config.sources.build;
      case 'test':
        return this.config.sources.test;
      case 'linter':
        return this.config.sources.linter;
      case 'static-analysis':
        return this.config.sources.staticAnalysis;
      default:
        return false;
    }
  }

  getDetector(name: string): BaseErrorDetector | undefined {
    return this.detectors.get(name);
  }

  listDetectors(): Array<{ name: string; enabled: boolean; running: boolean; capabilities: any }> {
    const detectors: Array<{ name: string; enabled: boolean; running: boolean; capabilities: any }> = [];

    for (const [name, detector] of this.detectors) {
      detectors.push({
        name,
        enabled: this.isDetectorEnabled(name),
        running: detector.isDetectorRunning(),
        capabilities: detector.getCapabilities(),
      });
    }

    return detectors;
  }

  getAggregatedErrors(): DetectedError[] {
    return [...this.aggregatedErrors];
  }

  clearAggregatedErrors(): void {
    this.aggregatedErrors = [];
    
    // Also clear individual detector buffers
    for (const detector of this.detectors.values()) {
      detector.clearBuffer();
    }
  }

  getDetectionStats(): {
    totalErrors: number;
    errorsByDetector: Record<string, number>;
    errorsByCategory: Record<string, number>;
    errorsBySeverity: Record<string, number>;
  } {
    const stats = {
      totalErrors: this.aggregatedErrors.length,
      errorsByDetector: {} as Record<string, number>,
      errorsByCategory: {} as Record<string, number>,
      errorsBySeverity: {} as Record<string, number>,
    };

    for (const error of this.aggregatedErrors) {
      // Count by detector
      const detectorName = error.source.configuration?.['detector'] as string || 'unknown';
      stats.errorsByDetector[detectorName] = (stats.errorsByDetector[detectorName] || 0) + 1;

      // Count by category
      stats.errorsByCategory[error.category] = (stats.errorsByCategory[error.category] || 0) + 1;

      // Count by severity
      stats.errorsBySeverity[error.severity] = (stats.errorsBySeverity[error.severity] || 0) + 1;
    }

    return stats;
  }

  updateConfig(newConfig: Partial<ErrorDetectionConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Update detector options
    const detectorOptions: ErrorDetectorOptions = {
      enabled: this.config.enabled,
      includeWarnings: true,
      filters: this.config.filters,
      polling: this.config.polling,
      bufferSize: this.config.bufferSize,
      realTime: this.config.realTime,
    };

    // Update all detectors
    for (const detector of this.detectors.values()) {
      detector.updateOptions(detectorOptions);
    }

    this.emit('config-updated', this.config);
  }

  isManagerRunning(): boolean {
    return this.isRunning;
  }
}
