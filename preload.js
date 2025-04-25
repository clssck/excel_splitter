import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  selectExcelFile: () => ipcRenderer.invoke("select-excel-file"),
  selectOutputDir: () => ipcRenderer.invoke("select-output-dir"),
  splitExcel: (inputPath, outputDir) => ipcRenderer.invoke("split-excel", { inputPath, outputDir }),
});
