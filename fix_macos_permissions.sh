#!/bin/bash

# Script to fix common macOS permissions issues with ExcelChopper app
# Run this script if the app closes immediately after opening

echo "ExcelChopper macOS Permissions Fix Tool"
echo "======================================="

# Check if the app exists in common locations
APP_LOCATIONS=(
  "/Applications/ExcelChopper.app"
  "$HOME/Applications/ExcelChopper.app"
  "$HOME/Downloads/ExcelChopper.app"
)

APP_PATH=""
for loc in "${APP_LOCATIONS[@]}"; do
  if [ -d "$loc" ]; then
    APP_PATH="$loc"
    break
  fi
done

if [ -z "$APP_PATH" ]; then
  echo "ExcelChopper.app not found in common locations."
  echo "Please enter the full path to ExcelChopper.app:"
  read -r APP_PATH
  
  if [ ! -d "$APP_PATH" ]; then
    echo "Error: The specified path does not exist or is not a directory."
    exit 1
  fi
fi

echo "Found ExcelChopper at: $APP_PATH"
echo

# Fix permissions
echo "Fixing permissions..."
chmod -R +x "$APP_PATH/Contents/MacOS/"
echo "✓ Set executable permissions on application binaries"

# Remove quarantine attribute
echo "Removing quarantine attribute..."
xattr -dr com.apple.quarantine "$APP_PATH"
echo "✓ Removed quarantine attribute"

# Check for app translocation
echo "Checking for App Translocation..."
if [[ "$APP_PATH" == *"/AppTranslocation/"* ]]; then
  echo "App is running from App Translocation directory."
  echo "Please move the app to /Applications and try again."
  echo "You can do this by dragging the app to the Applications folder."
else
  echo "✓ App is not in App Translocation directory"
fi

# Create logs directory
LOG_DIR="$HOME/Library/Logs/ExcelChopper"
echo "Creating logs directory at $LOG_DIR..."
mkdir -p "$LOG_DIR"
echo "✓ Created logs directory"

# Create a test log file
TEST_LOG="$LOG_DIR/startup_test.log"
echo "$(date): ExcelChopper permissions fix script ran successfully" > "$TEST_LOG"
echo "✓ Created test log file"

echo
echo "Permissions fix complete!"
echo "Try opening ExcelChopper again."
echo
echo "If the app still crashes, check the logs at:"
echo "  $HOME/Library/Application Support/excel-splitter-logs.txt"
echo
echo "You can also try rebuilding the app from source:"
echo "  1. Clone the repository"
echo "  2. Run 'npm install'"
echo "  3. Run 'npm run dist:mac'"
echo
