import { app, BrowserWindow, dialog, ipcMain, nativeImage } from "electron";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url"; // Import necessary modules
import { createMenu } from "./menu.js"; // Import the menu creation function
import splitExcel from "./splitExcel.js";

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

// Configure error logging
const logStream = fs.createWriteStream(
  path.join(app.getPath("appData"), "excel-splitter-logs.txt"),
  {
    flags: "a",
  }
);

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
  const splashPath = path.join(__dirname, "index.html");

  splash.loadFile(splashPath).catch((error) => {
    handleCriticalError("Splash Screen Failed", error);
  });

  // Create main window with additional error handling
  try {
    mainWindow = new BrowserWindow({
      width: 900,
      height: 700,
      minWidth: 500,
      minHeight: 400,
      show: false, // Hide until ready
      icon: appIcon,
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
      backgroundColor: "#181a1b",
    });

    // Handle window ready-to-show
    mainWindow.once("ready-to-show", () => {
      splash.destroy();
      mainWindow.show();
    });
  } catch (error) {
    splash.destroy();
    handleCriticalError("Window Creation Failed", error);
  }

  // Handle production vs development paths for main window
  const indexPath = path.join(__dirname, "index.html");

  mainWindow.loadFile(indexPath).catch((error) => {
    handleCriticalError("Failed to Load Interface", error);
  });

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
