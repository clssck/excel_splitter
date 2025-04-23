const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const splitExcel = require("./splitExcel");

function createWindow() {
  const win = new BrowserWindow({
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

  win.loadFile("index.html");
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
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
  } catch (err) {
    return { success: false, error: err.message || String(err) };
  }
});
