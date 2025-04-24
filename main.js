const { app, BrowserWindow, ipcMain, dialog } = require("electron");
let mainWindow; // Track main window globally
const fs = require("fs");
const path = require("path");

// Configure error logging
const logStream = fs.createWriteStream(
  path.join(app.getPath("appData"), "excel-splitter-logs.txt"),
  {
    flags: "a",
  }
);

process.on("uncaughtException", (error) => {
  const errorTime = new Date().toISOString();
  logStream.write(`[${errorTime}] Uncaught Exception: ${error.stack}\n\n`);
  app.quit();
});
const splitExcel = require("./splitExcel");

function handleFile(filePath) {
  if (mainWindow) {
    mainWindow.webContents.send("file-opened", filePath);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 500,
    minHeight: 400,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    backgroundColor: "#181a1b",
  });

  mainWindow.loadFile("index.html");

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

      app.on("activate", function () {
        try {
          if (BrowserWindow.getAllWindows().length === 0) createWindow();
        } catch (error) {
          logStream.write(`[${new Date().toISOString()}] Activate Error: ${error.stack}\n\n`);
          dialog.showErrorBox("Window Error", "Failed to recreate window: " + error.message);
        }
      });
    } catch (error) {
      logStream.write(`[${new Date().toISOString()}] Startup Error: ${error.stack}\n\n`);
      dialog.showErrorBox("Critical Error", "Application failed to start: " + error.message);
      app.quit();
    }
  })
  .catch((error) => {
    logStream.write(`[${new Date().toISOString()}] App Ready Error: ${error.stack}\n\n`);
    dialog.showErrorBox(
      "Initialization Error",
      "Failed to initialize application: " + error.message
    );
    app.quit();
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
    const errorTime = new Date().toISOString();
    logStream.write(`[${errorTime}] File Open Error: ${error.stack}\n\n`);
    dialog.showErrorBox("File Error", "Failed to handle file: " + error.message);
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
    await splitExcel(inputPath, outputDir);
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
