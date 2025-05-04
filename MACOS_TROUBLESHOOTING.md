# macOS Troubleshooting Guide for ExcelChopper

This guide helps you resolve common issues with the portable ExcelChopper app on macOS.

## Quick Solutions

### App Won't Open or Closes Immediately

Try these solutions in order:

1. **Right-click to Open**: Instead of double-clicking, right-click (or Control+click) on ExcelChopper.app and select "Open"

2. **Fix Permissions in Terminal**:

   ```bash
   chmod +x /path/to/ExcelChopper.app/Contents/MacOS/ExcelChopper
   ```

3. **Remove Quarantine Attribute**:

   ```bash
   xattr -dr com.apple.quarantine /path/to/ExcelChopper.app
   ```

4. **Run Directly from Terminal**:
   ```bash
   /path/to/ExcelChopper.app/Contents/MacOS/ExcelChopper
   ```

## Understanding macOS Security

macOS has several security features that can block portable apps:

1. **Gatekeeper**: Blocks unsigned apps from unidentified developers
2. **App Translocation**: Runs apps from a randomized location
3. **Quarantine**: Flags downloaded files as potentially unsafe

The ExcelChopper app is designed to work around these restrictions automatically, but sometimes manual intervention is needed.

## Detailed Solutions

### Solution 1: Allow App in Security Settings

1. Go to System Preferences > Security & Privacy > General
2. Look for a message about ExcelChopper being blocked
3. Click "Open Anyway"
4. Restart the app

### Solution 2: Check the Data Directory

The app stores all data in a "Data" folder next to the app. Make sure:

1. The Data folder exists
2. You have write permissions to this folder
3. There's enough disk space

### Solution 3: Check the Logs

Check the log file for error messages:

```bash
cat /path/to/ExcelChopper.app/Contents/Resources/Data/excel-splitter-logs.txt
```

## Moving the App

You can move the ExcelChopper app anywhere on your system:

1. Make sure to move the entire folder (app + Data folder)
2. You may need to right-click > Open again after moving

## Completely Portable Usage

For truly portable usage (e.g., on a USB drive):

1. Copy the ExcelChopper app to your USB drive
2. Create a "Data" folder next to it if it doesn't exist
3. Use right-click > Open when running from the USB drive

## Still Having Issues?

If you're still experiencing problems:

1. Try a newer version from the releases page
2. Check your macOS version (10.14+ is recommended)
3. Create an issue on GitHub with details about your system
