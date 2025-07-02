#!/bin/bash

# Error Debugging MCP Server Startup Script
# This script ensures the server starts correctly from any directory

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Change to the project directory
cd "$SCRIPT_DIR"

# Set environment variables
export NODE_ENV=development
export MCP_SERVER_CONFIG="$SCRIPT_DIR/error-debugging-config.json"

# Start the server
echo "🚀 Starting Error Debugging MCP Server..."
echo "📍 Project directory: $SCRIPT_DIR"
echo "⚙️  Config file: $MCP_SERVER_CONFIG"
echo ""

node "$SCRIPT_DIR/dist/index.js"
