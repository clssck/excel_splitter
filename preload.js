const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  testPing: () => "pong",
  selectExcelFile: () => ipcRenderer.invoke("select-excel-file"),
  selectOutputDir: () => ipcRenderer.invoke("select-output-dir"),
  splitExcel: (inputPath, outputDir) => ipcRenderer.invoke("split-excel", { inputPath, outputDir }),
  onProgressUpdate: (callback) =>
    ipcRenderer.on("progress-update", (_event, value) => callback(value)),
});
