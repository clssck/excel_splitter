#!/bin/bash

# Portable launcher for ExcelChopper on macOS
# This script creates a portable_mode file and launches the app

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
APP_PATH="$SCRIPT_DIR/ExcelChopper.app"

echo "ExcelChopper Portable Launcher"
echo "============================="

# Check if the app exists
if [ ! -d "$APP_PATH" ]; then
    echo "Error: ExcelChopper.app not found in the same directory as this script."
    echo "Please make sure ExcelChopper.app is in: $SCRIPT_DIR"
    exit 1
fi

# Create portable_mode marker file
PORTABLE_MARKER="$SCRIPT_DIR/portable_mode"
touch "$PORTABLE_MARKER"
echo "Created portable mode marker at: $PORTABLE_MARKER"

# Create AppData directory if it doesn't exist
APP_DATA_DIR="$SCRIPT_DIR/AppData"
if [ ! -d "$APP_DATA_DIR" ]; then
    mkdir -p "$APP_DATA_DIR"
    echo "Created portable data directory: $APP_DATA_DIR"
fi

# Fix permissions
echo "Setting executable permissions..."
chmod -R +x "$APP_PATH/Contents/MacOS/"

# Remove quarantine attribute if present
echo "Removing quarantine attribute if present..."
xattr -dr com.apple.quarantine "$APP_PATH" 2>/dev/null

# Launch the app
echo "Launching ExcelChopper in portable mode..."
open "$APP_PATH"

echo "ExcelChopper has been launched in portable mode."
echo "Data will be stored in: $APP_DATA_DIR"
echo "You can close this terminal window."
