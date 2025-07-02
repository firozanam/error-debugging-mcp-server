#!/bin/bash

# Error Debugging MCP Server - Cleanup Script
# This script cleans up temporary files and organizes the project structure

echo "🧹 Cleaning up Error Debugging MCP Server project..."

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "📍 Project root: $PROJECT_ROOT"

# Remove temporary files
echo "🗑️  Removing temporary files..."
rm -f *.tmp
rm -f *.log
rm -f .DS_Store
find . -name ".DS_Store" -delete 2>/dev/null || true

# Clean up node_modules if requested
if [ "$1" = "--deep" ]; then
    echo "🔄 Deep clean: removing node_modules..."
    rm -rf node_modules
    echo "📦 Reinstalling dependencies..."
    npm install
fi

# Clean up build artifacts
echo "🏗️  Cleaning build artifacts..."
rm -rf dist
rm -rf coverage

# Rebuild the project
echo "🔨 Rebuilding project..."
npm run build

# Run tests to ensure everything works
echo "🧪 Running tests to verify cleanup..."
npm test

# Check for any remaining temporary files
echo "🔍 Checking for remaining temporary files..."
TEMP_FILES=$(find . -name "*.tmp" -o -name "*.log" -o -name "*.bak" 2>/dev/null | grep -v node_modules | head -10)

if [ -n "$TEMP_FILES" ]; then
    echo "⚠️  Found remaining temporary files:"
    echo "$TEMP_FILES"
else
    echo "✅ No temporary files found"
fi

# Verify project structure
echo "📁 Verifying project structure..."
REQUIRED_DIRS=("src" "tests" "docs" "scripts" "examples" "config")
MISSING_DIRS=""

for dir in "${REQUIRED_DIRS[@]}"; do
    if [ ! -d "$dir" ]; then
        MISSING_DIRS="$MISSING_DIRS $dir"
    fi
done

if [ -n "$MISSING_DIRS" ]; then
    echo "❌ Missing required directories:$MISSING_DIRS"
    exit 1
else
    echo "✅ All required directories present"
fi

# Check file permissions
echo "🔐 Checking file permissions..."
chmod +x scripts/*.sh 2>/dev/null || true
chmod +x start-mcp-server.sh 2>/dev/null || true

# Generate project statistics
echo "📊 Project statistics:"
echo "  📁 Source files: $(find src -name "*.ts" | wc -l | tr -d ' ')"
echo "  🧪 Test files: $(find tests -name "*.test.ts" | wc -l | tr -d ' ')"
echo "  📚 Documentation files: $(find docs -name "*.md" | wc -l | tr -d ' ')"
echo "  📦 Dependencies: $(grep -c '"' package.json | tr -d ' ')"

# Final verification
echo "🎯 Final verification..."
if [ -f "dist/index.js" ] && [ -f "package.json" ] && [ -d "src" ]; then
    echo "✅ Project cleanup completed successfully!"
    echo "🚀 Ready for development and deployment"
else
    echo "❌ Project cleanup failed - missing essential files"
    exit 1
fi

echo ""
echo "🎉 Cleanup complete! Project is organized and ready to use."
echo "📋 Next steps:"
echo "  1. Test the server: npm start"
echo "  2. Run tests: npm test"
echo "  3. Check documentation: open docs/README.md"
echo "  4. Configure IDE: see docs/IDE_INTEGRATION_GUIDE.md"
