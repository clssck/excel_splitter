#!/bin/bash

# Simple build script that suppresses warnings
echo "Building ExcelChopper for macOS..."

# Clean dist directory
rm -rf dist

# Build the app
NODE_ENV=production npx electron-builder --mac --config.compression=store --publish never > /dev/null 2>&1

# Create Data directory
mkdir -p dist/mac/ExcelChopper.app/Contents/Resources/Data

# Remove quarantine attribute
xattr -cr dist/mac*/ExcelChopper.app 2>/dev/null || true

echo "✅ Build complete! App is in dist/mac/ExcelChopper.app"
