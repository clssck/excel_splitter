# Release Notes – Excel Project/Batch Splitter v1.0.0

## Overview

Excel Project/Batch Splitter is a cross-platform desktop application that allows users to split Excel files by `project_code` and `batch_code`. This is the first public release, providing a simple and efficient way to process large Excel files into organized, smaller files.

---

## What’s New in v1.0.0

- **Split by Project and Batch:** Automatically separates Excel files into multiple files based on unique `project_code` and `batch_code` columns.
- **User-Friendly Interface:** Simple GUI for selecting input files and output directories.
- **Cross-Platform Support:** Installers available for Windows, macOS, and Linux.
- **Efficient Processing:** Handles large Excel files with optimized performance.
- **Automated Builds:** Continuous integration and delivery via GitHub Actions.

---

## Installation

Download the latest installer for your platform from the [Releases](https://github.com/clssck/excel_splitter/releases) page:

- **Windows:** `.zip` archive (extract and run the `.exe`)
- **macOS:** `.dmg` installer
- **Linux:** `.AppImage` file

---

## Usage

1. Launch the app.
2. Select the Excel file you want to split.
3. Choose the output directory.
4. Click **Split**. The app will generate separate files for each unique `project_code` and `batch_code`.

---

## Known Issues

- The app requires the input Excel file to contain both `project_code` and `batch_code` columns.
- Some antivirus software may flag unsigned executables; verify the download source if prompted.

---

## Feedback & Support

- For issues or feature requests, open an issue on [GitHub](https://github.com/clssck/excel_splitter/issues).
- For troubleshooting, see the [Troubleshooting](README.md#troubleshooting) section in the README.

---

## License

MIT
