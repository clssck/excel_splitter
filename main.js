import { app, BrowserWindow, dialog, ipcMain, nativeImage, shell } from "electron";
import pkg from "electron-updater";
import fs from "fs";
import fetch from "node-fetch";
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

// Configure auto updates
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;
autoUpdater.allowPrerelease = false;

/**
 * Checks for application updates and sends status to the renderer
 * Works in both development and production builds
 */
async function checkForUpdates() {
  try {
    // GitHub repository information
    const owner = "clssck";
    const repo = "excel_splitter";
    const releaseUrl = `https://github.com/${owner}/${repo}/releases/latest`;

    // Get current version from package.json
    const currentVersion = app.getVersion();
    console.log(`Current version: ${currentVersion}`);

    // Notify renderer that we're checking for updates
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("update-status", {
        type: "checking",
        currentVersion,
      });
    }

    try {
      console.log(
        `Checking for updates from: https://api.github.com/repos/${owner}/${repo}/releases/latest`
      );

      // Fetch the latest release information from GitHub
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/latest`);
      const data = await response.json();

      console.log("GitHub API response status:", response.status);
      console.log("GitHub API response data:", JSON.stringify(data, null, 2));

      // Send appropriate status to renderer
      if (response.ok && data && data.tag_name) {
        // Extract version information from the release
        let latestVersion = data.tag_name.replace(/^v/, "");
        const releaseName = data.name || "";

        // Check if this is a non-standard version tag (like a commit hash or release tag)
        const isStandardVersion = /^\d+\.\d+\.\d+(-.*)?$/.test(latestVersion);

        // If it's not a standard version, try to extract version from release name
        if (!isStandardVersion && releaseName) {
          const versionMatch = releaseName.match(/v?(\d+\.\d+\.\d+)/);
          if (versionMatch) {
            latestVersion = versionMatch[1];
          }
        }

        console.log(`Latest version tag: ${data.tag_name}`);
        console.log(`Parsed latest version: ${latestVersion}`);
        console.log(`Current version: ${currentVersion}`);

        // For non-standard versions, check if the release contains a newer version
        // by comparing version numbers if possible
        let hasUpdate = false;

        if (isStandardVersion) {
          // For standard versions, compare directly
          hasUpdate = latestVersion !== currentVersion;
        } else if (/^\d+\.\d+\.\d+(-.*)?$/.test(latestVersion)) {
          // If we extracted a standard version from the release name
          const latestParts = latestVersion.split(".").map((p) => parseInt(p, 10));
          const currentParts = currentVersion.split(".").map((p) => parseInt(p, 10));

          // Compare major.minor.patch
          for (let i = 0; i < 3; i++) {
            if (latestParts[i] > currentParts[i]) {
              hasUpdate = true;
              break;
            } else if (latestParts[i] < currentParts[i]) {
              hasUpdate = false;
              break;
            }
          }
        } else {
          // If we can't determine version from the tag, try to extract it from the release assets
          const assetVersionMatch =
            data.assets && data.assets.length > 0
              ? data.assets[0].name.match(/(\d+\.\d+\.\d+)/)
              : null;

          if (assetVersionMatch) {
            // If we found a version in the assets, use proper version comparison
            const assetVersion = assetVersionMatch[1];
            const assetParts = assetVersion.split(".").map((p) => parseInt(p, 10));
            const currentParts = currentVersion.split(".").map((p) => parseInt(p, 10));

            // Compare major.minor.patch
            for (let i = 0; i < 3; i++) {
              if (assetParts[i] > currentParts[i]) {
                hasUpdate = true;
                break;
              } else if (assetParts[i] < currentParts[i]) {
                hasUpdate = false;
                break;
              }
            }

            // Set the display version to the one found in assets
            latestVersion = `${data.name || "v" + assetVersion} (non-standard version)`;
          } else {
            // If we still can't determine version, don't assume an update is available
            // if the current version is already 1.0.0 or higher (production release)
            const currentParts = currentVersion.split(".").map((p) => parseInt(p, 10));
            hasUpdate = currentParts[0] < 1; // Only suggest update if current is pre-1.0
            latestVersion = `${data.name || data.tag_name} (non-standard version)`;
          }
        }

        if (hasUpdate) {
          // Update available
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send("update-status", {
              type: "available",
              currentVersion,
              version: latestVersion,
              url: releaseUrl,
            });
          }
        } else {
          // Using latest version
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send("update-status", {
              type: "not-available",
              currentVersion,
            });
          }
        }
      } else if (response.status === 404) {
        // 404 typically means no releases found
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send("update-status", {
            type: "no-releases",
            currentVersion,
          });
        }
      } else {
        // Other API errors
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send("update-status", {
            type: "error",
            currentVersion,
            error: `GitHub API returned status: ${response.status}`,
          });
        }
      }
    } catch (error) {
      console.error("Update check failed:", error);

      // Send error to renderer
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("update-status", {
          type: "error",
          currentVersion,
          error: error.message || "Unknown error",
        });
      }
    }
  } catch (error) {
    console.error("Update check initialization failed:", error);

    // Send error to renderer
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("update-status", {
        type: "error",
        currentVersion: app.getVersion(),
        error: error.message || "Failed to initialize update check",
      });
    }
  }
}

autoUpdater.on("update-downloaded", () => {
  dialog
    .showMessageBox({
      type: "info",
      buttons: ["Restart", "Later"],
      title: "Update Ready",
      message: "Update downloaded. Restart to apply?",
    })
    .then(({ response }) => {
      if (response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
});

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

// Listen for manual update check requests
ipcMain.on("check-for-updates", async () => {
  try {
    console.log("Manual update check requested");
    await checkForUpdates();
    console.log("Manual update check completed");
  } catch (error) {
    console.error("Manual update check failed:", error);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("update-status", {
        type: "error",
        currentVersion: app.getVersion(),
        error: error.message || "Failed to check for updates",
      });
    }
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
