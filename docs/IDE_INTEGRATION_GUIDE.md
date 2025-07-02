# 🔧 IDE Integration Guide - Error Debugging MCP Server

This guide provides step-by-step instructions for integrating the Error Debugging MCP Server with various IDEs for real-world testing.

## 🚀 Server Status

✅ **Server is running successfully!**
- Port: localhost (stdio transport)
- Components: plugin-manager, error-detector-manager, tool-registry, core-components, transport
- Tools available: `detect-errors`, `analyze-error`

## 📋 Prerequisites

1. **Server built and running**: ✅ Confirmed
2. **Node.js**: v22.14.0+ ✅ 
3. **MCP-compatible IDE**: Choose from options below

## 🎯 IDE Integration Options

### 1. 🔵 VS Code Integration

#### Step 1: Install MCP Extension
```bash
# Install the MCP extension for VS Code
code --install-extension mcp-client
```

#### Step 2: Configure VS Code Settings
Add to your VS Code `settings.json`:

```json
{
  "mcp.servers": {
    "error-debugging": {
      "command": "node",
      "args": ["/Volumes/Storage/Tool_Projects/error-debugging-mcp-server/dist/index.js"],
      "env": {
        "NODE_ENV": "development"
      }
    }
  },
  "mcp.enableLogging": true,
  "mcp.logLevel": "debug"
}
```

#### Step 3: Test Integration
1. Open VS Code
2. Open Command Palette (`Cmd+Shift+P`)
3. Run: `MCP: Connect to Server`
4. Select `error-debugging`
5. Test with: `MCP: List Tools`

### 2. 🟡 Cursor IDE Integration

#### Step 1: Configure Cursor MCP Settings
Create or edit `~/.cursor/mcp-settings.json`:

```json
{
  "servers": {
    "error-debugging": {
      "command": "node",
      "args": ["/Volumes/Storage/Tool_Projects/error-debugging-mcp-server/dist/index.js"],
      "description": "Error debugging and analysis server",
      "capabilities": ["tools", "resources", "prompts"]
    }
  },
  "enableLogging": true,
  "autoConnect": true
}
```

#### Step 2: Test Integration
1. Restart Cursor
2. Open a project with TypeScript/JavaScript files
3. Use Cursor's AI chat and ask: "Can you detect errors in this project?"
4. The AI should use the MCP server's tools

### 3. 🟢 Windsurf IDE Integration

#### Step 1: Configure Windsurf
Add to Windsurf's MCP configuration file:

```json
{
  "mcpServers": {
    "error-debugging": {
      "command": "node",
      "args": ["/Volumes/Storage/Tool_Projects/error-debugging-mcp-server/dist/index.js"],
      "env": {
        "DEBUG": "mcp:*"
      }
    }
  }
}
```

### 4. 🔴 Augment Code Integration

Since you're using Augment Code, here's the integration:

#### Step 1: Configure Augment
Add to your Augment workspace configuration:

```json
{
  "mcp": {
    "servers": {
      "error-debugging": {
        "command": "node",
        "args": ["/Volumes/Storage/Tool_Projects/error-debugging-mcp-server/dist/index.js"],
        "description": "Advanced error detection and debugging",
        "features": ["error-detection", "performance-monitoring", "debug-sessions"]
      }
    }
  }
}
```

## 🧪 Testing Scenarios

### Test 1: Error Detection
Create a test file with intentional errors:

```typescript
// test-errors.ts
function testFunction() {
  const undefinedVar = someUndefinedVariable; // ReferenceError
  const result = 5 / 0; // Division by zero
  console.log(result.toUpperCase()); // TypeError
  return result
} // Missing semicolon

// Missing export
class TestClass {
  private value: string;
  
  constructor() {
    // Missing initialization
  }
  
  getValue(): string {
    return this.value.toUpperCase(); // Potential null reference
  }
}
```

### Test 2: Use MCP Tools
In your IDE's AI chat or command palette:

1. **Detect Errors**: 
   ```
   Use the detect-errors tool to analyze the current file
   ```

2. **Analyze Specific Error**:
   ```
   Use the analyze-error tool for the TypeError on line 3
   ```

### Test 3: Real-time Monitoring
1. Open a project with build errors
2. Run `npm run build` or `tsc`
3. The MCP server should detect and categorize build errors
4. Check IDE notifications/diagnostics

## 📊 Expected Results

When properly integrated, you should see:

✅ **Error Detection**:
- Real-time error detection in console
- Build error categorization
- Linter integration
- Runtime error capture

✅ **AI-Enhanced Analysis**:
- Error pattern matching
- Root cause analysis
- Fix suggestions
- Impact prediction

✅ **Performance Monitoring**:
- Memory usage tracking
- CPU performance metrics
- Response time monitoring

## 🔍 Troubleshooting

### Common Issues:

1. **Server not connecting**:
   - Check if server is running: `ps aux | grep node`
   - Verify path in configuration
   - Check IDE logs for MCP errors

2. **Tools not available**:
   - Restart IDE after configuration
   - Check MCP server logs
   - Verify JSON syntax in config files

3. **Permission errors**:
   - Ensure Node.js has proper permissions
   - Check file paths are accessible

### Debug Commands:
```bash
# Check server status
curl -X POST http://localhost:3000/health

# View server logs
tail -f ~/.error-debugging-server.log

# Test MCP connection
node -e "console.log('MCP Test')"
```

## 🎉 Success Indicators

You'll know the integration is working when:
- IDE shows MCP server as connected
- Error detection tools are available in AI chat
- Real-time error notifications appear
- Performance metrics are visible
- Debug sessions can be created

## 📞 Next Steps

1. Choose your preferred IDE from the options above
2. Follow the specific integration steps
3. Test with the provided scenarios
4. Report any issues or successes
5. Explore advanced features like debug sessions and performance profiling

---

**Ready to test?** Pick an IDE and let's get started! 🚀
