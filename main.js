import { app, BrowserWindow, dialog, ipcMain, nativeImage, shell } from "electron";
import pkg from "electron-updater";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url"; // Import necessary modules
import { createMenu } from "./menu.js"; // Import the menu creation function
import splitExcel from "./splitExcel.js";
const { autoUpdater } = pkg;

const __filename = fileURLToPath(import.meta.url); // Define __filename for ESM
const __dirname = dirname(__filename); // Define __dirname for ESM

// Create native image for the icon
const iconPath = path.join(__dirname, "build", "splitter_sprite.png");
console.log("Attempting to load icon from:", iconPath); // Log the path
const appIcon = nativeImage.createFromPath(iconPath);

if (appIcon.isEmpty()) {
  console.error("Error: Could not create nativeImage from path. Check file existence and format.");
}

let mainWindow; // Track main window globally

// Configure auto updates only for packaged app
if (app.isPackaged) {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowPrerelease = false; // Set to true if you want beta releases

  // Handle update errors
  autoUpdater.on("error", (error) => {
    const errorTime = new Date().toISOString();
    const errorMessage = `Update Error: ${error.message || error}`;
    logStream.write(`[${errorTime}] ${errorMessage}\n`);
    // Avoid showing dialog during startup, rely on menu check or log file
    console.error("Auto-update check failed:", errorMessage);
    // Optionally show a less intrusive notification if needed later
    // dialog.showErrorBox("Update Error", `Failed to check for updates: ${error.message || error}`);
  });

  // Handle successful download
  autoUpdater.on("update-downloaded", () => {
    logStream.write(`[${new Date().toISOString()}] Update downloaded, prompting user.\n`);
    dialog
      .showMessageBox({
        type: "info",
        buttons: ["Restart", "Later"],
        title: "Update Ready",
        message: "A new version has been downloaded. Restart the application to apply the updates.",
      })
      .then(({ response }) => {
        if (response === 0) {
          logStream.write(`[${new Date().toISOString()}] User chose to restart for update.\n`);
          autoUpdater.quitAndInstall();
        } else {
          logStream.write(`[${new Date().toISOString()}] User chose to update later.\n`);
        }
      });
  });
}

// ALWAYS run in portable mode - no configuration needed
// This makes the app truly standalone with no external dependencies

// Get the app's location
const appPath = app.getAppPath();
const appDir = path.dirname(app.isPackaged ? app.getPath("exe") : appPath);

// For development, use the current directory
// For production, use the directory containing the executable
const appRootDir = app.isPackaged
  ? path.resolve(appDir, "..", "..", "..") // Go up from MacOS/Contents/Resources
  : appDir;

console.log("App root directory:", appRootDir);

// Always use a local data directory
const dataDir = path.join(appRootDir, "Data");
console.log("Data directory:", dataDir);

// Create data directory if it doesn't exist
if (!fs.existsSync(dataDir)) {
  try {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log(`Created data directory: ${dataDir}`);
  } catch (err) {
    console.error(`Failed to create data directory: ${err.message}`);
  }
}

// Fix permissions automatically on macOS
if (process.platform === "darwin" && app.isPackaged) {
  try {
    // Get paths
    const macOSBinPath = app.getPath("exe");
    const appBundle = path.resolve(macOSBinPath, "..", "..", "..");
    const macOSDir = path.join(appBundle, "Contents", "MacOS");

    console.log("App bundle:", appBundle);
    console.log("MacOS directory:", macOSDir);

    // Fix executable permissions silently
    try {
      fs.chmodSync(macOSBinPath, 0o755);
      console.log("Fixed executable permissions");
    } catch (permErr) {
      console.log("Could not change permissions:", permErr.message);
    }

    // Try to remove quarantine attribute silently
    try {
      const { execSync } = require("child_process");
      execSync(`xattr -d com.apple.quarantine "${appBundle}" 2>/dev/null`);
    } catch {
      // Variable removed as it's unused
      // Ignore - this is expected to fail if no quarantine attribute exists
    }
  } catch (err) {
    // Just log errors but continue - don't crash the app
    console.error("Error during startup:", err.message);
  }
}

// Configure error logging
const logPath = path.join(dataDir, "excel-splitter-logs.txt");
console.log(`Setting up log file at: ${logPath}`);
console.log("Running in portable mode");

// Ensure log directory exists
const logDir = path.dirname(logPath);
if (!fs.existsSync(logDir)) {
  try {
    fs.mkdirSync(logDir, { recursive: true });
  } catch (err) {
    console.error(`Failed to create log directory: ${err.message}`);
  }
}

const logStream = fs.createWriteStream(logPath, {
  flags: "a",
});

// Write startup information to log
const startupTime = new Date().toISOString();
logStream.write(`\n[${startupTime}] ========== APPLICATION STARTUP ==========\n`);
logStream.write(`[${startupTime}] App version: ${app.getVersion()}\n`);
logStream.write(`[${startupTime}] Platform: ${process.platform}\n`);
logStream.write(`[${startupTime}] Architecture: ${process.arch}\n`);
logStream.write(`[${startupTime}] Node version: ${process.versions.node}\n`);
logStream.write(`[${startupTime}] Electron version: ${process.versions.electron}\n`);
logStream.write(`[${startupTime}] Chrome version: ${process.versions.chrome}\n`);
logStream.write(`[${startupTime}] App path: ${app.getAppPath()}\n`);
logStream.write(`[${startupTime}] __dirname: ${__dirname}\n`);
logStream.write(`[${startupTime}] Is packaged: ${app.isPackaged}\n`);
logStream.write(`[${startupTime}] Running in: portable mode\n`);
logStream.write(`[${startupTime}] Data directory: ${dataDir}\n`);
logStream.write(`[${startupTime}] Executable path: ${app.getPath("exe")}\n`);

// Enhanced error handling functions
function handleCriticalError(title, error) {
  const errorTime = new Date().toISOString();
  const errorMessage = `${title}: ${error.message || error}\n\nStack Trace:\n${error.stack}`;

  // Write to log file
  logStream.write(`[${errorTime}] ${errorMessage}\n`);

  // Show dialog even if no window exists
  dialog.showErrorBox(
    "Critical Error",
    `A fatal error occurred:\n\n${errorMessage}\n\n` + `Logs can be found at: ${logStream.path}`
  );

  app.quit();
}

process.on("uncaughtException", (error) => {
  handleCriticalError("Uncaught Exception", error);
});

function handleFile(filePath) {
  if (mainWindow) {
    mainWindow.webContents.send("file-opened", filePath);
  }
}

function createWindow() {
  // Create splash screen
  const splash = new BrowserWindow({
    width: 400,
    height: 200,
    frame: false,
    alwaysOnTop: true,
    backgroundColor: "#181a1b",
  });
  // Load splash screen with production path handling
  const splashPath = app.isPackaged
    ? path.join(process.resourcesPath, "app.asar", "index.html")
    : path.join(__dirname, "index.html");

  // Try to load the splash screen with a more robust approach
  try {
    splash.loadFile(splashPath).catch((error) => {
      console.error("First splash screen load attempt failed:", error);

      // Try alternative loading method using URL format
      const urlPath = app.isPackaged
        ? `file://${process.resourcesPath}/app.asar/index.html`
        : `file://${__dirname}/index.html`;

      splash.loadURL(urlPath).catch((secondError) => {
        console.error("Second splash screen load attempt failed:", secondError);
        handleCriticalError("Splash Screen Failed", secondError);
      });
    });
  } catch (error) {
    handleCriticalError("Splash Screen Initialization Failed", error);
  }

  // Create main window with additional error handling
  try {
    // Check if preload.js exists before creating the window
    const preloadPath = path.join(__dirname, "preload.js");
    try {
      fs.accessSync(preloadPath, fs.constants.R_OK);
      logStream.write(`[${new Date().toISOString()}] Preload file exists at: ${preloadPath}\n`);
    } catch (preloadError) {
      logStream.write(
        `[${new Date().toISOString()}] ERROR: Preload file not accessible: ${preloadPath}\n`
      );
      logStream.write(`[${new Date().toISOString()}] Error details: ${preloadError.message}\n`);
      handleCriticalError("Preload File Not Found", preloadError);
      return;
    }

    mainWindow = new BrowserWindow({
      width: 900,
      height: 700,
      minWidth: 500,
      minHeight: 400,
      show: false, // Hide until ready
      icon: appIcon,
      webPreferences: {
        preload: preloadPath,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
      backgroundColor: "#181a1b",
    });

    // Log window creation success
    logStream.write(`[${new Date().toISOString()}] Main window created successfully\n`);

    // Handle window ready-to-show
    mainWindow.once("ready-to-show", () => {
      logStream.write(`[${new Date().toISOString()}] Main window ready to show\n`);
      splash.destroy();
      mainWindow.show();
    });

    // Handle window errors
    mainWindow.webContents.on("did-fail-load", (event, errorCode, errorDescription) => {
      logStream.write(
        `[${new Date().toISOString()}] Window load failed: ${errorDescription} (${errorCode})\n`
      );
      handleCriticalError("Window Load Failed", new Error(`${errorDescription} (${errorCode})`));
    });
  } catch (error) {
    logStream.write(`[${new Date().toISOString()}] Window creation failed: ${error.message}\n`);
    splash.destroy();
    handleCriticalError("Window Creation Failed", error);
  }

  // Handle production vs development paths for main window
  const indexPath = app.isPackaged
    ? path.join(process.resourcesPath, "app.asar", "index.html")
    : path.join(__dirname, "index.html");

  // Try to load the main window with a more robust approach
  try {
    mainWindow.loadFile(indexPath).catch((error) => {
      console.error("First main window load attempt failed:", error);

      // Try alternative loading method using URL format
      const urlPath = app.isPackaged
        ? `file://${process.resourcesPath}/app.asar/index.html`
        : `file://${__dirname}/index.html`;

      mainWindow.loadURL(urlPath).catch((secondError) => {
        console.error("Second main window load attempt failed:", secondError);
        handleCriticalError("Failed to Load Interface", secondError);
      });
    });
  } catch (error) {
    handleCriticalError("Main Window Initialization Failed", error);
  }

  // Handle file path from command line (first instance)
  const filePath = process.argv.find((arg) => arg.endsWith(".xlsx"));
  if (filePath) {
    handleFile(filePath);
  }
}

app
  .whenReady()
  .then(() => {
    try {
      createWindow();
      createMenu(mainWindow); // Create and set the application menu
      // Automatic update check removed - now only happens from Help menu

      // Explicitly set Dock icon on macOS
      if (process.platform === "darwin" && !appIcon.isEmpty()) {
        app.dock.setIcon(appIcon);
        console.log("Attempted to set Dock icon.");
      } else if (process.platform === "darwin") {
        console.warn("Could not set Dock icon because appIcon was empty.");
      }

      app.on("activate", function () {
        try {
          if (BrowserWindow.getAllWindows().length === 0) createWindow();
        } catch (error) {
          handleCriticalError("Window Activation Failed", error);
        }
      });
    } catch (error) {
      handleCriticalError("Application Startup Failed", error);
    }
  })
  .catch((error) => {
    handleCriticalError("App Initialization Failed", error);
  });

// Handle file open from second instance (Windows)
app.on("second-instance", (event, argv) => {
  try {
    const filePath = argv.find((arg) => arg.endsWith(".xlsx"));
    if (filePath) {
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
        handleFile(filePath);
      }
    }
  } catch (error) {
    handleCriticalError("File Open Error", error);
  }
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

// IPC handlers for file/directory dialogs
ipcMain.handle("select-excel-file", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: "Select Excel File",
    filters: [{ name: "Excel Files", extensions: ["xlsx", "xls"] }],
    properties: ["openFile"],
  });
  return canceled ? null : filePaths[0];
});

ipcMain.handle("select-output-dir", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: "Select Output Directory",
    properties: ["openDirectory"],
  });
  return canceled ? null : filePaths[0];
});

// IPC handler to run the split logic
ipcMain.handle("split-excel", async (event, { inputPath, outputDir }) => {
  try {
    // Pass event.sender to splitExcel for progress reporting
    await splitExcel(inputPath, outputDir, event.sender);
    return { success: true };
  } catch (error) {
    const errorTime = new Date().toISOString();
    logStream.write(`[${errorTime}] Split Error: ${error.stack}\n`);
    logStream.write(`Input: ${inputPath}, Output: ${outputDir}\n\n`);
    return {
      success: false,
      error: error.message || String(error),
      stack: error.stack,
    };
  }
});

// Handle opening external links (like update URLs)
ipcMain.handle("open-external-link", async (event, url) => {
  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (error) {
    console.error("Failed to open external link:", error);
    return { success: false, error: error.message };
  }
});
