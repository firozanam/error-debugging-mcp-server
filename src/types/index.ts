/**
 * Core type definitions for the Error Debugging MCP Server
 */

// Export specific types to avoid conflicts
export type {
  DetectedError,
  ErrorCategory,
  ErrorSeverity,
  ErrorPattern,
  ErrorSource,
  FixSuggestion,
  CodeChange,
  ErrorAnalysis,
  ErrorTrend,
  ErrorFilter,
  SourceLocation,
  StackFrame as ErrorStackFrame,
  ErrorContext
} from './errors.js';

export type {
  Breakpoint,
  DebugSession,
  CallStackFrame,
  Variable,
  VariableScope,
  WatchExpression,
  DebugConfiguration,
  PerformanceProfile,
  PerformanceSample,
  PerformanceHotspot,
  MemorySnapshot,
  CpuSnapshot,
  StackFrame as DebugStackFrame,
  DebugEvent,
  DebugCapabilities
} from './debugging.js';

export type {
  DiagnosticEngine,
  ErrorAnalysis as DiagnosticAnalysis,
  RootCause,
  Evidence,
  AnalysisContext,
  CodebaseInfo,
  EnvironmentInfo,
  DependencyInfo,
  SecurityVulnerability,
  ChangeInfo,
  PatternMatch,
  Recommendation,
  SimilarError,
  ErrorExplanation,
  LearningResource,
  ImpactPrediction,
  DiagnosticConfiguration,
  CustomPattern
} from './diagnostics.js';

export type {
  SupportedLanguage,
  LanguageHandler,
  DetectionOptions,
  LanguageError,
  RelatedInformation,
  StackFrame as LanguageStackFrame,
  LanguageDebugCapabilities,
  LanguageDebugConfig,
  LanguageDebugSession,
  EvaluationResult,
  Variable as LanguageVariable,
  CallStackFrame as LanguageCallStackFrame,
  PerformanceAnalysis,
  HalsteadMetrics,
  PerformanceHotspot as LanguagePerformanceHotspot,
  TypeScriptConfig,
  JavaScriptFramework,
  PythonEnvironment,
  PythonPackage,
  GoModule,
  GoDependency,
  RustCrate,
  RustDependency
} from './languages.js';

export type {
  MCPTool,
  MCPResource,
  MCPPrompt,
  MCPPromptArgument,
  MCPToolCall,
  MCPToolResult,
  MCPContent,
  MCPServerCapabilities,
  MCPClientCapabilities,
  MCPInitializeParams,
  MCPInitializeResult,
  DetectErrorsParams,
  AnalyzeErrorParams,
  SuggestFixesParams,
  SetBreakpointParams,
  InspectVariablesParams,
  ProfilePerformanceParams,
  TrackMemoryParams,
  ConfigureDebuggerParams,
  GetErrorHistoryParams,
  ExportDiagnosticsParams
} from './mcp.js';

export type {
  ServerConfig,
  ErrorDetectionConfig,
  ErrorAnalysisConfig,
  DebuggingConfig,
  LanguageDebuggingConfig,
  PerformanceConfig,
  IntegrationsConfig,
  SecurityConfig,
  WorkspaceConfig,
  UserPreferences,
  ConfigValidationResult,
  ConfigValidationError,
  ConfigValidationWarning
} from './config.js';

export type {
  EventEmitter,
  ServerEvents,
  ErrorEvent,
  DebugEvent as EventDebugEvent,
  PerformanceEvent,
  ConfigEvent,
  WorkspaceEvent,
  SystemEvent,
  AnyEvent,
  EventFilter,
  EventSubscription,
  EventStore,
  EventMetrics,
  EventProcessingOptions
} from './events.js';
