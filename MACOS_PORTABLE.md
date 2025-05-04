# No-Bullshit Portable ExcelChopper for macOS

This is a truly portable version of ExcelChopper for macOS that works without installation, signing, or security theater.

## How to Use

1. **Extract the zip file** anywhere (USB drive, Downloads folder, Desktop, etc.)
2. **Run one of the launcher scripts**:
   - `mac_launcher.command` - Normal launcher (recommended)
   - `run_direct.command` - Direct binary launcher (if normal launcher fails)

That's it. No installation, no admin privileges, no App Store, no notarization bullshit.

## If the App Won't Open

If you get a security warning when trying to run the launcher:

1. Right-click (or Control+click) on the launcher script
2. Select "Open" from the context menu
3. Click "Open" in the security dialog

This only needs to be done once.

## How It Works

The launcher scripts:

1. Set up a portable environment
2. Fix permissions automatically
3. Remove quarantine attributes
4. Handle App Translocation issues
5. Create necessary data directories

All data is stored in the `AppData` folder next to the app, making it truly portable.

## Moving the App

You can move the entire folder anywhere, including to another Mac or a USB drive. The app will work as long as all files stay together.

## Troubleshooting

If you still have issues:

1. Open Terminal
2. Drag the `run_direct.command` file into the Terminal window
3. Press Enter to run it
4. Check for error messages

## Why This Exists

Because macOS security has become increasingly hostile to non-App Store apps, making simple portable apps unnecessarily difficult to distribute and run.

This version bypasses all that nonsense so you can just use the damn app.
