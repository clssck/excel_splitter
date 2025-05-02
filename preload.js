const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  testPing: () => "pong",
  selectExcelFile: () => ipcRenderer.invoke("select-excel-file"),
  selectOutputDir: () => ipcRenderer.invoke("select-output-dir"),
  splitExcel: (inputPath, outputDir) => ipcRenderer.invoke("split-excel", { inputPath, outputDir }),
  onProgressUpdate: (callback) =>
    ipcRenderer.on("progress-update", (_event, value) => callback(value)),
  checkForUpdates: () => ipcRenderer.send("check-for-updates"),
  onUpdateStatus: (callback) =>
    ipcRenderer.on("update-status", (_event, status) => callback(status)),
  openUpdateLink: (url) => ipcRenderer.invoke("open-external-link", url),
});
