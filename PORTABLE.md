# ExcelChopper Portable Mode

This document explains how to use ExcelChopper in portable mode on macOS.

## What is Portable Mode?

Portable mode allows you to run ExcelChopper without installing it on your system. All data and settings are stored in the same directory as the application, making it easy to move or copy the entire application to another location or computer.

## Benefits of Portable Mode

- No installation required
- Can be run from external drives
- All data stays with the application
- May help resolve permission issues on macOS
- Easy to backup or transfer to another computer

## How to Use Portable Mode

### Option 1: Download the Portable Version

1. Download the portable version from the releases page
2. Extract the zip file to any location
3. Double-click the `portable_launcher.command` file
4. If prompted about security, right-click the file and select "Open"

### Option 2: Create a Portable Version from the Installed App

If you already have ExcelChopper installed:

1. Create a new folder anywhere (e.g., on your Desktop or a USB drive)
2. Copy ExcelChopper.app to this folder
3. Create an empty file named `portable_mode` in the same folder
4. Create a folder named `AppData` in the same folder
5. Create a launcher script (see below)

### Portable Launcher Script

Create a file named `portable_launcher.command` with the following content:

```bash
#!/bin/bash

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
APP_PATH="$SCRIPT_DIR/ExcelChopper.app"

# Create portable_mode marker file if it doesn't exist
PORTABLE_MARKER="$SCRIPT_DIR/portable_mode"
touch "$PORTABLE_MARKER"

# Create AppData directory if it doesn't exist
APP_DATA_DIR="$SCRIPT_DIR/AppData"
if [ ! -d "$APP_DATA_DIR" ]; then
    mkdir -p "$APP_DATA_DIR"
fi

# Fix permissions
chmod -R +x "$APP_PATH/Contents/MacOS/"

# Remove quarantine attribute if present
xattr -dr com.apple.quarantine "$APP_PATH" 2>/dev/null

# Launch the app
open "$APP_PATH"
```

Make the script executable:

```bash
chmod +x portable_launcher.command
```

## Troubleshooting

If you encounter issues with portable mode:

1. Make sure the `portable_mode` file exists in the same directory as ExcelChopper.app
2. Check that the `AppData` directory exists and is writable
3. Run the portable launcher script from Terminal to see any error messages
4. Check the log file in the `AppData` directory

## Building from Source

To build the portable version from source:

```bash
npm run dist:portable-mac
```

This will create a portable version in the `dist/portable-mac` directory.
