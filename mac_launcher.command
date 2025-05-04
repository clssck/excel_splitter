#!/bin/bash

# Simple no-bullshit launcher for ExcelChopper on macOS
# This script handles all the security theater so you can just use the damn app

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
APP_PATH="$SCRIPT_DIR/ExcelChopper.app"

echo "🚀 ExcelChopper Launcher"
echo "========================"

# Check if the app exists
if [ ! -d "$APP_PATH" ]; then
    echo "❌ Error: ExcelChopper.app not found in the same directory as this script."
    echo "   Please make sure ExcelChopper.app is in: $SCRIPT_DIR"
    exit 1
fi

# Create portable marker file
touch "$SCRIPT_DIR/portable_mode"
echo "✅ Running in portable mode"

# Create data directory if it doesn't exist
mkdir -p "$SCRIPT_DIR/AppData"
echo "✅ Using data directory: $SCRIPT_DIR/AppData"

# Fix permissions - this is the key part that makes it work
echo "🔧 Fixing permissions..."
chmod -R +x "$APP_PATH/Contents/MacOS/"
echo "✅ Set executable permissions"

# Remove quarantine attribute if present
echo "🔧 Removing quarantine attribute..."
xattr -dr com.apple.quarantine "$APP_PATH" 2>/dev/null
echo "✅ Removed quarantine attribute"

# Check for App Translocation
if [[ "$APP_PATH" == *"/AppTranslocation/"* ]]; then
    echo "⚠️ App is in App Translocation directory."
    echo "   Moving app to avoid translocation..."
    
    # Create a temporary directory
    TEMP_DIR="$SCRIPT_DIR/temp_app"
    mkdir -p "$TEMP_DIR"
    
    # Copy the app to the temporary directory
    cp -R "$APP_PATH" "$TEMP_DIR/"
    
    # Remove the original app
    rm -rf "$APP_PATH"
    
    # Move the app back to the original location
    mv "$TEMP_DIR/ExcelChopper.app" "$SCRIPT_DIR/"
    
    # Remove the temporary directory
    rmdir "$TEMP_DIR"
    
    echo "✅ App moved to avoid translocation"
    
    # Update the app path
    APP_PATH="$SCRIPT_DIR/ExcelChopper.app"
else
    echo "✅ App is not in App Translocation directory"
fi

# Launch the app
echo "🚀 Launching ExcelChopper..."
open "$APP_PATH"

echo "✅ ExcelChopper launched successfully!"
echo "   You can close this terminal window."
echo ""
echo "💡 If the app still doesn't work, try running:"
echo "   $APP_PATH/Contents/MacOS/ExcelChopper"
echo ""
