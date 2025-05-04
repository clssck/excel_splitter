#!/bin/bash

# Direct launcher for ExcelChopper on macOS
# This bypasses the app bundle entirely and runs the binary directly
# Use this if the normal launcher doesn't work

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
APP_BINARY="$SCRIPT_DIR/ExcelChopper.app/Contents/MacOS/ExcelChopper"

echo "🚀 ExcelChopper Direct Launcher"
echo "=============================="

# Check if the binary exists
if [ ! -f "$APP_BINARY" ]; then
    echo "❌ Error: ExcelChopper binary not found at: $APP_BINARY"
    echo "   Please make sure ExcelChopper.app is in: $SCRIPT_DIR"
    exit 1
fi

# Create portable marker file
touch "$SCRIPT_DIR/portable_mode"
echo "✅ Running in portable mode"

# Create data directory if it doesn't exist
mkdir -p "$SCRIPT_DIR/AppData"
echo "✅ Using data directory: $SCRIPT_DIR/AppData"

# Fix permissions
echo "🔧 Fixing permissions..."
chmod +x "$APP_BINARY"
echo "✅ Set executable permissions"

# Set environment variables
export PORTABLE_EXECUTABLE_DIR="$SCRIPT_DIR"
echo "✅ Set environment variables"

# Run the binary directly
echo "🚀 Launching ExcelChopper directly..."
"$APP_BINARY"

# This script will wait until the app exits
echo "✅ ExcelChopper has exited."
