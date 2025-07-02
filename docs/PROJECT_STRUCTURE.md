# 📁 Project Structure

This document outlines the complete structure of the Error Debugging MCP Server project.

## 🏗️ Root Directory

```
error-debugging-mcp-server/
├── 📄 README.md                    # Main project documentation
├── 📄 package.json                 # Node.js dependencies and scripts
├── 📄 package-lock.json           # Locked dependency versions
├── 📄 tsconfig.json               # TypeScript configuration
├── 📄 vitest.config.ts            # Test configuration
├── 📄 error-debugging-config.json # Default server configuration
├── 🔧 start-mcp-server.sh         # Reliable startup script
├── 🐳 Dockerfile                  # Production Docker image
├── 🐳 Dockerfile.dev              # Development Docker image
├── 🐳 docker-compose.yml          # Production Docker setup
└── 🐳 docker-compose.dev.yml      # Development Docker setup
```

## 📚 Documentation (`/docs`)

```
docs/
├── 📖 API.md                      # Complete API reference
├── 📖 USER_GUIDE.md               # Step-by-step user guide
├── 📖 EXAMPLES.md                 # Real-world usage examples
├── 📖 PROJECT_STRUCTURE.md        # This file
├── 🔧 IDE_INTEGRATION_GUIDE.md    # IDE setup instructions
├── 🔧 REAL_WORLD_INTEGRATION.md   # Live testing guide
├── 🔧 FIXED_IDE_CONFIG.md         # Troubleshooting solutions
├── 🔧 FINAL_INTEGRATION_SUCCESS.md # Verification guide
├── 📁 api/                        # Detailed API documentation
├── 📁 examples/                   # Code examples and tutorials
└── 📁 guides/                     # Additional guides and tutorials
```

## 💻 Source Code (`/src`)

```
src/
├── 📄 index.ts                    # Main entry point
├── 📄 exports.ts                  # Public API exports
├── 📁 server/                     # MCP server implementation
│   ├── mcp-server.ts             # Core MCP server
│   ├── tool-registry.ts          # Tool management
│   └── resource-manager.ts       # Resource handling
├── 📁 detectors/                  # Error detection engines
│   ├── base-detector.ts          # Abstract base detector
│   ├── build-detector.ts         # Build error detection
│   ├── linter-detector.ts        # Linting error detection
│   ├── runtime-detector.ts       # Runtime error detection
│   ├── console-detector.ts       # Console error detection
│   ├── test-detector.ts          # Test error detection
│   ├── ide-detector.ts           # IDE diagnostic integration
│   └── static-analysis-detector.ts # Static analysis
├── 📁 languages/                  # Language-specific handlers
│   ├── typescript-handler.ts     # TypeScript support
│   ├── javascript-handler.ts     # JavaScript support
│   ├── python-handler.ts         # Python support
│   ├── go-handler.ts             # Go support
│   ├── rust-handler.ts           # Rust support
│   └── php-handler.ts            # PHP support
├── 📁 debug/                      # Debugging capabilities
│   ├── debug-session-manager.ts  # Debug session lifecycle
│   ├── performance-monitor.ts    # Performance tracking
│   ├── error-tracker.ts          # Error tracking and analysis
│   ├── debug-context-tracker.ts  # Context management
│   └── development-environment.ts # Dev environment integration
├── 📁 integrations/               # IDE integrations
│   ├── vscode-integration.ts     # VS Code integration
│   ├── cursor-integration.ts     # Cursor IDE integration
│   ├── windsurf-integration.ts   # Windsurf integration
│   └── augment-integration.ts    # Augment Code integration
├── 📁 utils/                      # Utility functions
│   ├── config-manager.ts         # Configuration management
│   ├── logger.ts                 # Logging utilities
│   ├── file-watcher.ts           # File system monitoring
│   ├── process-manager.ts        # Process lifecycle management
│   └── validation.ts             # Input validation
└── 📁 types/                      # TypeScript type definitions
    ├── index.ts                   # Main type exports
    ├── errors.ts                  # Error-related types
    ├── config.ts                  # Configuration types
    ├── mcp.ts                     # MCP protocol types
    └── debug.ts                   # Debug-related types
```

## 🧪 Tests (`/tests`)

```
tests/
├── 📁 unit/                       # Unit tests (22 files, 419 tests)
│   ├── utils/                     # Utility function tests
│   ├── detectors/                 # Detector tests
│   ├── debug/                     # Debug component tests
│   ├── integrations/              # Integration tests
│   ├── languages/                 # Language handler tests
│   └── server/                    # Server component tests
├── 📁 integration/                # Integration tests
│   ├── complete-flow.test.ts      # End-to-end workflow tests
│   ├── ide-integrations.test.ts   # IDE integration tests
│   └── error-recovery.test.ts     # Error recovery tests
└── 📁 e2e/                        # End-to-end tests
    ├── mcp-protocol.test.ts       # MCP protocol compliance
    └── real-world.test.ts         # Real-world scenario tests
```

## 🔧 Scripts (`/scripts`)

```
scripts/
├── 📄 test-mcp-protocol.js        # MCP protocol compliance test
├── 📄 test-mcp-integration.js     # Integration testing script
└── 📄 simple-mcp-test.js          # Basic functionality test
```

## 📊 Examples (`/examples`)

```
examples/
├── 📁 typescript/                 # TypeScript examples
│   ├── basic-errors.ts           # Common TypeScript errors
│   └── advanced-patterns.ts      # Complex error patterns
├── 📁 javascript/                 # JavaScript examples
├── 📁 python/                     # Python examples
├── 📁 go/                         # Go examples
├── 📁 rust/                       # Rust examples
└── 📁 php/                        # PHP examples
```

## 🧪 Test Project (`/test-project`)

```
test-project/
├── 📄 package.json               # Test project dependencies
├── 📄 tsconfig.json              # TypeScript configuration
└── 📄 test-errors.ts             # File with intentional errors for testing
```

## ⚙️ Configuration (`/config`)

```
config/
├── 📄 production.json            # Production configuration
├── 📄 augment.json               # Augment Code specific config
├── 📄 cursor.json                # Cursor IDE specific config
└── 📄 windsurf.json              # Windsurf specific config
```

## 🏗️ Build Output (`/dist`)

```
dist/                              # Compiled JavaScript output
├── 📄 index.js                   # Main entry point
├── 📄 exports.js                 # Public API exports
├── 📁 server/                    # Compiled server code
├── 📁 detectors/                 # Compiled detectors
├── 📁 languages/                 # Compiled language handlers
├── 📁 debug/                     # Compiled debug components
├── 📁 integrations/              # Compiled integrations
├── 📁 utils/                     # Compiled utilities
└── 📁 types/                     # Compiled type definitions
```

## 📊 Coverage (`/coverage`)

```
coverage/                          # Test coverage reports
├── 📄 index.html                 # Coverage report (62.35%)
├── 📄 coverage-final.json        # Machine-readable coverage data
└── 📁 error-debugging-mcp-server/ # Detailed coverage by file
```

## 🎯 Key Files

### 🔧 **Configuration Files**
- `error-debugging-config.json` - Main server configuration
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript compiler settings
- `vitest.config.ts` - Test framework configuration

### 🚀 **Entry Points**
- `src/index.ts` - Main application entry point
- `src/exports.ts` - Public API exports
- `start-mcp-server.sh` - Reliable startup script

### 📚 **Documentation**
- `README.md` - Main project documentation
- `docs/` - Comprehensive documentation suite
- `examples/` - Real-world usage examples

### 🧪 **Testing**
- `tests/` - Complete test suite (419 tests)
- `scripts/` - Testing and validation scripts
- `test-project/` - Sample project for testing

This structure ensures maintainability, scalability, and ease of development while providing comprehensive documentation and testing coverage.
