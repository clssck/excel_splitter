# Excel Project/Batch Splitter

[![Build Status](https://github.com/clssck/excel_splitter/actions/workflows/node.js.yml/badge.svg)](https://github.com/clssck/excel_splitter/actions)
[![Coverage Status](https://img.shields.io/badge/coverage-passing-brightgreen)](#)
[![Platforms](https://img.shields.io/badge/platform-win%20%7C%20mac-blue)](#)

> Effortlessly split Excel files by project and batch code with a simple, cross-platform desktop app.

---

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Usage](#usage)
- [Technical Requirements](#technical-requirements)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)
- [Release Notes](#release-notes)
- [License](#license)
- [Roadmap](#roadmap)

---

## Features

- Split Excel files by `project_code` and `batch_code`
- User-friendly GUI for file and directory selection
- Cross-platform: Windows and macOS installers
- Handles large files efficiently
- Automated builds and releases via GitHub Actions

---

## Quick Start

### Download

Go to the [Releases](https://github.com/clssck/excel_splitter/releases) page and download the latest installer for your platform.

See [RELEASE_NOTES.md](./RELEASE_NOTES.md) for details about the current version.

- Windows: `.zip` (extract and run the `.exe` inside)
- macOS: `.dmg`

### Install & Run

1. Download and run the installer for your OS.
2. Launch the app and follow the on-screen instructions to select your Excel file and output directory.

---

## Usage

1. **Open the app.**
2. **Select the Excel file** you want to split.
3. **Choose the output directory** for the split files.
4. **Click "Split"** to process the file. The app will create separate files for each unique `project_code` and `batch_code`.

---

## Technical Requirements

- Windows 10+ or macOS 12+
- No need for Microsoft Excel to be installed

---

## Contributing

Contributions are welcome! Please:

- Fork the repository and create a feature branch
- Follow the existing code style
- Add tests if possible
- Open a pull request with a clear description

---

## Troubleshooting

| Issue              | Solution                                                               |
| ------------------ | ---------------------------------------------------------------------- |
| App won't start    | Ensure your OS is supported and up to date                             |
| File not splitting | Check that your Excel file has `project_code` and `batch_code` columns |
| Permission errors  | Make sure you have write access to the output directory                |

---

## License

MIT

---

## Release Notes

See [RELEASE_NOTES.md](./RELEASE_NOTES.md) for a summary of features, changes, and known issues in each release.

---

## Roadmap

- [ ] Add support for additional Excel formats
- [ ] Cloud storage integration
- [ ] Advanced filtering options

---

_Inspired by [clssck/excel_splitter](https://github.com/clssck/excel_splitter)_
