# 🚀 Quick IDE Setup - Error Debugging MCP Server

## ⚡ 30-Second Setup Guide

### 📋 Prerequisites
- ✅ Node.js v22.14.0+
- ✅ MCP-compatible IDE
- ✅ Server built at: `/path/to/error-debugging-mcp-server/dist/index.js`

## 🎯 Quick Configuration

### VS Code
```json
{
  "mcp.servers": {
    "error-debugging": {
      "command": "node",
      "args": ["/path/to/error-debugging-mcp-server/dist/index.js"],
      "env": {"NODE_ENV": "development"}
    }
  }
}
```

### Cursor IDE
```json
{
  "servers": {
    "error-debugging": {
      "command": "node", 
      "args": ["/path/to/error-debugging-mcp-server/dist/index.js"],
      "env": {"NODE_ENV": "development"}
    }
  }
}
```

### Augment Code ✅ WORKING
```json
{
  "mcp": {
    "servers": {
      "error-debugging": {
        "command": "node",
        "args": ["/path/to/error-debugging-mcp-server/dist/index.js"],
        "transport": "stdio",
        "env": {"NODE_ENV": "development"}
      }
    }
  }
}
```

### Generic MCP Client
```json
{
  "servers": {
    "error-debugging": {
      "command": "node",
      "args": ["/path/to/error-debugging-mcp-server/dist/index.js"],
      "transport": "stdio",
      "capabilities": ["tools", "resources", "prompts"]
    }
  }
}
```

## 🧪 Quick Test

### 1. Create Test File
```javascript
// test.js - Intentional syntax error
function test() {
  const result = {
    // Missing closing brace
  console.log("syntax error");
}
```

### 2. Test Detection
```json
{
  "tool": "detect-errors",
  "arguments": {
    "source": "build",
    "language": "javascript",
    "files": ["test.js"]
  }
}
```

### 3. Expected Result
```json
{
  "errors": [{
    "message": "Unexpected token '{'",
    "type": "javascriptError", 
    "category": "syntax",
    "severity": "high",
    "line": 1,
    "column": 1
  }]
}
```

## ✅ Success Indicators
- 🟢 Server connects in IDE
- 🟢 Tools `detect-errors`, `analyze-error` available
- 🟢 JavaScript/PHP errors detected
- 🟢 Response time <6 seconds

## 🆘 Quick Troubleshooting
- **Not connecting?** Check server path and Node.js version
- **No tools?** Restart IDE after configuration
- **No errors detected?** Verify file has actual syntax errors
- **Slow performance?** Check for large directories being scanned

## 📞 Full Documentation
See `docs/IDE_INTEGRATION_GUIDE.md` for comprehensive setup guide.

---
**🎉 Ready in 30 seconds!** Configure → Test → Debug! 🐛➡️✨
