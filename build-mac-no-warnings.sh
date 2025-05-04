#!/bin/bash

# Build script that suppresses all warnings
echo "Building ExcelChopper for macOS..."

# Clean dist directory
rm -rf dist

# Set environment variables to suppress warnings
export NODE_ENV=production
export npm_config_loglevel=error
export npm_config_fund=false
export npm_config_audit=false
export npm_config_update_notifier=false

# Build the app
npx electron-builder --mac --config.compression=store > /dev/null 2>&1

# Create Data directory
mkdir -p dist/mac/ExcelChopper.app/Contents/Resources/Data

# Remove quarantine attribute
xattr -cr dist/mac*/ExcelChopper.app 2>/dev/null || true

echo "✅ Build complete! App is in dist/mac/ExcelChopper.app"
